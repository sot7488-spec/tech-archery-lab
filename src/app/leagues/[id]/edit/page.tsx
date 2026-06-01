export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateIndoorLeague } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CoachOption = {
  id: string;
  name: string | null;
  email: string | null;
  clubs?: { name?: string | null } | { name?: string | null }[] | null;
};

function getClubName(relation: CoachOption["clubs"]) {
  if (Array.isArray(relation)) return relation[0]?.name || "Sin club";
  return relation?.name || "Sin club";
}

export default async function EditLeaguePage({ params }: PageProps) {
  const { id } = await params;
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

  if (profile?.role !== "admin") redirect(`/leagues/${id}`);

  const { data: league } = await supabase
    .from("indoor_leagues")
    .select(`
      *,
      indoor_league_coaches (
        coach_id
      )
    `)
    .eq("id", id)
    .single();

  if (!league) redirect("/leagues");

  const { data: coachesRaw } = await supabase
    .from("users")
    .select(`
      id,
      name,
      email,
      clubs (
        name
      )
    `)
    .eq("role", "coach")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const coaches = (coachesRaw || []) as CoachOption[];
  const invitedCoachIds = new Set(
    (league.indoor_league_coaches || []).map((invite: any) => invite.coach_id)
  );
  const inputClass =
    "h-12 w-full rounded-2xl border border-cyan-400/10 bg-slate-950/80 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-400/10";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={`/leagues/${id}`}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
        >
          <ArrowLeft size={16} />
          Volver a liga
        </Link>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            Admin League Editor
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
            Editar liga
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
            Actualiza datos generales e invita coaches. Los coaches invitados
            podran ver la liga e inscribir atletas de su club.
          </p>
        </section>

        <form action={updateIndoorLeague} className="tal-chart-card space-y-5">
          <input type="hidden" name="league_id" value={league.id} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input name="name" defaultValue={league.name || ""} placeholder="Nombre" className={`${inputClass} md:col-span-2`} required />
            <select name="category" defaultValue={league.category} className={inputClass} required>
              <option className="bg-slate-900 text-white" value="iniciacion">Iniciacion</option>
              <option className="bg-slate-900 text-white" value="infantil">Infantil</option>
              <option className="bg-slate-900 text-white" value="juvenil">Juvenil</option>
              <option className="bg-slate-900 text-white" value="abierta">Abierta</option>
            </select>
            <select name="bow_type" defaultValue={league.bow_type} className={inputClass} required>
              <option className="bg-slate-900 text-white" value="recurvo">Recurvo</option>
              <option className="bg-slate-900 text-white" value="compuesto">Compuesto</option>
              <option className="bg-slate-900 text-white" value="barebow">Barebow</option>
            </select>
            <input name="target_size_cm" type="number" defaultValue={league.target_size_cm || 40} className={inputClass} required />
            <input name="arrows_count" type="number" defaultValue={league.arrows_count || 60} className={inputClass} required />
            <select name="status" defaultValue={league.status} className={inputClass}>
              <option className="bg-slate-900 text-white" value="draft">Borrador</option>
              <option className="bg-slate-900 text-white" value="open">Abierta</option>
              <option className="bg-slate-900 text-white" value="closed">Terminada</option>
            </select>
            <input name="description" defaultValue={league.description || ""} placeholder="Descripcion" className={`${inputClass} md:col-span-4`} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-cyan-300" />
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Coaches invitados
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {coaches.map((coach) => (
                <label
                  key={coach.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3"
                >
                  <input
                    name="coach_ids"
                    type="checkbox"
                    defaultChecked={invitedCoachIds.has(coach.id)}
                    value={coach.id}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">
                      {coach.name || coach.email || "Coach"}
                    </span>
                    <span className="block truncate text-xs font-bold text-slate-500">
                      {getClubName(coach.clubs)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300">
            <Save size={16} />
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
