import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Crosshair,
  Percent,
  Layers3,
  Search,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardAnalytics } from "@/components/dashboard-analytics";
import { AnalyticsInsights } from "@/components/analytics-insights";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ViewReveal } from "@/components/ViewReveal";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    view?: string;
    athlete_name?: string;
    period?: string;
    date_from?: string;
    date_to?: string;
  }>;
};

type AthleteOption = {
  id: string;
  user_id?: string | null;
  club_id?: string | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayOffset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getAthleteName(relation: AthleteOption["users"] | undefined) {
  if (Array.isArray(relation)) return relation[0]?.name || "Atleta sin nombre";
  return relation?.name || "Atleta sin nombre";
}

function buildQueryString(params: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.toString();
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const view = params?.view === "athlete" ? "athlete" : "club";
  const athleteName = params?.athlete_name?.trim() || "";
  const period = params?.period || "month";
  const today = new Date();

  let dateFrom = "";
  let dateTo = "";

  if (period === "today") {
    dateFrom = toDateInputValue(today);
    dateTo = toDateInputValue(today);
  } else if (period === "week") {
    const weekStart = getMonday(today);
    dateFrom = toDateInputValue(weekStart);
    dateTo = toDateInputValue(addDays(weekStart, 6));
  } else if (period === "range") {
    dateFrom = params?.date_from || "";
    dateTo = params?.date_to || "";
  } else {
    dateFrom = toDateInputValue(getMonthStart(today));
    dateTo = toDateInputValue(getMonthEnd(today));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!currentUser) redirect("/login");

  if (currentUser.role === "athlete") {
    const { data: athleteProfile } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (athleteProfile?.id) redirect(`/analytics/${athleteProfile.id}`);
    redirect("/athletes/profile");
  }

  if (currentUser.role === "coach" && !currentUser.club_id) redirect("/");

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(`
      id,
      user_id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (currentUser.role === "coach") {
    athletesQuery = athletesQuery.eq("club_id", currentUser.club_id);
  }

  const { data: athletesRaw } = await athletesQuery;
  const athletes = (athletesRaw || []) as AthleteOption[];
  const scopedAthleteIds = athletes.map((athlete) => athlete.id);

  const normalizedName = athleteName.toLowerCase();
  const matchedAthletes =
    view === "athlete" && normalizedName
      ? athletes.filter((athlete) =>
          getAthleteName(athlete.users).toLowerCase().includes(normalizedName)
        )
      : [];

  const filteredAthleteIds =
    view === "athlete"
      ? normalizedName
        ? matchedAthletes.map((athlete) => athlete.id)
        : []
      : scopedAthleteIds;

  let query = supabase
    .from("training_sessions")
    .select(`
      id,
      training_date,
      status,
      total_score,
      total_arrows,
      average_score,
      athlete_id,
      club_id,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      ),
      training_rounds (
        id,
        distance_meters,
        scoring_enabled,
        total_series,
        arrows_per_series,
        series (
          id,
          series_number,
          total_score,
          arrows (
            id,
            score,
            is_x,
            position_x,
            position_y
          )
        )
      )
    `)
    .order("training_date", { ascending: true });

  if (currentUser.role === "coach") {
    query = query.eq("club_id", currentUser.club_id);
  }

  if (view === "athlete") {
    query = filteredAthleteIds.length
      ? query.in("athlete_id", filteredAthleteIds)
      : query.eq("athlete_id", "00000000-0000-0000-0000-000000000000");
  }

  if (dateFrom) query = query.gte("training_date", dateFrom);
  if (dateTo) query = query.lte("training_date", dateTo);

  const { data: trainings } = await query;

  const allSeries =
    trainings?.flatMap((training: any) =>
      training.training_rounds
        ?.filter((round: any) => round.scoring_enabled !== false)
        .flatMap((round: any) => round.series || []) || []
    ) || [];

  const allArrows = allSeries.flatMap((serie: any) => serie.arrows || []);

  const totalScore =
    allSeries.reduce(
      (sum: number, serie: any) => sum + Number(serie.total_score || 0),
      0
    ) || 0;

  const totalArrows = allArrows.length;
  const averageScore =
    totalArrows > 0 ? Number((totalScore / totalArrows).toFixed(1)) : 0;
  const maxPossibleScore = totalArrows * 10;
  const accuracy =
    maxPossibleScore > 0
      ? Number(((totalScore / maxPossibleScore) * 100).toFixed(1))
      : 0;
  const xCount = allArrows.filter((arrow: any) => arrow.is_x).length;
  const tenCount = allArrows.filter(
    (arrow: any) => Number(arrow.score) === 10
  ).length;
  const effectiveness =
    totalArrows > 0
      ? Number(((tenCount / totalArrows) * 100).toFixed(1))
      : 0;

  const monthlyScores =
    trainings?.map((training: any, index: number) => {
      const scoringSeries =
        training.training_rounds
          ?.filter((round: any) => round.scoring_enabled !== false)
          .flatMap((round: any) => round.series || []) || [];

      return {
        name: training.training_date || `E${index + 1}`,
        score: scoringSeries.reduce(
          (sum: number, serie: any) => sum + Number(serie.total_score || 0),
          0
        ),
      };
    }) || [];

  const arrowDistribution = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(
    (score) => ({
      score: score === 0 ? "M" : String(score),
      count: allArrows.filter((arrow: any) => Number(arrow.score) === score)
        .length,
    })
  );

  const activeAthletesCount = new Set(
    trainings?.map((training: any) => training.athlete_id) || []
  ).size;
  const completedTrainings =
    trainings?.filter((training: any) => training.status === "completed") || [];
  const totalRegisteredArrowVolume = completedTrainings.reduce(
    (sum: number, training: any) => {
      const trainingVolume =
        training.training_rounds
          ?.filter((round: any) => round.scoring_enabled !== false)
          .flatMap((round: any) => round.series || [])
          .reduce(
            (seriesSum: number, serie: any) =>
              seriesSum + (serie.arrows?.length || 0),
            0
          ) || 0;

      return sum + trainingVolume;
    },
    0
  );
  const averageArrowVolume =
    completedTrainings.length > 0
      ? Number((totalRegisteredArrowVolume / completedTrainings.length).toFixed(1))
      : 0;

  const scopeLabel =
    view === "athlete"
      ? athleteName
        ? `${matchedAthletes.length} atleta(s) encontrados`
        : "Ingresa el nombre de un atleta"
      : currentUser.role === "coach"
        ? "Analitico del club"
        : "Analitico general";

  const periodLinks = [
    { label: "Hoy", value: "today" },
    { label: "Esta semana", value: "week" },
    { label: "Este mes", value: "month" },
    { label: "Rango", value: "range" },
  ];

  const inputClass =
    "h-12 w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              TAL Analytics Center
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight tal-text-glow md:text-6xl">
              Performance Analytics
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
              {scopeLabel}. Filtra rendimiento por club, atleta y periodo de
              entrenamiento.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>

        <ViewReveal>
        <section className="tal-chart-card">
          <form method="GET" className="space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Tipo
                </label>
                <select name="view" defaultValue={view} className={inputClass}>
                  <option className="bg-slate-900 text-white" value="club">
                    Club
                  </option>
                  <option className="bg-slate-900 text-white" value="athlete">
                    Atleta
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Nombre del atleta
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    name="athlete_name"
                    defaultValue={athleteName}
                    placeholder="Escribe el nombre para analitico individual"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Periodo
              </label>
              <div className="flex flex-wrap gap-2">
                {periodLinks.map((item) => {
                  const query = buildQueryString({
                    view,
                    athlete_name: athleteName,
                    period: item.value,
                    date_from: item.value === "range" ? dateFrom : "",
                    date_to: item.value === "range" ? dateTo : "",
                  });

                  return (
                    <Link
                      key={item.value}
                      href={`/analytics?${query}`}
                      className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                        period === item.value
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-white/10 bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <input type="hidden" name="period" value={period} />

            {period === "range" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Desde
                  </label>
                  <input
                    name="date_from"
                    type="date"
                    defaultValue={dateFrom}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Hasta
                  </label>
                  <input
                    name="date_to"
                    type="date"
                    defaultValue={dateTo}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">
                <BarChart3 size={16} />
                Aplicar filtros
              </button>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                <X size={16} />
                Limpiar
              </Link>
            </div>
          </form>
        </section>
        </ViewReveal>

        <section className="grid grid-cols-2 gap-5 xl:grid-cols-7">
          <Metric icon={Target} title="Accuracy" value={accuracy} suffix="%" decimals={1} />
          <Metric icon={Percent} title="Efectividad 10" value={effectiveness} suffix="%" decimals={1} accent="text-emerald-300" />
          <Metric icon={Crosshair} title="Promedio" value={averageScore} />
          <Metric icon={Layers3} title="Volumen prom." value={averageArrowVolume} />
          <Metric icon={Trophy} title="X Count" value={xCount} accent="text-yellow-300" />
          <Metric icon={CalendarDays} title="Sesiones" value={trainings?.length || 0} />
          <Metric icon={Users} title="Atletas" value={activeAthletesCount} />
        </section>

        {view === "athlete" && athleteName && matchedAthletes.length === 0 && (
          <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-400/10 p-5 text-sm font-bold text-yellow-100">
            No encontre atletas con ese nombre dentro de tu alcance.
          </div>
        )}

        <AnalyticsInsights
          accuracy={accuracy}
          averageScore={averageScore}
          xCount={xCount}
          totalArrows={totalArrows}
          trainingsCount={trainings?.length || 0}
        />

        <DashboardAnalytics
          monthlyScores={monthlyScores}
          arrowDistribution={arrowDistribution}
          accuracy={accuracy}
        />
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
  suffix = "",
  decimals = 0,
  accent = "text-cyan-300",
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accent?: string;
}) {
  return (
    <ViewReveal>
      <div className="tal-metric-card">
        <span className="tal-metric-icon">
          <Icon size={20} />
        </span>
        <p className="tal-metric-label">{title}</p>
        <p className={`tal-metric-value ${accent}`}>
          <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
        </p>
      </div>
    </ViewReveal>
  );
}
