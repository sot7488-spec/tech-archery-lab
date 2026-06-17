export type CameraViewV3 = "lateral" | "frontal" | "superior";
export type MetricLevelV3 = "correct" | "warning" | "error";

export type LandmarkV3 = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PointV3 = {
  x: number;
  y: number;
  z?: number;
};

export type FrameV3 = {
  time: number;
  landmarks: LandmarkV3[];
};

export type BiomechanicMetricV3 = {
  key: string;
  label: string;
  value: number;
  unit: string;
  score: number;
  level: MetricLevelV3;
  message: string;
  weight: number;
};

export type PhaseV3 =
  | "stance"
  | "set"
  | "set_up"
  | "draw"
  | "anchor"
  | "transfer"
  | "expansion"
  | "release"
  | "follow_through";

export type BiomechanicResultV3 = {
  score: number;
  anchorTime: number;
  phase: PhaseV3;
  metrics: BiomechanicMetricV3[];
  errors: string[];
};

export const LM = {
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
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
};

export const BIOMECHANIC_SEGMENTS_V3: Array<[number, number]> = [
  [LM.leftShoulder, LM.rightShoulder],
  [LM.leftShoulder, LM.leftElbow],
  [LM.leftElbow, LM.leftWrist],
  [LM.rightShoulder, LM.rightElbow],
  [LM.rightElbow, LM.rightWrist],
  [LM.leftShoulder, LM.leftHip],
  [LM.rightShoulder, LM.rightHip],
  [LM.leftHip, LM.rightHip],
  [LM.leftHeel, LM.leftFoot],
  [LM.rightHeel, LM.rightFoot],
];

function point(landmarks: LandmarkV3[], index: number): PointV3 {
  const landmark = landmarks[index];
  return { x: landmark?.x ?? 0, y: landmark?.y ?? 0, z: landmark?.z ?? 0 };
}

function distance(a: PointV3, b: PointV3) {
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(a.x - b.x, a.y - b.y, dz);
}

function angle(a: PointV3, b: PointV3, c: PointV3) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.atan2(Math.abs(cross), dot) * (180 / Math.PI);
}

function lineAngle(a: PointV3, b: PointV3) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function pointLineDistance(pointValue: PointV3, lineA: PointV3, lineB: PointV3) {
  const numerator = Math.abs(
    (lineB.y - lineA.y) * pointValue.x -
      (lineB.x - lineA.x) * pointValue.y +
      lineB.x * lineA.y -
      lineB.y * lineA.x
  );
  const denominator = Math.hypot(lineB.y - lineA.y, lineB.x - lineA.x);
  return denominator ? numerator / denominator : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreAngleTo180(value: number, minAcceptable: number) {
  if (value >= 180) return 100;
  if (value <= minAcceptable) return 45;
  return clampScore(45 + ((value - minAcceptable) / (180 - minAcceptable)) * 55);
}

function levelFromScore(score: number): MetricLevelV3 {
  if (score >= 85) return "correct";
  if (score >= 68) return "warning";
  return "error";
}

function metric(
  key: string,
  label: string,
  value: number,
  unit: string,
  score: number,
  weight: number,
  message: string
): BiomechanicMetricV3 {
  return {
    key,
    label,
    value: Number(value.toFixed(1)),
    unit,
    score: clampScore(score),
    level: levelFromScore(score),
    weight,
    message,
  };
}

export function findAnchorFrameV3(frames: FrameV3[], bowArm: "left" | "right") {
  if (!frames.length) return null;

  let best = frames[0];
  let bestDistance = -Infinity;

  frames.forEach((frame) => {
    const bowShoulder = point(
      frame.landmarks,
      bowArm === "left" ? LM.leftShoulder : LM.rightShoulder
    );
    const stringWrist = point(
      frame.landmarks,
      bowArm === "left" ? LM.rightWrist : LM.leftWrist
    );
    const drawDistance = distance(bowShoulder, stringWrist);

    if (drawDistance > bestDistance) {
      best = frame;
      bestDistance = drawDistance;
    }
  });

  return best;
}

export function analyzeBiomechanicsV3(
  frames: FrameV3[],
  view: CameraViewV3,
  bowArm: "left" | "right"
): BiomechanicResultV3 {
  const anchor = findAnchorFrameV3(frames, bowArm);

  if (!anchor) {
    return {
      score: 0,
      anchorTime: 0,
      phase: "stance",
      metrics: [],
      errors: ["No hay suficientes landmarks para calcular metricas."],
    };
  }

  const landmarks = anchor.landmarks;
  const bowShoulder = point(
    landmarks,
    bowArm === "left" ? LM.leftShoulder : LM.rightShoulder
  );
  const bowElbow = point(landmarks, bowArm === "left" ? LM.leftElbow : LM.rightElbow);
  const bowWrist = point(landmarks, bowArm === "left" ? LM.leftWrist : LM.rightWrist);
  const stringShoulder = point(
    landmarks,
    bowArm === "left" ? LM.rightShoulder : LM.leftShoulder
  );
  const stringElbow = point(
    landmarks,
    bowArm === "left" ? LM.rightElbow : LM.leftElbow
  );
  const stringWrist = point(
    landmarks,
    bowArm === "left" ? LM.rightWrist : LM.leftWrist
  );
  const nose = point(landmarks, LM.nose);
  const ear = point(landmarks, bowArm === "left" ? LM.rightEar : LM.leftEar);
  const leftShoulder = point(landmarks, LM.leftShoulder);
  const rightShoulder = point(landmarks, LM.rightShoulder);
  const leftHip = point(landmarks, LM.leftHip);
  const rightHip = point(landmarks, LM.rightHip);
  const leftFoot = point(landmarks, LM.leftFoot);
  const rightFoot = point(landmarks, LM.rightFoot);

  const shoulderWidth = Math.max(0.01, distance(leftShoulder, rightShoulder));
  const bowArmAngle = angle(bowShoulder, bowElbow, bowWrist);
  const forceLineDistance =
    (pointLineDistance(stringElbow, bowShoulder, stringShoulder) / shoulderWidth) *
    100;
  const arrowPlaneAngle = Math.abs(
    lineAngle(stringShoulder, stringElbow) - lineAngle(bowShoulder, bowWrist)
  );
  const stringElbowDelta =
    ((stringShoulder.y - stringElbow.y) / shoulderWidth) * 100;
  const headAngle = Math.abs(90 - Math.abs(lineAngle(ear, nose)));
  const shoulderRotation = Math.abs(lineAngle(leftShoulder, rightShoulder));
  const footLineAngle = Math.abs(lineAngle(leftFoot, rightFoot));
  const trunkCenterX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
  const footCenterX = (leftFoot.x + rightFoot.x) / 2;
  const weightShift = Math.abs(((trunkCenterX - footCenterX) / shoulderWidth) * 100);

  const metrics: BiomechanicMetricV3[] = [];

  if (view === "superior") {
    metrics.push(
      metric(
        "shoulder_rotation",
        "Rotacion de hombros",
        shoulderRotation,
        "deg",
        shoulderRotation <= 5 ? 100 : shoulderRotation <= 10 ? 78 : 52,
        25,
        shoulderRotation > 10 ? "Rotacion excesiva de hombros." : "Rotacion de hombros controlada."
      ),
      metric(
        "foot_line",
        "Linea de pies",
        footLineAngle,
        "deg",
        footLineAngle <= 6 ? 92 : footLineAngle <= 14 ? 74 : 55,
        15,
        footLineAngle <= 6 ? "Base square estable." : "Revisar base open/closed."
      ),
      metric(
        "shot_line",
        "Linea de tiro",
        Math.abs(shoulderRotation - footLineAngle),
        "deg",
        Math.abs(shoulderRotation - footLineAngle) <= 3
          ? 100
          : Math.abs(shoulderRotation - footLineAngle) <= 6
            ? 80
            : 55,
        30,
        "Comparacion entre linea de hombros y linea de tiro."
      ),
      metric(
        "weight_distribution",
        "Distribucion del peso",
        weightShift,
        "%",
        weightShift <= 5 ? 100 : weightShift <= 12 ? 76 : 50,
        20,
        weightShift > 12 ? "Centro de masa lateral inestable." : "Distribucion visual estable."
      ),
      metric(
        "real_draw",
        "Apertura real estimada",
        distance(bowShoulder, stringWrist) / shoulderWidth,
        "x hombros",
        82,
        10,
        "Estimacion relativa; comparar con draw length real del perfil."
      )
    );
  } else {
    metrics.push(
      metric(
        "t_posture",
        "Postura en T",
        bowArmAngle,
        "deg",
        scoreAngleTo180(bowArmAngle, 165),
        15,
        bowArmAngle < 170 ? "Brazo de arco colapsado." : "Brazo de arco extendido."
      ),
      metric(
        "force_line",
        "Linea de fuerza",
        forceLineDistance,
        "%",
        forceLineDistance <= 3 ? 100 : forceLineDistance <= 6 ? 78 : 48,
        25,
        forceLineDistance > 6
          ? "El codo de cuerda se encuentra fuera de la linea de fuerza."
          : "Codo de cuerda cercano a la linea de fuerza."
      ),
      metric(
        "shoulder_elbow_arrow",
        "Alineacion hombro-codo-flecha",
        arrowPlaneAngle,
        "deg",
        arrowPlaneAngle <= 10 ? 100 : arrowPlaneAngle <= 20 ? 76 : 45,
        20,
        arrowPlaneAngle > 20
          ? "Codo de cuerda fuera del plano de la flecha."
          : "Plano de flecha aceptable."
      ),
      metric(
        "bow_arm_angle",
        "Angulo brazo de arco",
        bowArmAngle,
        "deg",
        scoreAngleTo180(bowArmAngle, 165),
        15,
        bowArmAngle < 165 ? "Brazo flexionado." : "Angulo del brazo de arco aceptable."
      ),
      metric(
        "string_elbow_position",
        "Posicion codo cuerda",
        stringElbowDelta,
        "%",
        stringElbowDelta >= 2 && stringElbowDelta <= 5
          ? 100
          : stringElbowDelta > 0 && stringElbowDelta <= 8
            ? 75
            : 48,
        15,
        stringElbowDelta < 0
          ? "Falta activacion dorsal: codo por debajo del hombro."
          : "Altura de codo de cuerda revisada."
      ),
      metric(
        "head_string_position",
        "Cabeza respecto a cuerda",
        headAngle,
        "deg",
        headAngle <= 5 ? 100 : headAngle <= 10 ? 78 : 50,
        10,
        headAngle > 10 ? "Inclinacion excesiva de cabeza." : "Cabeza estable."
      )
    );
  }

  const weightedScore =
    metrics.reduce((sum, item) => sum + item.score * item.weight, 0) /
    metrics.reduce((sum, item) => sum + item.weight, 0);
  const errors = metrics
    .filter((item) => item.level === "error")
    .map((item) => item.message);

  return {
    score: clampScore(weightedScore),
    anchorTime: anchor.time,
    phase: "anchor",
    metrics,
    errors,
  };
}

export function drawBiomechanicOverlayV3(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkV3[],
  rect: { x: number; y: number; width: number; height: number },
  bowArm: "left" | "right"
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#22d3ee";
  ctx.strokeStyle = "#22d3ee";

  BIOMECHANIC_SEGMENTS_V3.forEach(([a, b]) => {
    const from = landmarks[a];
    const to = landmarks[b];
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(rect.x + from.x * rect.width, rect.y + from.y * rect.height);
    ctx.lineTo(rect.x + to.x * rect.width, rect.y + to.y * rect.height);
    ctx.stroke();
  });

  const bowShoulderIndex = bowArm === "left" ? LM.leftShoulder : LM.rightShoulder;
  const stringShoulderIndex = bowArm === "left" ? LM.rightShoulder : LM.leftShoulder;
  const stringElbowIndex = bowArm === "left" ? LM.rightElbow : LM.leftElbow;

  const biomechanicLines: Array<[number, number, string]> = [
    [bowShoulderIndex, stringShoulderIndex, "#34d399"],
    [stringShoulderIndex, stringElbowIndex, "#facc15"],
  ];

  biomechanicLines.forEach(([a, b, color]) => {
    const from = landmarks[a];
    const to = landmarks[b];
    if (!from || !to) return;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(rect.x + from.x * rect.width, rect.y + from.y * rect.height);
    ctx.lineTo(rect.x + to.x * rect.width, rect.y + to.y * rect.height);
    ctx.stroke();
  });

  Object.values(LM).forEach((index) => {
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
