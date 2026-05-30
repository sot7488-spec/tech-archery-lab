import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, Crosshair, Target, Trophy, Users, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ScoreChart from "@/components/ScoreChart";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isCoach = profile.role === "coach";
  if (isCoach && !profile.club_id) redirect("/");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  let athletesCountQuery = supabase
    .from("athlete_profiles")
    .select("*", { count: "exact", head: true });

  if (isCoach) athletesCountQuery = athletesCountQuery.eq("club_id", profile.club_id);

  const { count: athletesCount } = await athletesCountQuery;

  let trainingsCountQuery = supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true });

  if (isCoach) trainingsCountQuery = trainingsCountQuery.eq("club_id", profile.club_id);

  const { count: trainingsCount } = await trainingsCountQuery;

  let monthTrainingsCountQuery = supabase
    .from("training_sessions")
    .select("*", { count: "exact", head: true })
    .gte("training_date", monthStart)
    .lte("training_date", monthEnd);

  if (isCoach) {
    monthTrainingsCountQuery = monthTrainingsCountQuery.eq(
      "club_id",
      profile.club_id
    );
  }

  const { count: monthTrainingsCount } = await monthTrainingsCountQuery;

  let latestTrainingsQuery = supabase
    .from("training_sessions")
    .select(`
      id,
      training_date,
      location,
      session_type,
      total_score,
      total_arrows,
      average_score,
      status,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name,
          profile_photo_url
        )
      )
    `)
    .order("training_date", { ascending: false })
    .limit(8);

  if (isCoach) latestTrainingsQuery = latestTrainingsQuery.eq("club_id", profile.club_id);

  const { data: latestTrainings } = await latestTrainingsQuery;

  let monthTrainingsQuery = supabase
    .from("training_sessions")
    .select(`
      id,
      athlete_id,
      training_date,
      total_score,
      total_arrows,
      average_score,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name,
          profile_photo_url
        )
      )
    `)
    .gte("training_date", monthStart)
    .lte("training_date", monthEnd);

  if (isCoach) monthTrainingsQuery = monthTrainingsQuery.eq("club_id", profile.club_id);

  const { data: monthTrainings } = await monthTrainingsQuery;

  let monthArrowsQuery = supabase
    .from("arrows")
    .select(`
      id,
      score,
      series (
        training_rounds (
          training_sessions (
            id,
            training_date
          )
        )
      )
    `)
    .gte("series.training_rounds.training_sessions.training_date", monthStart)
    .lte("series.training_rounds.training_sessions.training_date", monthEnd);

  if (isCoach) {
    monthArrowsQuery = monthArrowsQuery.eq(
      "series.training_rounds.training_sessions.club_id",
      profile.club_id
    );
  }

  const { data: monthArrows } = await monthArrowsQuery;

  const arrowsRegistered = monthArrows?.length || 0;

  const bestScoreMonth =
    monthTrainings?.reduce((best: number, item: any) => {
      return Math.max(best, Number(item.total_score || 0));
    }, 0) || 0;

  const scoreChartData =
    latestTrainings
      ?.slice()
      .reverse()
      .map((training: any) => ({
        date: training.training_date,
        score: Number(training.total_score || 0),
      })) || [];

  const totalScore =
    latestTrainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_score || 0),
      0
    ) || 0;

  const avgLatestScore =
    latestTrainings && latestTrainings.length > 0
      ? Math.round(totalScore / latestTrainings.length)
      : 0;

  const athleteStatsMap = new Map();

  monthTrainings?.forEach((training: any) => {
    const athleteId = training.athlete_id;
    const athleteName =
      training.athlete_profiles?.users?.name || "Atleta sin nombre";
    const photoUrl = training.athlete_profiles?.users?.profile_photo_url || null;

    if (!athleteStatsMap.has(athleteId)) {
      athleteStatsMap.set(athleteId, {
        athleteId,
        name: athleteName,
        photoUrl,
        trainings: 0,
        totalScore: 0,
        totalArrows: 0,
        bestScore: 0,
        avgScore: 0,
      });
    }

    const current = athleteStatsMap.get(athleteId);

    current.trainings += 1;
    current.totalScore += Number(training.total_score || 0);
    current.totalArrows += Number(training.total_arrows || 0);
    current.bestScore = Math.max(
      current.bestScore,
      Number(training.total_score || 0)
    );
    current.avgScore =
      current.trainings > 0
        ? Math.round(current.totalScore / current.trainings)
        : 0;
  });

  const rankingMonth = Array.from(athleteStatsMap.values()).sort(
    (a, b) => b.avgScore - a.avgScore
  );

  const top5Athletes = rankingMonth.slice(0, 5);

  const archerOfMonth = rankingMonth[0] || null;

  const inactiveAthletes =
    Math.max((athletesCount || 0) - athleteStatsMap.size, 0);

  const quickAlerts = [
    {
      title: "Atletas sin entrenar este mes",
      value: inactiveAthletes,
      tone: inactiveAthletes > 0 ? "text-amber-300" : "text-emerald-300",
    },
    {
      title: "Mejor score del mes",
      value: bestScoreMonth,
      tone: "text-cyan-300",
    },
    {
      title: "Flechas registradas",
      value: arrowsRegistered,
      tone: "text-blue-300",
    },
  ];

  return (
    <main className="min-h-screen tal-radial tal-grid-bg px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Panel principal
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Sesión: {profile.name} · {profile.role}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/athletes"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
            >
              Atletas
            </Link>

            <Link
              href="/trainings"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
            >
              Entrenamientos
            </Link>

            <LogoutButton />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-cyan-950/40 p-8 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl">
          <div className="absolute right-[-120px] top-[-120px] h-[340px] w-[340px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-cyan-300">
                TECH ARCHERY LAB
              </p>

              <h1 className="mt-5 text-5xl font-black tracking-tight text-white md:text-7xl">
                Archery
                <span className="block tal-text-glow text-cyan-300">
                  Performance Lab
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                Plataforma avanzada de análisis, entrenamiento y telemetría para
                arqueros de alto rendimiento.
              </p>
            </div>

            <div className="tal-card tal-glow p-6">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                Arquero del mes
              </p>

              {archerOfMonth ? (
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-2xl font-black text-cyan-200">
                    {archerOfMonth.name.charAt(0)}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {archerOfMonth.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Promedio mensual: {archerOfMonth.avgScore}
                    </p>
                    <p className="text-sm text-slate-400">
                      Entrenamientos: {archerOfMonth.trainings} · Mejor score:{" "}
                      {archerOfMonth.bestScore}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  Aún no hay entrenamientos este mes.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Atletas" value={athletesCount || 0} icon={Users} />
          <KpiCard title="Entrenamientos" value={trainingsCount || 0} icon={Activity} />
          <KpiCard title="Entrenamientos del mes" value={monthTrainingsCount || 0} icon={Target} />
          <KpiCard title="Flechas registradas" value={arrowsRegistered} icon={Crosshair} />
          <KpiCard title="Mejor score del mes" value={bestScoreMonth} icon={Trophy} />
          <KpiCard title="Prom. últimos" value={avgLatestScore} icon={BarChart3} highlight />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="tal-panel tal-glow p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                  Ranking del mes
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Top 5 atletas
                </h2>
              </div>

              <Link
                href="/athletes"
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/20"
              >
                Ver atletas
              </Link>
            </div>

            <div className="space-y-3">
              {top5Athletes.length > 0 ? (
                top5Athletes.map((athlete, index) => (
                  <div
                    key={athlete.athleteId}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-black text-cyan-300">
                        #{index + 1}
                      </div>

                      <div>
                        <p className="font-black text-white">{athlete.name}</p>
                        <p className="text-sm text-slate-400">
                          {athlete.trainings} entrenamientos ·{" "}
                          {athlete.totalArrows} flechas
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-cyan-300">
                        {athlete.avgScore}
                      </p>
                      <p className="text-xs text-slate-500">promedio</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
                  Aún no hay ranking mensual disponible.
                </p>
              )}
            </div>
          </div>

          <div className="tal-panel tal-glow p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
              Alertas rápidas
            </p>

            <div className="mt-5 space-y-3">
              {quickAlerts.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-sm font-bold text-slate-400">
                    {alert.title}
                  </p>
                  <p className={`mt-1 text-3xl font-black ${alert.tone}`}>
                    {alert.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="tal-panel tal-glow p-6">
            <ScoreChart data={scoreChartData} />
          </section>

          <section className="tal-panel tal-glow p-6">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                Actividad reciente
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Últimos entrenamientos
              </h2>
            </div>

            <div className="space-y-3">
              {latestTrainings && latestTrainings.length > 0 ? (
                latestTrainings.map((training: any) => (
                  <Link
                    key={training.id}
                    href={`/trainings/${training.id}`}
                    className="block rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-white">
                          {training.athlete_profiles?.users?.name ||
                            "Atleta sin nombre"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {training.training_date} · {training.session_type} ·{" "}
                          {training.location || "Sin ubicación"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black text-cyan-300">
                          {training.total_score || 0}
                        </p>
                        <p className="text-xs text-slate-500">score</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
                  Aún no hay entrenamientos registrados.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  highlight = false,
}: {
  title: string;
  value: number;
  icon?: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "tal-metric-card border-cyan-300/30 bg-cyan-400/10"
          : "tal-metric-card"
      }
    >
      {Icon && (
        <span className="tal-metric-icon">
          <Icon size={20} />
        </span>
      )}
      <p
        className={
          highlight
            ? "tal-metric-label text-cyan-300"
            : "tal-metric-label"
        }
      >
        {title}
      </p>
      <p className="tal-metric-value">{value}</p>
    </div>
  );
}
