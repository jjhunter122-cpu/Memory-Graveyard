/**
 * Scene-dressing presets. These are deliberately plain data so the editor can
 * list them without pulling in Excalibur. Paths are relative to `public/assets`.
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

/** The nine pre-built room palettes in `main_lev_buildA.png`. */
const PIXEL_ROOM_PALETTES = [
  'moss',
  'rose',
  'olive',
  'crimson',
  'teal',
  'blood',
  'lime',
  'slate',
  'ocean',
] as const;

const PIXEL_BACKGROUNDS = ['1', '2', '3', '4', '5', '6'] as const;

function pixelBackgroundLayers(): SceneryLayer[] {
  return PIXEL_BACKGROUNDS.map((index) => ({
    image: `pixel-platformer-world/Background/background${index}.png`,
    height: 1,
    anchor: 'center' as const,
  }));
}

export const BACKGROUND_PRESETS: readonly SceneryPreset[] = [
  {
    id: 'pixel-platformer-world-flat',
    name: 'Pixel Platformer World — Flat',
    layers: [
      {
        image: 'pixel-platformer-world/Background/background1.png',
        height: 1,
        anchor: 'center',
      },
    ],
  },
  {
    id: 'pixel-platformer-world-layers',
    name: 'Pixel Platformer World — Layers',
    layers: pixelBackgroundLayers(),
  },
  ...PIXEL_ROOM_PALETTES.map((palette, index) => ({
    id: `pixel-platformer-world-room-${index + 1}`,
    name: `Pixel Platformer World — Room ${index + 1} (${palette})`,
    layers: [
      ...pixelBackgroundLayers(),
      {
        image: `pixel-platformer-world/rooms/room-${index + 1}.png`,
        height: 1,
        anchor: 'center' as const,
        repeat: false,
      },
    ],
  })),
];

export const FOREGROUND_PRESETS: readonly SceneryPreset[] = [];

export function findBackgroundPreset(id: string | undefined): SceneryPreset | undefined {
  if (!id || id === 'none') {
    return undefined;
  }
  return BACKGROUND_PRESETS.find((preset) => preset.id === id);
}

export function findForegroundPreset(id: string | undefined): SceneryPreset | undefined {
  if (!id || id === 'none') {
    return undefined;
  }
  return FOREGROUND_PRESETS.find((preset) => preset.id === id);
}

/** Every image path referenced by a preset, for preloading. */
export function sceneryImagePaths(): string[] {
  const paths = new Set<string>();
  for (const preset of [...BACKGROUND_PRESETS, ...FOREGROUND_PRESETS]) {
    for (const layer of preset.layers) {
      paths.add(layer.image);
    }
  }
  return [...paths];
}
