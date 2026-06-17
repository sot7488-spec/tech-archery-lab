"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Save,
  Upload,
  Video,
} from "lucide-react";
import { saveVideoAnalysisV3 } from "@/app/video-analysis-v3/actions";
import {
  analyzeBiomechanicsV3,
  drawBiomechanicOverlayV3,
  type BiomechanicMetricV3,
  type CameraViewV3,
  type FrameV3,
  type LandmarkV3,
} from "@/lib/video-analysis-v3/biomechanics";

type PoseLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number
  ) => { landmarks?: LandmarkV3[][] };
  close?: () => void;
};

type AthleteOption = {
  id: string;
  users?:
    | { name?: string | null; email?: string | null }
    | Array<{ name?: string | null; email?: string | null }>
    | null;
};

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL = "/models/pose_landmarker_heavy.task";
const PLAYBACK_RATES = [1, 0.5, 0.25, 0.125, 0.0625];

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

function levelClass(level: BiomechanicMetricV3["level"]) {
  if (level === "correct") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
  if (level === "warning") return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  return "border-rose-300/30 bg-rose-300/10 text-rose-100";
}

export function VideoAnalysisV3Client({ athletes }: { athletes: AthleteOption[] }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Cargando modelo Pose Heavy...");
  const [videoUrl, setVideoUrl] = useState("");
  const [cameraView, setCameraView] = useState<CameraViewV3>("lateral");
  const [bowArm, setBowArm] = useState<"left" | "right">("left");
  const [athleteId, setAthleteId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState<FrameV3[]>([]);
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
            minPoseDetectionConfidence: 0.42,
            minPosePresenceConfidence: 0.42,
            minTrackingConfidence: 0.55,
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
        setStatus("No se pudo cargar MediaPipe. Revisa el modelo local o la conexion.");
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

  const result = useMemo(
    () => analyzeBiomechanicsV3(frames, cameraView, bowArm),
    [frames, cameraView, bowArm]
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

    drawBiomechanicOverlayV3(ctx, landmarks, getVideoRect(video, canvas), bowArm);
    setFrames((current) => [
      ...current.slice(-179),
      { time: video.currentTime, landmarks },
    ]);
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
    if (!video || !videoUrl) return;

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

  function stepFrame(direction: -1 | 1) {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    stopLoop();
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + direction / 30));
    window.setTimeout(analyzeFrame, 80);
  }

  function handleUpload(file: File | null) {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setFrames([]);
    setSaveError("");
    setStatus(isReady ? "Video cargado. Reproduce o avanza por frames." : status);
  }

  function saveAnalysis() {
    setSaveError("");
    if (!athleteId) {
      setSaveError("Selecciona un atleta antes de guardar.");
      return;
    }
    if (!frames.length) {
      setSaveError("Analiza algunos frames antes de guardar.");
      return;
    }

    const formData = new FormData();
    formData.set("athlete_id", athleteId);
    formData.set("camera_view", cameraView);
    formData.set("score", String(result.score));
    formData.set("anchor_time_seconds", String(result.anchorTime));
    formData.set("phase", result.phase);
    formData.set("metrics", JSON.stringify(result.metrics));
    formData.set("errors", JSON.stringify(result.errors));
    formData.set("frames_analyzed", String(frames.length));

    startTransition(async () => {
      try {
        await saveVideoAnalysisV3(formData);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
      <div className="rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-4 shadow-[0_0_70px_rgba(34,211,238,0.08)] md:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Video size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
                Analizador V3
              </p>
              <h2 className="text-2xl font-black">Biomecanica frame a frame</h2>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.35)] transition hover:bg-cyan-200">
            <Upload size={17} />
            Cargar video
            <input
              className="hidden"
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(event) => handleUpload(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="grid gap-3 pb-4 md:grid-cols-4">
          <select
            value={athleteId}
            onChange={(event) => setAthleteId(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
          >
            <option value="">Selecciona atleta</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {getAthleteName(athlete)}
              </option>
            ))}
          </select>

          <select
            value={cameraView}
            onChange={(event) => {
              setCameraView(event.target.value as CameraViewV3);
              setFrames([]);
            }}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
          >
            <option value="lateral">Vista lateral</option>
            <option value="frontal">Vista frontal</option>
            <option value="superior">Vista superior</option>
          </select>

          <select
            value={bowArm}
            onChange={(event) => {
              setBowArm(event.target.value as "left" | "right");
              setFrames([]);
            }}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300"
          >
            <option value="left">Arco izquierdo</option>
            <option value="right">Arco derecho</option>
          </select>

          <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {isReady ? "Heavy listo" : "Cargando"}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-700 bg-black">
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="aspect-video w-full object-contain"
                playsInline
                onLoadedMetadata={() => {
                  resizeCanvas();
                  analyzeFrame();
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  stopLoop();
                }}
              />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            </>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 text-center text-slate-500">
              <Upload size={34} />
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Carga un video para iniciar
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!videoUrl || !isReady}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? "Pausar" : "Reproducir"}
            </button>
            <button
              type="button"
              onClick={() => stepFrame(-1)}
              disabled={!videoUrl}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-200 disabled:opacity-40"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => stepFrame(1)}
              disabled={!videoUrl}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-200 disabled:opacity-40"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  if (videoRef.current) videoRef.current.playbackRate = rate;
                }}
                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200"
              >
                {rate === 1 ? "1x" : `-${Math.round(1 / rate)}x`}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm font-bold text-slate-400">
          {status}
        </p>
      </div>

      <aside className="space-y-4 rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-5 shadow-[0_0_70px_rgba(34,211,238,0.08)]">
        <div className="rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Score V3
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-6xl font-black text-white">{result.score}</span>
            <span className="pb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              /100
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-400">
            Fase detectada: <span className="text-cyan-200">{result.phase}</span> ·
            anchor {result.anchorTime.toFixed(2)}s
          </p>
        </div>

        <div className="grid gap-3">
          {result.metrics.map((item) => (
            <div
              key={item.key}
              className={`rounded-2xl border p-4 ${levelClass(item.level)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">{item.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">{item.message}</p>
                </div>
                <span className="text-lg font-black">{item.score}</span>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {item.value} {item.unit} · peso {item.weight}%
              </p>
            </div>
          ))}
        </div>

        {result.errors.length > 0 ? (
          <div className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-rose-100">
              <AlertTriangle size={17} />
              <p className="text-sm font-black">Errores detectados</p>
            </div>
            <ul className="space-y-2 text-sm font-bold text-rose-100/90">
              {result.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100">
            <CheckCircle2 size={18} />
            Sin errores criticos en la muestra actual.
          </div>
        )}

        {saveError ? (
          <p className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-3 text-sm font-bold text-rose-100">
            {saveError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={saveAnalysis}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200 disabled:opacity-50"
        >
          {isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          Guardar analisis V3
        </button>
      </aside>
    </section>
  );
}
