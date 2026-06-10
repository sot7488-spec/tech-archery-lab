export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  CopyPlus,
  Crosshair,
  Layers3,
  Ruler,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TrainingTemplateCreateModal from "./TrainingTemplateCreateModal";
import TrainingTemplateDeleteButton from "./TrainingTemplateDeleteButton";

type TrainingTemplate = {
  id: string;
  name: string;
  description: string | null;
  session_type: string | null;
  objective: string | null;
  rounds: unknown;
  clubs?: { name?: string | null } | { name?: string | null }[] | null;
};

type ClubOption = {
  id: string;
  name: string;
};

type TemplateRound = {
  distance_meters?: number | string | null;
  target_size_cm?: number | string | null;
  total_series?: number | string | null;
  arrows_per_series?: number | string | null;
  scoring_enabled?: boolean | null;
};

function getClubName(clubs: TrainingTemplate["clubs"]) {
  if (Array.isArray(clubs)) return clubs[0]?.name || "Club";
  return clubs?.name || "Club";
}

function getRounds(rounds: unknown): TemplateRound[] {
  return Array.isArray(rounds) ? (rounds as TemplateRound[]) : [];
}

function formatValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export default async function TrainingTemplatesPage() {
  const supabase = await createClient();

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
  if (currentUser.role === "athlete") redirect("/");

  const isAdmin = currentUser.role === "admin";
  const defaultClubId = currentUser.club_id || "";

  let clubsQuery = supabase
    .from("clubs")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!isAdmin && defaultClubId) {
    clubsQuery = clubsQuery.eq("id", defaultClubId);
  }

  const { data: clubsRaw } = await clubsQuery;
  const clubs = (clubsRaw || []) as ClubOption[];

  let templatesQuery = supabase
    .from("training_templates")
    .select(`
      id,
      name,
      description,
      session_type,
      objective,
      rounds,
      clubs (
        name
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!isAdmin && defaultClubId) {
    templatesQuery = templatesQuery.eq("club_id", defaultClubId);
  }

  const { data: templatesRaw, error } = await templatesQuery;
  const templates = (templatesRaw || []) as TrainingTemplate[];

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

          <TrainingTemplateCreateModal
            clubs={clubs}
            isAdmin={isAdmin}
            defaultClubId={defaultClubId}
          />
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Training Presets
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Plantillas
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Configuraciones reutilizables para programar entrenamientos con
                rondas predefinidas por club.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Activas</p>
              <p className="text-5xl font-black">{templates.length}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
            {JSON.stringify(error)}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {templates.map((template) => {
            const rounds = getRounds(template.rounds);
            const firstRound = rounds[0] || {};

            return (
              <article
                key={template.id}
                className="rounded-[2rem] border border-cyan-400/10 bg-white/[0.045] p-5 shadow-[0_0_42px_rgba(0,0,0,0.30)] backdrop-blur-2xl"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                      {getClubName(template.clubs)}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      {template.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {template.description ||
                        template.objective ||
                        "Plantilla sin descripcion."}
                    </p>
                  </div>

                  <TrainingTemplateDeleteButton templateId={template.id} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Indicator
                    icon={Activity}
                    value={formatValue(template.session_type, "Tipo")}
                  />
                  <Indicator
                    icon={Layers3}
                    value={`${rounds.length} ronda${rounds.length === 1 ? "" : "s"}`}
                  />
                  <Indicator
                    icon={Ruler}
                    value={`${formatValue(firstRound.distance_meters)} m`}
                  />
                  <Indicator
                    icon={Target}
                    value={`${formatValue(firstRound.target_size_cm)} cm`}
                  />
                  <Indicator
                    icon={Crosshair}
                    value={`${formatValue(firstRound.total_series)} x ${formatValue(
                      firstRound.arrows_per_series
                    )}`}
                  />
                  <Indicator
                    icon={CopyPlus}
                    value={firstRound.scoring_enabled === false ? "Feedback" : "Score"}
                  />
                </div>
              </article>
            );
          })}

          {templates.length === 0 && (
            <div className="tal-chart-card text-center text-slate-400 lg:col-span-2">
              Todavia no hay plantillas registradas.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Indicator({
  icon: Icon,
  value,
}: {
  icon: typeof Activity;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2">
      <Icon className="shrink-0 text-cyan-300" size={16} />
      <span className="truncate text-xs font-black text-white">{value}</span>
    </div>
  );
}
