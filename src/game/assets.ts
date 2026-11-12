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
export const GUARDIAN_ATTACK_SHEET =
  'assets/enemies/old-guardian/Old_Guardian_attack_1.png';
export const GUARDIAN_DEATH_SHEET =
  'assets/enemies/old-guardian/Old_Guardian_death.png';

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
  /** Placeholder Guardian idle/walk/attack strips. */
  guardianIdleSheet?: ImageSource;
  guardianWalkSheet?: ImageSource;
  guardianAttackSheet?: ImageSource;
  guardianDeathSheet?: ImageSource;
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
  const guardianAttackSheet = new ImageSource(`${base}${GUARDIAN_ATTACK_SHEET}`);
  const guardianDeathSheet = new ImageSource(`${base}${GUARDIAN_DEATH_SHEET}`);

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
  if (background) {
    resources.push(background);
  }
  resources.push(
    guardianIdleSheet,
    guardianWalkSheet,
    guardianAttackSheet,
    guardianDeathSheet,
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
      background,
      guardianIdleSheet,
      guardianWalkSheet,
      guardianAttackSheet,
      guardianDeathSheet,
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
