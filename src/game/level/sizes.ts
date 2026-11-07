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
