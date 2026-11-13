export const SCORE_PER_COIN = 100;
export const COIN_START_X = 800;
export const COIN_SPACING = 1800;
export const COIN_CLUSTER_SIZE = 3;

/** One point per 10 px travelled. */
export function distanceScore(distancePx: number): number {
  return Math.floor(Math.max(0, distancePx) / 10);
}

export function runScore(distancePx: number, coins: number): number {
  return distanceScore(distancePx) + coins * SCORE_PER_COIN;
}
