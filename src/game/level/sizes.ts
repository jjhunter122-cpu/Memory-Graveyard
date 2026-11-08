import type { PlayArea } from './schema';

export interface LevelSizePreset {
  label: string;
  width: number;
  height: number;
}

/** Normal editor sizes. The smallest and largest are intentional limits. */
export const LEVEL_SIZE_PRESETS: readonly LevelSizePreset[] = [
  { label: 'Small — 40 × 18', width: 40, height: 18 },
  { label: 'Wide — 60 × 18', width: 60, height: 18 },
  { label: 'Long — 80 × 18', width: 80, height: 18 },
  { label: 'Tall — 40 × 27', width: 40, height: 27 },
  { label: 'Medium — 60 × 27', width: 60, height: 27 },
  { label: 'Large — 80 × 27', width: 80, height: 27 },
  { label: 'Very tall — 40 × 36', width: 40, height: 36 },
  { label: 'Big — 60 × 36', width: 60, height: 36 },
  { label: 'Maximum — 80 × 36', width: 80, height: 36 },
];

export const LEVEL_SIZE_MIN = { width: 40, height: 18 } as const;
export const LEVEL_SIZE_MAX = { width: 80, height: 36 } as const;
/** Dev-only custom sizes are allowed beyond the normal maximum. */
export const LEVEL_SIZE_DEV_MAX = { width: 120, height: 60 } as const;

export interface BlankSlabPreset {
  label: string;
  width: number;
  height: number;
  playArea: PlayArea;
}

/**
 * Canvas sizes offered by the editor's New level dialog. The playable area is
 * inset so the outer canvas can be filled with decorative scenery.
 */
export const BLANK_SLAB_PRESETS: readonly BlankSlabPreset[] = [
  {
    label: 'Small — 60 × 27',
    width: 60,
    height: 27,
    playArea: { x: 10, y: 8, width: 40, height: 19 },
  },
  {
    label: 'Wide — 80 × 27',
    width: 80,
    height: 27,
    playArea: { x: 12, y: 8, width: 56, height: 19 },
  },
  {
    label: 'Tall — 80 × 36',
    width: 80,
    height: 36,
    playArea: { x: 12, y: 12, width: 56, height: 24 },
  },
  {
    label: 'Large — 100 × 36',
    width: 100,
    height: 36,
    playArea: { x: 16, y: 12, width: 68, height: 24 },
  },
  {
    label: 'Maximum — 120 × 45',
    width: 120,
    height: 45,
    playArea: { x: 18, y: 14, width: 84, height: 31 },
  },
];

export function blankSlabPresetFor(
  width: number,
  height: number,
): BlankSlabPreset | undefined {
  return BLANK_SLAB_PRESETS.find(
    (preset) => preset.width === width && preset.height === height,
  );
}

/** Default decorative margin for custom canvas sizes. */
export function defaultPlayArea(width: number, height: number): PlayArea {
  const side = Math.min(18, Math.max(10, Math.round(width * 0.2)));
  const top = Math.min(14, Math.max(8, Math.round(height * 0.2)));
  return {
    x: side,
    y: top,
    width: Math.max(1, width - side * 2),
    height: Math.max(1, height - top),
  };
}

export function presetForKey(key: string): LevelSizePreset | undefined {
  return LEVEL_SIZE_PRESETS.find(
    (preset) => `${preset.width}x${preset.height}` === key,
  );
}

export function keyForSize(width: number, height: number): string {
  return `${width}x${height}`;
}

export function clampSize(
  width: number,
  height: number,
  dev: boolean,
): { width: number; height: number } {
  const max = dev ? LEVEL_SIZE_DEV_MAX : LEVEL_SIZE_MAX;
  return {
    width: Math.min(Math.max(Math.round(width), LEVEL_SIZE_MIN.width), max.width),
    height: Math.min(Math.max(Math.round(height), LEVEL_SIZE_MIN.height), max.height),
  };
}
