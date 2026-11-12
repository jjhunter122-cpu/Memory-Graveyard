/**
 * Scene-dressing presets for the endless forest. These are deliberately plain
 * data so the loader can paint them without knowing where they came from.
 * Paths are relative to `public/assets`.
 */

export type SceneryAnchor = 'top' | 'center' | 'bottom';

export interface SceneryLayer {
  /** Image path relative to `public/assets`. */
  image: string;
  /** Display height as a fraction of the level height. Defaults to 1. */
  height?: number;
  /** Where the layer is pinned vertically. Defaults to center. */
  anchor?: SceneryAnchor;
  /** Repeat horizontally to cover the level width. Defaults to true. */
  repeat?: boolean;
  /** Extra opacity multiplier for the whole layer. Defaults to 1. */
  opacity?: number;
  /** Optional pixel nudge after anchoring. */
  offsetY?: number;
  /** Optional tint applied to the layer. */
  tint?: string;
}

export interface SceneryPreset {
  id: string;
  name: string;
  layers: SceneryLayer[];
}

/** The six Pixel Platformer World forest backdrops, drawn back to front. */
const PIXEL_BACKGROUNDS = ['1', '2', '3', '4', '5', '6'] as const;

export const BACKGROUND_PRESETS: readonly SceneryPreset[] = [
  {
    id: 'pixel-platformer-world-layers',
    name: 'Pixel Platformer World — Forest Layers',
    layers: PIXEL_BACKGROUNDS.map((index) => ({
      image: `pixel-platformer-world/Background/background${index}.png`,
      height: 1,
      anchor: 'center' as const,
    })),
  },
];

export function findBackgroundPreset(id: string | undefined): SceneryPreset | undefined {
  if (!id || id === 'none') {
    return undefined;
  }
  return BACKGROUND_PRESETS.find((preset) => preset.id === id);
}

/** Every image path referenced by the scenery presets, de-duplicated. */
export function sceneryImagePaths(): string[] {
  const paths = new Set<string>();
  for (const preset of BACKGROUND_PRESETS) {
    for (const layer of preset.layers) {
      paths.add(layer.image);
    }
  }
  return [...paths];
}
