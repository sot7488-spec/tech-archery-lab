export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Brain,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Mail,
  Phone,
  ShieldAlert,
  Target,
  UserRound,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function getName(relation: any, fallback = "Atleta") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function averageMetric(items: any[], key: string) {
  const values = items.map((item) => Number(item[key] || 0)).filter(Boolean);
  if (!values.length) return "0.0";
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

export default async function AthleteMindPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "athlete") redirect("/psychology");

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select(
      `
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  if (!athlete?.id) redirect("/athletes/profile");

  const { data: sessionsRaw } = await supabase
    .from("psychology_sessions")
    .select(
      `
      id,
      session_date,
      session_type,
      focus_area,
      sport_feeling,
      confidence_score,
      focus_score,
      pressure_score,
      breathing_control_score,
      routine_clarity_score,
      error_recovery_score,
      recommendation,
      notes,
      mental_techniques (
        name,
        category
      ),
      performance_staff (
        name
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("session_date", { ascending: false })
    .limit(12);

  const sessions = sessionsRaw || [];

  const { data: assignmentsRaw } = await supabase
    .from("athlete_mental_technique_assignments")
    .select(
      `
      id,
      objective,
      assigned_at,
      mental_techniques (
        name,
        category,
        instructions,
        duration_minutes
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .eq("status", "active")
    .order("assigned_at", { ascending: false });

  const assignments = assignmentsRaw || [];

  const { data: routinesRaw } = await supabase
    .from("athlete_mental_routines")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const routines = routinesRaw || [];

  const { data: practiceLogsRaw } = await supabase
    .from("athlete_mental_practice_logs")
    .select(
      `
      id,
      practiced_at,
      usefulness_score,
      worked_status,
      sport_comment,
      athlete_mental_technique_assignments (
        mental_techniques (
          name
        )
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("practiced_at", { ascending: false })
    .limit(10);

  const practiceLogs = practiceLogsRaw || [];

  const { data: seasonPlansRaw } = await supabase
    .from("athlete_mental_season_plans")
    .select("*")
    .eq("athlete_id", athlete.id)
    .eq("status", "active")
    .order("start_date", { ascending: false });

  const seasonPlans = seasonPlansRaw || [];

  const { data: staffRaw } = athlete.club_id
    ? await supabase
        .from("performance_staff")
        .select("id, name, email, phone, specialty, certification_level")
        .eq("club_id", athlete.club_id)
        .eq("staff_type", "sports_psychologist")
        .eq("is_active", true)
        .order("name", { ascending: true })
    : { data: [] };

  const staff = staffRaw || [];
  const athleteName = getName(athlete.users);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href={`/athletes/${athlete.id}`}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <ArrowLeft size={16} />
          Mi ficha
        </Link>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Mental Performance
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Mente Deportiva
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium text-slate-400 md:text-base">
                {athleteName}, aqui puedes consultar tus rutinas mentales,
                tecnicas asignadas, check-ins deportivos y recomendaciones para
                competir con mas claridad.
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
            <p className="text-sm font-bold leading-6 text-yellow-50/90">
              Esta seccion es solo para rendimiento deportivo: foco,
              respiracion, confianza, rutina, presion competitiva y recuperacion
              despues de errores. No sustituye atencion psicologica clinica ni
              debe usarse para temas personales.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={HeartPulse} title="Confianza" value={averageMetric(sessions, "confidence_score")} suffix="/5" />
          <Metric icon={Target} title="Foco" value={averageMetric(sessions, "focus_score")} suffix="/5" />
          <Metric icon={Wind} title="Respiracion" value={averageMetric(sessions, "breathing_control_score")} suffix="/5" />
          <Metric icon={Activity} title="Reset error" value={averageMetric(sessions, "error_recovery_score")} suffix="/5" />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <SummaryCard title="Rutina pre-tiro" icon={ClipboardList}>
            {routines[0] ? (
              <div className="space-y-3 text-sm font-bold leading-6 text-slate-300">
                <h2 className="text-xl font-black text-white">{routines[0].title}</h2>
                {routines[0].breathing_step && <p>Respiracion: {routines[0].breathing_step}</p>}
                {routines[0].visualization_step && <p>Visualizacion: {routines[0].visualization_step}</p>}
                {routines[0].cue_word && <p>Palabra clave: {routines[0].cue_word}</p>}
                {routines[0].reset_action && <p>Reset: {routines[0].reset_action}</p>}
              </div>
            ) : (
              <EmptyText text="Aun no tienes una rutina pre-tiro asignada." />
            )}
          </SummaryCard>

          <SummaryCard title="Plan de temporada" icon={CalendarCheck}>
            {seasonPlans[0] ? (
              <div className="space-y-3 text-sm font-bold leading-6 text-slate-300">
                <h2 className="text-xl font-black text-white">{seasonPlans[0].title}</h2>
                <p>{seasonPlans[0].season_phase} - {seasonPlans[0].start_date}</p>
                {seasonPlans[0].objective && <p>{seasonPlans[0].objective}</p>}
                {seasonPlans[0].success_criteria && (
                  <p className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-emerald-100">
                    {seasonPlans[0].success_criteria}
                  </p>
                )}
              </div>
            ) : (
              <EmptyText text="Aun no hay plan mental de temporada activo." />
            )}
          </SummaryCard>

          <SummaryCard title="Contacto" icon={UserRound}>
            <div className="grid gap-3">
              {staff.map((member: any) => (
                <article key={member.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <h2 className="text-lg font-black text-white">{member.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {member.specialty || member.certification_level || "Psicologia deportiva"}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
                    <ContactLine icon={Mail} value={member.email || "Sin correo"} />
                    <ContactLine icon={Phone} value={member.phone || "Sin telefono"} />
                  </div>
                </article>
              ))}
              {staff.length === 0 && <EmptyText text="Tu club aun no tiene psicologo deportivo registrado." />}
            </div>
          </SummaryCard>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="tal-chart-card">
            <Header icon={Brain} eyebrow="Tecnicas" title="Tecnicas activas" />
            <div className="mt-5 grid gap-3">
              {assignments.map((assignment: any) => (
                <article key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {assignment.mental_techniques?.category || "tecnica"} - {assignment.mental_techniques?.duration_minutes || 3} min
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {assignment.mental_techniques?.name || "Tecnica mental"}
                  </h3>
                  {assignment.objective && (
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-300">{assignment.objective}</p>
                  )}
                  {assignment.mental_techniques?.instructions && (
                    <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold leading-6 text-slate-400">
                      {assignment.mental_techniques.instructions}
                    </p>
                  )}
                </article>
              ))}
              {assignments.length === 0 && <EmptyText text="Aun no tienes tecnicas mentales asignadas." />}
            </div>
          </section>

          <section className="tal-chart-card">
            <Header icon={Activity} eyebrow="Historial" title="Ultimos check-ins" />
            <div className="mt-5 grid gap-3">
              {sessions.map((session: any) => (
                <article key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {session.session_date} - {session.session_type || "check-in"}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        {session.focus_area || "Check-in deportivo"}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black text-slate-300">
                      <Pill label="Conf" value={session.confidence_score} />
                      <Pill label="Foco" value={session.focus_score} />
                      <Pill label="Resp" value={session.breathing_control_score} />
                    </div>
                  </div>
                  {session.sport_feeling && (
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{session.sport_feeling}</p>
                  )}
                  {session.recommendation && (
                    <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-sm font-bold leading-6 text-emerald-100">
                      {session.recommendation}
                    </p>
                  )}
                </article>
              ))}
              {sessions.length === 0 && <EmptyText text="Aun no tienes check-ins deportivos registrados." />}
            </div>
          </section>
        </section>

        <section className="tal-chart-card">
          <Header icon={ClipboardList} eyebrow="Bitacora" title="Practica mental" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {practiceLogs.map((log: any) => (
              <article key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  {log.practiced_at} - {log.worked_status}
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  {log.athlete_mental_technique_assignments?.mental_techniques?.name || "Tecnica mental"}
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Utilidad {log.usefulness_score || "-"}/5
                </p>
                {log.sport_comment && (
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{log.sport_comment}</p>
                )}
              </article>
            ))}
            {practiceLogs.length === 0 && <EmptyText text="Aun no hay practica mental registrada." />}
          </div>
        </section>
      </div>
    </main>
  );
}

function Header({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="tal-metric-icon mb-0">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="tal-chart-card">
      <Header icon={Icon} eyebrow="Mente deportiva" title={title} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
  suffix = "",
}: {
  icon: LucideIcon;
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

function Pill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
      {label}: {value || "-"}
    </span>
  );
}

function ContactLine({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <Icon size={15} className="shrink-0 text-cyan-300" />
      <span className="truncate">{value}</span>
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm font-bold text-slate-500">
      {text}
    </p>
  );
}
