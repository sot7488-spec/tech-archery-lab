"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Camera,
  Crosshair,
  FileVideo,
  Gauge,
  Loader2,
  Ruler,
  ScanLine,
  ShieldCheck,
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

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const PLAYBACK_RATES = [
  { label: "1x", value: 1 },
  { label: "-2x", value: 0.5 },
  { label: "-4x", value: 0.25 },
  { label: "-8x", value: 0.125 },
  { label: "-16x", value: 0.0625 },
];

const LANDMARK_SMOOTHING = 0.38;
const LANDMARK_HOLD_MS = 650;
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

function normalizedPoint(landmark: Landmark) {
  return {
    x: landmark.x,
    y: landmark.y,
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

function smoothLandmarks(
  previous: Landmark[] | null,
  next: Landmark[],
  factor = LANDMARK_SMOOTHING
) {
  if (!previous || previous.length !== next.length) return next;

  return next.map((landmark, index) => {
    const previousLandmark = previous[index];
    if (!previousLandmark) return landmark;

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
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedLandmarksRef = useRef<Landmark[] | null>(null);
  const lastValidLandmarksAtRef = useRef(0);

  const [videoUrl, setVideoUrl] = useState("");
  const [modelStatus, setModelStatus] = useState("Cargando modelo de postura...");
  const [isReady, setIsReady] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("lateral");
  const [bowArm, setBowArm] = useState<"left" | "right">("left");
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(
    DEFAULT_OVERLAY_SETTINGS
  );
  const [manualAnchorMode, setManualAnchorMode] = useState(false);
  const [manualAnchors, setManualAnchors] = useState<ManualAnchors>(
    DEFAULT_MANUAL_ANCHORS
  );
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Linea de hombros", value: "-" },
    { label: "Linea de cadera", value: "-" },
    { label: "Brazo de arco", value: "-" },
    { label: "Brazo de cuerda", value: "-" },
    { label: "Parado", value: "-" },
  ]);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          WASM_URL
        );
        const landmarker = await vision.PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsReady(true);
        setModelStatus("Modelo listo. Carga un video lateral.");
      } catch (error) {
        console.error(error);
        setModelStatus("No se pudo cargar MediaPipe. Revisa conexion a internet.");
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close?.();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    function handleResize() {
      resizeCanvas();
      analyzeCurrentFrame();
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => analyzeCurrentFrame());

    return () => cancelAnimationFrame(frameId);
  }, [analysisMode, bowArm, overlaySettings, manualAnchorMode, manualAnchors]);

  function updateOverlaySetting(key: keyof OverlaySettings, value: number) {
    setOverlaySettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetManualAnchors() {
    setManualAnchors(DEFAULT_MANUAL_ANCHORS);
  }

  function handleVideoUpload(file: File | null) {
    if (!file) return;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
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
    smoothedLandmarksRef.current = null;
    lastValidLandmarksAtRef.current = 0;
  }

  function resizeCanvas() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
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
      lastLandmarks && now - lastValidLandmarksAtRef.current <= LANDMARK_HOLD_MS;

    if (shouldHoldLast) {
      drawAnalysis(lastLandmarks, true);
      return;
    }

    smoothedLandmarksRef.current = null;
    drawAnalysis([], false);
  }

  function startLoop() {
    const loop = () => {
      analyzeCurrentFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyzeCurrentFrame();
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

    if (analysisMode === "front_t" && manualAnchorMode) {
      drawManualFrontTAnalysis(ctx, videoRect, isHeldFrame);
      return;
    }

    if (!landmarks.length) {
      setConfidence(0);
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
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
      LANDMARKS.leftAnkle,
      LANDMARKS.rightAnkle,
      ...bowArmIndexes,
      ...stringArmIndexes,
    ];

    const visibility = getVisibility(landmarks, needed);
    setConfidence(isHeldFrame ? Math.max(0, visibility - 15) : visibility);

    if (analysisMode === "front_t") {
      drawFrontTAnalysis(ctx, videoRect, landmarks, needed, isHeldFrame);
      return;
    }

    const heldOpacity = isHeldFrame ? 0.68 : 1;

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
    const verticalCenterX =
      videoRect.x +
      ((shoulderCenter.x + hipCenter.x + ankleCenter.x) / 3) * videoRect.width +
      overlaySettings.verticalOffset * videoRect.width;
    const verticalTop =
      videoRect.y +
      Math.max(0.02, shoulderCenter.y - overlaySettings.verticalTopOffset) *
        videoRect.height;
    const verticalBottom =
      videoRect.y +
      Math.min(0.98, ankleCenter.y + overlaySettings.verticalBottomOffset) *
        videoRect.height;
    const bowShoulderPoint = toPoint(bowShoulder, videoRect);
    const bowWristPoint = toPoint(bowWrist, videoRect);
    const horizontalAngle = lineAngle(normalizedPoint(bowShoulder), normalizedPoint(bowWrist));
    const horizontalDeviation = Number(
      Math.min(Math.abs(horizontalAngle), Math.abs(180 - Math.abs(horizontalAngle))).toFixed(1)
    );
    const slope =
      (bowWristPoint.y - bowShoulderPoint.y) /
      Math.max(1, bowWristPoint.x - bowShoulderPoint.x);
    const horizontalStart = (1 - overlaySettings.horizontalReach) / 2;
    const horizontalEnd = 1 - horizontalStart;
    const horizontalBaseY =
      bowShoulderPoint.y + overlaySettings.horizontalOffset * videoRect.height;
    const horizontalFrom = {
      x: videoRect.x + videoRect.width * horizontalStart,
      y:
        horizontalBaseY +
        slope *
          (videoRect.x + videoRect.width * horizontalStart - bowShoulderPoint.x),
    };
    const horizontalTo = {
      x: videoRect.x + videoRect.width * horizontalEnd,
      y:
        horizontalBaseY +
        slope *
          (videoRect.x + videoRect.width * horizontalEnd - bowShoulderPoint.x),
    };
    const bodyDeviation = shoulderWidth
      ? Number((Math.abs(shoulderCenter.x - hipCenter.x) / shoulderWidth * 100).toFixed(1))
      : 0;
    const shoulderTilt = absTilt(leftShoulder, rightShoulder);
    const hipTilt = absTilt(leftHip, rightHip);
    const stanceWidth = distance(leftAnkle, rightAnkle);
    const stanceRatio = shoulderWidth
      ? Number((stanceWidth / shoulderWidth).toFixed(2))
      : 0;
    const heldOpacity = isHeldFrame ? 0.7 : 1;

    ctx.save();
    ctx.globalAlpha = heldOpacity;
    drawFreeLine(
      ctx,
      { x: verticalCenterX, y: verticalTop },
      { x: verticalCenterX, y: verticalBottom },
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

    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [LANDMARKS.leftShoulder, LANDMARKS.rightShoulder],
      "#fde047",
      Math.max(2, overlaySettings.lineWidth - 1)
    );
    drawSegment(
      ctx,
      videoRect,
      landmarks,
      [bowArm === "left" ? LANDMARKS.leftShoulder : LANDMARKS.rightShoulder,
       bowArm === "left" ? LANDMARKS.leftElbow : LANDMARKS.rightElbow,
       bowArm === "left" ? LANDMARKS.leftWrist : LANDMARKS.rightWrist],
      "#facc15",
      Math.max(2, overlaySettings.lineWidth - 1)
    );

    needed.forEach((index) => {
      const landmark = landmarks[index];
      if (landmark) {
        drawPoint(
          ctx,
          videoRect,
          landmark,
          "#fde047",
          overlaySettings.pointRadius,
          overlaySettings.glow
        );
      }
    });
    ctx.restore();

    setMetrics([
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
    ]);
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
    const heldOpacity = isHeldFrame ? 0.7 : 1;
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
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="tal-hero-panel p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
                TAL Video Analysis
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight tal-text-glow md:text-6xl">
                Video analisis
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400 md:text-base">
                Detecta automaticamente alineacion lateral o frontal del arquero:
                hombros, brazo de arco, brazo de cuerda, cadera, parado y eje T.
              </p>
            </div>

            <div className="tal-metric-card min-w-[220px]">
              <span className="tal-metric-icon">
                {isReady ? <ShieldCheck size={20} /> : <Loader2 className="animate-spin" size={20} />}
              </span>
              <p className="tal-metric-label">Estado</p>
              <p className="relative z-10 mt-2 text-sm font-black text-cyan-100">
                {modelStatus}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="tal-chart-card">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="tal-metric-icon mb-0">
                  <FileVideo size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Video tecnico
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Overlay tecnico</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {videoUrl && (
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
                )}

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300">
                  <Upload size={17} />
                  Cargar video
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) =>
                      handleVideoUpload(event.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-black shadow-[0_0_60px_rgba(34,211,238,0.10)]">
              {videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    className="block max-h-[68vh] w-full bg-black object-contain"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackRate;
                      }
                      resizeCanvas();
                      analyzeCurrentFrame();
                    }}
                    onPlay={startLoop}
                    onPause={stopLoop}
                    onSeeked={analyzeCurrentFrame}
                  />
                  <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  {analysisMode === "front_t" && manualAnchorMode && (
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
                            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-300 text-[9px] font-black text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                            style={getAnchorStyle(manualAnchors[key])}
                            title={MANUAL_ANCHOR_LABELS[key]}
                          >
                            {MANUAL_ANCHOR_LABELS[key].slice(0, 1)}
                          </button>
                        )
                      )}
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
          </div>

          <aside className="space-y-5">
            <div className="tal-chart-card">
              <div className="mb-5 flex items-center gap-3">
                <span className="tal-metric-icon mb-0">
                  <ScanLine size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Configuracion
                  </p>
                  <h3 className="text-2xl font-black">Vista lateral</h3>
                </div>
              </div>

              <div className="grid gap-3">
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
                  corporal y una linea horizontal por el brazo de arco, como en
                  tu referencia. Valida que el overlay amarillo coincida con el
                  brazo que sostiene el arco.
                </div>

                {analysisMode === "front_t" && (
                  <div className="rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.07] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
                          Anclajes manuales
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-400">
                          Activa puntos arrastrables para definir manualmente la
                          posicion de la cruz T. Util cuando el video tiene
                          perspectiva, arco tapando articulaciones o landmarks
                          inestables.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={manualAnchorMode}
                          onChange={(event) => {
                            setManualAnchorMode(event.target.checked);
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
                        <button
                          type="button"
                          onClick={resetManualAnchors}
                          className="rounded-xl border border-yellow-200/20 bg-yellow-200/10 px-3 py-2 text-xs font-black text-yellow-100 transition hover:bg-yellow-200 hover:text-slate-950"
                        >
                          Reset anclajes
                        </button>
                        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-400">
                          Arrastra: Superior, Centro, Inferior, Izq, Der
                        </span>
                      </div>
                    )}
                  </div>
                )}

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
            </div>
          </aside>
        </section>
      </div>
    </main>
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
