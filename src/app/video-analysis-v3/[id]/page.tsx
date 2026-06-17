import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle, CheckCircle2, Gauge, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BiomechanicMetricV3 } from "@/lib/video-analysis-v3/biomechanics";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type AnalysisRecord = {
  id: string;
  athlete_id: string;
  club_id: string | null;
  camera_view: string | null;
  score: number | null;
  phase: string | null;
  anchor_time_seconds: number | null;
  frames_analyzed: number | null;
  metrics: BiomechanicMetricV3[] | null;
  errors: string[] | null;
  created_at: string | null;
  athlete_profiles?:
    | {
        user_id?: string | null;
        users?: { name?: string | null; email?: string | null } | Array<{ name?: string | null; email?: string | null }> | null;
      }
    | Array<{
        user_id?: string | null;
        users?: { name?: string | null; email?: string | null } | Array<{ name?: string | null; email?: string | null }> | null;
      }>
    | null;
};

function getAthlete(record: AnalysisRecord) {
  const profile = Array.isArray(record.athlete_profiles)
    ? record.athlete_profiles[0]
    : record.athlete_profiles;
  const user = Array.isArray(profile?.users) ? profile?.users[0] : profile?.users;
  return {
    userId: profile?.user_id || "",
    name: user?.name || user?.email || "Atleta",
  };
}

function metricClass(level: BiomechanicMetricV3["level"]) {
  if (level === "correct") return "border-emerald-300/25 bg-emerald-300/10";
  if (level === "warning") return "border-yellow-300/25 bg-yellow-300/10";
  return "border-rose-300/25 bg-rose-300/10";
}

export default async function VideoAnalysisV3DetailPage({ params }: PageProps) {
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

  const { data } = await supabase
    .from("video_analysis_v3")
    .select(
      `
      id,
      athlete_id,
      club_id,
      camera_view,
      score,
      phase,
      anchor_time_seconds,
      frames_analyzed,
      metrics,
      errors,
      created_at,
      athlete_profiles (
        user_id,
        users!athlete_profiles_user_id_fkey (
          name,
          email
        )
      )
    `
    )
    .eq("id", id)
    .single();

  const record = data as AnalysisRecord | null;
  if (!record || !currentUser) redirect("/video-analysis-v3");

  const athlete = getAthlete(record);
  if (currentUser.role === "coach" && record.club_id !== currentUser.club_id) {
    redirect("/video-analysis-v3");
  }
  if (currentUser.role === "athlete" && athlete.userId !== user.id) {
    redirect("/video-analysis-v3");
  }

  const metrics = record.metrics || [];
  const errors = record.errors || [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/video-analysis-v3"
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200"
        >
          <ArrowLeft size={16} />
          Volver a Video analisis V3
        </Link>

        <section className="rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                Reporte biomecanico
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                {athlete.name}
              </h1>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                {record.camera_view || "vista"} / {record.phase || "anchor"}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-5 text-right">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Score
              </p>
              <p className="text-6xl font-black">{record.score ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={Video} label="Frames analizados" value={String(record.frames_analyzed || 0)} />
          <InfoCard icon={Gauge} label="Anchor detectado" value={`${Number(record.anchor_time_seconds || 0).toFixed(2)}s`} />
          <InfoCard icon={CheckCircle2} label="Metricas" value={String(metrics.length)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {metrics.map((metric) => (
            <article
              key={metric.key}
              className={`rounded-[1.6rem] border p-5 ${metricClass(metric.level)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">{metric.label}</h2>
                  <p className="mt-2 text-sm font-bold text-slate-300">{metric.message}</p>
                </div>
                <p className="text-3xl font-black text-cyan-200">{metric.score}</p>
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                {metric.value} {metric.unit} · peso {metric.weight}%
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-200" />
            <h2 className="text-xl font-black">Observaciones automaticas</h2>
          </div>
          {errors.length ? (
            <ul className="space-y-2 text-sm font-bold text-slate-300">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400">
              No se detectaron errores criticos en la fase analizada.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Video;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-cyan-300/15 bg-slate-900/80 p-5">
      <Icon className="mb-4 text-cyan-200" size={22} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
