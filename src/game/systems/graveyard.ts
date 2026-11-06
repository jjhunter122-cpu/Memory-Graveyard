/** Pure helpers for Memory Graveyard. No engine imports, so they run in tests. */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Indices of the memories within `reach` of the player this frame.
 * The player collects at most one per frame by design; the caller decides.
 */
export function memoriesInReach(
  player: Point,
  reach: number,
  memories: readonly Point[],
): number[] {
  const hits: number[] = [];
  memories.forEach((memory, index) => {
    if (distanceBetween(player, memory) <= reach) {
      hits.push(index);
    }
  });
  return hits;
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
