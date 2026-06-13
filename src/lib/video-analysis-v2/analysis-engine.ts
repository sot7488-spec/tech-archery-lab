import {
  DEFAULT_VIDEO_ANALYSIS_THRESHOLDS,
  type MetricStatus,
  type VideoViewType,
  getMetricStatus,
  scoreFromStatus,
} from "./thresholds";
import {
  angleDeg,
  distance,
  jointAngle,
  midpoint,
  normalizedMovement,
  type PoseFrameSample,
} from "./pose-utils";

export type AnalysisMetric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  status: MetricStatus;
  description: string;
};

export type VideoAnalysisResult = {
  score: number;
  metrics: AnalysisMetric[];
  observations: string[];
  recommendations: string[];
  strengths: string[];
  corrections: string[];
};

function round(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function pushMetric(
  metrics: AnalysisMetric[],
  metric: Omit<AnalysisMetric, "value"> & { value: number }
) {
  metrics.push({
    ...metric,
    value: round(metric.value),
  });
}

export function analyzePoseSamples(
  samples: PoseFrameSample[],
  viewType: VideoViewType,
  bowArm: "left" | "right"
): VideoAnalysisResult {
  const latest = samples[samples.length - 1];

  if (!latest || samples.length < 3) {
    return {
      score: 0,
      metrics: [],
      observations: ["Carga un video y reproduce algunos frames para iniciar el analisis."],
      recommendations: [
        "Usa una toma estable, cuerpo completo visible y buena iluminacion.",
      ],
      strengths: [],
      corrections: ["Aun no hay suficientes frames detectados."],
    };
  }

  const thresholds = DEFAULT_VIDEO_ANALYSIS_THRESHOLDS;
  const metrics: AnalysisMetric[] = [];
  const shoulderWidth = distance(latest.leftShoulder, latest.rightShoulder);
  const hipCenter = midpoint(latest.leftHip, latest.rightHip);
  const shoulderCenter = midpoint(latest.leftShoulder, latest.rightShoulder);
  const ankleCenter = midpoint(latest.leftAnkle, latest.rightAnkle);
  const bowShoulder = bowArm === "left" ? latest.leftShoulder : latest.rightShoulder;
  const bowElbow = bowArm === "left" ? latest.leftElbow : latest.rightElbow;
  const bowWrist = bowArm === "left" ? latest.leftWrist : latest.rightWrist;
  const stringShoulder =
    bowArm === "left" ? latest.rightShoulder : latest.leftShoulder;
  const stringElbow = bowArm === "left" ? latest.rightElbow : latest.leftElbow;
  const stringWrist = bowArm === "left" ? latest.rightWrist : latest.leftWrist;

  const shoulderTilt = Math.abs(angleDeg(latest.leftShoulder, latest.rightShoulder));
  const trunkLean = Math.abs(90 - Math.abs(angleDeg(hipCenter, shoulderCenter)));
  const headMovement = normalizedMovement(
    samples.map((sample) => sample.nose.x),
    shoulderWidth
  );
  const bowArmMovement = normalizedMovement(
    samples.map((sample) =>
      bowArm === "left" ? sample.leftWrist.y : sample.rightWrist.y
    ),
    shoulderWidth
  );
  const bowArmAlignment = Math.abs(180 - jointAngle(bowShoulder, bowElbow, bowWrist));
  const stringArmAngle = jointAngle(stringShoulder, stringElbow, stringWrist);
  const releaseMovement = normalizedMovement(
    samples.slice(-18).map((sample) =>
      bowArm === "left" ? sample.rightWrist.x : sample.leftWrist.x
    ),
    shoulderWidth
  );
  const centerConsistency = normalizedMovement(
    samples.map((sample) => midpoint(sample.leftHip, sample.rightHip).x),
    shoulderWidth
  );

  pushMetric(metrics, {
    key: "shoulder_tilt",
    label: "Inclinacion de hombros",
    value: shoulderTilt,
    unit: "deg",
    status: getMetricStatus(
      shoulderTilt,
      thresholds.shoulderTiltGood,
      thresholds.shoulderTiltWarning
    ),
    description: "Diferencia angular entre hombro izquierdo y derecho.",
  });

  pushMetric(metrics, {
    key: "trunk_lean",
    label: "Inclinacion de tronco",
    value: trunkLean,
    unit: "deg",
    status: getMetricStatus(
      trunkLean,
      thresholds.trunkLeanGood,
      thresholds.trunkLeanWarning
    ),
    description: "Relacion vertical entre cadera y centro de hombros.",
  });

  pushMetric(metrics, {
    key: "head_stability",
    label: "Estabilidad de cabeza",
    value: headMovement,
    unit: "%",
    status: getMetricStatus(
      headMovement,
      thresholds.headMovementGood,
      thresholds.headMovementWarning
    ),
    description: "Movimiento lateral relativo de la nariz durante la muestra.",
  });

  pushMetric(metrics, {
    key: "bow_arm_stability",
    label: "Estabilidad brazo de arco",
    value: bowArmMovement,
    unit: "%",
    status: getMetricStatus(
      bowArmMovement,
      thresholds.bowArmMovementGood,
      thresholds.bowArmMovementWarning
    ),
    description: "Variacion vertical relativa de la mano de arco.",
  });

  pushMetric(metrics, {
    key: "bow_arm_alignment",
    label: "Alineacion hombro-codo-muneca",
    value: bowArmAlignment,
    unit: "deg",
    status: getMetricStatus(
      bowArmAlignment,
      thresholds.alignmentGood,
      thresholds.alignmentWarning
    ),
    description: "Desviacion del brazo de arco respecto a una linea extendida.",
  });

  pushMetric(metrics, {
    key: "release_movement",
    label: "Movimiento post-suelta",
    value: releaseMovement,
    unit: "%",
    status: getMetricStatus(
      releaseMovement,
      thresholds.releaseMovementGood,
      thresholds.releaseMovementWarning
    ),
    description: "Movimiento reciente de mano de cuerda como referencia de follow-through.",
  });

  pushMetric(metrics, {
    key: "frame_consistency",
    label: "Consistencia entre frames",
    value: centerConsistency,
    unit: "%",
    status: getMetricStatus(
      centerConsistency,
      thresholds.consistencyGood,
      thresholds.consistencyWarning
    ),
    description: "Variacion del centro de cadera durante la muestra.",
  });

  const viewObservations: Record<VideoViewType, string> = {
    frontal:
      "Vista frontal: prioriza simetria corporal, nivel de hombros y estabilidad lateral.",
    lateral:
      "Vista lateral: revisa postura vertical, cabeza y continuidad de cuerda en follow-through.",
    superior:
      "Vista superior: usa hombros, codo de cuerda y linea de tiro como referencias principales.",
  };
  const observations = [viewObservations[viewType]];
  const recommendations: string[] = [];
  const strengths: string[] = [];
  const corrections: string[] = [];

  metrics.forEach((metric) => {
    if (metric.status === "good") {
      strengths.push(`${metric.label}: se observa dentro de un rango estable.`);
      return;
    }

    if (metric.status === "warning") {
      corrections.push(`${metric.label}: conviene revisar con el entrenador.`);
    } else {
      corrections.push(`${metric.label}: requiere correccion tecnica prioritaria.`);
    }
  });

  if (shoulderTilt <= thresholds.shoulderTiltGood) {
    observations.push("El nivel de hombros se mantiene estable en la muestra.");
  } else {
    observations.push("Se observa diferencia en el nivel de hombros.");
    recommendations.push("Trabaja posicion inicial y sensacion de hombros nivelados antes del anclaje.");
  }

  if (bowArmMovement <= thresholds.bowArmMovementGood) {
    observations.push("El brazo de arco conserva buena estabilidad visual.");
  } else {
    observations.push("El brazo de arco muestra variacion durante la secuencia.");
    recommendations.push("Usa ejercicios de expansion continua y mantenimiento del brazo de arco.");
  }

  if (releaseMovement > thresholds.releaseMovementWarning) {
    observations.push("La mano de cuerda pierde continuidad en la fase final.");
    recommendations.push("Revisar follow-through y evitar colapso despues de la suelta.");
  }

  if (viewType === "superior" && stringArmAngle < 120) {
    observations.push("El codo de cuerda podria estar fuera de una linea eficiente.");
    recommendations.push("Comparar la linea hombros-codo de cuerda con la linea de tiro.");
  }

  if (!recommendations.length) {
    recommendations.push("Mantener registro de video y comparar consistencia entre sesiones.");
  }

  const score = Math.round(
    metrics.reduce((sum, metric) => sum + scoreFromStatus(metric.status), 0) /
      metrics.length
  );

  return {
    score,
    metrics,
    observations,
    recommendations,
    strengths: strengths.slice(0, 4),
    corrections: corrections.slice(0, 4),
  };
}
