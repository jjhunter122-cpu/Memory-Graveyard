import { ACT_FLOOR_ROW } from './generator';

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

/** 1 while healthy, falling to LOW_STAMINA_SPEED at empty. */
export function staminaSpeedFactor(stamina: number): number {
  if (stamina >= LOW_STAMINA_THRESHOLD) {
    return 1;
  }
  const t = Math.max(0, Math.min(1, stamina / LOW_STAMINA_THRESHOLD));
  return LOW_STAMINA_SPEED + (1 - LOW_STAMINA_SPEED) * t;
}

/** Shard gaps widen with distance to a cap, then stay there forever. */
export function shardSpacingAt(distancePx: number): number {
  const t = Math.min(1, Math.max(0, distancePx) / SHARD_RAMP_DISTANCE);
  return SHARD_MIN_SPACING + (SHARD_MAX_SPACING - SHARD_MIN_SPACING) * t;
}

/**
 * Alternating shard heights: ground level is collected while running, the air
 * version needs a jump. Index 0 is the easy ground shard.
 */
export function shardHeightAt(index: number): number {
  return index % 2 === 0 ? ACT_FLOOR_ROW - 1 : ACT_FLOOR_ROW - 3;
}
