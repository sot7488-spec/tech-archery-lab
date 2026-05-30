export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  CloudSun,
  Crosshair,
  Gauge,
  LocateFixed,
  MapPin,
  Ruler,
  Search,
  Target,
  Thermometer,
  Trophy,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TrainingCreateModal from "./TrainingCreateModal";

type SearchParams = {
  athlete_id?: string;
  athlete_name?: string;
  period?: string;
  from?: string;
  to?: string;
};

type AthleteOption = {
  id: string;
  club_id?: string | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

type EquipmentOption = {
  id: string;
  name: string | null;
  athlete_id: string;
  is_active: boolean | null;
};

function getRelatedName(relation: AthleteOption["users"] | undefined) {
  if (Array.isArray(relation)) return relation[0]?.name || "Atleta sin nombre";
  return relation?.name || "Atleta sin nombre";
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodRange(period: string) {
  const now = new Date();

  if (period === "today") {
    const today = toDateInputValue(now);
    return { from: today, to: today };
  }

  if (period === "week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { from: toDateInputValue(monday), to: toDateInputValue(sunday) };
  }

  if (period === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return { from: toDateInputValue(firstDay), to: toDateInputValue(lastDay) };
  }

  return { from: "", to: "" };
}

function formatIndicator(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const selectedAthleteId = params.athlete_id || "";
  const athleteNameFilter = params.athlete_name?.trim().toLowerCase() || "";
  const period = params.period || "";
  const rangeFromParams = params.from || "";
  const rangeToParams = params.to || "";
  const periodRange = getPeriodRange(period);
  const fromDate = period === "range" ? rangeFromParams : periodRange.from;
  const toDate = period === "range" ? rangeToParams : periodRange.to;

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

  const isAthlete = currentUser.role === "athlete";
  const isCoach = currentUser.role === "coach";
  const coachClubId = currentUser.club_id || "";

  if (isCoach && !coachClubId) redirect("/");

  let currentAthleteId = selectedAthleteId;

  if (isAthlete) {
    const { data: athleteProfile } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    currentAthleteId = athleteProfile?.id || "";
  }

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(`
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (isCoach) {
    athletesQuery = athletesQuery.eq("club_id", coachClubId);
  }

  const { data: athletesRaw } = await athletesQuery;
  const athletes = (athletesRaw || []) as AthleteOption[];
  const scopedAthleteIds = athletes.map((athlete) => athlete.id);

  if (isCoach && currentAthleteId && !scopedAthleteIds.includes(currentAthleteId)) {
    currentAthleteId = "";
  }

  const filteredAthletes = athleteNameFilter
    ? athletes.filter((athlete) =>
        getRelatedName(athlete.users).toLowerCase().includes(athleteNameFilter)
      )
    : athletes;

  const nameFilteredAthleteIds = filteredAthletes.map((athlete) => athlete.id);

  const { data: equipmentProfilesRaw } = await supabase
    .from("equipment_profiles")
    .select("id, name, athlete_id, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const equipmentProfiles = (
    isCoach
      ? equipmentProfilesRaw?.filter((equipment) =>
          scopedAthleteIds.includes(equipment.athlete_id)
        )
      : equipmentProfilesRaw
  ) as EquipmentOption[] | null;

  let query = supabase
    .from("training_sessions")
    .select(`
      *,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      ),
      training_rounds (
        distance_meters,
        target_size_cm,
        total_series,
        arrows_per_series
      )
    `)
    .order("training_date", { ascending: false });

  if (currentAthleteId) {
    query = query.eq("athlete_id", currentAthleteId);
  } else if (athleteNameFilter) {
    if (nameFilteredAthleteIds.length === 0) {
      query = query.in("athlete_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("athlete_id", nameFilteredAthleteIds);
    }
  } else if (isCoach) {
    query = query.eq("club_id", coachClubId);
  }

  if (fromDate) query = query.gte("training_date", fromDate);
  if (toDate) query = query.lte("training_date", toDate);

  const { data: trainings, error } = await query;

  const selectedAthlete = athletes.find(
    (athlete) => athlete.id === currentAthleteId
  );

  const totalTrainings = trainings?.length || 0;
  const totalScore =
    trainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_score || 0),
      0
    ) || 0;
  const averageScore =
    totalTrainings > 0 ? Math.round(totalScore / totalTrainings) : 0;
  const competitionSessions =
    trainings?.filter((training: any) => training.session_type === "competencia")
      .length || 0;

  const trainingStats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Entrenamientos", value: totalTrainings, icon: Activity },
    { label: "Score acumulado", value: totalScore, icon: Trophy },
    { label: "Promedio", value: averageScore, icon: BarChart3 },
    { label: "Competencias", value: competitionSessions, icon: Crosshair },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-20" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            Dashboard
          </Link>

          {!isAthlete && (
            <TrainingCreateModal
              athletes={athletes}
              equipmentProfiles={equipmentProfiles || []}
              selectedAthleteId={currentAthleteId}
            />
          )}
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Training Lab
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Entrenamientos
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                {selectedAthlete
                  ? `Análisis de sesiones de ${getRelatedName(selectedAthlete.users)}`
                  : "Sesiones, objetivos, clima, score, equipamiento y configuración técnica en una vista limpia."}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Sesiones</p>
              <p className="text-5xl font-black">{totalTrainings}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {trainingStats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="tal-metric-card">
              <span className="tal-metric-icon">
                <Icon size={20} />
              </span>
              <p className="tal-metric-label">{label}</p>
              <p className="tal-metric-value">{value}</p>
            </div>
          ))}
        </section>

        {!isAthlete && (
          <section className="tal-chart-card">
            <form method="GET" className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                <input
                  name="athlete_name"
                  defaultValue={params.athlete_name || ""}
                  placeholder="Buscar atleta por nombre"
                  className="tal-input w-full pl-11"
                />
              </div>

              <select name="period" defaultValue={period} className="tal-input">
                <option value="">Todos los periodos</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="range">Rango específico</option>
              </select>

              <input
                name="from"
                type="date"
                defaultValue={rangeFromParams}
                className="tal-input"
              />

              <input
                name="to"
                type="date"
                defaultValue={rangeToParams}
                className="tal-input"
              />

              <button className="tal-button inline-flex items-center justify-center gap-2">
                <Search size={16} />
                Filtrar
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/trainings"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-slate-300 transition hover:bg-white/20"
              >
                Limpiar filtros
              </Link>

              {currentAthleteId && (
                <span className="tal-chip">
                  {getRelatedName(selectedAthlete?.users)}
                </span>
              )}
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="space-y-4">
          {trainings?.map((training: any) => {
            const round = training.training_rounds?.[0] || {};
            const athleteName = getRelatedName(training.athlete_profiles?.users);

            return (
              <Link
                key={training.id}
                href={`/trainings/${training.id}`}
                className="group block overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-white/[0.045] p-5 shadow-[0_0_42px_rgba(0,0,0,0.30)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/[0.06] hover:shadow-[0_0_60px_rgba(34,211,238,0.12)]"
              >
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.55fr_1.6fr_auto] xl:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      {training.training_date}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      {athleteName}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {training.objective || "Sin objetivo registrado"}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-cyan-400/10 bg-slate-950/70 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Score
                    </p>
                    <p className="mt-1 text-4xl font-black text-cyan-300">
                      {training.total_score || 0}
                    </p>
                    <p className="text-xs text-slate-500">
                      {training.total_arrows || 0} flechas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Indicator icon={Gauge} title="Brace Height" value={`${formatIndicator(training.brace_height_cm, "0")} cm`} />
                    <Indicator icon={Ruler} title="Distancia" value={`${formatIndicator(round.distance_meters)} m`} />
                    <Indicator icon={Target} title="Tamaño diana" value={`${formatIndicator(round.target_size_cm)} cm`} />
                    <Indicator icon={Crosshair} title="Número de series" value={formatIndicator(round.total_series)} />
                    <Indicator icon={MapPin} title="Lugar" value={formatIndicator(training.location)} />
                    <Indicator icon={Activity} title="Tipo entrenamiento" value={formatIndicator(training.session_type, "Entrenamiento")} />
                    <Indicator icon={CloudSun} title="Clima" value={formatIndicator(training.weather)} />
                    <Indicator icon={Wind} title="Viento" value={`${formatIndicator(training.wind_speed_kmh, "0")} km/h`} />
                    <Indicator icon={Thermometer} title="Temperatura" value={`${formatIndicator(training.temperature_c, "0")} °C`} />
                    <Indicator icon={LocateFixed} title="Objetivo" value={formatIndicator(training.objective)} wide />
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition group-hover:translate-x-1 group-hover:bg-cyan-300">
                      <Waves size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {trainings?.length === 0 && (
            <div className="tal-chart-card text-center text-slate-400">
              No hay entrenamientos con los filtros seleccionados.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Indicator({
  icon: Icon,
  title,
  value,
  wide = false,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      title={title}
      className={`flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <Icon className="shrink-0 text-cyan-300" size={16} />
      <span className="truncate text-xs font-black text-white">{value}</span>
    </div>
  );
}
