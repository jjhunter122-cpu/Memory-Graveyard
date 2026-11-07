import { Actor, CollisionType, Color, Sprite, TiledSprite, type ImageSource, type Scene } from 'excalibur';
import type { GameTextures } from '../assets';
import { COLORS } from '../config';
import { ONEWAY_GROUP, SOLID_GROUP } from '../physics/collisionGroups';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { EMPTY_TILE, type LevelData } from './schema';
import { tileIndex, type AssetManifest, type TileDef } from './manifest';
import { mergeHorizontal, toGrid, type TileRun } from './tiles';

const ONEWAY_THICKNESS = 12;
const CAP_HEIGHT = 6;

/**
 * Temporary tint for painted tile textures. The placeholder `color` is too dark
 * to multiply a light texture by, so art is tinted to a mid stone tone instead.
 */
const TILE_IMAGE_TINT = '#9aa0b8';
const BACKGROUND_IMAGE_TINT = '#7d8299';

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
  tint: string,
  z: number,
): void {
  const variantX = (run.x * 37 + run.y * 17) % 4;
  const variantY = (run.x * 11 + run.y * 29) % 4;
  const sourceSize = Math.min(tileSize, texture.width, texture.height);
  const actor = new Actor({
    x: (run.x + run.width / 2) * tileSize,
    y: (run.y + run.height / 2) * tileSize,
    width: run.width * tileSize,
    height: run.height * tileSize,
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
      width: run.width * tileSize,
      height: run.height * tileSize,
      tint: Color.fromHex(tint),
    }),
  );
  scene.add(actor);
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

export interface BuiltLevel {
  widthPx: number;
  heightPx: number;
  spawn: { x: number; y: number };
  /** Undefined means the level has no pursuer. */
  monsterSpawn?: { x: number; y: number };
  memories: Memory[];
  exits: Exit[];
  groundProbe: GroundProbe;
}

function tileCenter(tile: number, tileSize: number): number {
  return tile * tileSize + tileSize / 2;
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

  if (def.collision === 'oneway') {
    const thickness = Math.min(ONEWAY_THICKNESS, tileSize);
    scene.add(
      new Actor({
        x: left + width / 2,
        y: top + thickness / 2,
        width,
        height: thickness,
        color: Color.fromHex(def.color),
        collisionType: CollisionType.Fixed,
        collisionGroup: ONEWAY_GROUP,
      }),
    );
    return;
  }

  const body = new Actor({
    x: left + width / 2,
    y: top + height / 2,
    width,
    height,
    color: Color.fromHex(def.color),
    collisionType: CollisionType.Fixed,
    collisionGroup: SOLID_GROUP,
  });
  if (texture) {
    // Painted tiles own the visuals; keep the collision body invisible.
    body.graphics.visible = false;
  }
  scene.add(body);

  if (texture) {
    addTileGraphic(scene, texture, run, tileSize, TILE_IMAGE_TINT, 0);
  }

  if (def.cap) {
    scene.add(
      new Actor({
        x: left + width / 2,
        y: top + CAP_HEIGHT / 2,
        width,
        height: CAP_HEIGHT,
        color: Color.fromHex(def.cap),
        collisionType: CollisionType.PreventCollision,
        z: 1,
      }),
    );
  }
}

/**
 * Paints the level-wide backdrop. With art it is a row of wallpapered sprites;
 * without art it falls back to the flat fog rectangle.
 */
function addBackground(
  scene: Scene,
  widthPx: number,
  heightPx: number,
  textures?: GameTextures,
  skybox?: string,
): void {
  if (skybox) {
    scene.add(
      new Actor({
        x: widthPx / 2,
        y: heightPx / 2,
        width: widthPx,
        height: heightPx,
        color: Color.fromHex(skybox),
        collisionType: CollisionType.PreventCollision,
        z: -1,
      }),
    );
    return;
  }

  const background = textures?.background;
  if (!background) {
    scene.add(
      new Actor({
        x: widthPx / 2,
        y: heightPx / 2,
        width: widthPx,
        height: heightPx,
        color: Color.fromHex(COLORS.fog),
        collisionType: CollisionType.PreventCollision,
        z: -1,
      }),
    );
    return;
  }

  // Painted sprites instead of one giant TiledSprite: a plain Sprite uploads
  // immediately and avoids a first-frame draw-list quirk with large repeats.
  const tile = Math.max(256, heightPx);
  const columns = Math.ceil(widthPx / tile);
  for (let column = 0; column < columns; column += 1) {
    const actor = new Actor({
      x: column * tile + tile / 2,
      y: heightPx / 2,
      width: tile,
      height: tile,
      collisionType: CollisionType.PreventCollision,
      z: 0,
    });
    actor.graphics.use(
      new Sprite({
        image: background,
        destSize: { width: tile, height: tile },
        tint: Color.fromHex(BACKGROUND_IMAGE_TINT),
        opacity: 0.5,
      }),
    );
    scene.add(actor);
  }
}

/**
 * Invisible solid side walls. The top and bottom stay open; PlayScene's fall
 * check is the kill plane below the level.
 */
function addWorldBounds(scene: Scene, widthPx: number, heightPx: number): void {
  const thickness = 32;
  const wall = (x: number, y: number, width: number, height: number): void => {
    const actor = new Actor({
      x,
      y,
      width,
      height,
      color: Color.fromHex('#000000'),
      collisionType: CollisionType.Fixed,
      collisionGroup: SOLID_GROUP,
    });
    actor.graphics.visible = false;
    scene.add(actor);
  };

  wall(-thickness / 2, heightPx / 2, thickness, heightPx + thickness * 2);
  wall(
    widthPx + thickness / 2,
    heightPx / 2,
    thickness,
    heightPx + thickness * 2,
  );
}

/**
 * Turns level JSON + an asset manifest into live actors in a scene.
 * Rendering and collision both come from the tile definitions, so swapping in
 * real art later is a manifest-only change.
 */
export function buildLevel(
  scene: Scene,
  level: LevelData,
  manifest: AssetManifest,
  textures?: GameTextures,
): BuiltLevel {
  const tiles = tileIndex(manifest);
  const tileSize = level.tileSize;
  const widthPx = level.width * tileSize;
  const heightPx = level.height * tileSize;

  const solidAt = makeGrid(level.width, level.height);
  const oneWayAt = makeGrid(level.width, level.height);

  // Record which tiles are landable, for the deterministic ground probe.
  for (const layer of level.layers) {
    if (!layer.collide) {
      continue;
    }
    const grid = toGrid(layer.data, level.width, level.height);
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const id = grid.rows[y]?.[x] ?? EMPTY_TILE;
        const def = tiles.get(id);
        if (!def || def.collision === 'none') {
          continue;
        }
        const target = def.collision === 'oneway' ? oneWayAt[y] : solidAt[y];
        if (target) {
          target[x] = true;
        }
      }
    }
  }

  const groundProbe: GroundProbe = (centerX, feetY, halfWidth, ignoreOneWay) => {
    const tileY = Math.floor((feetY + 1) / tileSize);
    if (tileY < 0 || tileY >= level.height) {
      return false;
    }
    const left = Math.floor((centerX - halfWidth + 2) / tileSize);
    const right = Math.floor((centerX + halfWidth - 2) / tileSize);
    for (let x = left; x <= right; x += 1) {
      if (x < 0 || x >= level.width) {
        continue;
      }
      if (solidAt[tileY]?.[x]) {
        return true;
      }
      if (!ignoreOneWay && oneWayAt[tileY]?.[x]) {
        return true;
      }
    }
    return false;
  };

  addBackground(scene, widthPx, heightPx, textures, level.skybox);
  addWorldBounds(scene, widthPx, heightPx);

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
          addTileGraphic(scene, texture, run, tileSize, TILE_IMAGE_TINT, 0);
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

  const memories: Memory[] = [];
  const exits: Exit[] = [];
  let monsterSpawn: { x: number; y: number } | undefined;
  let spawn = {
    x: tileCenter(Math.floor(level.width / 2), tileSize),
    y: tileCenter(Math.floor(level.height / 2), tileSize),
  };

  for (const entity of level.entities) {
    const x = tileCenter(entity.x, tileSize);
    const y = tileCenter(entity.y, tileSize);
    switch (entity.type) {
      case 'spawn':
        spawn = { x, y };
        break;
      case 'memory': {
        const memory = new Memory(x, y);
        memories.push(memory);
        scene.add(memory);
        break;
      }
      case 'exit': {
        const exit = new Exit(x, y);
        exits.push(exit);
        scene.add(exit);
        break;
      }
      case 'monster':
        monsterSpawn = { x, y };
        break;
      default:
        // Unknown entity types are ignored for forward compatibility.
        break;
    }
  }

  return {
    widthPx,
    heightPx,
    spawn,
    monsterSpawn,
    memories,
    exits,
    groundProbe,
  };
}

function makeGrid(width: number, height: number): boolean[][] {
  const rows: boolean[][] = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(new Array<boolean>(width).fill(false));
  }
  return rows;
}
