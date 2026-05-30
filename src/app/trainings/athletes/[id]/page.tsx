export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Target,
  Trophy,
  Wind,
  Gauge,
  BarChart3,
  Crosshair,
  Eye,
} from "lucide-react";

export default async function AthleteTrainingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id: athleteId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Link href="/login" className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select(`
      id,
      user_id,
      club_id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `)
    .eq("id", athleteId)
    .single();

  if (!athlete) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8">
          <h1 className="text-3xl font-black text-red-300">Atleta no encontrado</h1>
        </div>
      </main>
    );
  }

  if (currentUser?.role === "athlete" && athlete.user_id !== user.id) {
    const { data: ownAthlete } = await supabase
      .from("athlete_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (ownAthlete?.id) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
          <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
            <h1 className="text-2xl font-black text-red-300">
              No puedes ver entrenamientos de otro atleta.
            </h1>

            <Link
              href={`/trainings/athletes/${ownAthlete.id}`}
              className="mt-5 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
            >
              Ir a mis entrenamientos
            </Link>
          </div>
        </main>
      );
    }
  }

  if (currentUser?.role === "coach" && athlete.club_id !== currentUser.club_id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-black text-red-300">
            Solo puedes ver entrenamientos de atletas de tu club.
          </h1>

          <Link
            href="/trainings"
            className="mt-5 inline-block rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
          >
            Volver a entrenamientos
          </Link>
        </div>
      </main>
    );
  }

  const { data: trainings, error } = await supabase
    .from("training_sessions")
    .select(`
      *,
      equipment_profiles (
        id,
        name
      )
    `)
    .eq("athlete_id", athleteId)
    .order("training_date", { ascending: false });

  const athleteUser = Array.isArray(athlete.users)
    ? athlete.users[0]
    : athlete.users;

  const athleteName = athleteUser?.name || "Atleta";

  const totalTrainings = trainings?.length || 0;

  const totalScore =
    trainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_score || 0),
      0
    ) || 0;

  const totalArrows =
    trainings?.reduce(
      (sum: number, training: any) => sum + Number(training.total_arrows || 0),
      0
    ) || 0;

  const averageScore =
    totalTrainings > 0 ? Math.round(totalScore / totalTrainings) : 0;

  const competitionSessions =
    trainings?.filter((training: any) => training.session_type === "competencia")
      .length || 0;

  const completedSessions =
    trainings?.filter((training: any) => training.status === "completed")
      .length || 0;

  const statCardClass =
    "tal-metric-card px-4 py-3";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-5 text-white md:px-6">
      <div className="absolute inset-0 tal-grid-bg opacity-20" />
      <div className="absolute right-[-220px] top-0 h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[-140px] h-[380px] w-[380px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/athletes/${athleteId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-cyan-300 backdrop-blur-xl transition hover:bg-cyan-400/10"
          >
            <ArrowLeft size={15} />
            Mi ficha
          </Link>

          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-300">
            {completedSessions}/{totalTrainings} finalizados
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/30 p-6 shadow-[0_0_45px_rgba(34,211,238,0.08)]">
          <div className="absolute right-[-80px] top-[-90px] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Athlete Training
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
                Mis entrenamientos
              </h1>

              <p className="mt-2 text-sm font-bold text-cyan-300">
                {athleteName}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300">
                  {athlete.category || "Sin categoría"}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300">
                  {athlete.bow_type || "Sin arco"}
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-right shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase text-cyan-300">Sesiones</p>
              <p className="text-4xl font-black text-white">{totalTrainings}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className={statCardClass}>
            <Activity className="mb-1.5 text-cyan-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Entrenamientos</p>
            <p className="mt-1 text-2xl font-black text-white">{totalTrainings}</p>
          </div>

          <div className={statCardClass}>
            <Trophy className="mb-1.5 text-yellow-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Score acumulado</p>
            <p className="mt-1 text-2xl font-black text-white">{totalScore}</p>
          </div>

          <div className={statCardClass}>
            <BarChart3 className="mb-1.5 text-cyan-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Promedio</p>
            <p className="mt-1 text-2xl font-black text-white">{averageScore}</p>
          </div>

          <div className={statCardClass}>
            <Target className="mb-1.5 text-cyan-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Flechas</p>
            <p className="mt-1 text-2xl font-black text-white">{totalArrows}</p>
          </div>

          <div className={statCardClass}>
            <Crosshair className="mb-1.5 text-cyan-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Competencias</p>
            <p className="mt-1 text-2xl font-black text-white">{competitionSessions}</p>
          </div>

          <div className={statCardClass}>
            <Gauge className="mb-1.5 text-cyan-300" size={19} />
            <p className="text-[11px] font-bold text-slate-400">Finalizados</p>
            <p className="mt-1 text-2xl font-black text-white">{completedSessions}</p>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Historial de sesiones
            </p>

            <p className="text-xs font-bold text-slate-500">
              {totalTrainings} registros
            </p>
          </div>

          {trainings?.map((training: any) => (
            <Link
              key={training.id}
              href={`/trainings/${training.id}`}
              className="group relative block overflow-hidden rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] px-4 py-3 shadow-[0_0_28px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.06]"
            >
              <div className="absolute right-[-60px] top-[-70px] h-44 w-44 rounded-full bg-cyan-400/5 blur-3xl transition group-hover:bg-cyan-400/10" />

              <div className="relative z-10 grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1.1fr_1.1fr_150px] lg:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-300">
                      <CalendarDays size={12} />
                      {training.training_date}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
                      {training.status || "draft"}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-white">
                    {training.session_type || "Entrenamiento"}
                  </h2>

                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {training.objective || "Sin objetivo registrado."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MiniInfo icon={MapPin} label="Lugar" value={training.location || "-"} />
                  <MiniInfo icon={Wind} label="Viento" value={`${training.wind_speed_kmh || 0} km/h`} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MiniInfo icon={Gauge} label="Brace" value={`${training.brace_height_cm || 0} cm`} />
                  <MiniInfo icon={Target} label="Flechas" value={training.total_arrows || 0} />
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-[1.2rem] bg-cyan-400 px-4 py-3 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                  <div>
                    <p className="text-[10px] font-black uppercase">Score</p>
                    <p className="text-3xl font-black leading-none">
                      {training.total_score || 0}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/10">
                    <Eye size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {trainings?.length === 0 && (
            <div className="rounded-[1.7rem] border border-cyan-400/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">
              No tienes entrenamientos registrados todavía.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.1rem] border border-white/5 bg-slate-950/70 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
        <Icon size={12} />
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}
