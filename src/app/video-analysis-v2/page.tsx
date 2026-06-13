import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Activity, Camera, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PoseVideoAnalyzer } from "@/components/video-analysis-v2/PoseVideoAnalyzer";
import { AnalysisHistory } from "@/components/video-analysis-v2/AnalysisHistory";

export const dynamic = "force-dynamic";

export default async function VideoAnalysisV2Page() {
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

  let athletesQuery = supabase
    .from("athlete_profiles")
    .select(
      `
      id,
      club_id,
      users!athlete_profiles_user_id_fkey (
        name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (currentUser?.role === "coach" && currentUser.club_id) {
    athletesQuery = athletesQuery.eq("club_id", currentUser.club_id);
  }

  if (currentUser?.role === "athlete") {
    athletesQuery = athletesQuery.eq("user_id", user.id);
  }

  const { data: athletes } = await athletesQuery;

  let historyQuery = supabase
    .from("video_analysis")
    .select(
      `
      id,
      view_type,
      score,
      created_at,
      athlete_profiles (
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(8);

  if (currentUser?.role === "coach" && currentUser.club_id) {
    historyQuery = historyQuery.eq("club_id", currentUser.club_id);
  }

  const { data: history } = await historyQuery;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-6 shadow-[0_0_80px_rgba(34,211,238,0.10)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Motion Intelligence
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight tal-text-glow md:text-6xl">
                Video analisis V2
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 md:text-base">
                Analisis tecnico asistido para tomas frontal, lateral y superior.
                Usa MediaPipe Pose como apoyo visual; la evaluacion final sigue
                siendo responsabilidad del entrenador.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <HeroPill icon={Camera} label="Tomas" value="3 vistas" />
              <HeroPill icon={Activity} label="Metricas" value="7 bases" />
              <HeroPill icon={ShieldCheck} label="IA" value="Asistida" />
            </div>
          </div>
        </section>

        <PoseVideoAnalyzer athletes={athletes || []} />

        <AnalysisHistory items={history || []} />
      </div>
    </main>
  );
}

function HeroPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/10 p-4">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-slate-950/50 text-cyan-200">
        <Icon size={18} />
      </span>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
