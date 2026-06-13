"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  Crosshair,
  FileVideo,
  Gauge,
  Loader2,
  Pause,
  Play,
  Ruler,
  ScanLine,
  Settings2,
  ShieldCheck,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Target,
  Timer,
  Upload,
} from "lucide-react";

type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

type PoseLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number
  ) => { landmarks?: Landmark[][] };
  close?: () => void;
};

type Metric = {
  label: string;
  value: string;
  tone?: string;
};

type AnalysisMode = "lateral" | "front_t";
type PoseModelKey = "lite" | "full" | "heavy";
type ActiveVideoPanel = "body" | "top";
type TopTrackingMode = "manual" | "auto" | "hybrid";
type BodyPointTrackingMode = "fixed" | "assisted";
type BodyPointKey =
  | "head"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftHand"
  | "rightHand"
  | "leftHip"
  | "rightHip"
  | "leftFoot"
  | "rightFoot";
type ManualAnchorKey =
  | "verticalTop"
  | "crossCenter"
  | "verticalBottom"
  | "horizontalLeft"
  | "horizontalRight";

type ManualAnchor = {
  x: number;
  y: number;
};

type ManualAnchors = Record<ManualAnchorKey, ManualAnchor>;
type BodyPoints = Record<BodyPointKey, ManualAnchor>;
type BodyPointOffsets = Partial<Record<BodyPointKey, ManualAnchor>>;
type TechnicalReferencePoint = {
  id: string;
  anchor: ManualAnchor;
};
type TechnicalReferenceLine = {
  id: string;
  from: ManualAnchor;
  to: ManualAnchor;
};
type TopAnchorKey =
  | "topBowHand"
  | "topStringHand"
  | "topAnchor"
  | "topReferenceTop"
  | "topReferenceBottom";
type TopAnchors = Record<TopAnchorKey, ManualAnchor>;

type OverlaySettings = {
  lineWidth: number;
  pointRadius: number;
  glow: number;
  verticalOffset: number;
  horizontalOffset: number;
  verticalTopOffset: number;
  verticalBottomOffset: number;
  horizontalReach: number;
};

type VideoRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const LANDMARKS = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
};

const POSE_MODELS: Record<
  PoseModelKey,
  {
    label: string;
    description: string;
    url: string;
  }
> = {
  lite: {
    label: "Lite",
    description: "Rapido para pruebas, laptops sencillas y moviles.",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
  },
  full: {
    label: "Full",
    description: "Balance recomendado para TAL: buena precision y fluidez.",
    url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
  },
  heavy: {
    label: "Heavy",
    description: "Maxima precision para analisis pausado o videos dificiles.",
    url: "/models/pose_landmarker_heavy.task",
  },
};

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const PLAYBACK_RATES = [
  { label: "1x", value: 1 },
  { label: "-2x", value: 0.5 },
  { label: "-4x", value: 0.25 },
  { label: "-8x", value: 0.125 },
  { label: "-16x", value: 0.0625 },
];

const LANDMARK_SMOOTHING = 0.24;
const LANDMARK_HOLD_MS = 1800;
const MIN_LANDMARK_VISIBILITY = 0.18;
const HELD_FRAME_OPACITY = 0.82;
const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  lineWidth: 3,
  pointRadius: 3,
  glow: 5,
  verticalOffset: 0,
  horizontalOffset: 0,
  verticalTopOffset: 0.22,
  verticalBottomOffset: 0.08,
  horizontalReach: 0.94,
};
const DEFAULT_MANUAL_ANCHORS: ManualAnchors = {
  verticalTop: { x: 0.5, y: 0.18 },
  crossCenter: { x: 0.5, y: 0.38 },
  verticalBottom: { x: 0.5, y: 0.88 },
  horizontalLeft: { x: 0.06, y: 0.38 },
  horizontalRight: { x: 0.94, y: 0.38 },
};
const MANUAL_ANCHOR_LABELS: Record<ManualAnchorKey, string> = {
  verticalTop: "Superior",
  crossCenter: "Centro",
  verticalBottom: "Inferior",
  horizontalLeft: "Izq",
  horizontalRight: "Der",
};
const DEFAULT_BODY_POINTS: BodyPoints = {
  head: { x: 0.5, y: 0.16 },
  leftShoulder: { x: 0.38, y: 0.34 },
  rightShoulder: { x: 0.62, y: 0.34 },
  leftElbow: { x: 0.27, y: 0.42 },
  rightElbow: { x: 0.73, y: 0.42 },
  leftHand: { x: 0.18, y: 0.44 },
  rightHand: { x: 0.82, y: 0.44 },
  leftHip: { x: 0.43, y: 0.56 },
  rightHip: { x: 0.57, y: 0.56 },
  leftFoot: { x: 0.42, y: 0.9 },
  rightFoot: { x: 0.58, y: 0.9 },
};
const BODY_POINT_LABELS: Record<BodyPointKey, string> = {
  head: "Cabeza",
  leftShoulder: "Hombro I",
  rightShoulder: "Hombro D",
  leftElbow: "Codo I",
  rightElbow: "Codo D",
  leftHand: "Mano I",
  rightHand: "Mano D",
  leftHip: "Cadera I",
  rightHip: "Cadera D",
  leftFoot: "Pie I",
  rightFoot: "Pie D",
};
const DEFAULT_TOP_ANCHORS: TopAnchors = {
  topBowHand: { x: 0.58, y: 0.18 },
  topStringHand: { x: 0.48, y: 0.72 },
  topAnchor: { x: 0.44, y: 0.48 },
  topReferenceTop: { x: 0.58, y: 0.05 },
  topReferenceBottom: { x: 0.58, y: 0.95 },
};
const TOP_ANCHOR_LABELS: Record<TopAnchorKey, string> = {
  topBowHand: "Arco",
  topStringHand: "Cuerda",
  topAnchor: "Torso",
  topReferenceTop: "Ref sup",
  topReferenceBottom: "Ref inf",
};

function getVideoContentRect(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): VideoRect {
  const videoRatio = video.videoWidth / video.videoHeight;
  const canvasRatio = canvas.width / canvas.height;

  if (canvasRatio > videoRatio) {
    const height = canvas.height;
    const width = height * videoRatio;

    return {
      x: (canvas.width - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  const width = canvas.width;
  const height = width / videoRatio;

  return {
    x: 0,
    y: (canvas.height - height) / 2,
    width,
    height,
  };
}

function toPoint(landmark: Landmark, rect: VideoRect) {
  return {
    x: rect.x + landmark.x * rect.width,
    y: rect.y + landmark.y * rect.height,
    visibility: landmark.visibility ?? 1,
  };
}

function distance(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lineAngle(a: Landmark, b: Landmark) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function jointAngle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  const angle = Math.atan2(Math.abs(cross), dot) * (180 / Math.PI);

  return Number(angle.toFixed(1));
}

function absTilt(a: Landmark, b: Landmark) {
  return Number(Math.abs(lineAngle(a, b)).toFixed(1));
}

function getVisibility(landmarks: Landmark[], indexes: number[]) {
  const values = indexes.map((index) => landmarks[index]?.visibility ?? 0);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return Number((average * 100).toFixed(0));
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  rect: VideoRect,
  landmarks: Landmark[],
  indexes: number[],
  color: string,
  width = 5
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();

  indexes.forEach((index, pointIndex) => {
    const landmark = landmarks[index];
    if (!landmark) return;

    const point = toPoint(landmark, rect);
    if (pointIndex === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();
  ctx.restore();
}

function drawPoint(
  ctx: CanvasRenderingContext2D,
  rect: VideoRect,
  landmark: Landmark,
  color: string,
  radius = 3,
  glow = 5
) {
  const point = toPoint(landmark, rect);

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFreeLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  width = 3,
  glow = 5
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawReferenceLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color = "#fde047"
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.setLineDash([10, 8]);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function lineFromCenter(
  center: { x: number; y: number },
  angleDeg: number,
  length: number
) {
  const radians = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(radians) * length * 0.5;
  const dy = Math.sin(radians) * length * 0.5;

  return {
    from: { x: center.x - dx, y: center.y - dy },
    to: { x: center.x + dx, y: center.y + dy },
  };
}

function normalizedPoint(landmark: Landmark) {
  return {
    x: landmark.x,
    y: landmark.y,
  };
}

function clampAnchor(anchor: ManualAnchor): ManualAnchor {
  return {
    x: Math.min(1, Math.max(0, anchor.x)),
    y: Math.min(1, Math.max(0, anchor.y)),
  };
}

function getBodyPointsFromLandmarks(landmarks: Landmark[]): BodyPoints {
  const leftFoot = landmarks[LANDMARKS.leftFoot] ?? landmarks[LANDMARKS.leftAnkle];
  const rightFoot =
    landmarks[LANDMARKS.rightFoot] ?? landmarks[LANDMARKS.rightAnkle];

  return {
    head: normalizedPoint(landmarks[LANDMARKS.nose]),
    leftShoulder: normalizedPoint(landmarks[LANDMARKS.leftShoulder]),
    rightShoulder: normalizedPoint(landmarks[LANDMARKS.rightShoulder]),
    leftElbow: normalizedPoint(landmarks[LANDMARKS.leftElbow]),
    rightElbow: normalizedPoint(landmarks[LANDMARKS.rightElbow]),
    leftHand: normalizedPoint(landmarks[LANDMARKS.leftWrist]),
    rightHand: normalizedPoint(landmarks[LANDMARKS.rightWrist]),
    leftHip: normalizedPoint(landmarks[LANDMARKS.leftHip]),
    rightHip: normalizedPoint(landmarks[LANDMARKS.rightHip]),
    leftFoot: normalizedPoint(leftFoot),
    rightFoot: normalizedPoint(rightFoot),
  };
}

function anchorToCanvas(anchor: ManualAnchor, rect: VideoRect) {
  return {
    x: rect.x + anchor.x * rect.width,
    y: rect.y + anchor.y * rect.height,
  };
}

function metricTone(value: number, goodUnder: number) {
  if (value <= goodUnder) return "text-emerald-300";
  if (value <= goodUnder * 2) return "text-yellow-200";
  return "text-red-300";
}

function angleDifference(a: number, b: number) {
  const difference = Math.abs(((a - b + 180) % 360) - 180);
  return Number(difference.toFixed(1));
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00.00";

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;

  return `${minutes}:${remaining.toFixed(2).padStart(5, "0")}`;
}

function smoothLandmarks(
  previous: Landmark[] | null,
  next: Landmark[],
  factor = LANDMARK_SMOOTHING
) {
  if (!previous || previous.length !== next.length) return next;

  return next.map((landmark, index) => {
    const previousLandmark = previous[index];
    if (!previousLandmark) return landmark;
    const nextVisibility = landmark.visibility ?? 1;
    const previousVisibility = previousLandmark.visibility ?? 1;

    if (
      nextVisibility < MIN_LANDMARK_VISIBILITY &&
      previousVisibility >= MIN_LANDMARK_VISIBILITY
    ) {
      return {
        ...previousLandmark,
        visibility: Math.max(MIN_LANDMARK_VISIBILITY, previousVisibility * 0.96),
      };
    }

    return {
      x: previousLandmark.x + (landmark.x - previousLandmark.x) * factor,
      y: previousLandmark.y + (landmark.y - previousLandmark.y) * factor,
      z:
        previousLandmark.z !== undefined && landmark.z !== undefined
          ? previousLandmark.z + (landmark.z - previousLandmark.z) * factor
          : landmark.z,
      visibility:
        previousLandmark.visibility !== undefined &&
        landmark.visibility !== undefined
          ? previousLandmark.visibility +
            (landmark.visibility - previousLandmark.visibility) * factor
          : landmark.visibility,
    };
  });
}

export default function VideoAnalysisClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const topVideoRef = useRef<HTMLVideoElement | null>(null);
  const topCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTopVideoTimeRef = useRef(-1);
  const smoothedLandmarksRef = useRef<Landmark[] | null>(null);
  const topSmoothedLandmarksRef = useRef<Landmark[] | null>(null);
  const lastValidLandmarksAtRef = useRef(0);
  const lastTopValidLandmarksAtRef = useRef(0);

  const [videoUrl, setVideoUrl] = useState("");
  const [topVideoUrl, setTopVideoUrl] = useState("");
  const [modelStatus, setModelStatus] = useState("Cargando modelo de postura...");
  const [isReady, setIsReady] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PoseModelKey>("heavy");
  const [activeVideoPanel, setActiveVideoPanel] = useState<ActiveVideoPanel>("body");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("lateral");
  const [bowArm, setBowArm] = useState<"left" | "right">("left");
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [topPlaybackRate, setTopPlaybackRateState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [topCurrentTime, setTopCurrentTime] = useState(0);
  const [topDuration, setTopDuration] = useState(0);
  const [isTopPlaying, setIsTopPlaying] = useState(false);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(
    DEFAULT_OVERLAY_SETTINGS
  );
  const [manualAnchorMode, setManualAnchorMode] = useState(false);
  const [frontReferenceSaved, setFrontReferenceSaved] = useState(false);
  const [manualBodyPointMode, setManualBodyPointMode] = useState(false);
  const [manualBodyPointsSaved, setManualBodyPointsSaved] = useState(false);
  const [bodyPointTrackingMode, setBodyPointTrackingMode] =
    useState<BodyPointTrackingMode>("assisted");
  const [bodyPointOffsets, setBodyPointOffsets] = useState<BodyPointOffsets>({});
  const [technicalReferenceMode, setTechnicalReferenceMode] = useState(false);
  const [technicalEditMode, setTechnicalEditMode] = useState(true);
  const [technicalPointDiameter, setTechnicalPointDiameter] = useState(12);
  const [technicalPoints, setTechnicalPoints] = useState<TechnicalReferencePoint[]>(
    []
  );
  const [technicalLines, setTechnicalLines] = useState<TechnicalReferenceLine[]>(
    []
  );
  const [manualAnchors, setManualAnchors] = useState<ManualAnchors>(
    DEFAULT_MANUAL_ANCHORS
  );
  const [bodyPoints, setBodyPoints] = useState<BodyPoints>(DEFAULT_BODY_POINTS);
  const [topTrackingMode, setTopTrackingMode] =
    useState<TopTrackingMode>("hybrid");
  const [topAnchors, setTopAnchors] = useState<TopAnchors>(DEFAULT_TOP_ANCHORS);
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Linea de hombros", value: "-" },
    { label: "Linea de cadera", value: "-" },
    { label: "Brazo de arco", value: "-" },
    { label: "Brazo de cuerda", value: "-" },
    { label: "Parado", value: "-" },
  ]);
  const [topMetrics, setTopMetrics] = useState<Metric[]>([
    { label: "Plano superior", value: "-" },
    { label: "Referencia vertical", value: "-" },
    { label: "Linea cuerda-arco", value: "-" },
  ]);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setIsReady(false);
        setModelStatus(`Cargando modelo ${POSE_MODELS[selectedModel].label}...`);
        landmarkerRef.current?.close?.();
        landmarkerRef.current = null;

        const vision = await import("@mediapipe/tasks-vision");
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          WASM_URL
        );
        const landmarker = await vision.PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: POSE_MODELS[selectedModel].url,
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
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsReady(true);
        setModelStatus(
          `Modelo ${POSE_MODELS[selectedModel].label} listo. Carga o reproduce un video.`
        );
        requestAnimationFrame(() => {
          smoothedLandmarksRef.current = null;
          lastValidLandmarksAtRef.current = 0;
          analyzeCurrentFrame();
        });
      } catch (error) {
        console.error(error);
        setIsReady(false);
        setModelStatus(
          `No se pudo cargar el modelo ${POSE_MODELS[selectedModel].label}. Revisa conexion a internet.`
        );
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
    };
  }, [selectedModel]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (topVideoUrl) URL.revokeObjectURL(topVideoUrl);
    };
  }, [topVideoUrl]);

  useEffect(() => {
    function handleResize() {
      resizeCanvas();
      resizeTopCanvas();
      analyzeCurrentFrame();
      drawTopAnalysis();
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => analyzeCurrentFrame());

    return () => cancelAnimationFrame(frameId);
  }, [
    analysisMode,
    bowArm,
    overlaySettings,
    manualAnchorMode,
    manualAnchors,
    technicalReferenceMode,
    technicalPointDiameter,
    technicalPoints,
    technicalLines,
  ]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => drawTopAnalysis());

    return () => cancelAnimationFrame(frameId);
  }, [topAnchors, overlaySettings, topVideoUrl]);

  function updateOverlaySetting(key: keyof OverlaySettings, value: number) {
    setOverlaySettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetManualAnchors() {
    setManualAnchors(DEFAULT_MANUAL_ANCHORS);
    setFrontReferenceSaved(false);
  }

  function resetBodyPoints() {
    setBodyPoints(DEFAULT_BODY_POINTS);
    setManualBodyPointsSaved(false);
    setBodyPointOffsets({});
  }

  function resetTopAnchors() {
    setTopAnchors(DEFAULT_TOP_ANCHORS);
  }

  function generateTopVerticalReference() {
    const x =
      topSmoothedLandmarksRef.current?.[
        bowArm === "left" ? LANDMARKS.leftWrist : LANDMARKS.rightWrist
      ]?.x ??
      topAnchors.topBowHand.x ??
      0.5;

    setTopAnchors((current) => ({
      ...current,
      topReferenceTop: { x: Math.min(1, Math.max(0, x)), y: 0.05 },
      topReferenceBottom: { x: Math.min(1, Math.max(0, x)), y: 0.95 },
    }));
    requestAnimationFrame(drawTopAnalysis);
  }

  function handleVideoUpload(file: File | null) {
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setActiveVideoPanel("body");
    setModelStatus(
      isReady
        ? "Video cargado. Reproduce o mueve la linea de tiempo para analizar."
        : "Video cargado. Esperando modelo..."
    );
    setMetrics([
      { label: "Linea de hombros", value: "-" },
      { label: "Linea de cadera", value: "-" },
      { label: "Brazo de arco", value: "-" },
      { label: "Brazo de cuerda", value: "-" },
      { label: "Parado", value: "-" },
    ]);
    setConfidence(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    smoothedLandmarksRef.current = null;
    lastValidLandmarksAtRef.current = 0;
  }

  function handleTopVideoUpload(file: File | null) {
    if (!file) return;

    if (topVideoUrl) URL.revokeObjectURL(topVideoUrl);
    setTopVideoUrl(URL.createObjectURL(file));
    setActiveVideoPanel("top");
    setTopMetrics([
      { label: "Plano superior", value: "-" },
      { label: "Referencia vertical", value: "-" },
      { label: "Linea cuerda-arco", value: "-" },
    ]);
    setIsPlaying(false);
    setTopCurrentTime(0);
    setTopDuration(0);
    setIsTopPlaying(false);
    topSmoothedLandmarksRef.current = null;
    lastTopValidLandmarksAtRef.current = 0;
    lastTopVideoTimeRef.current = -1;
  }

  function resizeCanvas() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    const rect = video.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
  }

  function resizeTopCanvas() {
    const video = topVideoRef.current;
    const canvas = topCanvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    const rect = video.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
  }

  function setPlaybackRate(rate: number) {
    setPlaybackRateState(rate);

    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }

  function setTopPlaybackRate(rate: number) {
    setTopPlaybackRateState(rate);

    if (topVideoRef.current) {
      topVideoRef.current.playbackRate = rate;
    }
  }

  function seekTo(time: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const nextTime = Math.min(video.duration, Math.max(0, time));
    video.pause();
    video.currentTime = nextTime;
    setIsPlaying(false);
    setCurrentTime(nextTime);
    requestAnimationFrame(() => {
      analyzeCurrentFrame();
    });
  }

  function seekBy(seconds: number) {
    seekTo((videoRef.current?.currentTime ?? currentTime) + seconds);
  }

  function stepFrame(direction: -1 | 1) {
    seekBy(direction * (1 / 60));
  }

  function seekTopTo(time: number) {
    const video = topVideoRef.current;
    if (!video || !video.duration) return;

    const nextTime = Math.min(video.duration, Math.max(0, time));
    video.pause();
    video.currentTime = nextTime;
    setIsTopPlaying(false);
    setTopCurrentTime(nextTime);
    requestAnimationFrame(drawTopAnalysis);
  }

  function seekTopBy(seconds: number) {
    seekTopTo((topVideoRef.current?.currentTime ?? topCurrentTime) + seconds);
  }

  function stepTopFrame(direction: -1 | 1) {
    seekTopBy(direction * (1 / 60));
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.playbackRate = playbackRate;
      await video.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  async function toggleTopPlayback() {
    const video = topVideoRef.current;
    if (!video) return;

    if (video.paused) {
      video.playbackRate = topPlaybackRate;
      await video.play().catch(() => undefined);
      setIsTopPlaying(true);
      return;
    }

    video.pause();
    setIsTopPlaying(false);
  }

  function getAnchorStyle(anchor: ManualAnchor) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) {
      return { left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` };
    }

    const rect = getVideoContentRect(video, canvas);
    const point = anchorToCanvas(anchor, rect);

    return {
      left: `${(point.x / canvas.width) * 100}%`,
      top: `${(point.y / canvas.height) * 100}%`,
    };
  }

  function updateManualAnchorFromPointer(
    key: ManualAnchorKey,
    event: React.PointerEvent<HTMLElement>
  ) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) return;

    const canvasBox = canvas.getBoundingClientRect();
    const videoRect = getVideoContentRect(video, canvas);
    const canvasX =
      ((event.clientX - canvasBox.left) / canvasBox.width) * canvas.width;
    const canvasY =
      ((event.clientY - canvasBox.top) / canvasBox.height) * canvas.height;
    const nextAnchor = {
      x: Math.min(1, Math.max(0, (canvasX - videoRect.x) / videoRect.width)),
      y: Math.min(1, Math.max(0, (canvasY - videoRect.y) / videoRect.height)),
    };

    setManualAnchors((current) => ({
      ...current,
      [key]: nextAnchor,
    }));
  }

  function getBodyPointStyle(anchor: ManualAnchor) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) {
      return { left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` };
    }

    const rect = getVideoContentRect(video, canvas);
    const point = anchorToCanvas(anchor, rect);

    return {
      left: `${(point.x / canvas.width) * 100}%`,
      top: `${(point.y / canvas.height) * 100}%`,
    };
  }

  function updateBodyPointFromPointer(
    key: BodyPointKey,
    event: React.PointerEvent<HTMLElement>
  ) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) return;

    const canvasBox = canvas.getBoundingClientRect();
    const videoRect = getVideoContentRect(video, canvas);
    const canvasX =
      ((event.clientX - canvasBox.left) / canvasBox.width) * canvas.width;
    const canvasY =
      ((event.clientY - canvasBox.top) / canvasBox.height) * canvas.height;
    const nextPoint = {
      x: Math.min(1, Math.max(0, (canvasX - videoRect.x) / videoRect.width)),
      y: Math.min(1, Math.max(0, (canvasY - videoRect.y) / videoRect.height)),
    };

    setBodyPoints((current) => ({
      ...current,
      [key]: nextPoint,
    }));
  }

  function anchorFromPrimaryPointer(
    event: React.PointerEvent<HTMLElement>
  ): ManualAnchor | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) return null;

    const canvasBox = canvas.getBoundingClientRect();
    const videoRect = getVideoContentRect(video, canvas);
    const canvasX =
      ((event.clientX - canvasBox.left) / canvasBox.width) * canvas.width;
    const canvasY =
      ((event.clientY - canvasBox.top) / canvasBox.height) * canvas.height;

    return clampAnchor({
      x: (canvasX - videoRect.x) / videoRect.width,
      y: (canvasY - videoRect.y) / videoRect.height,
    });
  }

  function addTechnicalPoint() {
    setTechnicalReferenceMode(true);
    setTechnicalEditMode(true);
    setTechnicalPoints((current) => [
      ...current,
      {
        id: `point-${Date.now()}-${current.length}`,
        anchor: { x: 0.5, y: 0.5 },
      },
    ]);
  }

  function addTechnicalLine() {
    setTechnicalReferenceMode(true);
    setTechnicalEditMode(true);
    setTechnicalLines((current) => [
      ...current,
      {
        id: `line-${Date.now()}-${current.length}`,
        from: { x: 0.35, y: 0.45 },
        to: { x: 0.65, y: 0.45 },
      },
    ]);
  }

  function resetTechnicalReferences() {
    setTechnicalPoints([]);
    setTechnicalLines([]);
    requestAnimationFrame(analyzeCurrentFrame);
  }

  function updateTechnicalPointFromPointer(
    id: string,
    event: React.PointerEvent<HTMLElement>
  ) {
    const nextAnchor = anchorFromPrimaryPointer(event);
    if (!nextAnchor) return;

    setTechnicalPoints((current) =>
      current.map((point) =>
        point.id === id ? { ...point, anchor: nextAnchor } : point
      )
    );
  }

  function updateTechnicalLineFromPointer(
    id: string,
    endpoint: "from" | "to",
    event: React.PointerEvent<HTMLElement>
  ) {
    const nextAnchor = anchorFromPrimaryPointer(event);
    if (!nextAnchor) return;

    setTechnicalLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, [endpoint]: nextAnchor } : line
      )
    );
  }

  function getAssistedBodyPoints(landmarks: Landmark[]): BodyPoints {
    const autoPoints = getBodyPointsFromLandmarks(landmarks);

    return (Object.keys(autoPoints) as BodyPointKey[]).reduce((next, key) => {
      const offset = bodyPointOffsets[key] ?? { x: 0, y: 0 };
      next[key] = clampAnchor({
        x: autoPoints[key].x + offset.x,
        y: autoPoints[key].y + offset.y,
      });

      return next;
    }, {} as BodyPoints);
  }

  function saveBodyPointsForTracking() {
    const landmarks = smoothedLandmarksRef.current;

    if (landmarks?.length) {
      const autoPoints = getBodyPointsFromLandmarks(landmarks);
      const nextOffsets = (Object.keys(bodyPoints) as BodyPointKey[]).reduce(
        (next, key) => {
          next[key] = {
            x: bodyPoints[key].x - autoPoints[key].x,
            y: bodyPoints[key].y - autoPoints[key].y,
          };

          return next;
        },
        {} as BodyPointOffsets
      );

      setBodyPointOffsets(nextOffsets);
    } else {
      setBodyPointOffsets({});
    }

    setManualBodyPointsSaved(true);
    requestAnimationFrame(analyzeCurrentFrame);
  }

  function getTopAnchorStyle(anchor: ManualAnchor) {
    const video = topVideoRef.current;
    const canvas = topCanvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) {
      return { left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` };
    }

    const rect = getVideoContentRect(video, canvas);
    const point = anchorToCanvas(anchor, rect);

    return {
      left: `${(point.x / canvas.width) * 100}%`,
      top: `${(point.y / canvas.height) * 100}%`,
    };
  }

  function updateTopAnchorFromPointer(
    key: TopAnchorKey,
    event: React.PointerEvent<HTMLElement>
  ) {
    const video = topVideoRef.current;
    const canvas = topCanvasRef.current;
    if (!video || !canvas || !canvas.width || !canvas.height) return;

    const canvasBox = canvas.getBoundingClientRect();
    const videoRect = getVideoContentRect(video, canvas);
    const canvasX =
      ((event.clientX - canvasBox.left) / canvasBox.width) * canvas.width;
    const canvasY =
      ((event.clientY - canvasBox.top) / canvasBox.height) * canvas.height;
    const nextAnchor = {
      x: Math.min(1, Math.max(0, (canvasX - videoRect.x) / videoRect.width)),
      y: Math.min(1, Math.max(0, (canvasY - videoRect.y) / videoRect.height)),
    };

    setTopAnchors((current) => ({
      ...current,
      [key]: nextAnchor,
    }));
  }

  function getAutoTopAnchors(landmarks: Landmark[] | null): TopAnchors | null {
    if (!landmarks?.length) return null;

    const bowWrist =
      landmarks[bowArm === "left" ? LANDMARKS.leftWrist : LANDMARKS.rightWrist];
    const stringWrist =
      landmarks[bowArm === "left" ? LANDMARKS.rightWrist : LANDMARKS.leftWrist];
    const leftShoulder = landmarks[LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[LANDMARKS.rightShoulder];
    const leftHip = landmarks[LANDMARKS.leftHip];
    const rightHip = landmarks[LANDMARKS.rightHip];
    const required = [bowWrist, stringWrist, leftShoulder, rightShoulder, leftHip, rightHip];

    if (
      required.some(
        (landmark) => !landmark || (landmark.visibility ?? 1) < MIN_LANDMARK_VISIBILITY
      )
    ) {
      return null;
    }

    const bodyAnchor = {
      x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
      y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
    };
    const bowHand = { x: bowWrist.x, y: bowWrist.y };
    const stringHand = { x: stringWrist.x, y: stringWrist.y };

    return {
      topBowHand: bowHand,
      topStringHand: stringHand,
      topAnchor: bodyAnchor,
      topReferenceTop: topAnchors.topReferenceTop,
      topReferenceBottom: topAnchors.topReferenceBottom,
    };
  }

  function analyzeCurrentFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || !video.videoWidth) return;

    resizeCanvas();

    if (video.currentTime === lastVideoTimeRef.current && !video.paused) return;

    const now = performance.now();
    const result = landmarker.detectForVideo(video, now);
    lastVideoTimeRef.current = video.currentTime;
    const landmarks = result.landmarks?.[0];

    if (landmarks?.length) {
      const smoothed = smoothLandmarks(smoothedLandmarksRef.current, landmarks);
      smoothedLandmarksRef.current = smoothed;
      lastValidLandmarksAtRef.current = now;
      drawAnalysis(smoothed, false);
      return;
    }

    const lastLandmarks = smoothedLandmarksRef.current;
    const shouldHoldLast =
      lastLandmarks &&
      (!video.paused || now - lastValidLandmarksAtRef.current <= LANDMARK_HOLD_MS);

    if (shouldHoldLast) {
      drawAnalysis(lastLandmarks, true);
      return;
    }

    smoothedLandmarksRef.current = null;
    drawAnalysis([], false);
  }

  function drawTopAnalysis() {
    const video = topVideoRef.current;
    const canvas = topCanvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    resizeTopCanvas();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const videoRect = getVideoContentRect(video, canvas);
    let activeAnchors = topAnchors;
    let trackingLabel = "Manual";
    let trackingConfidence = 100;

    if (topTrackingMode !== "manual" && landmarker) {
      const now = performance.now();
      const shouldDetect = video.currentTime !== lastTopVideoTimeRef.current || video.paused;
      let detectedLandmarks: Landmark[] | null = null;

      if (shouldDetect) {
        const result = landmarker.detectForVideo(video, now);
        lastTopVideoTimeRef.current = video.currentTime;
        const landmarks = result.landmarks?.[0];

        if (landmarks?.length) {
          const smoothed = smoothLandmarks(topSmoothedLandmarksRef.current, landmarks);
          topSmoothedLandmarksRef.current = smoothed;
          lastTopValidLandmarksAtRef.current = now;
          detectedLandmarks = smoothed;
        }
      } else {
        detectedLandmarks = topSmoothedLandmarksRef.current;
      }

      const shouldHoldLast =
        !detectedLandmarks &&
        topSmoothedLandmarksRef.current &&
        (!video.paused || now - lastTopValidLandmarksAtRef.current <= LANDMARK_HOLD_MS);
      const autoAnchors = getAutoTopAnchors(
        detectedLandmarks || (shouldHoldLast ? topSmoothedLandmarksRef.current : null)
      );

      if (autoAnchors) {
        activeAnchors = autoAnchors;
        trackingLabel = topTrackingMode === "hybrid" ? "Hibrido" : "Auto";
        trackingConfidence = shouldHoldLast ? 82 : 100;
      } else {
        trackingLabel = "Manual fallback";
        trackingConfidence = 0;
      }
    }

    const bowHand = anchorToCanvas(activeAnchors.topBowHand, videoRect);
    const stringHand = anchorToCanvas(activeAnchors.topStringHand, videoRect);
    const bodyAnchor = anchorToCanvas(activeAnchors.topAnchor, videoRect);
    const referenceTop = anchorToCanvas(activeAnchors.topReferenceTop, videoRect);
    const referenceBottom = anchorToCanvas(
      activeAnchors.topReferenceBottom,
      videoRect
    );
    const referenceAngle = lineAngle(
      activeAnchors.topReferenceTop,
      activeAnchors.topReferenceBottom
    );
    const drawAngle = lineAngle(activeAnchors.topStringHand, activeAnchors.topBowHand);
    const torsoAngle = lineAngle(activeAnchors.topAnchor, activeAnchors.topBowHand);
    const drawDeviation = angleDifference(referenceAngle, drawAngle);
    const torsoDeviation = angleDifference(referenceAngle, torsoAngle);
    const sectorRadius = Math.max(
      24,
      Math.hypot(bowHand.x - stringHand.x, bowHand.y - stringHand.y)
    );

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(bowHand.x, bowHand.y);
    ctx.arc(
      bowHand.x,
      bowHand.y,
      sectorRadius,
      (referenceAngle * Math.PI) / 180,
      (drawAngle * Math.PI) / 180
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawFreeLine(
      ctx,
      referenceTop,
      referenceBottom,
      "#ef4444",
      Math.max(2, overlaySettings.lineWidth),
      overlaySettings.glow
    );
    drawFreeLine(
      ctx,
      stringHand,
      bowHand,
      "#fb7185",
      Math.max(2, overlaySettings.lineWidth),
      overlaySettings.glow
    );
    drawFreeLine(
      ctx,
      bodyAnchor,
      bowHand,
      "#f97316",
      Math.max(2, overlaySettings.lineWidth - 1),
      overlaySettings.glow
    );
    drawFreeLine(
      ctx,
      bodyAnchor,
      stringHand,
      "#f97316",
      Math.max(2, overlaySettings.lineWidth - 1),
      overlaySettings.glow
    );

    [bowHand, stringHand, bodyAnchor].forEach((point) => {
      ctx.save();
      ctx.fillStyle = "#fecaca";
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = overlaySettings.glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, overlaySettings.pointRadius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    setTopMetrics([
      {
        label: "Plano superior",
        value: `${drawDeviation} deg`,
        tone: metricTone(drawDeviation, 6),
      },
      {
        label: "Referencia vertical",
        value: `${Math.round(referenceAngle)} deg`,
        tone: "text-red-200",
      },
      {
        label: "Torso hacia arco",
        value: `${torsoDeviation} deg`,
        tone: metricTone(torsoDeviation, 10),
      },
      {
        label: "Tracking cenital",
        value: trackingLabel,
        tone: trackingConfidence ? "text-emerald-300" : "text-yellow-200",
      },
    ]);
  }

  function drawManualFrontReferenceOverlay(ctx: CanvasRenderingContext2D, videoRect: VideoRect) {
    const verticalTop = anchorToCanvas(manualAnchors.verticalTop, videoRect);
    const crossCenter = anchorToCanvas(manualAnchors.crossCenter, videoRect);
    const verticalBottom = anchorToCanvas(manualAnchors.verticalBottom, videoRect);
    const horizontalLeft = anchorToCanvas(manualAnchors.horizontalLeft, videoRect);
    const horizontalRight = anchorToCanvas(manualAnchors.horizontalRight, videoRect);
    const verticalAngle = lineAngle(manualAnchors.verticalTop, manualAnchors.verticalBottom);
    const horizontalAngle = lineAngle(
      manualAnchors.horizontalLeft,
      manualAnchors.horizontalRight
    );
    const verticalDeviation = Number(
      Math.abs(90 - Math.abs(verticalAngle)).toFixed(1)
    );
    const horizontalDeviation = Number(
      Math.min(
        Math.abs(horizontalAngle),
        Math.abs(180 - Math.abs(horizontalAngle))
      ).toFixed(1)
    );

    drawReferenceLine(ctx, verticalTop, verticalBottom, "#22d3ee");
    drawReferenceLine(ctx, horizontalLeft, horizontalRight, "#22d3ee");

    [verticalTop, crossCenter, verticalBottom, horizontalLeft, horizontalRight].forEach(
      (point) => {
        ctx.save();
        ctx.fillStyle = "rgba(103, 232, 249, 0.55)";
        ctx.strokeStyle = "#020617";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = Math.max(2, overlaySettings.glow / 2);
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(2, overlaySettings.pointRadius - 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    );

    return {
      verticalDeviation,
      horizontalDeviation,
      crossCenter,
      horizontalAngle,
      verticalAngle,
      horizontalCanvasAngle: lineAngle(horizontalLeft, horizontalRight),
      verticalCanvasAngle: lineAngle(verticalTop, verticalBottom),
      horizontalLeft,
      horizontalRight,
      verticalTop,
      verticalBottom,
    };
  }

  function startLoop() {
    const loop = () => {
      analyzeCurrentFrame();
      drawTopAnalysis();
      rafRef.current = requestAnimationFrame(loop);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }

  function stopLoop() {
    const primaryPlaying = videoRef.current ? !videoRef.current.paused : false;
    const topPlaying = topVideoRef.current ? !topVideoRef.current.paused : false;

    if (!primaryPlaying && !topPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    analyzeCurrentFrame();
    drawTopAnalysis();
  }

  function drawTechnicalReferences(
    ctx: CanvasRenderingContext2D,
    videoRect: VideoRect
  ) {
    if (!technicalReferenceMode) return;

    technicalLines.forEach((line) => {
      const from = anchorToCanvas(line.from, videoRect);
      const to = anchorToCanvas(line.to, videoRect);

      drawFreeLine(
        ctx,
        from,
        to,
        "#a78bfa",
        Math.max(1.5, overlaySettings.lineWidth - 0.5),
        overlaySettings.glow
      );

      [from, to].forEach((point) => {
        ctx.save();
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#c4b5fd";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#a78bfa";
        ctx.shadowBlur = Math.max(2, overlaySettings.glow / 2);
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(3, technicalPointDiameter / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    });

    technicalPoints.forEach((point) => {
      const canvasPoint = anchorToCanvas(point.anchor, videoRect);

      ctx.save();
      ctx.fillStyle = "#22d3ee";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = overlaySettings.glow;
      ctx.beginPath();
      ctx.arc(
        canvasPoint.x,
        canvasPoint.y,
        Math.max(3, technicalPointDiameter / 2),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawAnalysis(landmarks: Landmark[], isHeldFrame = false) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const video = videoRef.current;
    const videoRect = video ? getVideoContentRect(video, canvas) : null;

    if (!videoRect) {
      setConfidence(0);
      return;
    }

    if (analysisMode === "front_t" && manualAnchorMode && !landmarks.length) {
      drawManualFrontTAnalysis(ctx, videoRect, isHeldFrame);
      drawTechnicalReferences(ctx, videoRect);
      return;
    }

    if (!landmarks.length) {
      setConfidence(0);
      drawTechnicalReferences(ctx, videoRect);
      return;
    }

    const leftArm = [
      LANDMARKS.leftShoulder,
      LANDMARKS.leftElbow,
      LANDMARKS.leftWrist,
    ];
    const rightArm = [
      LANDMARKS.rightShoulder,
      LANDMARKS.rightElbow,
      LANDMARKS.rightWrist,
    ];
    const bowArmIndexes = bowArm === "left" ? leftArm : rightArm;
    const stringArmIndexes = bowArm === "left" ? rightArm : leftArm;
    const needed = [
      LANDMARKS.leftShoulder,
      LANDMARKS.rightShoulder,
      LANDMARKS.nose,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
      LANDMARKS.leftKnee,
      LANDMARKS.rightKnee,
      LANDMARKS.leftAnkle,
      LANDMARKS.rightAnkle,
      LANDMARKS.leftHeel,
      LANDMARKS.rightHeel,
      LANDMARKS.leftFoot,
      LANDMARKS.rightFoot,
      ...bowArmIndexes,
      ...stringArmIndexes,
    ];

    const visibility = getVisibility(landmarks, needed);
    setConfidence(isHeldFrame ? Math.max(0, visibility - 15) : visibility);

    if (analysisMode === "front_t") {
      drawFrontTAnalysis(ctx, videoRect, landmarks, needed, isHeldFrame);
      drawTechnicalReferences(ctx, videoRect);
      return;
    }

    const heldOpacity = isHeldFrame ? HELD_FRAME_OPACITY : 1;

    ctx.save();
    ctx.globalAlpha = heldOpacity;

    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.leftShoulder, LANDMARKS.rightShoulder],
      "#22d3ee",
      overlaySettings.lineWidth
    );
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.leftHip, LANDMARKS.rightHip],
      "#34d399",
      overlaySettings.lineWidth
    );
    drawSegment(ctx, videoRect, landmarks, bowArmIndexes, "#facc15", overlaySettings.lineWidth);
    drawSegment(ctx, videoRect, landmarks, stringArmIndexes, "#c084fc", overlaySettings.lineWidth);
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.leftHip, LANDMARKS.leftKnee, LANDMARKS.leftAnkle],
      "#38bdf8",
      Math.max(2, overlaySettings.lineWidth - 1)
    );
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.rightHip, LANDMARKS.rightKnee, LANDMARKS.rightAnkle],
      "#38bdf8",
      Math.max(2, overlaySettings.lineWidth - 1)
    );
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.leftHeel, LANDMARKS.leftFoot],
      "#fb7185",
      Math.max(2, overlaySettings.lineWidth - 1)
    );
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.rightHeel, LANDMARKS.rightFoot],
      "#fb7185",
      Math.max(2, overlaySettings.lineWidth - 1)
    );

    needed.forEach((index) => {
      const landmark = landmarks[index];
      if (landmark) {
        drawPoint(
          ctx,
          videoRect,
          landmark,
          "#67e8f9",
          overlaySettings.pointRadius,
          overlaySettings.glow
        );
      }
    });

    ctx.restore();
    drawTechnicalReferences(ctx, videoRect);

    const shoulderTilt = absTilt(
      landmarks[LANDMARKS.leftShoulder],
      landmarks[LANDMARKS.rightShoulder]
    );
    const hipTilt = absTilt(landmarks[LANDMARKS.leftHip], landmarks[LANDMARKS.rightHip]);
    const bowAngle = jointAngle(
      landmarks[bowArmIndexes[0]],
      landmarks[bowArmIndexes[1]],
      landmarks[bowArmIndexes[2]]
    );
    const stringAngle = jointAngle(
      landmarks[stringArmIndexes[0]],
      landmarks[stringArmIndexes[1]],
      landmarks[stringArmIndexes[2]]
    );
    const shoulderCenter = {
      x:
        (landmarks[LANDMARKS.leftShoulder].x +
          landmarks[LANDMARKS.rightShoulder].x) /
        2,
      y:
        (landmarks[LANDMARKS.leftShoulder].y +
          landmarks[LANDMARKS.rightShoulder].y) /
        2,
    };
    const hipCenter = {
      x: (landmarks[LANDMARKS.leftHip].x + landmarks[LANDMARKS.rightHip].x) / 2,
      y: (landmarks[LANDMARKS.leftHip].y + landmarks[LANDMARKS.rightHip].y) / 2,
    };
    const trunkLean = Number(
      Math.abs(90 - Math.abs(lineAngle(hipCenter, shoulderCenter))).toFixed(1)
    );
    const shoulderWidth = distance(
      landmarks[LANDMARKS.leftShoulder],
      landmarks[LANDMARKS.rightShoulder]
    );
    const stanceWidth = distance(
      landmarks[LANDMARKS.leftAnkle],
      landmarks[LANDMARKS.rightAnkle]
    );
    const stanceRatio = shoulderWidth
      ? Number((stanceWidth / shoulderWidth).toFixed(2))
      : 0;

    setMetrics([
      {
        label: "Linea de hombros",
        value: `${shoulderTilt} deg`,
        tone: metricTone(shoulderTilt, 4),
      },
      {
        label: "Linea de cadera",
        value: `${hipTilt} deg`,
        tone: metricTone(hipTilt, 4),
      },
      {
        label: "Brazo de arco",
        value: `${bowAngle} deg`,
        tone: bowAngle >= 165 ? "text-emerald-300" : "text-yellow-200",
      },
      {
        label: "Brazo de cuerda",
        value: `${stringAngle} deg`,
        tone: "text-purple-200",
      },
      {
        label: "Parado",
        value: `${stanceRatio}x hombros`,
        tone:
          stanceRatio >= 0.85 && stanceRatio <= 1.35
            ? "text-emerald-300"
            : "text-yellow-200",
      },
      {
        label: "Inclinacion tronco",
        value: `${trunkLean} deg`,
        tone: metricTone(trunkLean, 5),
      },
    ]);
  }

  function drawFrontTAnalysis(
    ctx: CanvasRenderingContext2D,
    videoRect: VideoRect,
    landmarks: Landmark[],
    needed: number[],
    isHeldFrame: boolean
  ) {
    const leftShoulder = landmarks[LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[LANDMARKS.rightShoulder];
    const leftHip = landmarks[LANDMARKS.leftHip];
    const rightHip = landmarks[LANDMARKS.rightHip];
    const leftAnkle = landmarks[LANDMARKS.leftAnkle];
    const rightAnkle = landmarks[LANDMARKS.rightAnkle];
    const nose = landmarks[LANDMARKS.nose];
    const bowShoulder =
      landmarks[bowArm === "left" ? LANDMARKS.leftShoulder : LANDMARKS.rightShoulder];
    const bowWrist =
      landmarks[bowArm === "left" ? LANDMARKS.leftWrist : LANDMARKS.rightWrist];

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
    const ankleCenter = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };
    const shoulderWidth = distance(leftShoulder, rightShoulder);
    const bowShoulderPoint = toPoint(bowShoulder, videoRect);
    const bowWristPoint = toPoint(bowWrist, videoRect);
    const nosePoint = toPoint(nose, videoRect);
    const shoulderCenterPoint = toPoint(normalizedPoint(shoulderCenter), videoRect);
    const hipCenterPoint = toPoint(normalizedPoint(hipCenter), videoRect);
    const ankleCenterPoint = toPoint(normalizedPoint(ankleCenter), videoRect);
    const activeBodyPoints =
      manualBodyPointMode &&
      manualBodyPointsSaved &&
      bodyPointTrackingMode === "assisted"
        ? getAssistedBodyPoints(landmarks)
        : bodyPoints;
    const manualBodyPoints = {
      head: anchorToCanvas(activeBodyPoints.head, videoRect),
      leftShoulder: anchorToCanvas(activeBodyPoints.leftShoulder, videoRect),
      rightShoulder: anchorToCanvas(activeBodyPoints.rightShoulder, videoRect),
      leftHand: anchorToCanvas(activeBodyPoints.leftHand, videoRect),
      rightHand: anchorToCanvas(activeBodyPoints.rightHand, videoRect),
      leftHip: anchorToCanvas(activeBodyPoints.leftHip, videoRect),
      rightHip: anchorToCanvas(activeBodyPoints.rightHip, videoRect),
      leftFoot: anchorToCanvas(activeBodyPoints.leftFoot, videoRect),
      rightFoot: anchorToCanvas(activeBodyPoints.rightFoot, videoRect),
    };
    const activeBowShoulderPoint = manualBodyPointMode
      ? bowArm === "left"
        ? manualBodyPoints.leftShoulder
        : manualBodyPoints.rightShoulder
      : bowShoulderPoint;
    const activeBowHandPoint = manualBodyPointMode
      ? bowArm === "left"
        ? manualBodyPoints.leftHand
        : manualBodyPoints.rightHand
      : bowWristPoint;
    const activeHeadPoint = manualBodyPointMode ? manualBodyPoints.head : nosePoint;
    const activeShoulderCenterPoint = manualBodyPointMode
      ? {
          x: (manualBodyPoints.leftShoulder.x + manualBodyPoints.rightShoulder.x) / 2,
          y: (manualBodyPoints.leftShoulder.y + manualBodyPoints.rightShoulder.y) / 2,
        }
      : shoulderCenterPoint;
    const activeHipCenterPoint = manualBodyPointMode
      ? {
          x: (manualBodyPoints.leftHip.x + manualBodyPoints.rightHip.x) / 2,
          y: (manualBodyPoints.leftHip.y + manualBodyPoints.rightHip.y) / 2,
        }
      : hipCenterPoint;
    const activeFootCenterPoint = manualBodyPointMode
      ? {
          x: (manualBodyPoints.leftFoot.x + manualBodyPoints.rightFoot.x) / 2,
          y: (manualBodyPoints.leftFoot.y + manualBodyPoints.rightFoot.y) / 2,
        }
      : ankleCenterPoint;
    const slope =
      (activeBowHandPoint.y - activeBowShoulderPoint.y) /
      Math.max(1, activeBowHandPoint.x - activeBowShoulderPoint.x);
    const horizontalStart = (1 - overlaySettings.horizontalReach) / 2;
    const horizontalEnd = 1 - horizontalStart;
    const horizontalBaseY =
      activeBowShoulderPoint.y + overlaySettings.horizontalOffset * videoRect.height;
    const horizontalFrom = {
      x: videoRect.x + videoRect.width * horizontalStart,
      y:
        horizontalBaseY +
        slope *
          (videoRect.x + videoRect.width * horizontalStart - activeBowShoulderPoint.x),
    };
    const horizontalTo = {
      x: videoRect.x + videoRect.width * horizontalEnd,
      y:
        horizontalBaseY +
        slope *
          (videoRect.x + videoRect.width * horizontalEnd - activeBowShoulderPoint.x),
    };
    const horizontalCanvasAngle = lineAngle(horizontalFrom, horizontalTo);
    const horizontalDeviation = Number(
      Math.min(
        Math.abs(horizontalCanvasAngle),
        Math.abs(180 - Math.abs(horizontalCanvasAngle))
      ).toFixed(1)
    );
    const verticalAxisAngle = lineAngle(activeFootCenterPoint, activeHeadPoint);
    const bodyCenterPoint = {
      x:
        (activeHeadPoint.x +
          activeShoulderCenterPoint.x +
          activeHipCenterPoint.x +
          activeFootCenterPoint.x) /
        4,
      y:
        (activeHeadPoint.y +
          activeShoulderCenterPoint.y +
          activeHipCenterPoint.y +
          activeFootCenterPoint.y) /
        4,
    };
    const verticalAxisLength = Math.max(
      videoRect.height * 0.42,
      Math.hypot(
        activeHeadPoint.x - activeFootCenterPoint.x,
        activeHeadPoint.y - activeFootCenterPoint.y
      ) *
        1.25
    );
    const verticalAxis = lineFromCenter(
      bodyCenterPoint,
      verticalAxisAngle,
      verticalAxisLength
    );
    const bodyDeviation = shoulderWidth
      ? Number((Math.abs(shoulderCenter.x - hipCenter.x) / shoulderWidth * 100).toFixed(1))
      : 0;
    const shoulderTilt = absTilt(leftShoulder, rightShoulder);
    const hipTilt = absTilt(leftHip, rightHip);
    const stanceWidth = distance(leftAnkle, rightAnkle);
    const stanceRatio = shoulderWidth
      ? Number((stanceWidth / shoulderWidth).toFixed(2))
      : 0;
    const heldOpacity = isHeldFrame ? HELD_FRAME_OPACITY : 1;
    const reference = manualAnchorMode
      ? drawManualFrontReferenceOverlay(ctx, videoRect)
      : null;

    ctx.save();
    ctx.globalAlpha = heldOpacity;
    drawFreeLine(
      ctx,
      verticalAxis.from,
      verticalAxis.to,
      "#facc15",
      overlaySettings.lineWidth,
      overlaySettings.glow
    );
    drawFreeLine(
      ctx,
      horizontalFrom,
      horizontalTo,
      "#facc15",
      overlaySettings.lineWidth,
      overlaySettings.glow
    );

    ctx.restore();

    const nextMetrics: Metric[] = [
      {
        label: "Linea horizontal T",
        value: `${horizontalDeviation} deg`,
        tone: metricTone(horizontalDeviation, 4),
      },
      {
        label: "Eje vertical",
        value: `${bodyDeviation}%`,
        tone: metricTone(bodyDeviation, 8),
      },
      {
        label: "Linea de hombros",
        value: `${shoulderTilt} deg`,
        tone: metricTone(shoulderTilt, 4),
      },
      {
        label: "Linea de cadera",
        value: `${hipTilt} deg`,
        tone: metricTone(hipTilt, 4),
      },
      {
        label: "Parado",
        value: `${stanceRatio}x hombros`,
        tone:
          stanceRatio >= 0.85 && stanceRatio <= 1.35
            ? "text-emerald-300"
            : "text-yellow-200",
      },
    ];

    if (reference) {
      nextMetrics.push(
        {
          label: "Modo frontal",
          value: "Hibrido",
          tone: "text-yellow-200",
        }
      );
    }

    if (manualBodyPointMode) {
      nextMetrics.push({
        label: "Puntos cuerpo",
        value:
          manualBodyPointsSaved && bodyPointTrackingMode === "assisted"
            ? "Asistido"
            : "Manual fijo",
        tone: "text-emerald-200",
      });
    }

    setMetrics(nextMetrics);
  }

  function drawManualFrontTAnalysis(
    ctx: CanvasRenderingContext2D,
    videoRect: VideoRect,
    isHeldFrame: boolean
  ) {
    const verticalTop = anchorToCanvas(manualAnchors.verticalTop, videoRect);
    const crossCenter = anchorToCanvas(manualAnchors.crossCenter, videoRect);
    const verticalBottom = anchorToCanvas(manualAnchors.verticalBottom, videoRect);
    const horizontalLeft = anchorToCanvas(manualAnchors.horizontalLeft, videoRect);
    const horizontalRight = anchorToCanvas(manualAnchors.horizontalRight, videoRect);
    const heldOpacity = isHeldFrame ? HELD_FRAME_OPACITY : 1;
    const verticalAngle = lineAngle(manualAnchors.verticalTop, manualAnchors.verticalBottom);
    const verticalDeviation = Number(
      Math.abs(90 - Math.abs(verticalAngle)).toFixed(1)
    );
    const horizontalAngle = lineAngle(
      manualAnchors.horizontalLeft,
      manualAnchors.horizontalRight
    );
    const horizontalDeviation = Number(
      Math.min(
        Math.abs(horizontalAngle),
        Math.abs(180 - Math.abs(horizontalAngle))
      ).toFixed(1)
    );

    setConfidence(100);

    ctx.save();
    ctx.globalAlpha = heldOpacity;
    drawFreeLine(
      ctx,
      verticalTop,
      verticalBottom,
      "#facc15",
      overlaySettings.lineWidth,
      overlaySettings.glow
    );
    drawFreeLine(
      ctx,
      horizontalLeft,
      horizontalRight,
      "#facc15",
      overlaySettings.lineWidth,
      overlaySettings.glow
    );
    [
      verticalTop,
      crossCenter,
      verticalBottom,
      horizontalLeft,
      horizontalRight,
    ].forEach((point) => {
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = overlaySettings.glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, overlaySettings.pointRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    setMetrics([
      {
        label: "Linea horizontal T",
        value: `${horizontalDeviation} deg`,
        tone: metricTone(horizontalDeviation, 4),
      },
      {
        label: "Eje vertical manual",
        value: `${verticalDeviation} deg`,
        tone: metricTone(verticalDeviation, 4),
      },
      {
        label: "Centro T",
        value: `${Math.round(manualAnchors.crossCenter.x * 100)}% / ${Math.round(
          manualAnchors.crossCenter.y * 100
        )}%`,
        tone: "text-cyan-300",
      },
      {
        label: "Anclajes",
        value: "Manual",
        tone: "text-yellow-200",
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-900/80 p-5 shadow-[0_0_70px_rgba(34,211,238,0.10)] md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  TAL Motion Lab
                </span>
                <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-100">
                  Heavy pose model
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight tal-text-glow md:text-6xl">
                Laboratorio de video tecnico
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 md:text-base">
                Analiza postura lateral, eje frontal y plano cenital con overlay
                configurable, camara lenta y avance cuadro por cuadro.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <PhasePill icon={Camera} label="Captura" text="Lateral, frontal o cenital" />
                <PhasePill icon={ScanLine} label="Analisis" text="Pose, ejes y angulos" />
                <PhasePill icon={SlidersHorizontal} label="Calibracion" text="Anclajes editables" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="tal-metric-card">
                <span className="tal-metric-icon">
                  {isReady ? <ShieldCheck size={20} /> : <Loader2 className="animate-spin" size={20} />}
                </span>
                <p className="tal-metric-label">Estado</p>
                <p className="relative z-10 mt-2 text-sm font-black text-cyan-100">
                  {modelStatus}
                </p>
              </div>
              <div className="tal-metric-card">
              <span className="tal-metric-icon">
                <Gauge size={20} />
              </span>
                <p className="tal-metric-label">Confianza</p>
                <p className={`relative z-10 mt-2 text-3xl font-black ${confidence >= 70 ? "text-emerald-300" : "text-yellow-200"}`}>
                  {confidence}%
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="tal-chart-card">
            <div className="mb-5 grid gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="tal-metric-icon mb-0">
                  <FileVideo size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      Consola de captura
                    </p>
                    <h2 className="mt-1 text-2xl font-black">Overlay tecnico profesional</h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
                    <Upload size={17} />
                    Cargar lateral/frontal
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(event) =>
                        handleVideoUpload(event.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-300/25 bg-red-300/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-300 hover:text-slate-950">
                    <Upload size={17} />
                    Cargar cenital
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(event) =>
                        handleTopVideoUpload(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
              </div>

              {(videoUrl || topVideoUrl) && (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveVideoPanel("body")}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                        activeVideoPanel === "body"
                          ? "bg-cyan-400 text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Frontal / lateral
                    </button>
                  )}
                  {topVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveVideoPanel("top")}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                        activeVideoPanel === "top"
                          ? "bg-red-300 text-red-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Cenital
                    </button>
                  )}
                </div>
              )}

              {videoUrl && activeVideoPanel === "body" && (
                <div className="rounded-[1.5rem] border border-cyan-300/15 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlayback}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300"
                        title={isPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => seekBy(-1)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/10"
                        title="Retroceder 1 segundo"
                      >
                        <SkipBack size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={() => stepFrame(-1)}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/10"
                      >
                        -1 frame
                      </button>
                      <button
                        type="button"
                        onClick={() => stepFrame(1)}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/10"
                      >
                        +1 frame
                      </button>
                      <button
                        type="button"
                        onClick={() => seekBy(1)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/10"
                        title="Avanzar 1 segundo"
                      >
                        <SkipForward size={19} />
                      </button>

                      <div className="flex flex-wrap rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                        {PLAYBACK_RATES.map((rate) => (
                          <button
                            key={rate.value}
                            type="button"
                            onClick={() => setPlaybackRate(rate.value)}
                            className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                              playbackRate === rate.value
                                ? "bg-cyan-400 text-slate-950"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                            title={
                              rate.value === 1
                                ? "Velocidad normal"
                                : `Camara lenta ${rate.label}`
                            }
                          >
                            {rate.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={1 / 120}
                        value={Math.min(currentTime, duration || currentTime)}
                        onChange={(event) => seekTo(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
            {activeVideoPanel === "body" && (videoUrl || !topVideoUrl) && (
            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-black shadow-[0_0_60px_rgba(34,211,238,0.10)]">
              {videoUrl ? (
                <>
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-cyan-300/20 bg-slate-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                    Lateral
                  </div>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    playsInline
                    className="block max-h-[68vh] w-full bg-black object-contain"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackRate;
                        setDuration(videoRef.current.duration || 0);
                        setCurrentTime(videoRef.current.currentTime || 0);
                      }
                      resizeCanvas();
                      analyzeCurrentFrame();
                    }}
                    onTimeUpdate={() => {
                      setCurrentTime(videoRef.current?.currentTime || 0);
                    }}
                    onPlay={() => {
                      setIsPlaying(true);
                      startLoop();
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      stopLoop();
                    }}
                    onSeeked={() => {
                      setCurrentTime(videoRef.current?.currentTime || 0);
                      analyzeCurrentFrame();
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  {analysisMode === "front_t" && manualAnchorMode && !frontReferenceSaved && (
                    <div className="absolute inset-0 z-10">
                      {(Object.keys(manualAnchors) as ManualAnchorKey[]).map(
                        (key) => (
                          <button
                            key={key}
                            type="button"
                            onPointerDown={(event) => {
                              event.currentTarget.setPointerCapture(
                                event.pointerId
                              );
                              updateManualAnchorFromPointer(key, event);
                            }}
                            onPointerMove={(event) => {
                              if (event.buttons !== 1) return;
                              updateManualAnchorFromPointer(key, event);
                            }}
                            onPointerUp={(event) => {
                              event.currentTarget.releasePointerCapture(
                                event.pointerId
                              );
                              analyzeCurrentFrame();
                            }}
                            className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-300 text-[8px] font-black text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.55)] ring-2 ring-yellow-200/30"
                            style={getAnchorStyle(manualAnchors[key])}
                            title={MANUAL_ANCHOR_LABELS[key]}
                          >
                            {MANUAL_ANCHOR_LABELS[key].slice(0, 1)}
                          </button>
                        )
                      )}
                    </div>
                  )}
                  {analysisMode === "front_t" &&
                    manualBodyPointMode &&
                    !manualBodyPointsSaved && (
                      <div className="absolute inset-0 z-20">
                        {(Object.keys(bodyPoints) as BodyPointKey[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onPointerDown={(event) => {
                              event.currentTarget.setPointerCapture(event.pointerId);
                              updateBodyPointFromPointer(key, event);
                            }}
                            onPointerMove={(event) => {
                              if (event.buttons !== 1) return;
                              updateBodyPointFromPointer(key, event);
                            }}
                            onPointerUp={(event) => {
                              event.currentTarget.releasePointerCapture(event.pointerId);
                              analyzeCurrentFrame();
                            }}
                            className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-300 text-[8px] font-black text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.45)] ring-2 ring-emerald-200/30"
                            style={getBodyPointStyle(bodyPoints[key])}
                            title={BODY_POINT_LABELS[key]}
                          >
                            {BODY_POINT_LABELS[key].slice(0, 1)}
                          </button>
                        ))}
                      </div>
                    )}
                  {technicalReferenceMode && technicalEditMode && (
                    <div className="absolute inset-0 z-30">
                      {technicalLines.map((line, index) =>
                        (["from", "to"] as const).map((endpoint) => (
                          <button
                            key={`${line.id}-${endpoint}`}
                            type="button"
                            onPointerDown={(event) => {
                              event.currentTarget.setPointerCapture(event.pointerId);
                              updateTechnicalLineFromPointer(line.id, endpoint, event);
                            }}
                            onPointerMove={(event) => {
                              if (event.buttons !== 1) return;
                              updateTechnicalLineFromPointer(line.id, endpoint, event);
                            }}
                            onPointerUp={(event) => {
                              event.currentTarget.releasePointerCapture(event.pointerId);
                              analyzeCurrentFrame();
                            }}
                            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-950 bg-purple-300 text-[8px] font-black text-slate-950 shadow-[0_0_18px_rgba(167,139,250,0.5)] ring-2 ring-purple-200/30"
                            style={{
                              ...getAnchorStyle(line[endpoint]),
                              width: `${Math.max(16, technicalPointDiameter + 6)}px`,
                              height: `${Math.max(16, technicalPointDiameter + 6)}px`,
                            }}
                            title={`Linea ${index + 1} ${endpoint === "from" ? "inicio" : "fin"}`}
                          >
                            {endpoint === "from" ? "A" : "B"}
                          </button>
                        ))
                      )}
                      {technicalPoints.map((point, index) => (
                        <button
                          key={point.id}
                          type="button"
                          onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            updateTechnicalPointFromPointer(point.id, event);
                          }}
                          onPointerMove={(event) => {
                            if (event.buttons !== 1) return;
                            updateTechnicalPointFromPointer(point.id, event);
                          }}
                          onPointerUp={(event) => {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                            analyzeCurrentFrame();
                          }}
                          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-300 text-[8px] font-black text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.5)] ring-2 ring-cyan-200/30"
                          style={{
                            ...getAnchorStyle(point.anchor),
                            width: `${Math.max(16, technicalPointDiameter + 6)}px`,
                            height: `${Math.max(16, technicalPointDiameter + 6)}px`,
                          }}
                          title={`Punto libre ${index + 1}`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[460px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <Camera size={34} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Carga un video lateral</h3>
                    <p className="mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
                      Usa una toma estable, cuerpo completo visible y camara a
                      la altura del torso para mejores mediciones.
                    </p>
                  </div>
                </div>
              )}
            </div>
            )}

            {topVideoUrl && activeVideoPanel === "top" && (
              <div className="overflow-hidden rounded-[2rem] border border-red-300/15 bg-slate-950 shadow-[0_0_60px_rgba(248,113,113,0.10)]">
                <div className="relative overflow-hidden bg-black">
                  <div className="absolute left-4 top-4 z-10 rounded-full border border-red-300/20 bg-slate-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-100 backdrop-blur">
                    Cenital
                  </div>
                  <video
                    ref={topVideoRef}
                    src={topVideoUrl}
                    playsInline
                    className="block max-h-[68vh] w-full bg-black object-contain"
                    onLoadedMetadata={() => {
                      if (topVideoRef.current) {
                        topVideoRef.current.playbackRate = topPlaybackRate;
                        setTopDuration(topVideoRef.current.duration || 0);
                        setTopCurrentTime(topVideoRef.current.currentTime || 0);
                      }
                      resizeTopCanvas();
                      drawTopAnalysis();
                    }}
                    onTimeUpdate={() => {
                      setTopCurrentTime(topVideoRef.current?.currentTime || 0);
                    }}
                    onPlay={() => {
                      setIsTopPlaying(true);
                      startLoop();
                    }}
                    onPause={() => {
                      setIsTopPlaying(false);
                      stopLoop();
                    }}
                    onSeeked={() => {
                      setTopCurrentTime(topVideoRef.current?.currentTime || 0);
                      drawTopAnalysis();
                    }}
                    onEnded={() => setIsTopPlaying(false)}
                  />
                  <canvas
                    ref={topCanvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  {topTrackingMode !== "auto" && (
                    <div className="absolute inset-0 z-10">
                      {(Object.keys(topAnchors) as TopAnchorKey[])
                        .filter(
                          (key) =>
                            topTrackingMode === "manual" ||
                            key === "topReferenceTop" ||
                            key === "topReferenceBottom"
                        )
                        .map((key) => (
                          <button
                            key={key}
                            type="button"
                            onPointerDown={(event) => {
                              event.currentTarget.setPointerCapture(event.pointerId);
                              updateTopAnchorFromPointer(key, event);
                            }}
                            onPointerMove={(event) => {
                              if (event.buttons !== 1) return;
                              updateTopAnchorFromPointer(key, event);
                            }}
                            onPointerUp={(event) => {
                              event.currentTarget.releasePointerCapture(event.pointerId);
                              drawTopAnalysis();
                            }}
                            className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-red-950 bg-red-200 text-[8px] font-black text-red-950 shadow-[0_0_18px_rgba(248,113,113,0.55)] ring-2 ring-red-200/30"
                            style={getTopAnchorStyle(topAnchors[key])}
                            title={TOP_ANCHOR_LABELS[key]}
                          >
                            {TOP_ANCHOR_LABELS[key].slice(0, 1)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 border-t border-red-300/10 bg-red-950/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-red-100">
                    <Timer size={14} />
                    Control cenital independiente
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleTopPlayback}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-300 text-red-950 transition hover:bg-red-200"
                      title={isTopPlaying ? "Pausar cenital" : "Reproducir cenital"}
                    >
                      {isTopPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => seekTopBy(-1)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/10"
                      title="Retroceder cenital 1 segundo"
                    >
                      <SkipBack size={19} />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepTopFrame(-1)}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/10"
                    >
                      -1 frame
                    </button>
                    <button
                      type="button"
                      onClick={() => stepTopFrame(1)}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/10"
                    >
                      +1 frame
                    </button>
                    <button
                      type="button"
                      onClick={() => seekTopBy(1)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/10"
                      title="Avanzar cenital 1 segundo"
                    >
                      <SkipForward size={19} />
                    </button>

                    <div className="flex flex-wrap rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate.value}
                          type="button"
                          onClick={() => setTopPlaybackRate(rate.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            topPlaybackRate === rate.value
                              ? "bg-red-300 text-red-950"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                          title={
                            rate.value === 1
                              ? "Velocidad normal cenital"
                              : `Camara lenta cenital ${rate.label}`
                          }
                        >
                          {rate.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      <span>{formatTime(topCurrentTime)}</span>
                      <span>{formatTime(topDuration)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={topDuration || 0}
                      step={1 / 120}
                      value={Math.min(topCurrentTime, topDuration || topCurrentTime)}
                      onChange={(event) => seekTopTo(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-red-300"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="tal-chart-card">
              <div className="mb-5 flex items-center gap-3">
                <span className="tal-metric-icon mb-0">
                  <Settings2 size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Configuracion
                  </p>
                  <h3 className="text-2xl font-black">Calibracion del analisis</h3>
                </div>
              </div>

              <div className="grid gap-3">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Modelo de postura
                  </span>
                  <select
                    value={selectedModel}
                    onChange={(event) => {
                      setSelectedModel(event.target.value as PoseModelKey);
                      setConfidence(0);
                      setMetrics([
                        { label: "Linea de hombros", value: "-" },
                        { label: "Linea de cadera", value: "-" },
                        { label: "Brazo de arco", value: "-" },
                        { label: "Brazo de cuerda", value: "-" },
                        { label: "Parado", value: "-" },
                      ]);
                    }}
                    className="tal-input"
                  >
                    {(Object.keys(POSE_MODELS) as PoseModelKey[]).map((key) => (
                      <option key={key} value={key}>
                        {POSE_MODELS[key].label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        Precision activa
                      </p>
                      <p className="mt-1 text-lg font-black text-white">
                        {POSE_MODELS[selectedModel].label}
                      </p>
                    </div>
                    <span
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        selectedModel === "heavy"
                          ? "bg-red-300/15 text-red-100"
                          : selectedModel === "full"
                            ? "bg-emerald-300/15 text-emerald-100"
                            : "bg-cyan-300/15 text-cyan-100"
                      }`}
                    >
                      {isReady ? "Listo" : "Cargando"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-400">
                    {POSE_MODELS[selectedModel].description}
                  </p>
                </div>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Tipo de analisis
                  </span>
                  <select
                    value={analysisMode}
                    onChange={(event) => {
                      setAnalysisMode(event.target.value as AnalysisMode);
                      requestAnimationFrame(analyzeCurrentFrame);
                    }}
                    className="tal-input"
                  >
                    <option value="lateral">Lateral tecnico</option>
                    <option value="front_t">Frontal T</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Brazo de arco
                  </span>
                  <select
                    value={bowArm}
                    onChange={(event) => {
                      setBowArm(event.target.value as "left" | "right");
                      requestAnimationFrame(analyzeCurrentFrame);
                    }}
                    className="tal-input"
                  >
                    <option value="left">Izquierdo</option>
                    <option value="right">Derecho</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-bold leading-6 text-cyan-50">
                  En modo Frontal T, TAL dibuja una linea vertical por el eje
                  corporal y una linea horizontal por el brazo de arco. Si
                  activas referencias, tus lineas manuales quedan como regla de
                  comparacion contra hombros, brazos, manos, cadera, torso y
                  cabeza detectados automaticamente.
                </div>

                {analysisMode === "front_t" && (
                  <div className="rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.07] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
                          Referencia frontal hibrida
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                          Marca vertical, horizontal y punto central. TAL
                          mantiene la deteccion automatica del cuerpo y compara
                          sus trazos contra esta referencia.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={manualAnchorMode}
                          onChange={(event) => {
                            setManualAnchorMode(event.target.checked);
                            setFrontReferenceSaved(false);
                            requestAnimationFrame(analyzeCurrentFrame);
                          }}
                          className="peer sr-only"
                        />
                        <span className="h-7 w-12 rounded-full border border-white/10 bg-slate-800 transition peer-checked:bg-yellow-300" />
                        <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-slate-950" />
                      </label>
                    </div>

                    {manualAnchorMode && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {frontReferenceSaved ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFrontReferenceSaved(false);
                              requestAnimationFrame(analyzeCurrentFrame);
                            }}
                            className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-200 hover:text-slate-950"
                          >
                            Editar referencia
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFrontReferenceSaved(true);
                              requestAnimationFrame(analyzeCurrentFrame);
                            }}
                            className="rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-200 hover:text-slate-950"
                          >
                            Guardar referencia
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetManualAnchors}
                          className="rounded-xl border border-yellow-200/20 bg-yellow-200/10 px-3 py-2 text-xs font-black text-yellow-100 transition hover:bg-yellow-200 hover:text-slate-950"
                        >
                          Reset anclajes
                        </button>
                        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400">
                          {frontReferenceSaved
                            ? "Referencia guardada: analisis activo"
                            : "Arrastra: Superior, Centro, Inferior, Izq, Der"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {analysisMode === "front_t" && (
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-200">
                          Puntos corporales
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                          Define manualmente cabeza, hombros, codos, manos,
                          cadera y pies. Frontal T usara estos puntos para
                          generar la T del cuerpo.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={manualBodyPointMode}
                          onChange={(event) => {
                            setManualBodyPointMode(event.target.checked);
                            setManualBodyPointsSaved(false);
                            setBodyPointOffsets({});
                            requestAnimationFrame(analyzeCurrentFrame);
                          }}
                          className="peer sr-only"
                        />
                        <span className="h-7 w-12 rounded-full border border-white/10 bg-slate-800 transition peer-checked:bg-emerald-300" />
                        <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-slate-950" />
                      </label>
                    </div>

                    {manualBodyPointMode && (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[
                            {
                              value: "assisted",
                              label: "Seguimiento asistido",
                            },
                            { value: "fixed", label: "Base fija" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setBodyPointTrackingMode(
                                  option.value as BodyPointTrackingMode
                                );
                                requestAnimationFrame(analyzeCurrentFrame);
                              }}
                              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                                bodyPointTrackingMode === option.value
                                  ? "border-emerald-200 bg-emerald-300 text-slate-950"
                                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                        {manualBodyPointsSaved ? (
                          <button
                            type="button"
                            onClick={() => {
                              setManualBodyPointsSaved(false);
                              requestAnimationFrame(analyzeCurrentFrame);
                            }}
                            className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-200 hover:text-slate-950"
                          >
                            Editar puntos
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={saveBodyPointsForTracking}
                            className="rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-200 hover:text-slate-950"
                          >
                            Guardar puntos
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetBodyPoints}
                          className="rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-200 hover:text-slate-950"
                        >
                          Reset puntos
                        </button>
                        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400">
                          {manualBodyPointsSaved
                            ? bodyPointTrackingMode === "assisted"
                              ? "Puntos guardados: MediaPipe los sigue con tu correccion"
                              : "Puntos guardados: posicion fija"
                            : "Arrastra los puntos verdes sobre el cuerpo"}
                        </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-purple-300/15 bg-purple-300/[0.07] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-200">
                        Referencias libres
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                        Agrega puntos sin conexion y lineas punto a punto para
                        marcar referencias tecnicas sobre el video.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={technicalReferenceMode}
                        onChange={(event) => {
                          setTechnicalReferenceMode(event.target.checked);
                          requestAnimationFrame(analyzeCurrentFrame);
                        }}
                        className="peer sr-only"
                      />
                      <span className="h-7 w-12 rounded-full border border-white/10 bg-slate-800 transition peer-checked:bg-purple-300" />
                      <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-slate-950" />
                    </label>
                  </div>

                  {technicalReferenceMode && (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={addTechnicalPoint}
                          className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-200 hover:text-slate-950"
                        >
                          Agregar punto
                        </button>
                        <button
                          type="button"
                          onClick={addTechnicalLine}
                          className="rounded-xl border border-purple-200/20 bg-purple-200/10 px-3 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-200 hover:text-slate-950"
                        >
                          Agregar linea
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTechnicalEditMode((current) => !current);
                            requestAnimationFrame(analyzeCurrentFrame);
                          }}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          {technicalEditMode ? "Bloquear edicion" : "Editar"}
                        </button>
                        <button
                          type="button"
                          onClick={resetTechnicalReferences}
                          className="rounded-xl border border-red-200/20 bg-red-200/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-200 hover:text-slate-950"
                        >
                          Limpiar
                        </button>
                      </div>

                      <RangeControl
                        label="Diametro puntos libres"
                        value={technicalPointDiameter}
                        min={6}
                        max={30}
                        step={1}
                        display={`${technicalPointDiameter}px`}
                        onChange={(value) => {
                          setTechnicalPointDiameter(value);
                          requestAnimationFrame(analyzeCurrentFrame);
                        }}
                      />

                      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-400">
                        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          Puntos: {technicalPoints.length}
                        </span>
                        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          Lineas: {technicalLines.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                        Overlay
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        Ajustes visuales y anclajes
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverlaySettings(DEFAULT_OVERLAY_SETTINGS)}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-slate-300 transition hover:bg-white/20 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <RangeControl
                      label="Grosor linea"
                      value={overlaySettings.lineWidth}
                      min={1}
                      max={8}
                      step={0.5}
                      display={`${overlaySettings.lineWidth}px`}
                      onChange={(value) => updateOverlaySetting("lineWidth", value)}
                    />
                    <RangeControl
                      label="Tamano puntos"
                      value={overlaySettings.pointRadius}
                      min={1}
                      max={8}
                      step={0.5}
                      display={`${overlaySettings.pointRadius}px`}
                      onChange={(value) => updateOverlaySetting("pointRadius", value)}
                    />
                    <RangeControl
                      label="Brillo"
                      value={overlaySettings.glow}
                      min={0}
                      max={18}
                      step={1}
                      display={`${overlaySettings.glow}`}
                      onChange={(value) => updateOverlaySetting("glow", value)}
                    />
                    <RangeControl
                      label="Anclaje vertical"
                      value={overlaySettings.verticalOffset}
                      min={-0.18}
                      max={0.18}
                      step={0.01}
                      display={`${Math.round(overlaySettings.verticalOffset * 100)}%`}
                      onChange={(value) => updateOverlaySetting("verticalOffset", value)}
                    />
                    <RangeControl
                      label="Anclaje horizontal"
                      value={overlaySettings.horizontalOffset}
                      min={-0.18}
                      max={0.18}
                      step={0.01}
                      display={`${Math.round(overlaySettings.horizontalOffset * 100)}%`}
                      onChange={(value) => updateOverlaySetting("horizontalOffset", value)}
                    />
                    <RangeControl
                      label="Largo superior"
                      value={overlaySettings.verticalTopOffset}
                      min={0.02}
                      max={0.4}
                      step={0.01}
                      display={`${Math.round(overlaySettings.verticalTopOffset * 100)}%`}
                      onChange={(value) => updateOverlaySetting("verticalTopOffset", value)}
                    />
                    <RangeControl
                      label="Largo inferior"
                      value={overlaySettings.verticalBottomOffset}
                      min={0.02}
                      max={0.25}
                      step={0.01}
                      display={`${Math.round(overlaySettings.verticalBottomOffset * 100)}%`}
                      onChange={(value) => updateOverlaySetting("verticalBottomOffset", value)}
                    />
                    <RangeControl
                      label="Alcance horizontal"
                      value={overlaySettings.horizontalReach}
                      min={0.25}
                      max={1}
                      step={0.01}
                      display={`${Math.round(overlaySettings.horizontalReach * 100)}%`}
                      onChange={(value) => updateOverlaySetting("horizontalReach", value)}
                    />
                  </div>
                </div>

                {topVideoUrl && (
                  <div className="rounded-2xl border border-red-300/15 bg-red-300/[0.07] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-red-200">
                          Plano cenital
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                          Detecta manos y torso con MediaPipe o usa anclajes
                          manuales. La referencia vertical se puede generar y
                          ajustar sobre el eje que quieras comparar.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetTopAnchors}
                        className="rounded-xl border border-red-200/20 bg-red-200/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-200 hover:text-slate-950"
                      >
                        Reset
                      </button>
                    </div>

                    <label className="mt-4 grid gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Tracking cenital
                      </span>
                      <select
                        value={topTrackingMode}
                        onChange={(event) => {
                          setTopTrackingMode(event.target.value as TopTrackingMode);
                          topSmoothedLandmarksRef.current = null;
                          lastTopValidLandmarksAtRef.current = 0;
                          requestAnimationFrame(drawTopAnalysis);
                        }}
                        className="tal-input"
                      >
                        <option value="hybrid">Hibrido: manos/torso auto + referencia vertical</option>
                        <option value="auto">Automatico: manos/torso + referencia guardada</option>
                        <option value="manual">Manual: manos, torso y referencia editables</option>
                      </select>
                    </label>

                    <div className="mt-3 rounded-2xl border border-red-200/15 bg-red-950/20 p-3 text-xs font-bold leading-5 text-red-50">
                      Recomendado: Hibrido. MediaPipe sigue munecas y torso; tu
                      ajustas la referencia vertical para comparar la linea de
                      cuerda-arco y la orientacion del torso.
                    </div>

                    <button
                      type="button"
                      onClick={generateTopVerticalReference}
                      className="mt-3 w-full rounded-xl border border-red-200/20 bg-red-200/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-200 hover:text-slate-950"
                    >
                      Generar referencia vertical
                    </button>

                    <div className="mt-4 grid gap-2">
                      {(Object.keys(TOP_ANCHOR_LABELS) as TopAnchorKey[]).map(
                        (key) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-400"
                          >
                            <span>{TOP_ANCHOR_LABELS[key]}</span>
                            <span className="text-red-100">
                              {Math.round(topAnchors[key].x * 100)}% /{" "}
                              {Math.round(topAnchors[key].y * 100)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="tal-chart-card">
              <div className="mb-4 flex items-center gap-3">
                <span className="tal-metric-icon mb-0">
                  <Target size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Guia de captura
                  </p>
                  <h3 className="text-2xl font-black">Mejor lectura corporal</h3>
                </div>
              </div>
              <div className="grid gap-3 text-sm font-bold leading-6 text-slate-400">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <span className="text-cyan-200">Lateral:</span> camara fija,
                  cuerpo completo y lente a la altura del pecho/cadera.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <span className="text-cyan-200">Frontal:</span> arquero
                  centrado, hombros visibles y sin contraluz.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <span className="text-red-100">Cenital:</span> usa los
                  anclajes manuales; desde arriba la pose automatica es menos
                  confiable.
                </div>
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4 text-emerald-50">
                  Ideal: 60 fps, buena luz, ropa que contraste y un solo
                  arquero por video.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard
                icon={Gauge}
                title="Confianza"
                value={`${confidence}%`}
                tone={confidence >= 70 ? "text-emerald-300" : "text-yellow-200"}
              />
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  icon={metric.label === "Parado" ? Ruler : Crosshair}
                  title={metric.label}
                  value={metric.value}
                  tone={metric.tone}
                />
              ))}
              {topVideoUrl &&
                topMetrics.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    icon={Activity}
                    title={metric.label}
                    value={metric.value}
                    tone={metric.tone}
                  />
                ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PhasePill({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
          <Icon size={16} />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  tone = "text-cyan-300",
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="tal-metric-card">
      <span className="tal-metric-icon">
        <Icon size={20} />
      </span>
      <p className="tal-metric-label">{title}</p>
      <p className={`relative z-10 mt-2 text-3xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-300"
      />
    </label>
  );
}
