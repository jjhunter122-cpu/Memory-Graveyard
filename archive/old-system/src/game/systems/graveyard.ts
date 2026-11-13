/** Pure helpers shared by the game. No engine imports, so they run in tests. */

export function clamp(value: number, min: number, max: number): number {
  // Guard against inverted ranges (level smaller than the viewport).
  if (max < min) {
    return (min + max) / 2;
  }
  return Math.min(Math.max(value, min), max);
}
