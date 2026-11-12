export const SCORE_PER_MEMORY = 100;
export const MEMORY_START_X = 800;
export const MEMORY_SPACING = 1800;
export const MEMORY_CLUSTER_SIZE = 3;

/** One point per 10 px travelled. */
export function distanceScore(distancePx: number): number {
  return Math.floor(Math.max(0, distancePx) / 10);
}

export function runScore(distancePx: number, memories: number): number {
  return distanceScore(distancePx) + memories * SCORE_PER_MEMORY;
}
