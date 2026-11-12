import { ImageSource } from 'excalibur';
import type { AssetManifest } from './level/manifest';
import { sceneryImagePaths } from './scenery';

/**
 * TEMP: unlicensed teammate stand-ins live in `public/assets/TEMP`.
 *
 * Flip this to `false` (and delete that folder) before publishing. Tile art is
 * then ignored and the backdrop falls back to the original fog colour, so the
 * game keeps working with placeholder rectangles.
 */
export const TEMP_ASSETS = true;

/**
 * Temporary wallpaper used by the existing OG levels when they have no skybox
 * or scenery preset.
 */
export const LEVEL_BACKGROUND = 'assets/TEMP/wallpaper_color.png';

/** Placeholder Guardian monster sheets, pending licence approval. */
export const GUARDIAN_IDLE_SHEET = 'assets/enemies/old-guardian/Old_Guardian_idle.png';
export const GUARDIAN_WALK_SHEET = 'assets/enemies/old-guardian/Old_Guardian_walk.png';

export interface GameTextures {
  /** Fallback wallpaper for levels without a skybox or scenery preset. */
  background?: ImageSource;
  /**
   * Reserved for character sheets. The current main game uses placeholder
   * player/monster rectangles, so these stay undefined until real art arrives.
   */
  heroSheet?: ImageSource;
  ghostSheet?: ImageSource;
  skeletonSheet?: ImageSource;
  /** Placeholder Guardian idle/walk strips. */
  guardianIdleSheet?: ImageSource;
  guardianWalkSheet?: ImageSource;
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
export function createGameTextures(base: string, manifest: AssetManifest): GameAssets {
  const tilePaths = new Set<string>();
  if (TEMP_ASSETS) {
    for (const tileset of manifest.tilesets) {
      for (const tile of tileset.tiles) {
        if (tile.image) {
          tilePaths.add(tile.image);
        }
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

  const background = TEMP_ASSETS
    ? new ImageSource(`${base}${LEVEL_BACKGROUND}`)
    : undefined;

  const guardianIdleSheet = new ImageSource(`${base}${GUARDIAN_IDLE_SHEET}`);
  const guardianWalkSheet = new ImageSource(`${base}${GUARDIAN_WALK_SHEET}`);

  const resources = [...tiles.values(), ...scenery.values()];
  if (background) {
    resources.push(background);
  }
  resources.push(guardianIdleSheet, guardianWalkSheet);

  return {
    textures: {
      background,
      guardianIdleSheet,
      guardianWalkSheet,
      scenery,
      tiles,
    },
    resources,
  };
}
