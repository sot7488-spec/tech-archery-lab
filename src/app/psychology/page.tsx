export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Brain,
  Building2,
  CalendarCheck,
  ClipboardList,
  Flag,
  HeartPulse,
  ListChecks,
  Mail,
  NotebookPen,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wind,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createPerformanceStaff } from "../sports-support/actions";
import {
  assignMentalTechnique,
  createMentalRoutine,
  createMentalSeasonPlan,
  createSportPsychologySession,
  logMentalTechniquePractice,
} from "./actions";
import { TechniqueLibraryModal } from "./TechniqueLibraryModal";

type Profile = {
  role: string;
  club_id: string | null;
};

function getName(relation: any, fallback = "Sin nombre") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getClubName(club: any) {
  if (Array.isArray(club)) return club[0]?.name || "Sin club";
  return club?.name || "Sin club";
}

export default async function PsychologyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("users")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profileRaw) redirect("/login");
  const profile = profileRaw as Profile;

  const isAdmin = profile.role === "admin";
  const isCoach = profile.role === "coach";
  const isPsychologist = profile.role === "sports_psychologist";

  if (!isAdmin && !isCoach && !isPsychologist) redirect("/");
  if ((isCoach || isPsychologist) && !profile.club_id) redirect("/");

  const { data: psychologistStaffRaw } = isPsychologist
    ? await supabase
        .from("performance_staff")
        .select("*")
        .eq("user_id", user.id)
        .eq("staff_type", "sports_psychologist")
        .maybeSingle()
    : { data: null };

  const psychologistStaff = psychologistStaffRaw as any;

  let clubsQuery = supabase
    .from("clubs")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!isAdmin) clubsQuery = clubsQuery.eq("id", profile.club_id);

  const { data: clubsRaw } = await clubsQuery;
  const clubs = clubsRaw || [];

  let staffQuery = supabase
    .from("performance_staff")
    .select("*, clubs(name)")
    .eq("staff_type", "sports_psychologist")
    .order("created_at", { ascending: false });

  if (!isAdmin) staffQuery = staffQuery.eq("club_id", profile.club_id);

  const { data: staffRaw } = await staffQuery;
  const staff = staffRaw || [];
  const activeStaff = staff.filter((member: any) => member.is_active).length;

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(
      `
      id,
      club_id,
      category,
      bow_type,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (!isAdmin) athletesQuery = athletesQuery.eq("club_id", profile.club_id);

  const { data: athletesRaw } = await athletesQuery;
  const athletes = athletesRaw || [];
  const athleteIds = athletes.map((athlete: any) => athlete.id);

  const { data: techniquesRaw } = await supabase
    .from("mental_techniques")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  const techniques = techniquesRaw || [];

  const { data: sessionsRaw, error: sessionsError } =
    athleteIds.length > 0
      ? await supabase
          .from("psychology_sessions")
          .select(
            `
            *,
            athlete_profiles (
              users!athlete_profiles_user_id_fkey (
                name
              )
            ),
            performance_staff (
              name
            ),
            mental_techniques (
              name
            )
          `
          )
          .in("athlete_id", athleteIds)
          .order("session_date", { ascending: false })
          .limit(12)
      : { data: [], error: null };

  const sessions = sessionsRaw || [];

  const { data: assignmentsRaw } =
    athleteIds.length > 0
      ? await supabase
          .from("athlete_mental_technique_assignments")
          .select(
            `
            *,
            athlete_profiles (
              users!athlete_profiles_user_id_fkey (
                name
              )
            ),
            mental_techniques (
              name,
              category
            )
          `
          )
          .in("athlete_id", athleteIds)
          .eq("status", "active")
          .order("assigned_at", { ascending: false })
          .limit(12)
      : { data: [] };

  const assignments = assignmentsRaw || [];

  const { data: routinesRaw } =
    athleteIds.length > 0
      ? await supabase
          .from("athlete_mental_routines")
          .select(
            `
            *,
            athlete_profiles (
              users!athlete_profiles_user_id_fkey (
                name
              )
            )
          `
          )
          .in("athlete_id", athleteIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8)
      : { data: [] };

  const routines = routinesRaw || [];

  const { data: practiceLogsRaw } =
    athleteIds.length > 0
      ? await supabase
          .from("athlete_mental_practice_logs")
          .select(
            `
            *,
            athlete_profiles (
              users!athlete_profiles_user_id_fkey (
                name
              )
            ),
            athlete_mental_technique_assignments (
              mental_techniques (
                name
              )
            )
          `
          )
          .in("athlete_id", athleteIds)
          .order("practiced_at", { ascending: false })
          .limit(8)
      : { data: [] };

  const practiceLogs = practiceLogsRaw || [];

  const { data: seasonPlansRaw } =
    athleteIds.length > 0
      ? await supabase
          .from("athlete_mental_season_plans")
          .select(
            `
            *,
            athlete_profiles (
              users!athlete_profiles_user_id_fkey (
                name
              )
            )
          `
          )
          .in("athlete_id", athleteIds)
          .eq("status", "active")
          .order("start_date", { ascending: false })
          .limit(8)
      : { data: [] };

  const seasonPlans = seasonPlansRaw || [];
  const averageConfidence = averageMetric(sessions, "confidence_score");
  const averageFocus = averageMetric(sessions, "focus_score");
  const averagePressure = averageMetric(sessions, "pressure_score");
  const averageBreathing = averageMetric(sessions, "breathing_control_score");
  const mentalAlerts = buildMentalAlerts(sessions);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Mental Performance
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Psicologia deportiva
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium text-slate-400 md:text-base">
                Registro deportivo de sensaciones, foco, confianza, presion
                percibida, respiracion y rutinas mentales para rendimiento en
                tiro con arco.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Check-ins</p>
              <p className="text-5xl font-black">{sessions.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-yellow-300/25 bg-yellow-300/10 p-5">
          <div className="flex gap-3">
            <ShieldAlert className="mt-1 shrink-0 text-yellow-200" size={22} />
            <div>
              <h2 className="text-lg font-black text-white">
                Alcance deportivo, no clinico
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-yellow-50/90">
                Esta seccion debe usarse solo para rendimiento deportivo:
                concentracion, confianza, control de respiracion, presion
                competitiva, rutina pre-tiro y recuperacion despues de errores.
                No sustituye atencion psicologica clinica ni debe registrar
                temas personales, medicos o de salud mental.
              </p>
            </div>
          </div>
        </section>

        {isPsychologist && !psychologistStaff?.id && (
          <section className="rounded-[1.7rem] border border-red-300/25 bg-red-500/10 p-5 text-sm font-bold text-red-100">
            Tu usuario tiene rol de psicologo deportivo, pero aun no esta
            vinculado a un registro de performance_staff. Pide a un admin que
            vincule tu usuario al contacto de psicologia.
          </section>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={Brain} title="Psicologos" value={staff.length} />
          <Metric icon={ShieldCheck} title="Activos" value={activeStaff} />
          <Metric icon={Users} title="Atletas" value={athletes.length} />
          <Metric icon={Target} title="Tecnicas" value={techniques.length} />
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={HeartPulse} title="Confianza prom." value={averageConfidence} suffix="/5" />
          <Metric icon={Activity} title="Foco prom." value={averageFocus} suffix="/5" />
          <Metric icon={ShieldAlert} title="Presion prom." value={averagePressure} suffix="/5" />
          <Metric icon={Wind} title="Respiracion prom." value={averageBreathing} suffix="/5" />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            {(isAdmin || isCoach) && (
              <form action={createPerformanceStaff} className="tal-chart-card space-y-4">
                <input type="hidden" name="staff_type" value="sports_psychologist" />
                <Header icon={Brain} eyebrow="Nuevo registro" title="Registrar psicologo deportivo" />

                <input name="name" required placeholder="Nombre completo" className="tal-input w-full" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="email" type="email" placeholder="Correo" className="tal-input w-full" />
                  <input name="phone" placeholder="Telefono" className="tal-input w-full" />
                </div>
                <input name="specialty" placeholder="Especialidad deportiva" className="tal-input w-full" />
                <div className="grid gap-3 md:grid-cols-2">
                  <input name="certification_level" placeholder="Certificacion" className="tal-input w-full" />
                  <input name="years_experience" type="number" min="0" defaultValue="0" className="tal-input w-full" />
                </div>
                <select
                  name="club_id"
                  className="tal-input w-full"
                  defaultValue={isCoach ? profile.club_id || "" : ""}
                  disabled={isCoach}
                  required
                >
                  <option className="bg-slate-900 text-white" value="">
                    Selecciona club
                  </option>
                  {clubs.map((club: any) => (
                    <option className="bg-slate-900 text-white" key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
                {isCoach && <input type="hidden" name="club_id" value={profile.club_id || ""} />}
                <textarea name="notes" placeholder="Notas de contacto" className="tal-input min-h-24 w-full resize-none" />
                <button className="tal-button inline-flex items-center justify-center gap-2">
                  <Sparkles size={17} />
                  Registrar
                </button>
              </form>
            )}

            <form action={createSportPsychologySession} className="tal-chart-card space-y-4">
              <Header icon={NotebookPen} eyebrow="Check-in deportivo" title="Registrar sensaciones deportivas" />
              <input type="hidden" name="staff_id" value={psychologistStaff?.id || ""} />

              <select name="athlete_id" className="tal-input w-full" required>
                <option className="bg-slate-900 text-white" value="">
                  Selecciona atleta
                </option>
                {athletes.map((athlete: any) => (
                  <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                    {getName(athlete.users, "Atleta")} - {athlete.category || "categoria"}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <input name="session_date" type="date" defaultValue={today()} className="tal-input w-full" />
                <select name="session_type" className="tal-input w-full" defaultValue="sport_checkin">
                  <option className="bg-slate-900 text-white" value="sport_checkin">Check-in deportivo</option>
                  <option className="bg-slate-900 text-white" value="technique_followup">Seguimiento tecnica</option>
                  <option className="bg-slate-900 text-white" value="competition_prep">Preparacion competencia</option>
                  <option className="bg-slate-900 text-white" value="post_competition">Post competencia</option>
                </select>
              </div>

              <input name="focus_area" placeholder="Enfoque deportivo: foco, rutina, presion..." className="tal-input w-full" />
              <textarea
                name="sport_feeling"
                placeholder="Sensaciones deportivas del arquero. Evita temas personales o clinicos."
                className="tal-input min-h-24 w-full resize-none"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <ScoreSelect name="confidence_score" label="Confianza" />
                <ScoreSelect name="focus_score" label="Foco" />
                <ScoreSelect name="pressure_score" label="Presion" />
                <ScoreSelect name="breathing_control_score" label="Respiracion" />
                <ScoreSelect name="routine_clarity_score" label="Rutina" />
                <ScoreSelect name="error_recovery_score" label="Reset error" />
              </div>

              <select name="technique_id" className="tal-input w-full" defaultValue="">
                <option className="bg-slate-900 text-white" value="">
                  Sin tecnica vinculada
                </option>
                {techniques.map((technique: any) => (
                  <option className="bg-slate-900 text-white" key={technique.id} value={technique.id}>
                    {technique.name} - {technique.category}
                  </option>
                ))}
              </select>

              <textarea name="recommendation" placeholder="Recomendacion deportiva para la siguiente sesion" className="tal-input min-h-24 w-full resize-none" />
              <textarea name="notes" placeholder="Notas deportivas visibles" className="tal-input min-h-20 w-full resize-none" />
              <textarea name="private_notes" placeholder="Notas internas del profesional deportivo" className="tal-input min-h-20 w-full resize-none" />

              <button className="tal-button inline-flex items-center justify-center gap-2">
                <Brain size={17} />
                Guardar check-in
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <form action={assignMentalTechnique} className="tal-chart-card space-y-4">
              <Header icon={Wind} eyebrow="Tecnicas" title="Asignar tecnica mental" />
              <input type="hidden" name="staff_id" value={psychologistStaff?.id || ""} />

              <select name="athlete_id" className="tal-input w-full" required>
                <option className="bg-slate-900 text-white" value="">
                  Selecciona atleta
                </option>
                {athletes.map((athlete: any) => (
                  <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                    {getName(athlete.users, "Atleta")}
                  </option>
                ))}
              </select>
              <select name="technique_id" className="tal-input w-full" required>
                <option className="bg-slate-900 text-white" value="">
                  Selecciona tecnica
                </option>
                {techniques.map((technique: any) => (
                  <option className="bg-slate-900 text-white" key={technique.id} value={technique.id}>
                    {technique.name}
                  </option>
                ))}
              </select>
              <textarea name="objective" placeholder="Objetivo deportivo de la tecnica" className="tal-input min-h-24 w-full resize-none" />
              <button className="tal-button inline-flex items-center justify-center gap-2">
                <Target size={17} />
                Asignar
              </button>
            </form>

            <form action={createMentalRoutine} className="tal-chart-card space-y-4">
              <Header icon={ListChecks} eyebrow="Rutina pre-tiro" title="Crear rutina mental" />
              <input type="hidden" name="staff_id" value={psychologistStaff?.id || ""} />

              <select name="athlete_id" className="tal-input w-full" required>
                <option className="bg-slate-900 text-white" value="">
                  Selecciona atleta
                </option>
                {athletes.map((athlete: any) => (
                  <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                    {getName(athlete.users, "Atleta")}
                  </option>
                ))}
              </select>
              <input name="title" placeholder="Titulo de la rutina" className="tal-input w-full" defaultValue="Rutina mental pre-tiro" />
              <textarea name="breathing_step" placeholder="Paso de respiracion: inhalar, sostener, exhalar..." className="tal-input min-h-20 w-full resize-none" />
              <textarea name="visualization_step" placeholder="Visualizacion deportiva antes de tirar" className="tal-input min-h-20 w-full resize-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="cue_word" placeholder="Palabra clave" className="tal-input w-full" />
                <input name="reset_action" placeholder="Accion de reset despues de error" className="tal-input w-full" />
              </div>
              <textarea name="competition_note" placeholder="Nota para competencia" className="tal-input min-h-20 w-full resize-none" />
              <button className="tal-button inline-flex items-center justify-center gap-2">
                <ClipboardList size={17} />
                Guardar rutina
              </button>
            </form>

            <TechniqueLibraryModal techniques={techniques as any} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <form action={createMentalSeasonPlan} className="tal-chart-card space-y-4">
            <Header icon={Flag} eyebrow="Temporada" title="Plan mental por temporada" />
            <input type="hidden" name="staff_id" value={psychologistStaff?.id || ""} />

            <select name="athlete_id" className="tal-input w-full" required>
              <option className="bg-slate-900 text-white" value="">
                Selecciona atleta
              </option>
              {athletes.map((athlete: any) => (
                <option className="bg-slate-900 text-white" key={athlete.id} value={athlete.id}>
                  {getName(athlete.users, "Atleta")}
                </option>
              ))}
            </select>
            <input name="title" placeholder="Nombre del plan" className="tal-input w-full" />
            <div className="grid gap-3 md:grid-cols-3">
              <select name="season_phase" className="tal-input w-full" defaultValue="preparation">
                <option className="bg-slate-900 text-white" value="base">Base</option>
                <option className="bg-slate-900 text-white" value="preparation">Preparacion</option>
                <option className="bg-slate-900 text-white" value="competition">Competencia</option>
                <option className="bg-slate-900 text-white" value="recovery">Recuperacion</option>
              </select>
              <input name="start_date" type="date" defaultValue={today()} className="tal-input w-full" />
              <input name="end_date" type="date" className="tal-input w-full" />
            </div>
            <textarea name="objective" placeholder="Objetivo mental deportivo" className="tal-input min-h-24 w-full resize-none" />
            <textarea name="focus_areas" placeholder="Areas de enfoque: respiracion, foco, rutina, presion..." className="tal-input min-h-24 w-full resize-none" />
            <textarea name="success_criteria" placeholder="Criterios observables de exito" className="tal-input min-h-24 w-full resize-none" />
            <button className="tal-button inline-flex items-center justify-center gap-2">
              <CalendarCheck size={17} />
              Guardar plan
            </button>
          </form>

          <form action={logMentalTechniquePractice} className="tal-chart-card space-y-4">
            <Header icon={Activity} eyebrow="Seguimiento" title="Registrar practica mental" />

            <select name="assignment_id" className="tal-input w-full" required>
              <option className="bg-slate-900 text-white" value="">
                Selecciona tecnica asignada
              </option>
              {assignments.map((assignment: any) => (
                <option className="bg-slate-900 text-white" key={assignment.id} value={assignment.id}>
                  {getName(assignment.athlete_profiles?.users, "Atleta")} - {assignment.mental_techniques?.name || "Tecnica"}
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-3">
              <input name="practiced_at" type="date" defaultValue={today()} className="tal-input w-full" />
              <select name="worked_status" className="tal-input w-full" defaultValue="practiced">
                <option className="bg-slate-900 text-white" value="practiced">Practicada</option>
                <option className="bg-slate-900 text-white" value="worked">Funciono</option>
                <option className="bg-slate-900 text-white" value="not_worked">No funciono</option>
              </select>
              <ScoreSelect name="usefulness_score" label="Utilidad" />
            </div>
            <textarea name="sport_comment" placeholder="Comentario deportivo sobre la practica" className="tal-input min-h-24 w-full resize-none" />
            <button className="tal-button inline-flex items-center justify-center gap-2">
              <Activity size={17} />
              Guardar seguimiento
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
          <section className="tal-chart-card">
            <Header icon={ShieldAlert} eyebrow="Alertas deportivas" title="Riesgos de rendimiento" />
            <div className="mt-5 grid gap-3">
              {mentalAlerts.map((alert) => (
                <article key={`${alert.athlete}-${alert.type}`} className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200">
                    {alert.type}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">{alert.athlete}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-yellow-50/90">
                    {alert.message}
                  </p>
                </article>
              ))}
              {mentalAlerts.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Sin alertas deportivas con los ultimos check-ins.
                </p>
              )}
            </div>
          </section>

          <section className="tal-chart-card">
            <Header icon={ListChecks} eyebrow="Rutina" title="Rutinas pre-tiro activas" />
            <div className="mt-5 grid gap-3">
              {routines.map((routine: any) => (
                <article key={routine.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {getName(routine.athlete_profiles?.users, "Atleta")}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">{routine.title}</h3>
                  <div className="mt-3 grid gap-2 text-sm font-bold leading-6 text-slate-300">
                    {routine.breathing_step && <p>Respiracion: {routine.breathing_step}</p>}
                    {routine.visualization_step && <p>Visualizacion: {routine.visualization_step}</p>}
                    {routine.cue_word && <p>Palabra clave: {routine.cue_word}</p>}
                    {routine.reset_action && <p>Reset: {routine.reset_action}</p>}
                  </div>
                </article>
              ))}
              {routines.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Sin rutinas pre-tiro activas.
                </p>
              )}
            </div>
          </section>

          <section className="tal-chart-card">
            <Header icon={Flag} eyebrow="Temporada" title="Planes mentales activos" />
            <div className="mt-5 grid gap-3">
              {seasonPlans.map((plan: any) => (
                <article key={plan.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {getName(plan.athlete_profiles?.users, "Atleta")} - {plan.season_phase}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">{plan.title}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-400">
                    {plan.start_date} {plan.end_date ? `a ${plan.end_date}` : ""}
                  </p>
                  {plan.objective && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{plan.objective}</p>
                  )}
                  {plan.success_criteria && (
                    <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm font-bold leading-6 text-emerald-100">
                      {plan.success_criteria}
                    </p>
                  )}
                </article>
              ))}
              {seasonPlans.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Sin planes mentales activos.
                </p>
              )}
            </div>
          </section>

          <section className="tal-chart-card">
            <Header icon={ClipboardList} eyebrow="Bitacora" title="Practica de tecnicas" />
            <div className="mt-5 grid gap-3">
              {practiceLogs.map((log: any) => (
                <article key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {log.practiced_at} - {log.worked_status}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {getName(log.athlete_profiles?.users, "Atleta")}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {log.athlete_mental_technique_assignments?.mental_techniques?.name || "Tecnica mental"} - utilidad {log.usefulness_score || "-"}/5
                  </p>
                  {log.sport_comment && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{log.sport_comment}</p>
                  )}
                </article>
              ))}
              {practiceLogs.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Aun no hay seguimiento de practica mental.
                </p>
              )}
            </div>
          </section>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
          <section className="tal-chart-card">
            <Header icon={Activity} eyebrow="Historial" title="Ultimos check-ins deportivos" />
            {sessionsError && (
              <p className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
                Corre el SQL supabase/20260617_sports_psychology_role.sql para habilitar los nuevos campos.
              </p>
            )}
            <div className="mt-5 grid gap-3">
              {sessions.map((session: any) => (
                <article key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {session.session_date} - {session.session_type || "check-in"}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        {getName(session.athlete_profiles?.users, "Atleta")}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black text-slate-300">
                      <Pill label="Conf" value={session.confidence_score} />
                      <Pill label="Foco" value={session.focus_score} />
                      <Pill label="Resp" value={session.breathing_control_score} />
                    </div>
                  </div>
                  {session.sport_feeling && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                      {session.sport_feeling}
                    </p>
                  )}
                  {session.recommendation && (
                    <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm font-bold leading-6 text-emerald-100">
                      {session.recommendation}
                    </p>
                  )}
                </article>
              ))}
              {sessions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Aun no hay check-ins deportivos registrados.
                </p>
              )}
            </div>
          </section>

          <section className="tal-chart-card">
            <Header icon={Target} eyebrow="Asignaciones" title="Tecnicas activas" />
            <div className="mt-5 grid gap-3">
              {assignments.map((assignment: any) => (
                <article key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {assignment.mental_techniques?.category || "tecnica"}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {assignment.mental_techniques?.name || "Tecnica"}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {getName(assignment.athlete_profiles?.users, "Atleta")}
                  </p>
                  {assignment.objective && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">
                      {assignment.objective}
                    </p>
                  )}
                </article>
              ))}
              {assignments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm font-bold text-slate-500">
                  Sin tecnicas asignadas.
                </p>
              )}
            </div>
          </section>
        </section>

        <section className="tal-chart-card">
          <Header icon={Users} eyebrow="Directorio" title="Psicologos deportivos registrados" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {staff.map((member: any) => (
              <article key={member.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  {getClubName(member.clubs)}
                </p>
                <h3 className="mt-1 text-xl font-black text-white">{member.name}</h3>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  {member.specialty || "Psicologia deportiva"}
                </p>
                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300 md:grid-cols-2">
                  <Contact icon={Mail} value={member.email || "Sin correo"} />
                  <Contact icon={Phone} value={member.phone || "Sin telefono"} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function averageMetric(items: any[], key: string) {
  const values = items.map((item) => Number(item[key] || 0)).filter(Boolean);
  if (!values.length) return "0.0";
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function buildMentalAlerts(sessions: any[]) {
  const byAthlete = new Map<string, any[]>();

  sessions.forEach((session) => {
    const name = getName(session.athlete_profiles?.users, "Atleta");
    byAthlete.set(name, [...(byAthlete.get(name) || []), session]);
  });

  return Array.from(byAthlete.entries()).flatMap(([athlete, athleteSessions]) => {
    const recent = athleteSessions.slice(0, 3);
    const confidence = Number(averageMetric(recent, "confidence_score"));
    const pressure = Number(averageMetric(recent, "pressure_score"));
    const breathing = Number(averageMetric(recent, "breathing_control_score"));
    const reset = Number(averageMetric(recent, "error_recovery_score"));
    const alerts = [];

    if (confidence > 0 && confidence <= 2.5) {
      alerts.push({
        athlete,
        type: "Confianza baja",
        message:
          "Revisar lenguaje de auto-instruccion, metas de proceso y una rutina breve antes de cada serie.",
      });
    }

    if (pressure >= 4) {
      alerts.push({
        athlete,
        type: "Presion competitiva alta",
        message:
          "Practicar respiracion cuadrada y simulaciones de competencia con foco en proceso, no en resultado.",
      });
    }

    if (breathing > 0 && breathing <= 2.5) {
      alerts.push({
        athlete,
        type: "Control respiratorio bajo",
        message:
          "Asignar una tecnica de respiracion de 3 a 5 minutos y verificar adherencia antes de entrenar.",
      });
    }

    if (reset > 0 && reset <= 2.5) {
      alerts.push({
        athlete,
        type: "Recuperacion despues de error",
        message:
          "Definir una accion de reset visible: soltar tension, palabra clave y regreso a la tarea inmediata.",
      });
    }

    return alerts;
  });
}

function Header({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="tal-metric-icon mb-0">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      </div>
    </div>
  );
}

function ScoreSelect({ name, label }: { name: string; label: string }) {
  return (
    <label className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <select name={name} defaultValue="3" className="tal-input w-full">
        {[1, 2, 3, 4, 5].map((value) => (
          <option className="bg-slate-900 text-white" key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
  suffix = "",
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value">
        {value}
        {suffix && <span className="text-xl text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}

function Contact({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  value: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <Icon size={15} className="shrink-0 text-cyan-300" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function Pill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
      {label}: {value || "-"}
    </span>
  );
}
