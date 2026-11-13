import {
  Actor,
  CollisionType,
  Color,
  Sprite,
  TiledSprite,
  type ImageSource,
  type Scene,
} from 'excalibur';
import type { GameTextures } from '../assets';
import { COLORS } from '../config';
import { SOLID_GROUP } from '../physics/collisionGroups';
import { EMPTY_TILE, type LevelData } from './schema';
import { tileIndex, type AssetManifest, type TileDef } from './manifest';
import { mergeHorizontal, toGrid, type TileRun } from './tiles';
import { addSceneryPreset } from './scenery';
import { findBackgroundPreset } from '../scenery';

/**
 * Tile tint for painted textures. The placeholder `color` is too dark to
 * multiply a light texture by, so art is tinted to a neutral tone instead.
 */
const TILE_IMAGE_TINT = '#ffffff';

export interface BuildLevelOptions {
  /** Skip the scenery backdrop when another act already painted one. */
  background?: boolean;
}

/**
 * Deterministic ground test against the level grid.
 * @param ignoreOneWay true while rising / dropping so planks are not "ground".
 */
export type GroundProbe = (
  centerX: number,
  feetY: number,
  halfWidth: number,
  ignoreOneWay: boolean,
) => boolean;

function tileTexture(def: TileDef, textures?: GameTextures): ImageSource | undefined {
  return def.image ? textures?.tiles.get(def.image) : undefined;
}

/**
 * Painted tiles tile their source texture at native pixel scale rather than
 * stretching one image over the whole run. A small offset per run breaks up
 * the repetition without adding more art.
 */
function addTileGraphic(
  scene: Scene,
  texture: ImageSource,
  run: TileRun,
  tileSize: number,
  z: number,
): void {
  const displayHeight = tileSize;
  const runWidth = run.width * tileSize;

  if (texture.width < tileSize && texture.height < tileSize) {
    // Small source art (for example 16x16 Pixel tiles in a 32px level) must be
    // scaled up to fill the cell. A TiledSprite would repeat it at native size
    // and make one cell look like four tiny tiles.
    for (let x = run.x; x < run.x + run.width; x += 1) {
      const spriteActor = new Actor({
        x: (x + 0.5) * tileSize,
        y: (run.y + 0.5) * tileSize,
        width: tileSize,
        height: tileSize,
        collisionType: CollisionType.PreventCollision,
        z,
      });
      spriteActor.graphics.use(
        new Sprite({
          image: texture,
          destSize: { width: tileSize, height: tileSize },
          tint: Color.fromHex(TILE_IMAGE_TINT),
        }),
      );
      scene.add(spriteActor);
    }
    return;
  }

  const sourceSize = Math.min(tileSize, texture.width, texture.height);
  const variantsX = Math.max(1, Math.floor(texture.width / sourceSize));
  const variantsY = Math.max(1, Math.floor(texture.height / sourceSize));
  const variantX = (run.x * 37 + run.y * 17) % variantsX;
  const variantY = (run.x * 11 + run.y * 29) % variantsY;
  const actor = new Actor({
    x: (run.x + run.width / 2) * tileSize,
    y: (run.y + run.height / 2) * tileSize,
    width: runWidth,
    height: run.height * displayHeight,
    collisionType: CollisionType.PreventCollision,
    z,
  });
  actor.graphics.use(
    new TiledSprite({
      image: texture,
      sourceView: {
        x: variantX * sourceSize,
        y: variantY * sourceSize,
        width: sourceSize,
        height: sourceSize,
      },
      width: runWidth,
      height: run.height * displayHeight,
      tint: Color.fromHex(TILE_IMAGE_TINT),
    }),
  );
  scene.add(actor);
}

function addSolid(
  scene: Scene,
  def: TileDef,
  run: TileRun,
  tileSize: number,
  textures?: GameTextures,
): void {
  const width = run.width * tileSize;
  const height = run.height * tileSize;
  const left = run.x * tileSize;
  const top = run.y * tileSize;
  const texture = tileTexture(def, textures);

  const body = new Actor({
    x: left + width / 2,
    y: top + height / 2,
    width,
    height,
    color: Color.fromHex(def.color),
    collisionType: CollisionType.Fixed,
    collisionGroup: SOLID_GROUP,
  });
  if (texture || def.hidden) {
    // Painted or collision-only tiles own the visuals; keep the body invisible.
    body.graphics.visible = false;
  }
  scene.add(body);

  if (texture && !def.hidden) {
    addTileGraphic(scene, texture, run, tileSize, 0);
  }
}

/**
 * Paints the level-wide backdrop. The colour skybox is always laid down first;
 * the forest scenery preset is then layered over it. Without either, the level
 * falls back to the flat fog colour.
 */
function addBackground(
  scene: Scene,
  level: LevelData,
  widthPx: number,
  heightPx: number,
  textures?: GameTextures,
): void {
  if (level.skybox) {
    scene.add(
      new Actor({
        x: widthPx / 2,
        y: heightPx / 2,
        width: widthPx,
        height: heightPx,
        color: Color.fromHex(level.skybox),
        collisionType: CollisionType.PreventCollision,
        z: -40,
      }),
    );
  }

  const preset = findBackgroundPreset(level.background);
  if (preset && textures) {
    addSceneryPreset(scene, preset, textures, widthPx, heightPx, -30, 1);
    return;
  }

  if (!level.skybox) {
    scene.add(
      new Actor({
        x: widthPx / 2,
        y: heightPx / 2,
        width: widthPx,
        height: heightPx,
        color: Color.fromHex(COLORS.fog),
        collisionType: CollisionType.PreventCollision,
        z: -40,
      }),
    );
  }
}

/**
 * Turns an act's level grid into live actors in a scene. Rendering and collision
 * both come from the tile definitions, so swapping art is a manifest-only
 * change. Returns the actors it added so the caller can place or recycle them.
 */
export function buildLevel(
  scene: Scene,
  level: LevelData,
  manifest: AssetManifest,
  textures?: GameTextures,
  options: BuildLevelOptions = {},
): Actor[] {
  const before = new Set(scene.actors);
  const tiles = tileIndex(manifest);
  const tileSize = level.tileSize;
  const widthPx = level.width * tileSize;
  const heightPx = level.height * tileSize;

  if (options.background !== false) {
    addBackground(scene, level, widthPx, heightPx, textures);
  }

  for (const layer of level.layers) {
    const grid = toGrid(layer.data, level.width, level.height);
    const runs = mergeHorizontal(grid, (id) => id !== EMPTY_TILE);
    for (const run of runs) {
      const def = tiles.get(run.id);
      if (!def) {
        continue;
      }
      if (layer.collide && def.collision !== 'none') {
        addSolid(scene, def, run, tileSize, textures);
      } else {
        const texture = tileTexture(def, textures);
        if (texture) {
          addTileGraphic(scene, texture, run, tileSize, 0);
        } else {
          scene.add(
            new Actor({
              x: (run.x + run.width / 2) * tileSize,
              y: (run.y + run.height / 2) * tileSize,
              width: run.width * tileSize,
              height: run.height * tileSize,
              color: Color.fromHex(def.color),
              collisionType: CollisionType.PreventCollision,
            }),
          );
        }
      }
    }
  }

  return scene.actors.filter((actor) => !before.has(actor));
}
