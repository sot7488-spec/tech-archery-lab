import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Brain,
  Building2,
  Dumbbell,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createPerformanceStaff } from "./actions";

type StaffType = "physical_trainer" | "sports_psychologist";

type PageConfig = {
  staffType: StaffType;
  title: string;
  eyebrow: string;
  description: string;
  registerTitle: string;
};

type ClubOption = {
  id: string;
  name: string | null;
};

function getClubName(club: any) {
  if (Array.isArray(club)) return club[0]?.name || "Sin club";
  return club?.name || "Sin club";
}

export default async function SupportStaffPage(config: PageConfig) {
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
  if (profile.role === "coach" && !profile.club_id) redirect("/");

  let clubsQuery = supabase
    .from("clubs")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (profile.role === "coach") {
    clubsQuery = clubsQuery.eq("id", profile.club_id);
  }

  const { data: clubsRaw } = await clubsQuery;
  const clubs = (clubsRaw || []) as ClubOption[];

  let staffQuery = supabase
    .from("performance_staff")
    .select(`
      *,
      clubs (
        name
      )
    `)
    .eq("staff_type", config.staffType)
    .order("created_at", { ascending: false });

  if (profile.role === "coach") {
    staffQuery = staffQuery.eq("club_id", profile.club_id);
  }

  const { data: staffRaw, error } = await staffQuery;
  const staff = staffRaw || [];
  const activeStaff = staff.filter((member: any) => member.is_active).length;
  const totalExperience = staff.reduce(
    (sum: number, member: any) => sum + Number(member.years_experience || 0),
    0
  );
  const Icon = config.staffType === "physical_trainer" ? Dumbbell : Brain;

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
            {config.eyebrow}
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                {config.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                {config.description}
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Activos</p>
              <p className="text-5xl font-black">{activeStaff}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={Icon} title="Staff" value={staff.length} />
          <Metric icon={ShieldCheck} title="Activos" value={activeStaff} />
          <Metric icon={Building2} title="Clubs" value={clubs.length} />
          <Metric icon={Award} title="Experiencia" value={totalExperience} suffix=" yrs" />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.25fr]">
          <form action={createPerformanceStaff} className="tal-chart-card space-y-4">
            <input type="hidden" name="staff_type" value={config.staffType} />
            <div className="flex items-center gap-3">
              <span className="tal-metric-icon">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Nuevo registro
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {config.registerTitle}
                </h2>
              </div>
            </div>

            <input
              name="name"
              required
              placeholder="Nombre completo"
              className="tal-input w-full"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input name="email" type="email" placeholder="Correo" className="tal-input w-full" />
              <input name="phone" placeholder="Telefono" className="tal-input w-full" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="specialty"
                placeholder="Especialidad"
                className="tal-input w-full"
              />
              <input
                name="years_experience"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="Anios experiencia"
                className="tal-input w-full"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="certification_level"
                placeholder="Nivel certificacion"
                className="tal-input w-full"
              />
              <input
                name="certification_institution"
                placeholder="Institucion"
                className="tal-input w-full"
              />
            </div>

            <select
              name="club_id"
              className="tal-input w-full"
              defaultValue={profile.role === "coach" ? profile.club_id || "" : ""}
              disabled={profile.role === "coach"}
              required
            >
              <option className="bg-slate-900 text-white" value="">
                Selecciona club
              </option>
              {clubs.map((club) => (
                <option className="bg-slate-900 text-white" key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {profile.role === "coach" && (
              <input type="hidden" name="club_id" value={profile.club_id || ""} />
            )}

            <textarea
              name="notes"
              placeholder="Notas"
              className="tal-input min-h-28 w-full resize-none"
            />

            <button className="tal-button inline-flex items-center justify-center gap-2">
              <Sparkles size={17} />
              Registrar
            </button>
          </form>

          <section className="tal-chart-card">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Directorio
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Staff registrado
                </h2>
              </div>
              <Users className="text-cyan-300" size={24} />
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">
                Corre el SQL de performance staff antes de usar esta seccion:
                supabase/20260604_performance_staff.sql
              </div>
            )}

            <div className="grid gap-3">
              {staff.map((member: any) => (
                <article
                  key={member.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {getClubName(member.clubs)}
                      </p>
                      <h3 className="mt-1 text-xl font-black text-white">{member.name}</h3>
                      <p className="mt-1 text-sm font-bold text-slate-400">
                        {member.specialty || "Especialidad pendiente"}
                      </p>
                    </div>

                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                      {member.years_experience || 0} yrs
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm font-bold text-slate-300 md:grid-cols-2">
                    <Contact icon={Mail} value={member.email || "Sin correo"} />
                    <Contact icon={Phone} value={member.phone || "Sin telefono"} />
                  </div>

                  {(member.certification_level || member.certification_institution || member.notes) && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm font-bold leading-6 text-slate-400">
                      {member.certification_level && (
                        <p className="text-slate-200">{member.certification_level}</p>
                      )}
                      {member.certification_institution && <p>{member.certification_institution}</p>}
                      {member.notes && <p className="mt-2">{member.notes}</p>}
                    </div>
                  )}
                </article>
              ))}

              {staff.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-slate-500">
                  Aun no hay registros.
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
