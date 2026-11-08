/**
 * Scene dressing presets. These are deliberately plain data so the editor can
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

export const BACKGROUND_PRESETS: readonly SceneryPreset[] = [
  {
    id: 'gothicvania',
    name: 'GothicVania',
    layers: [
      { image: 'DRYFIT/gothicvania/environment/background.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/gothicvania/environment/mountains.png', height: 0.55, anchor: 'bottom' },
      { image: 'DRYFIT/gothicvania/environment/graveyard.png', height: 0.42, anchor: 'bottom' },
    ],
  },
  {
    id: 'gothicvania-moon',
    name: 'GothicVania — Moon only',
    layers: [
      { image: 'DRYFIT/gothicvania/environment/background.png', height: 1, anchor: 'center' },
    ],
  },
  {
    id: 'gothicvania-hills',
    name: 'GothicVania — Hills',
    layers: [
      { image: 'DRYFIT/gothicvania/environment/background.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/gothicvania/environment/mountains.png', height: 0.7, anchor: 'bottom' },
    ],
  },
  {
    id: 'pixel-platformer-world-flat',
    name: 'Pixel Platformer World — Flat',
    layers: [
      { image: 'DRYFIT/pixel-platformer-world/Background/background1.png', height: 1, anchor: 'center' },
    ],
  },
  {
    id: 'pixel-platformer-world-layers',
    name: 'Pixel Platformer World — Layers',
    layers: [
      { image: 'DRYFIT/pixel-platformer-world/Background/background1.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background2.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background3.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background4.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background5.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background6.png', height: 1, anchor: 'center' },
    ],
  },
  {
    id: 'pixel-platformer-world',
    name: 'Pixel Platformer World — Room',
    layers: [
      { image: 'DRYFIT/pixel-platformer-world/Background/background1.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background2.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background3.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background4.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background5.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/pixel-platformer-world/Background/background6.png', height: 1, anchor: 'center' },
      {
        image: 'DRYFIT/pixel-platformer-world/room-test.png',
        height: 1,
        anchor: 'center',
        repeat: false,
      },
    ],
  },
  {
    id: 'woods',
    name: 'Pixel Woods',
    layers: [
      { image: 'DRYFIT/woods/Backgrounds/BACKGROUND.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/woods/Backgrounds/WOODS - First.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/woods/Backgrounds/WOODS - Second.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/woods/Backgrounds/WOODS - Third.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/woods/Backgrounds/WOODS - Fourth.png', height: 1, anchor: 'center' },
      { image: 'DRYFIT/woods/Backgrounds/BUSH - BACKGROUND.png', height: 1, anchor: 'center' },
    ],
  },
];

export const FOREGROUND_PRESETS: readonly SceneryPreset[] = [
  {
    id: 'gothicvines',
    name: 'GothicVania — Hanging vines',
    layers: [
      {
        image: 'DRYFIT/gothicvania/tiles/gv-vines.png',
        height: 0.2,
        anchor: 'top',
        opacity: 0.85,
      },
    ],
  },
  {
    id: 'woodsvines',
    name: 'Pixel Woods — Vines',
    layers: [
      {
        image: 'DRYFIT/woods/Backgrounds/VINES - Second.png',
        height: 0.45,
        anchor: 'top',
        opacity: 0.9,
      },
    ],
  },
  {
    id: 'woodsbushes',
    name: 'Pixel Woods — Bushes',
    layers: [
      {
        image: 'DRYFIT/woods/Decorations/BUSH FOREGROUND 1-2.png',
        height: 0.09,
        anchor: 'bottom',
      },
    ],
  },
  {
    id: 'woodsvines-bushes',
    name: 'Pixel Woods — Vines + bushes',
    layers: [
      {
        image: 'DRYFIT/woods/Backgrounds/VINES - Second.png',
        height: 0.45,
        anchor: 'top',
        opacity: 0.9,
      },
      {
        image: 'DRYFIT/woods/Decorations/BUSH FOREGROUND 1-2.png',
        height: 0.09,
        anchor: 'bottom',
      },
    ],
  },
];

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
