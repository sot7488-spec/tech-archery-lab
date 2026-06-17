export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  MessageSquare,
  ScanLine,
  Video,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function getName(relation: any, fallback = "Coach") {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default async function TechnicalFeedbackPage() {
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

  if (profile?.role !== "athlete") redirect("/athletes");

  const { data: athlete } = await supabase
    .from("athlete_profiles")
    .select(
      `
      id,
      users!athlete_profiles_user_id_fkey (
        name
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  if (!athlete?.id) redirect("/athletes/profile");

  const { data: feedbackRaw } = await supabase
    .from("video_analysis_feedback")
    .select(
      `
      id,
      title,
      feedback,
      snapshot_data_url,
      video_time_seconds,
      analysis_mode,
      created_at,
      users!video_analysis_feedback_coach_id_fkey (
        name
      )
    `
    )
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false });

  const feedback = feedbackRaw || [];
  const latest = feedback[0];
  const athleteName = getName(athlete.users, "Atleta");

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
            TAL Video Feedback
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white tal-text-glow md:text-6xl">
                Retroalimentacion tecnica
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium text-slate-400 md:text-base">
                {athleteName}, aqui puedes revisar las capturas y comentarios
                que tu coach genero desde el analisis de video.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-400 px-6 py-4 text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
              <p className="text-xs font-black uppercase">Analisis</p>
              <p className="text-5xl font-black">{feedback.length}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Metric icon={Video} title="Feedbacks" value={feedback.length} />
          <Metric
            icon={ScanLine}
            title="Ultimo modo"
            value={latest?.analysis_mode || "-"}
          />
          <Metric
            icon={Clock3}
            title="Ultimo tiempo"
            value={latest ? formatSeconds(Number(latest.video_time_seconds || 0)) : "-"}
          />
        </section>

        {feedback.length > 0 ? (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {feedback.map((item: any) => {
              const seconds = Number(item.video_time_seconds || 0);
              const coachName = getName(item.users);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/10"
                >
                  {item.snapshot_data_url ? (
                    <img
                      src={item.snapshot_data_url}
                      alt={item.title || "Retroalimentacion tecnica"}
                      className="aspect-video w-full bg-black object-contain"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-black text-sm font-bold text-slate-500">
                      Sin captura
                    </div>
                  )}

                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                          {item.analysis_mode || "analisis tecnico"}
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-white">
                          {item.title || "Retroalimentacion tecnica"}
                        </h2>
                      </div>
                      <span className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-300">
                        {formatSeconds(seconds)}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-sm font-medium leading-6 text-slate-300">
                      {item.feedback || "Sin comentario registrado."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <MessageSquare size={14} />
                      <span>{coachName}</span>
                      <span>-</span>
                      <span>{new Date(item.created_at).toLocaleDateString("es-MX")}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="tal-chart-card">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="tal-metric-icon">
                <Video size={22} />
              </span>
              <h2 className="mt-4 text-2xl font-black text-white">
                Aun no tienes retroalimentacion tecnica
              </h2>
              <p className="mt-2 max-w-xl text-sm font-bold leading-6 text-slate-400">
                Cuando tu coach guarde una captura desde video analisis,
                aparecera aqui junto con sus comentarios.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: number | string;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className="tal-metric-value text-3xl">{value}</p>
    </div>
  );
}
