import { ImageSource } from 'excalibur';
import type { AssetManifest } from './level/manifest';

/**
 * TEMP: unlicensed teammate art lives in `public/assets/TEMP`.
 *
 * Flip this to `false` (and delete that folder) before publishing. Tile art is
 * then ignored and the backdrop falls back to the original fog colour, so the
 * game keeps working with placeholder rectangles.
 */
export const TEMP_ASSETS = true;

/**
 * Painted wallpaper shown behind every playable level. Kept out of the tile
 * manifest because it is scenery, not a tile: it spans the whole level rather
 * than sitting on the 32px grid.
 */
export const LEVEL_BACKGROUND = 'assets/DRYFIT/gothicvania/environment/background.png';
export const DRYFIT_HERO = 'assets/DRYFIT/gothicvania/hero/hero-idle-crop.png';
export const DRYFIT_MONSTER = 'assets/DRYFIT/gothicvania/enemies/ghost-1-crop.png';

export interface GameTextures {
  /** Backdrop texture, if one was configured. */
  background?: ImageSource;
  /** Temporary player/monster art for the dry-fit branch. */
  hero?: ImageSource;
  monster?: ImageSource;
  /** Tile art, keyed by the manifest's `image` path. */
  tiles: Map<string, ImageSource>;
}

export interface GameAssets {
  textures: GameTextures;
  /** Every image that must finish loading before the engine starts. */
  resources: ImageSource[];
}

/**
 * Creates the image resources described by the manifest (plus the level
 * backdrop). Missing images simply do not appear in the map, so every tile
 * keeps its placeholder colour as a fallback.
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

  const background = TEMP_ASSETS
    ? new ImageSource(`${base}${LEVEL_BACKGROUND}`)
    : undefined;
  const hero = TEMP_ASSETS ? new ImageSource(`${base}${DRYFIT_HERO}`) : undefined;
  const monster = TEMP_ASSETS ? new ImageSource(`${base}${DRYFIT_MONSTER}`) : undefined;
  const resources = [...tiles.values()];
  if (background) {
    resources.push(background);
  }
  if (hero) {
    resources.push(hero);
  }
  if (monster) {
    resources.push(monster);
  }

  return { textures: { background, hero, monster, tiles }, resources };
}
