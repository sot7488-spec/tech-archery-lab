export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crosshair,
  HelpCircle,
  MapPin,
  Target,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TrainingCreateModal from "../trainings/TrainingCreateModal";
import { updateTrainingAthleteResponse } from "./actions";

type PageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
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

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
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

function getAthleteName(relation: AthleteOption["users"] | undefined) {
  if (Array.isArray(relation)) return relation[0]?.name || "Atleta sin nombre";
  return relation?.name || "Atleta sin nombre";
}

function normalizeType(type: string | null | undefined) {
  return String(type || "entrenamiento").toLowerCase();
}

function typeStyle(type: string | null | undefined) {
  const normalized = normalizeType(type);

  if (normalized.includes("competencia")) {
    return {
      accent: "border-yellow-300/30 bg-yellow-400/10 text-yellow-200",
      dot: "bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.6)]",
      label: "Competencia",
    };
  }

  if (normalized.includes("tuning")) {
    return {
      accent: "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-200",
      dot: "bg-fuchsia-300 shadow-[0_0_18px_rgba(217,70,239,0.55)]",
      label: "Tuning",
    };
  }

  if (normalized.includes("fis") || normalized.includes("fís")) {
    return {
      accent: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
      dot: "bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.55)]",
      label: "Fisico",
    };
  }

  if (normalized.includes("puntu")) {
    return {
      accent: "border-blue-300/30 bg-blue-400/10 text-blue-200",
      dot: "bg-blue-300 shadow-[0_0_18px_rgba(96,165,250,0.55)]",
      label: "Puntuacion",
    };
  }

  return {
    accent: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
    dot: "bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.55)]",
    label: "Tecnico",
  };
}

function formatTime(time: string | null | undefined) {
  if (!time) return "Sin hora";
  return time.slice(0, 5);
}

function responseStyle(response: string | null | undefined) {
  if (response === "accepted") {
    return {
      label: "Confirmado",
      className: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
      icon: CheckCircle2,
    };
  }

  if (response === "rejected") {
    return {
      label: "Rechazado",
      className: "border-red-300/25 bg-red-500/10 text-red-200",
      icon: XCircle,
    };
  }

  return {
    label: "Pendiente",
    className: "border-white/10 bg-slate-950/50 text-slate-300",
    icon: HelpCircle,
  };
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role === "coach" && !profile.club_id) redirect("/");
  const isAthlete = profile.role === "athlete";
  const isCoach = profile.role === "coach";

  let currentAthleteId = "";

  if (isAthlete) {
    const { data: athleteProfile } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!athleteProfile?.id) redirect("/athletes/profile");
    currentAthleteId = athleteProfile.id;
  }

  const baseDate = params?.date ? new Date(`${params.date}T12:00:00`) : new Date();
  const weekStart = getMonday(Number.isNaN(baseDate.getTime()) ? new Date() : baseDate);
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const previousWeek = toDateInputValue(addDays(weekStart, -7));
  const nextWeek = toDateInputValue(addDays(weekStart, 7));
  const today = toDateInputValue(new Date());

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
    athletesQuery = athletesQuery.eq("club_id", profile.club_id);
  } else if (isAthlete) {
    athletesQuery = athletesQuery.eq("id", currentAthleteId);
  }

  const { data: athletesRaw } = await athletesQuery;
  const athletes = (athletesRaw || []) as AthleteOption[];
  const scopedAthleteIds = athletes.map((athlete) => athlete.id);

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
      : isAthlete
      ? equipmentProfilesRaw?.filter((equipment) =>
          equipment.athlete_id === currentAthleteId
        )
      : equipmentProfilesRaw
  ) as EquipmentOption[] | null;

  let trainingsQuery = supabase
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
        total_series
      )
    `)
    .gte("training_date", toDateInputValue(weekStart))
    .lte("training_date", toDateInputValue(weekEnd))
    .order("training_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (isCoach) {
    trainingsQuery = trainingsQuery.eq("club_id", profile.club_id);
  } else if (isAthlete) {
    trainingsQuery = trainingsQuery.eq("athlete_id", currentAthleteId);
  }

  const { data: trainingsRaw, error } = await trainingsQuery;
  const trainings = trainingsRaw || [];

  const trainingsByDate = new Map<string, any[]>();
  weekDays.forEach((day) => trainingsByDate.set(toDateInputValue(day), []));

  trainings.forEach((training: any) => {
    const list = trainingsByDate.get(training.training_date);
    if (list) list.push(training);
  });

  const plannedCount = trainings.length;
  const competitionCount = trainings.filter((training: any) =>
    normalizeType(training.session_type).includes("competencia")
  ).length;
  const uniqueAthletes = new Set(trainings.map((training: any) => training.athlete_id));

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-20" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/trainings"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            Entrenamientos
          </Link>

          {!isAthlete && (
            <TrainingCreateModal
              athletes={athletes}
              equipmentProfiles={equipmentProfiles || []}
            />
          )}
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Coach Agenda
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Agenda semanal
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                {isAthlete
                  ? "Confirma o rechaza tus entrenamientos programados desde una linea del tiempo semanal."
                  : "Linea del tiempo para visualizar entrenamientos programados del club por dia, tipo, atleta y objetivo."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/agenda?date=${previousWeek}`} className="tal-button-dark inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Semana anterior
              </Link>
              <Link href={`/agenda?date=${today}`} className="tal-button-dark">
                Hoy
              </Link>
              <Link href={`/agenda?date=${nextWeek}`} className="tal-button inline-flex items-center gap-2">
                Siguiente
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Metric icon={CalendarDays} title="Programados" value={plannedCount} />
          <Metric icon={Users} title="Atletas activos" value={uniqueAthletes.size} />
          <Metric icon={Trophy} title="Competencias" value={competitionCount} />
        </section>

        <section className="tal-chart-card">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                {toDateInputValue(weekStart)} / {toDateInputValue(weekEnd)}
              </p>
              <h2 className="mt-2 text-2xl font-black tal-text-glow">
                Linea del tiempo
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
              {["tecnico", "puntuacion", "competencia", "tuning", "fisico"].map((type) => {
                const style = typeStyle(type);

                return (
                  <span key={type} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${style.accent}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
              {JSON.stringify(error)}
            </div>
          )}

          <div className="space-y-4">
            {weekDays.map((day) => {
              const dateKey = toDateInputValue(day);
              const dayTrainings = trainingsByDate.get(dateKey) || [];
              const isToday = dateKey === today;

              return (
                <div
                  key={dateKey}
                  className={`grid gap-5 rounded-[1.8rem] border p-5 lg:grid-cols-[180px_1fr] ${
                    isToday
                      ? "border-cyan-300/30 bg-cyan-400/[0.07] shadow-[0_0_35px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-slate-950/55"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 lg:block">
                    <div className="flex items-center gap-4 lg:block">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-slate-950/70 text-3xl font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        {day.getDate()}
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                          {day.toLocaleDateString("es-MX", { weekday: "long" })}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-400">
                          {day.toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300">
                      <CalendarDays size={14} className="text-cyan-300" />
                      {dayTrainings.length}
                    </span>
                  </div>

                  <div className="relative space-y-3 border-l border-cyan-400/20 pl-5">
                    {dayTrainings.map((training: any) => {
                      const style = typeStyle(training.session_type);
                      const response = responseStyle(
                        training.athlete_response_status || "pending"
                      );
                      const ResponseIcon = response.icon;
                      const round = training.training_rounds?.[0] || {};

                      return (
                        <div
                          key={training.id}
                          className={`group relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)] ${style.accent}`}
                        >
                          <span className={`absolute -left-[29px] top-6 h-4 w-4 rounded-full border-2 border-slate-950 ${style.dot}`} />
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70" />

                          <Link href={`/trainings/${training.id}`} className="block">
                            <div className="grid gap-4 lg:grid-cols-[minmax(180px,0.8fr)_1.4fr_auto] lg:items-center">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white">
                                    <Clock size={13} />
                                    {formatTime(training.start_time)}
                                  </span>
                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em]">
                                    <Activity size={13} />
                                    {style.label}
                                  </span>
                                </div>

                                <h4 className="mt-3 truncate text-xl font-black text-white">
                                  {getAthleteName(training.athlete_profiles?.users)}
                                </h4>
                              </div>

                              <div className="grid gap-2 text-sm font-bold text-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                                <p className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                                  <MapPin size={15} className="shrink-0 text-cyan-200" />
                                  <span className="truncate">{training.location || "Sin lugar"}</span>
                                </p>
                                <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                                  <Target size={15} className="shrink-0 text-cyan-200" />
                                  {round.distance_meters || "-"} m
                                </p>
                                <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                                  <Crosshair size={15} className="shrink-0 text-cyan-200" />
                                  {round.target_size_cm || "-"} cm
                                </p>
                                <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                                  <CalendarDays size={15} className="shrink-0 text-cyan-200" />
                                  {round.total_series || "-"} series
                                </p>
                              </div>

                              <div className="flex items-center justify-start lg:justify-end">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] ${response.className}`}>
                                  <ResponseIcon size={13} />
                                  {response.label}
                                </span>
                              </div>
                            </div>

                            <p className="mt-4 line-clamp-2 rounded-xl border border-white/10 bg-slate-950/25 px-3 py-2 text-sm font-bold text-slate-300">
                              {training.objective || "Sin objetivo"}
                            </p>
                          </Link>

                          {isAthlete && (
                            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:flex sm:justify-end">
                              <form action={updateTrainingAthleteResponse}>
                                <input type="hidden" name="training_id" value={training.id} />
                                <input type="hidden" name="response" value="accepted" />
                                <button
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 sm:w-auto"
                                >
                                  <CheckCircle2 size={14} />
                                  Confirmar
                                </button>
                              </form>

                              <form action={updateTrainingAthleteResponse}>
                                <input type="hidden" name="training_id" value={training.id} />
                                <input type="hidden" name="response" value="rejected" />
                                <button
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500 hover:text-white sm:w-auto"
                                >
                                  <XCircle size={14} />
                                  Rechazar
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayTrainings.length === 0 && (
                      <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-slate-500">
                        Sin entrenamientos programados
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value: number;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value">{value}</p>
    </div>
  );
}
