"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BowArrow,
  Loader2,
  Play,
  Pause,
  Save,
  Upload,
  Video,
} from "lucide-react";
import { saveVideoAnalysisV2 } from "@/app/video-analysis-v2/actions";
import {
  createFrameSample,
  drawPoseOverlay,
  type PoseFrameSample,
  type PoseLandmark,
} from "@/lib/video-analysis-v2/pose-utils";
import {
  analyzePoseSamples,
  type VideoAnalysisResult,
} from "@/lib/video-analysis-v2/analysis-engine";
import type { VideoViewType } from "@/lib/video-analysis-v2/thresholds";
import { AnalysisMetrics } from "./AnalysisMetrics";
import { AnalysisSummary } from "./AnalysisSummary";

type PoseLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number
  ) => { landmarks?: PoseLandmark[][] };
  close?: () => void;
};

type AthleteOption = {
  id: string;
  users?: { name?: string | null; email?: string | null } | Array<{
    name?: string | null;
    email?: string | null;
  }> | null;
};

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL = "/models/pose_landmarker_heavy.task";

function getVideoRect(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = canvas.width / canvas.height;

  if (canvasRatio > videoRatio) {
    const height = canvas.height;
    const width = height * videoRatio;
    return { x: (canvas.width - width) / 2, y: 0, width, height };
  }

  const width = canvas.width;
  const height = width / videoRatio;
  return { x: 0, y: (canvas.height - height) / 2, width, height };
}

function getAthleteName(athlete: AthleteOption) {
  if (Array.isArray(athlete.users)) {
    return athlete.users[0]?.name || athlete.users[0]?.email || "Atleta";
  }

  return athlete.users?.name || athlete.users?.email || "Atleta";
}

export function PoseVideoAnalyzer({
  athletes,
}: {
  athletes: AthleteOption[];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Cargando modelo de postura...");
  const [videoUrl, setVideoUrl] = useState("");
  const [viewType, setViewType] = useState<VideoViewType>("frontal");
  const [bowArm, setBowArm] = useState<"left" | "right">("left");
  const [athleteId, setAthleteId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [samples, setSamples] = useState<PoseFrameSample[]>([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await vision.PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.35,
            minPosePresenceConfidence: 0.35,
            minTrackingConfidence: 0.35,
          }
        );

        if (cancelled) {
          landmarker.close?.();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsReady(true);
        setStatus("Modelo listo. Carga un video para iniciar.");
      } catch (error) {
        console.error(error);
        setStatus("No se pudo cargar MediaPipe. Revisa conexion o modelo local.");
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const result: VideoAnalysisResult = useMemo(
    () => analyzePoseSamples(samples, viewType, bowArm),
    [samples, viewType, bowArm]
  );

  function resizeCanvas() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const rect = video.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
  }

  function analyzeFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || !video.videoWidth) return;

    resizeCanvas();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const response = landmarker.detectForVideo(video, performance.now());
    const landmarks = response.landmarks?.[0];
    if (!landmarks?.length) return;

    drawPoseOverlay(ctx, landmarks, getVideoRect(video, canvas));

    const sample = createFrameSample(landmarks, video.currentTime);
    if (sample) {
      setSamples((current) => [...current.slice(-89), sample]);
    }
  }

  function startLoop() {
    function loop() {
      analyzeFrame();
      rafRef.current = requestAnimationFrame(loop);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyzeFrame();
  }

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play().catch(() => undefined);
      setIsPlaying(true);
      startLoop();
      return;
    }

    video.pause();
    setIsPlaying(false);
    stopLoop();
  }

  function handleUpload(file: File | null) {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setSamples([]);
    setSaveError("");
    setStatus(isReady ? "Video cargado. Reproduce para analizar." : status);
  }

  function handleSave() {
    setSaveError("");

    if (!athleteId) {
      setSaveError("Selecciona un atleta antes de guardar.");
      return;
    }

    if (!result.metrics.length || result.score <= 0) {
      setSaveError("Reproduce el video hasta generar metricas antes de guardar.");
      return;
    }

    const formData = new FormData();
    formData.set("athlete_id", athleteId);
    formData.set("view_type", viewType);
    formData.set("score", String(result.score));
    formData.set("metrics", JSON.stringify(result.metrics));
    formData.set("observations", JSON.stringify(result.observations));
    formData.set("recommendations", JSON.stringify(result.recommendations));

    startTransition(async () => {
      try {
        await saveVideoAnalysisV2(formData);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "No se pudo guardar el analisis."
        );
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="tal-chart-card">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="tal-metric-icon mb-0">
              <Video size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                TAL Video Analysis V2
              </p>
              <h2 className="text-2xl font-black text-white">Analisis asistido</h2>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
            <Upload size={17} />
            Cargar video
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => handleUpload(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <select
            value={athleteId}
            onChange={(event) => setAthleteId(event.target.value)}
            className="tal-input md:col-span-2"
          >
            <option value="">Selecciona atleta</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {getAthleteName(athlete)}
              </option>
            ))}
          </select>

          <select
            value={viewType}
            onChange={(event) => {
              setViewType(event.target.value as VideoViewType);
              setSamples([]);
            }}
            className="tal-input"
          >
            <option value="frontal">Frontal</option>
            <option value="lateral">Lateral</option>
            <option value="superior">Superior</option>
          </select>

          <select
            value={bowArm}
            onChange={(event) => setBowArm(event.target.value as "left" | "right")}
            className="tal-input"
          >
            <option value="left">Arco izquierdo</option>
            <option value="right">Arco derecho</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-black">
          {videoUrl ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                className="block max-h-[68vh] w-full bg-black object-contain"
                onLoadedMetadata={() => {
                  resizeCanvas();
                  analyzeFrame();
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  startLoop();
                }}
                onPause={() => {
                  setIsPlaying(false);
                  stopLoop();
                }}
                onSeeked={analyzeFrame}
                onEnded={() => setIsPlaying(false)}
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <BowArrow size={34} />
              </span>
              <div>
                <h3 className="text-2xl font-black">Carga un video del arquero</h3>
                <p className="mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
                  Usa una toma estable: frontal, lateral o superior. El analisis
                  es una referencia visual para el entrenador.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!videoUrl || !isReady}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? "Pausar" : "Reproducir"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !result.metrics.length}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar analisis
          </button>

          <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-300">
            {status}
          </span>
        </div>

        {saveError && (
          <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
            {saveError}
          </div>
        )}
      </section>

      <aside className="space-y-5">
        <AnalysisSummary result={result} />
      </aside>

      <section className="xl:col-span-2">
        <AnalysisMetrics metrics={result.metrics} />
      </section>
    </div>
  );
}
