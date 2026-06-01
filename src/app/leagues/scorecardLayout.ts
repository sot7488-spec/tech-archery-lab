export const SCORECARD_OPTIONS = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"] as const;

export type ScorecardOption = (typeof SCORECARD_OPTIONS)[number];

const BLOCK_LEFTS = [4, 36, 68];
const ROW_TOP = 31;
const ROW_GAP = 3.05;
const OPTION_LEFT_OFFSET = 5.2;
const OPTION_GAP = 1.86;

export function getScorecardBubblePosition(arrowNumber: number, optionIndex: number) {
  const blockIndex = Math.floor((arrowNumber - 1) / 20);
  const rowIndex = (arrowNumber - 1) % 20;

  return {
    x: BLOCK_LEFTS[blockIndex] + OPTION_LEFT_OFFSET + optionIndex * OPTION_GAP,
    y: ROW_TOP + rowIndex * ROW_GAP,
  };
}

export function getScoreFromOption(option: ScorecardOption) {
  if (option === "X") return { score: "10", isX: true };
  if (option === "M") return { score: "0", isX: false };
  return { score: option, isX: false };
}

export function getScorecardBlockLeft(blockIndex: number) {
  return BLOCK_LEFTS[blockIndex] || BLOCK_LEFTS[0];
}

export const SCORECARD_ROW_TOP = ROW_TOP;
export const SCORECARD_ROW_GAP = ROW_GAP;
