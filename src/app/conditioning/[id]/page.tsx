export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Goal,
  NotebookPen,
  Repeat,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createConditioningRoutine } from "../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getName(relation: any, fallback = "Sin nombre") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ConditioningStaffDetailPage({ params }: PageProps) {
  const { id } = await params;
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
  if (profile.role !== "admin" && profile.role !== "coach") redirect("/");

  const { data: staff } = await supabase
    .from("performance_staff")
    .select(`
      *,
      clubs (
        name
      )
    `)
    .eq("id", id)
    .eq("staff_type", "physical_trainer")
    .single();

  if (!staff) redirect("/conditioning");
  if (profile.role === "coach" && staff.club_id !== profile.club_id) {
    redirect("/conditioning");
  }

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(`
      id,
      club_id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (profile.role === "coach") {
    athletesQuery = athletesQuery.eq("club_id", profile.club_id);
  } else if (staff.club_id) {
    athletesQuery = athletesQuery.eq("club_id", staff.club_id);
  }

  const { data: athletesRaw } = await athletesQuery;
  const athletes = athletesRaw || [];
  const athleteIds = athletes.map((athlete: any) => athlete.id);

  const { data: goalsRaw } =
    athleteIds.length > 0
      ? await supabase
          .from("athlete_goals")
          .select("id, athlete_id, title, status, target_date")
          .in("athlete_id", athleteIds)
          .order("target_date", { ascending: true })
      : { data: [] };

  const goals = goalsRaw || [];

  const { data: routinesRaw, error } = await supabase
    .from("conditioning_routines")
    .select(`
      *,
      athlete_profiles (
        id,
        category,
        bow_type,
        users!athlete_profiles_user_id_fkey (
          name
        )
      ),
      athlete_goals (
        title
      ),
      conditioning_routine_exercises (
        exercise_order,
        name,
        focus_area,
        sets,
        reps,
        load,
        rest,
        notes
      )
    `)
    .eq("staff_id", staff.id)
    .order("start_date", { ascending: false })
    .limit(12);

  const routines = routinesRaw || [];
  const activeRoutines = routines.filter((routine: any) => routine.status === "active").length;
  const exercisesCount = routines.reduce(
    (sum: number, routine: any) => sum + (routine.conditioning_routine_exercises?.length || 0),
    0
  );

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/conditioning"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <ArrowLeft size={16} />
          Acondicionamiento
        </Link>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Perfil de preparador fisico
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                {staff.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                {staff.specialty || "Preparacion fisica especifica para tiro con arco"} · {getName(staff.clubs, "Club")}
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Rutinas activas</p>
              <p className="text-5xl font-black">{activeRoutines}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={UserRound} title="Atletas club" value={athletes.length} />
          <Metric icon={Target} title="Objetivos" value={goals.length} />
          <Metric icon={Repeat} title="Rutinas" value={routines.length} />
          <Metric icon={Dumbbell} title="Ejercicios" value={exercisesCount} />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.2fr]">
          <form action={createConditioningRoutine} className="tal-chart-card space-y-4">
            <input type="hidden" name="staff_id" value={staff.id} />
            <div className="flex items-center gap-3">
              <span className="tal-metric-icon">
                <NotebookPen size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Rutina especifica
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Crear rutina por objetivo
                </h2>
              </div>
            </div>

            <select name="athlete_id" className="tal-input w-full" required>
              <option className="bg-slate-900 text-white" value="">
                Selecciona atleta
              </option>
              {athletes.map((athlete: any) => (
                <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                  {getName(athlete.users, "Atleta")} · {athlete.category || "categoria"}
                </option>
              ))}
            </select>

            <select name="goal_id" className="tal-input w-full" defaultValue="">
              <option className="bg-slate-900 text-white" value="">
                Sin objetivo vinculado
              </option>
              {goals.map((goal: any) => {
                const athlete = athletes.find((item: any) => item.id === goal.athlete_id);
                return (
                  <option className="bg-slate-900 text-white" key={goal.id} value={goal.id}>
                    {getName(athlete?.users, "Atleta")} · {goal.title}
                  </option>
                );
              })}
            </select>

            <input name="title" required placeholder="Titulo de rutina" className="tal-input w-full" />
            <textarea
              name="objective"
              placeholder="Objetivo fisico de la rutina"
              className="tal-input min-h-24 w-full resize-none"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <input name="phase" placeholder="Fase" className="tal-input w-full" />
              <input
                name="frequency_per_week"
                type="number"
                min="1"
                max="7"
                defaultValue="3"
                className="tal-input w-full"
              />
              <input
                name="duration_weeks"
                type="number"
                min="1"
                max="52"
                defaultValue="4"
                className="tal-input w-full"
              />
            </div>

            <input name="start_date" type="date" defaultValue={today()} className="tal-input w-full" />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Ejercicios
              </p>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-3 md:grid-cols-6">
                    <input name={`exercise_name_${index}`} placeholder={`Ejercicio ${index}`} className="tal-input md:col-span-2" />
                    <input name={`exercise_focus_${index}`} placeholder="Foco" className="tal-input" />
                    <input name={`exercise_sets_${index}`} placeholder="Series" className="tal-input" />
                    <input name={`exercise_reps_${index}`} placeholder="Reps" className="tal-input" />
                    <input name={`exercise_rest_${index}`} placeholder="Descanso" className="tal-input" />
                    <input name={`exercise_load_${index}`} placeholder="Carga" className="tal-input md:col-span-2" />
                    <input name={`exercise_notes_${index}`} placeholder="Notas" className="tal-input md:col-span-4" />
                  </div>
                ))}
              </div>
            </div>

            <textarea
              name="notes"
              placeholder="Notas generales"
              className="tal-input min-h-24 w-full resize-none"
            />

            <button className="tal-button inline-flex items-center justify-center gap-2">
              <Goal size={17} />
              Crear rutina
            </button>
          </form>

          <section className="tal-chart-card">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Historial
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Rutinas recientes
                </h2>
              </div>
              <Activity className="text-cyan-300" size={24} />
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
                Corre el SQL de rutinas fisicas antes de usar esta seccion:
                supabase/20260604_conditioning_routines.sql
              </div>
            )}

            <div className="space-y-3">
              {routines.map((routine: any) => (
                <article
                  key={routine.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {getName(routine.athlete_profiles?.users, "Atleta")}
                      </p>
                      <h3 className="mt-1 text-xl font-black text-white">{routine.title}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-400">
                        {routine.athlete_goals?.title || routine.objective || "Sin objetivo vinculado"}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                      {routine.frequency_per_week}x semana · {routine.duration_weeks} sem
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-black text-slate-300 sm:grid-cols-3">
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <CalendarDays size={14} className="mr-1 inline text-cyan-300" />
                      {routine.start_date}
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      {routine.phase || "Fase libre"}
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      {routine.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(routine.conditioning_routine_exercises || []).map((exercise: any) => (
                      <div
                        key={`${routine.id}-${exercise.exercise_order}`}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm font-bold text-slate-300"
                      >
                        <p className="font-black text-white">
                          {exercise.exercise_order}. {exercise.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            exercise.focus_area,
                            exercise.sets && `${exercise.sets} series`,
                            exercise.reps && `${exercise.reps} reps`,
                            exercise.load,
                            exercise.rest && `descanso ${exercise.rest}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

              {routines.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-slate-500">
                  Aun no hay rutinas registradas para este preparador.
                </div>
              )}
            </div>
          </section>
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
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  value: number | string;
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
