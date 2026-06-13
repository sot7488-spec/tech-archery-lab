export type PoseLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PosePoint = {
  x: number;
  y: number;
};

export type PoseFrameSample = {
  time: number;
  nose: PosePoint;
  leftShoulder: PosePoint;
  rightShoulder: PosePoint;
  leftElbow: PosePoint;
  rightElbow: PosePoint;
  leftWrist: PosePoint;
  rightWrist: PosePoint;
  leftHip: PosePoint;
  rightHip: PosePoint;
  leftAnkle: PosePoint;
  rightAnkle: PosePoint;
};

export const POSE_LANDMARKS = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftAnkle: 27,
  rightAnkle: 28,
};

export const SKELETON_SEGMENTS: Array<[number, number]> = [
  [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder],
  [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.leftElbow],
  [POSE_LANDMARKS.leftElbow, POSE_LANDMARKS.leftWrist],
  [POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.rightElbow],
  [POSE_LANDMARKS.rightElbow, POSE_LANDMARKS.rightWrist],
  [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.leftHip],
  [POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.rightHip],
  [POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip],
  [POSE_LANDMARKS.leftHip, POSE_LANDMARKS.leftAnkle],
  [POSE_LANDMARKS.rightHip, POSE_LANDMARKS.rightAnkle],
];

function point(landmarks: PoseLandmark[], index: number): PosePoint {
  return {
    x: landmarks[index]?.x ?? 0,
    y: landmarks[index]?.y ?? 0,
  };
}

export function createFrameSample(
  landmarks: PoseLandmark[],
  time: number
): PoseFrameSample | null {
  const required = Object.values(POSE_LANDMARKS);
  const hasRequired = required.every((index) => {
    const landmark = landmarks[index];
    return landmark && (landmark.visibility ?? 1) >= 0.15;
  });

  if (!hasRequired) return null;

  return {
    time,
    nose: point(landmarks, POSE_LANDMARKS.nose),
    leftShoulder: point(landmarks, POSE_LANDMARKS.leftShoulder),
    rightShoulder: point(landmarks, POSE_LANDMARKS.rightShoulder),
    leftElbow: point(landmarks, POSE_LANDMARKS.leftElbow),
    rightElbow: point(landmarks, POSE_LANDMARKS.rightElbow),
    leftWrist: point(landmarks, POSE_LANDMARKS.leftWrist),
    rightWrist: point(landmarks, POSE_LANDMARKS.rightWrist),
    leftHip: point(landmarks, POSE_LANDMARKS.leftHip),
    rightHip: point(landmarks, POSE_LANDMARKS.rightHip),
    leftAnkle: point(landmarks, POSE_LANDMARKS.leftAnkle),
    rightAnkle: point(landmarks, POSE_LANDMARKS.rightAnkle),
  };
}

export function midpoint(a: PosePoint, b: PosePoint): PosePoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function distance(a: PosePoint, b: PosePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleDeg(a: PosePoint, b: PosePoint) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

export function jointAngle(a: PosePoint, b: PosePoint, c: PosePoint) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;

  return Math.atan2(Math.abs(cross), dot) * (180 / Math.PI);
}

export function range(values: number[]) {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function normalizedMovement(values: number[], reference: number) {
  if (!reference) return 0;
  return (range(values) / reference) * 100;
}

export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  rect: { x: number; y: number; width: number; height: number }
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#22d3ee";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 8;

  SKELETON_SEGMENTS.forEach(([fromIndex, toIndex]) => {
    const from = landmarks[fromIndex];
    const to = landmarks[toIndex];
    if (!from || !to) return;

    ctx.beginPath();
    ctx.moveTo(rect.x + from.x * rect.width, rect.y + from.y * rect.height);
    ctx.lineTo(rect.x + to.x * rect.width, rect.y + to.y * rect.height);
    ctx.stroke();
  });

  Object.values(POSE_LANDMARKS).forEach((index) => {
    const landmark = landmarks[index];
    if (!landmark) return;

    ctx.fillStyle = "#67e8f9";
    ctx.strokeStyle = "#020617";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      rect.x + landmark.x * rect.width,
      rect.y + landmark.y * rect.height,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}
