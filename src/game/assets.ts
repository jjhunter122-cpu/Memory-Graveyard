import { ImageSource } from 'excalibur';
import type { AssetManifest } from './level/manifest';
import { sceneryImagePaths } from './scenery';

/** Dark Fantasy Monster Pack 2 (Monster 1) by zneeke. */
export const SHADE_SHEET =
  'assets/enemies/dark-fantasy-monster-2/pack-2-m1.png';

export interface GameTextures {
  /** The Shade's idle/walk/attack/death frames, sliced in visuals/shade.ts. */
  shadeSheet?: ImageSource;
  /** Pixel Platformer World character frames. */
  heroIdle: ImageSource[];
  heroRun: ImageSource[];
  heroJump: ImageSource[];
  heroLanding: ImageSource[];
  heroDead: ImageSource[];
  /** CC0 silver coin used for the score pickup and HUD icon. */
  scoreCoin: ImageSource;
  /** CC0 green bolt used for stamina pickups and the HUD icon. */
  staminaBolt: ImageSource;
  /** Scene-dressing art, keyed by path relative to `public/assets`. */
  scenery: Map<string, ImageSource>;
  /** Tile art, keyed by the manifest's `image` path. */
  tiles: Map<string, ImageSource>;
}

export interface GameAssets {
  textures: GameTextures;
  /** Every image that must finish loading before the engine starts. */
  resources: ImageSource[];
}

/**
 * Creates the image resources described by the manifest and the scenery
 * presets. Missing images simply do not appear in the map, so every tile keeps
 * its placeholder colour as a fallback.
 */
export function createGameTextures(
  base: string,
  manifest: AssetManifest,
): GameAssets {
  const tilePaths = new Set<string>();
  for (const tileset of manifest.tilesets) {
    for (const tile of tileset.tiles) {
      if (tile.image) {
        tilePaths.add(tile.image);
      }
    }
  }

  const tiles = new Map<string, ImageSource>();
  for (const path of tilePaths) {
    tiles.set(path, new ImageSource(`${base}assets/${path}`));
  }

  const scenery = new Map<string, ImageSource>();
  for (const path of sceneryImagePaths()) {
    scenery.set(path, new ImageSource(`${base}assets/${path}`));
  }

  const shadeSheet = new ImageSource(`${base}${SHADE_SHEET}`);

  const heroFrame = (file: string): ImageSource =>
    new ImageSource(
      `${base}assets/pixel-platformer-world/Character/Sprite/${file}`,
    );
  const heroIdle = Array.from({ length: 6 }, (_, index) =>
    heroFrame(`idle-${String(index + 1).padStart(2, '0')}.png`),
  );
  const heroRun = Array.from({ length: 7 }, (_, index) =>
    heroFrame(`run-${String(index + 1).padStart(2, '0')}.png`),
  );
  const heroJump = Array.from({ length: 2 }, (_, index) =>
    heroFrame(`jump-${String(index + 1).padStart(2, '0')}.png`),
  );
  const heroLanding = Array.from({ length: 3 }, (_, index) =>
    heroFrame(`jump-landing-${String(index + 1).padStart(2, '0')}.png`),
  );
  const heroDead = Array.from({ length: 4 }, (_, index) =>
    heroFrame(`dead-${String(index + 1).padStart(2, '0')}.png`),
  );
  const scoreCoin = new ImageSource(`${base}assets/ui/coin.png`);
  const staminaBolt = new ImageSource(`${base}assets/ui/bolt-green.png`);

  const resources = [...tiles.values(), ...scenery.values()];
  resources.push(
    shadeSheet,
    ...heroIdle,
    ...heroRun,
    ...heroJump,
    ...heroLanding,
    ...heroDead,
    scoreCoin,
    staminaBolt,
  );

  return {
    textures: {
      shadeSheet,
      heroIdle,
      heroRun,
      heroJump,
      heroLanding,
      heroDead,
      scoreCoin,
      staminaBolt,
      scenery,
      tiles,
    },
    resources,
  };
}
