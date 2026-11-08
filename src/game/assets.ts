import { ImageSource } from 'excalibur';
import type { AssetManifest } from './level/manifest';
import { sceneryImagePaths } from './scenery';

/**
 * TEMP: unlicensed teammate art lives in `public/assets/TEMP`, and the dry-fit
 * branch points at the local-only `public/assets/DRYFIT` candidate set.
 *
 * Flip this to `false` (and delete those folders) before publishing. Tile art is
 * then ignored and the backdrop falls back to the original fog colour, so the
 * game keeps working with placeholder rectangles.
 */
export const TEMP_ASSETS = true;

/** Cropped, evenly spaced hero frames used by the dry-fit animations. */
export const DRYFIT_HERO_SHEET = 'assets/DRYFIT/gothicvania/hero/hero-sheet.png';
/** Six-frame ghost monster used as an alternate dry-fit pursuer. */
export const DRYFIT_GHOST_SHEET = 'assets/DRYFIT/ghost/anim-nme-ghost.png';
/** Eight walk frames and six rise frames for the skeleton pursuer. */
export const DRYFIT_SKELETON_SHEET =
  'assets/DRYFIT/gothicvania/enemies/skeleton/skeleton-sheet.png';

export interface GameTextures {
  /** Sprite sheet for the temporary player animations. */
  heroSheet?: ImageSource;
  /** Sprite sheet for the alternate ghost pursuer. */
  ghostSheet?: ImageSource;
  /** Sprite sheet for the skeleton pursuer. */
  skeletonSheet?: ImageSource;
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
 * Creates the image resources described by the manifest, the scenery presets
 * and the dry-fit character sheets. Missing images simply do not appear in the
 * map, so every tile keeps its placeholder colour as a fallback.
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

  const heroSheet = TEMP_ASSETS
    ? new ImageSource(`${base}${DRYFIT_HERO_SHEET}`)
    : undefined;
  const ghostSheet = TEMP_ASSETS
    ? new ImageSource(`${base}${DRYFIT_GHOST_SHEET}`)
    : undefined;
  const skeletonSheet = TEMP_ASSETS
    ? new ImageSource(`${base}${DRYFIT_SKELETON_SHEET}`)
    : undefined;

  const resources = [...tiles.values(), ...scenery.values()];
  if (heroSheet) {
    resources.push(heroSheet);
  }
  if (ghostSheet) {
    resources.push(ghostSheet);
  }
  if (skeletonSheet) {
    resources.push(skeletonSheet);
  }

  return {
    textures: { heroSheet, ghostSheet, skeletonSheet, scenery, tiles },
    resources,
  };
}
