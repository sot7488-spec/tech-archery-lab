export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BowArrow,
  CalendarDays,
  Gauge,
  NotebookPen,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TuningCreateModal from "./TuningCreateModal";

type AthleteOption = {
  id: string;
  club_id?: string | null;
  users?: { name?: string | null } | { name?: string | null }[] | null;
};

type EquipmentOption = {
  id: string;
  name: string | null;
  athlete_id: string;
  bow_type?: string | null;
  brace_height_cm?: number | null;
};

function getRelationName(relation: any, fallback = "Sin nombre") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function formatNumber(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined) return "-";
  return `${value}${suffix}`;
}

export default async function TuningPage() {
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

  if (profile.role === "coach") {
    athletesQuery = athletesQuery.eq("club_id", profile.club_id);
  }

  const { data: athletesRaw } = await athletesQuery;
  const athletes = (athletesRaw || []) as AthleteOption[];
  const scopedAthleteIds = athletes.map((athlete) => athlete.id);

  let equipmentQuery = supabase
    .from("equipment_profiles")
    .select("id, name, athlete_id, bow_type, brace_height_cm, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (profile.role === "coach") {
    equipmentQuery = scopedAthleteIds.length
      ? equipmentQuery.in("athlete_id", scopedAthleteIds)
      : equipmentQuery.eq("athlete_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: equipmentRaw } = await equipmentQuery;
  const equipmentProfiles = (equipmentRaw || []) as EquipmentOption[];

  let logsQuery = supabase
    .from("equipment_tuning_logs")
    .select(`
      *,
      equipment_profiles (
        id,
        name,
        bow_type
      ),
      athlete_profiles (
        id,
        club_id,
        users!athlete_profiles_user_id_fkey (
          name
        )
      ),
      users!equipment_tuning_logs_coach_id_fkey (
        name
      )
    `)
    .order("tuning_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (profile.role === "coach") {
    logsQuery = scopedAthleteIds.length
      ? logsQuery.in("athlete_id", scopedAthleteIds)
      : logsQuery.eq("athlete_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: logsRaw, error } = await logsQuery;
  const logs = logsRaw || [];
  const recentLogs = logs.slice(0, 12);
  const tunedAthletes = new Set(logs.map((log: any) => log.athlete_id)).size;
  const latestLog = logs[0];
  const averageBraceHeight =
    logs.filter((log: any) => log.brace_height_cm !== null).length > 0
      ? (
          logs
            .filter((log: any) => log.brace_height_cm !== null)
            .reduce((sum: number, log: any) => sum + Number(log.brace_height_cm), 0) /
          logs.filter((log: any) => log.brace_height_cm !== null).length
        ).toFixed(1)
      : "-";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-5 py-7 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute inset-0 tal-grid-bg opacity-20" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-cyan-300 backdrop-blur-xl transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <TuningCreateModal
            athletes={athletes}
            equipmentProfiles={equipmentProfiles}
          />
        </div>

        <section className="tal-hero-panel p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Tuning Lab
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Tuning
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 md:text-base">
                Bitacora tecnica para comparar ajustes del equipo, cambios
                realizados y resultados observados por atleta.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Registros</p>
              <p className="text-5xl font-black">{logs.length}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric icon={NotebookPen} title="Ajustes" value={logs.length} />
          <Metric icon={Target} title="Atletas" value={tunedAthletes} />
          <Metric icon={BowArrow} title="Equipos activos" value={equipmentProfiles.length} />
          <Metric icon={Gauge} title="Brace prom." value={averageBraceHeight} suffix={averageBraceHeight === "-" ? "" : " cm"} />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="tal-chart-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="tal-metric-icon">
                <SlidersHorizontal size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Ultimo ajuste
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Estado tecnico
                </h2>
              </div>
            </div>

            {latestLog ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {latestLog.tuning_date}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {getRelationName(latestLog.athlete_profiles?.users, "Atleta")}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {latestLog.equipment_profiles?.name || "Equipo sin nombre"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Brace" value={formatNumber(latestLog.brace_height_cm, " cm")} />
                  <MiniStat label="Nocking" value={formatNumber(latestLog.nocking_point_mm, " mm")} />
                  <MiniStat label="Tiller sup." value={formatNumber(latestLog.tiller_top_cm, " cm")} />
                  <MiniStat label="Tiller inf." value={formatNumber(latestLog.tiller_bottom_cm, " cm")} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Resultado
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
                    {latestLog.observed_result || "Sin resultado registrado."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm font-bold text-slate-500">
                Aun no hay ajustes registrados.
              </div>
            )}
          </div>

          <div className="tal-chart-card">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Historial
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Bitacora de tuning
                </h2>
              </div>
              <TrendingUp className="text-cyan-300" size={24} />
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
                {JSON.stringify(error)}
              </div>
            )}

            <div className="space-y-3">
              {recentLogs.map((log: any) => (
                <article
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-400/10"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        {log.tuning_date}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        {getRelationName(log.athlete_profiles?.users, "Atleta")}
                      </h3>
                      <p className="text-sm font-bold text-slate-400">
                        {log.equipment_profiles?.name || "Equipo sin nombre"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-black text-slate-200 sm:grid-cols-4">
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        BH {formatNumber(log.brace_height_cm, " cm")}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        NP {formatNumber(log.nocking_point_mm, " mm")}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        TS {formatNumber(log.tiller_top_cm, " cm")}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        TI {formatNumber(log.tiller_bottom_cm, " cm")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold leading-6 text-slate-300">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Cambio
                      </span>
                      {log.change_description || "Sin cambio registrado."}
                    </p>
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold leading-6 text-slate-300">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Resultado
                      </span>
                      {log.observed_result || "Sin resultado registrado."}
                    </p>
                  </div>
                </article>
              ))}

              {recentLogs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-slate-500">
                  No hay ajustes registrados para mostrar.
                </div>
              )}
            </div>
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
  suffix = "",
}: {
  icon: React.ComponentType<{ size?: number }>;
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
