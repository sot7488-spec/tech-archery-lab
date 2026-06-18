export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarDays,
  HeartPulse,
  Sparkles,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MentalLogClient from "./MentalLogClient";

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

type TrainingRow = {
  id: string;
  athlete_id: string;
  club_id: string | null;
  training_date: string | null;
  start_time: string | null;
  session_type: string | null;
  objective: string | null;
  athlete_profiles?:
    | { id?: string | null; users?: AthleteOption["users"] }
    | { id?: string | null; users?: AthleteOption["users"] }[]
    | null;
};

type MentalLog = {
  id: string;
  training_session_id: string;
  athlete_id: string;
  emotion_key: string;
  emotion_intensity: number;
  body_key: string;
  body_intensity: number;
  process_focus_score: number;
  emotional_control_score: number;
  error_recovery_score: number;
  mental_score: number;
  profile_label: string;
  sport_note: string | null;
  cue_word: string | null;
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

function metricProfile(score: number) {
  if (score >= 85) return "Optimo";
  if (score >= 70) return "Funcional";
  if (score >= 50) return "Atencion";
  return "Reforzar";
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Brain;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.035] p-5 shadow-[0_0_40px_rgba(34,211,238,0.05)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Icon size={20} />
        </span>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
    </div>
  );
}

export default async function MentalLogPage({ searchParams }: PageProps) {
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

  const isAthlete = profile.role === "athlete";
  const isCoach = profile.role === "coach";
  const isPsychologist = profile.role === "sports_psychologist";

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

  const baseDate = params?.date
    ? new Date(`${params.date}T12:00:00`)
    : new Date();
  const weekStart = getMonday(
    Number.isNaN(baseDate.getTime()) ? new Date() : baseDate
  );
  const weekEnd = addDays(weekStart, 6);
  const weekDaysRaw = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index)
  );
  const previousWeek = toDateInputValue(addDays(weekStart, -7));
  const nextWeek = toDateInputValue(addDays(weekStart, 7));
  const today = toDateInputValue(new Date());

  let trainingsQuery = supabase
    .from("training_sessions")
    .select(
      `
      id,
      athlete_id,
      club_id,
      training_date,
      start_time,
      session_type,
      objective,
      athlete_profiles (
        id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `
    )
    .gte("training_date", toDateInputValue(weekStart))
    .lte("training_date", toDateInputValue(weekEnd))
    .order("training_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (isAthlete) {
    trainingsQuery = trainingsQuery.eq("athlete_id", currentAthleteId);
  } else if (isCoach || isPsychologist) {
    if (!profile.club_id) redirect("/");
    trainingsQuery = trainingsQuery.eq("club_id", profile.club_id);
  }

  const { data: trainingsRaw } = await trainingsQuery;
  const trainings = ((trainingsRaw || []) as TrainingRow[]).map((training) => {
    const athleteProfile = Array.isArray(training.athlete_profiles)
      ? training.athlete_profiles[0]
      : training.athlete_profiles;

    return {
    id: String(training.id),
    athlete_id: String(training.athlete_id),
    club_id: training.club_id || null,
    training_date: String(training.training_date || ""),
    start_time: training.start_time || null,
    session_type: training.session_type || null,
    objective: training.objective || null,
    athleteName: getAthleteName(athleteProfile?.users),
    mentalLog: null as MentalLog | null,
    };
  });

  const trainingIds = trainings.map((training) => training.id);
  let schemaMissing = false;
  let mentalLogs: MentalLog[] = [];

  if (trainingIds.length > 0) {
    const { data: logsRaw, error: logsError } = await supabase
      .from("mental_training_logs")
      .select("*")
      .in("training_session_id", trainingIds);

    if (logsError) {
      schemaMissing = true;
    } else {
      mentalLogs = (logsRaw || []) as MentalLog[];
    }
  }

  const logByTraining = new Map(
    mentalLogs.map((log) => [log.training_session_id, log])
  );
  const trainingsWithLogs = trainings.map((training) => ({
    ...training,
    mentalLog: logByTraining.get(training.id) || null,
  }));

  const weekDays = weekDaysRaw.map((day) => {
    const dateKey = toDateInputValue(day);

    return {
      dateKey,
      label: day.toLocaleDateString("es-MX", { weekday: "long" }),
      shortLabel: day.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      }),
      dayNumber: day.getDate(),
      trainings: trainingsWithLogs.filter(
        (training) => training.training_date === dateKey
      ),
    };
  });

  const completedLogs = trainingsWithLogs.filter((training) => training.mentalLog);
  const averageMentalScore =
    completedLogs.length > 0
      ? Math.round(
          completedLogs.reduce(
            (sum, training) => sum + Number(training.mentalLog?.mental_score || 0),
            0
          ) / completedLogs.length
        )
      : 0;
  const profileLabel = completedLogs.length
    ? metricProfile(averageMentalScore)
    : "Sin registros";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="absolute inset-0 tal-grid-bg opacity-20" />
      <div className="absolute right-[-200px] top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-200px] left-[-120px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Mental Log
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Bitacora mental
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Registro semanal rapido y visual para detectar que estado mental
                favorece o interfiere con el rendimiento deportivo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/mental-log?date=${previousWeek}`}
                className="tal-button-dark inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Semana anterior
              </Link>
              <Link href={`/mental-log?date=${today}`} className="tal-button-dark">
                Hoy
              </Link>
              <Link
                href={`/mental-log?date=${nextWeek}`}
                className="tal-button inline-flex items-center gap-2"
              >
                Siguiente
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Metric icon={CalendarDays} title="Entrenamientos" value={trainings.length} />
          <Metric icon={HeartPulse} title="Registros" value={completedLogs.length} />
          <Metric icon={Sparkles} title="Perfil semanal" value={profileLabel} />
        </section>

        <section className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Target size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                {toDateInputValue(weekStart)} / {toDateInputValue(weekEnd)}
              </p>
              <h2 className="text-2xl font-black">Semana mental deportiva</h2>
            </div>
          </div>

          <MentalLogClient weekDays={weekDays} schemaMissing={schemaMissing} />
        </section>
      </div>
    </main>
  );
}
