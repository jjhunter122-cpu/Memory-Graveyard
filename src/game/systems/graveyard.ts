/** Pure helpers for Memory Graveyard. No engine imports, so they run in tests. */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function clamp(value: number, min: number, max: number): number {
  // Guard against inverted ranges (level smaller than the viewport).
  if (max < min) {
    return (min + max) / 2;
  }
  return Math.min(Math.max(value, min), max);
}

/** A flavour title that tracks how much of the graveyard has been read. */
export function rankFor(collected: number, total: number): string {
  if (total <= 0) {
    return 'Wanderer';
  }
  const ratio = collected / total;
  if (ratio >= 1) {
    return 'Gravekeeper';
  }
  if (ratio >= 0.6) {
    return 'Medium';
  }
  if (ratio >= 0.3) {
    return 'Listener';
  }
  return 'Wanderer';
}
