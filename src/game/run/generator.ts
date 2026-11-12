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

export interface RaisedSection {
  start: number;
  width: number;
  /** Tile row of the top surface: 15 is one tile up, 14 is two. */
  topRow: number;
}

export interface FloatingPlatform {
  start: number;
  width: number;
  topRow: number;
}

export interface ActFeatures {
  raised: RaisedSection[];
  floating: FloatingPlatform[];
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

/**
 * Solid raised sections on flat ground plus raised bridges over selected pits.
 * All features stay at least three tiles from pit edges and the safe act ends.
 */
export function generateFeatures(
  seed: number,
  actIndex: number,
  pits: readonly Pit[],
): ActFeatures {
  const rng = createRng((seed + actIndex * 0x85ebca6b) >>> 0);
  const features: ActFeatures = { raised: [], floating: [] };

  for (const pit of pits) {
    if (pit.width < 3) {
      continue;
    }
    if (rng() > 0.55) {
      continue;
    }
    const topRow = actIndex >= 4 && rng() < 0.5 ? 14 : 15;
    features.floating.push({ start: pit.start, width: pit.width, topRow });
  }

  const segments: { start: number; end: number }[] = [];
  let cursor = ACT_SAFE_START;
  for (const pit of pits) {
    if (pit.start - cursor >= 12) {
      segments.push({ start: cursor, end: pit.start });
    }
    cursor = pit.start + pit.width;
  }
  if (ACT_WIDTH - ACT_SAFE_END - cursor >= 12) {
    segments.push({ start: cursor, end: ACT_WIDTH - ACT_SAFE_END });
  }

  const chance = Math.min(0.9, 0.55 + actIndex * 0.04);
  for (const segment of segments) {
    if (rng() > chance) {
      continue;
    }
    const available = segment.end - segment.start - 6;
    if (available < 2) {
      continue;
    }
    const kind = rng();
    if (kind < 0.4) {
      const width = 2 + Math.floor(rng() * 2);
      if (width > available) {
        continue;
      }
      const start =
        segment.start + 3 + Math.floor(rng() * (available - width + 1));
      features.raised.push({ start, width, topRow: 15 });
    } else if (kind < 0.75) {
      const width = 4 + Math.floor(rng() * 5);
      if (width > available) {
        continue;
      }
      const start =
        segment.start + 3 + Math.floor(rng() * (available - width + 1));
      const topRow = actIndex >= 2 && rng() < 0.5 ? 14 : 15;
      features.raised.push({ start, width, topRow });
    } else {
      const firstWidth = 3 + Math.floor(rng() * 2);
      const secondWidth = 3 + Math.floor(rng() * 2);
      const width = firstWidth + secondWidth;
      if (width > available) {
        continue;
      }
      const start =
        segment.start + 3 + Math.floor(rng() * (available - width + 1));
      const up = rng() < 0.5;
      features.raised.push({
        start,
        width: firstWidth,
        topRow: up ? 15 : 14,
      });
      features.raised.push({
        start: start + firstWidth,
        width: secondWidth,
        topRow: up ? 14 : 15,
      });
    }
  }

  return features;
}

/** Shared player/monster pace. Both ramp together; the gap stays fixed. */
export function speedAt(distancePx: number): number {
  const t = Math.min(1, Math.max(0, distancePx / SPEED_RAMP_DISTANCE));
  return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * t;
}
