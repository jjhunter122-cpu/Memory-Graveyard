/** Stamina tuning. Kept pure so the curve can be tested without Excalibur. */
export const STAMINA_MAX = 100;
export const STAMINA_DRAIN = 3;
export const SHARD_REFILL = 25;
export const LOW_STAMINA_THRESHOLD = 20;
export const LOW_STAMINA_SPEED = 0.55;

export const SHARD_START_X = 1200;
export const SHARD_MIN_SPACING = 1600;
export const SHARD_MAX_SPACING = 2600;
const SHARD_RAMP_DISTANCE = 20000;

/** Full speed until the bar is empty, then drop to the crawl speed. */
export function staminaSpeedFactor(stamina: number): number {
  return stamina > 0 ? 1 : LOW_STAMINA_SPEED;
}

/** Shard gaps widen with distance to a cap, then stay there forever. */
export function shardSpacingAt(distancePx: number): number {
  const t = Math.min(1, Math.max(0, distancePx) / SHARD_RAMP_DISTANCE);
  return SHARD_MIN_SPACING + (SHARD_MAX_SPACING - SHARD_MIN_SPACING) * t;
}

/**
 * Alternating shard heights relative to the local surface: one row above for
 * ground pickups, three rows above for the jump pickups.
 */
export function shardRowOffset(index: number): number {
  return index % 2 === 0 ? 1 : 3;
}
