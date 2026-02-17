/**
 * Payline pattern rules for the 5-reel slot machine.
 * Each pattern is an array of [row, col] coordinates defining the payline path.
 * 9 paylines total across 5 reels × 3 rows.
 */
export const PATTERN_RULE: [number, number][][] = [
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ], // Middle row
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ], // Top row
  [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
  ], // Bottom row
  [
    [0, 0],
    [1, 1],
    [2, 2],
    [1, 3],
    [0, 4],
  ], // V shape
  [
    [2, 0],
    [1, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ], // Inverted V
  [
    [1, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [1, 4],
  ], // U shape
  [
    [1, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
  ], // Inverted U
  [
    [0, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
  ], // Descending
  [
    [2, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [0, 4],
  ], // Ascending
];

export const TOTAL_LINES = 9;

export const BET_TYPE = {
  manual: 0,
  auto: 1,
} as const;
