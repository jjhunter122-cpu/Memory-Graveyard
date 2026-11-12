/**
 * Pure procedural-run helpers: seeded act layouts, pit rules and the speed
 * curve. Kept free of Excalibur so the generator can be replayed in Vitest.
 */

export const ACT_WIDTH = 480;
export const ACT_HEIGHT = 18;
export const ACT_TILE_SIZE = 32;
export const ACT_FLOOR_ROW = 16;
/** Pixel Platformer World moss grass top + fill. */
export const FLOOR_TOP_TILE = 79;
export const FLOOR_FILL_TILE = 80;
export const ACT_SAFE_START = 20;
export const ACT_SAFE_END = 20;
export const MIN_PIT_SPACING = 8;

export const BASE_SPEED = 220;
export const MAX_SPEED = 360;
export const SPEED_RAMP_DISTANCE = 30000;

export interface Pit {
  /** Start tile inside the act. */
  start: number;
  /** Width in tiles. */
  width: number;
}

/** Small deterministic PRNG so a run can be reproduced from its seed. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Later acts allow wider pits, matching the rising run speed. */
export function maxPitWidth(actIndex: number): number {
  return 3 + Math.min(2, Math.floor(actIndex / 2));
}

export function generatePits(seed: number, actIndex: number): Pit[] {
  const rng = createRng((seed + actIndex * 0x9e3779b9) >>> 0);
  const maxWidth = maxPitWidth(actIndex);
  const pits: Pit[] = [];
  let cursor = ACT_SAFE_START;

  while (true) {
    cursor += MIN_PIT_SPACING + Math.floor(rng() * 8);
    if (cursor >= ACT_WIDTH - ACT_SAFE_END) {
      break;
    }
    const width = 2 + Math.floor(rng() * (maxWidth - 1));
    if (cursor + width > ACT_WIDTH - ACT_SAFE_END) {
      break;
    }
    pits.push({ start: cursor, width });
    cursor += width;
  }

  return pits;
}

export function isOverPit(pits: readonly Pit[], tileX: number): boolean {
  return pits.some((pit) => tileX >= pit.start && tileX < pit.start + pit.width);
}

/** Shared player/monster pace. Both ramp together; the gap stays fixed. */
export function speedAt(distancePx: number): number {
  const t = Math.min(1, Math.max(0, distancePx / SPEED_RAMP_DISTANCE));
  return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * t;
}
