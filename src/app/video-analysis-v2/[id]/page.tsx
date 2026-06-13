import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowLeft, BarChart3, CalendarClock, Target, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnalysisMetrics } from "@/components/video-analysis-v2/AnalysisMetrics";
import { AnalysisSummary } from "@/components/video-analysis-v2/AnalysisSummary";
import type { AnalysisMetric, VideoAnalysisResult } from "@/lib/video-analysis-v2/analysis-engine";

export const dynamic = "force-dynamic";

export default async function VideoAnalysisV2DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: analysis, error } = await supabase
    .from("video_analysis")
    .select(
      `
      *,
      athlete_profiles (
        user_id,
        club_id,
        users!athlete_profiles_user_id_fkey (
          name,
          email
        )
      ),
      users!video_analysis_coach_id_fkey (
        name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="rounded-[2rem] border border-red-300/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-black text-red-100">Analisis no encontrado</h1>
        </div>
      </main>
    );
  }

  const athlete = Array.isArray(analysis.athlete_profiles)
    ? analysis.athlete_profiles[0]
    : analysis.athlete_profiles;

  if (currentUser?.role === "coach" && athlete?.club_id !== currentUser.club_id) {
    redirect("/video-analysis-v2");
  }

  if (currentUser?.role === "athlete" && athlete?.user_id !== user.id) {
    redirect("/video-analysis-v2");
  }

  const athleteUser = Array.isArray(athlete?.users)
    ? athlete?.users[0]
    : athlete?.users;
  const coachUser = Array.isArray(analysis.users)
    ? analysis.users[0]
    : analysis.users;
  const metrics = (analysis.metrics || []) as AnalysisMetric[];
  const result: VideoAnalysisResult = {
    score: Number(analysis.score || 0),
    metrics,
    observations: (analysis.observations || []) as string[],
    recommendations: (analysis.recommendations || []) as string[],
    strengths: metrics
      .filter((metric) => metric.status === "good")
      .map((metric) => `${metric.label}: se observa dentro de un rango estable.`),
    corrections: metrics
      .filter((metric) => metric.status !== "good")
      .map((metric) => `${metric.label}: conviene revisar con el entrenador.`),
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/video-analysis-v2"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Volver a Video analisis V2
        </Link>

        <section className="rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-6 shadow-[0_0_70px_rgba(34,211,238,0.10)]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            TAL Analysis Record
          </p>
          <h1 className="mt-3 text-4xl font-black tal-text-glow">
            Analisis {analysis.view_type}
          </h1>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <InfoCard icon={Target} label="Score" value={`${analysis.score || 0}`} />
            <InfoCard
              icon={UserRound}
              label="Atleta"
              value={athleteUser?.name || "Atleta"}
            />
            <InfoCard
              icon={BarChart3}
              label="Coach"
              value={coachUser?.name || "Sin coach"}
            />
            <InfoCard
              icon={CalendarClock}
              label="Fecha"
              value={new Date(analysis.created_at).toLocaleDateString("es-MX")}
            />
          </div>
        </section>

        <AnalysisSummary result={result} />
        <AnalysisMetrics metrics={metrics} />
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
      <Icon size={20} className="mb-3 text-cyan-300" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
