import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { Activity, BrainCircuit, Camera, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VideoAnalysisV3Client } from "@/components/video-analysis-v3/VideoAnalysisV3Client";
import { VideoAnalysisV3History } from "@/components/video-analysis-v3/VideoAnalysisV3History";

export const dynamic = "force-dynamic";

export default async function VideoAnalysisV3Page() {
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
    .from("video_analysis_v3")
    .select(
      `
      id,
      camera_view,
      score,
      phase,
      created_at,
      athlete_profiles (
        users!athlete_profiles_user_id_fkey (
          name
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (currentUser?.role === "coach" && currentUser.club_id) {
    historyQuery = historyQuery.eq("club_id", currentUser.club_id);
  }

  const { data: history } = await historyQuery;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Biomechanics Lab
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight tal-text-glow md:text-6xl">
                Video analisis V3
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 md:text-base">
                Evaluacion biomecanica con MediaPipe Pose Heavy, metricas por vista
                y reglas inspiradas en principios tecnicos de World Archery.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[620px] lg:grid-cols-4">
              <HeroPill icon={Camera} label="Vistas" value="3 tomas" />
              <HeroPill icon={Activity} label="Fase" value="Anchor" />
              <HeroPill icon={BrainCircuit} label="Modelo" value="Heavy" />
              <HeroPill icon={ShieldCheck} label="Score" value="Reglas" />
            </div>
          </div>
        </section>

        <VideoAnalysisV3Client athletes={athletes || []} />
        <VideoAnalysisV3History items={history || []} />
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
    <div className="rounded-[1.35rem] border border-cyan-300/15 bg-cyan-300/10 p-4">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-slate-950/50 text-cyan-200">
        <Icon size={18} />
      </span>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
