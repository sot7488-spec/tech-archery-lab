export type VideoViewType = "frontal" | "lateral" | "superior";
export type MetricStatus = "good" | "warning" | "bad";

export type AnalysisThresholds = {
  shoulderTiltGood: number;
  shoulderTiltWarning: number;
  trunkLeanGood: number;
  trunkLeanWarning: number;
  headMovementGood: number;
  headMovementWarning: number;
  bowArmMovementGood: number;
  bowArmMovementWarning: number;
  alignmentGood: number;
  alignmentWarning: number;
  releaseMovementGood: number;
  releaseMovementWarning: number;
  consistencyGood: number;
  consistencyWarning: number;
};

export const DEFAULT_VIDEO_ANALYSIS_THRESHOLDS: AnalysisThresholds = {
  shoulderTiltGood: 5,
  shoulderTiltWarning: 10,
  trunkLeanGood: 7,
  trunkLeanWarning: 14,
  headMovementGood: 3,
  headMovementWarning: 7,
  bowArmMovementGood: 4,
  bowArmMovementWarning: 9,
  alignmentGood: 12,
  alignmentWarning: 24,
  releaseMovementGood: 5,
  releaseMovementWarning: 12,
  consistencyGood: 6,
  consistencyWarning: 14,
};

export function getMetricStatus(
  value: number,
  goodLimit: number,
  warningLimit: number
): MetricStatus {
  if (value <= goodLimit) return "good";
  if (value <= warningLimit) return "warning";
  return "bad";
}

export function scoreFromStatus(status: MetricStatus) {
  if (status === "good") return 100;
  if (status === "warning") return 72;
  return 45;
}
