import { Actor, CollisionType, Color, Sprite, TiledSprite, type ImageSource, type Scene } from 'excalibur';
import type { GameTextures } from '../assets';
import { COLORS } from '../config';
import { ONEWAY_GROUP, SOLID_GROUP } from '../physics/collisionGroups';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { EMPTY_TILE, type LevelData } from './schema';
import { tileIndex, type AssetManifest, type TileDef } from './manifest';
import { tileSurfaceTop } from './surfaces';
import { mergeHorizontal, toGrid, type TileRun } from './tiles';
import { addSceneryPreset } from './scenery';
import { findBackgroundPreset, findForegroundPreset } from '../scenery';

const ONEWAY_THICKNESS = 12;
const CAP_HEIGHT = 6;

/**
 * Temporary tint for painted tile textures. The placeholder `color` is too dark
 * to multiply a light texture by, so art is tinted to a mid stone tone instead.
 */
const TILE_IMAGE_TINT = '#ffffff';

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
  def: TileDef,
  texture: ImageSource,
  run: TileRun,
  tileSize: number,
  tint: string,
  z: number,
): void {
  const displayHeight = def.half ? tileSize / 2 : tileSize;
  const displayTop = tileSurfaceTop(tileSize, run.y, def.half);
  const runWidth = run.width * tileSize;

  if (def.half) {
    const actor = new Actor({
      x: (run.x + run.width / 2) * tileSize,
      y: displayTop + displayHeight / 2,
      width: runWidth,
      height: displayHeight,
      collisionType: CollisionType.PreventCollision,
      z,
    });
    actor.graphics.use(
      new TiledSprite({
        image: texture,
        sourceView: { x: 0, y: 0, width: texture.width, height: texture.height },
        width: runWidth,
        height: displayHeight,
        tint: Color.fromHex(tint),
      }),
    );
    scene.add(actor);
    return;
  }

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
          tint: Color.fromHex(tint),
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
      width: runWidth,
      height: run.height * tileSize,
      tint: Color.fromHex(tint),
    }),
  );
  scene.add(actor);
}

/**
 * Free-standing props (gravestones, trees, statues) are drawn at their natural
 * aspect ratio and pinned to the bottom of the tile they were painted on.
 */
function addDecor(
  scene: Scene,
  def: TileDef,
  texture: ImageSource,
  run: TileRun,
  tileSize: number,
): void {
  const scale = def.scale ?? 1;
  const width = def.width ?? texture.width * scale;
  const height = def.height ?? texture.height * scale;
  const centerY =
    def.anchor === 'top' ? run.y * tileSize + height / 2 : (run.y + 1) * tileSize - height / 2;
  for (let x = run.x; x < run.x + run.width; x += 1) {
    const actor = new Actor({
      x: (x + 0.5) * tileSize,
      y: centerY,
      width,
      height,
      collisionType: CollisionType.PreventCollision,
      z: -1,
    });
    actor.graphics.use(
      new Sprite({
        image: texture,
        destSize: { width, height },
      }),
    );
    scene.add(actor);
  }
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

/** Returns the slope surface under the player, or null when not on a ramp. */
export type SlopeProbe = (
  centerX: number,
  feetY: number,
  halfWidth: number,
) => number | null;

export type MonsterVariant = 'ghost' | 'skeleton';

export interface BuiltLevel {
  widthPx: number;
  heightPx: number;
  spawn: { x: number; y: number };
  /** Undefined means the level has no pursuer. */
  monsterSpawn?: { x: number; y: number };
  monsterVariant?: MonsterVariant;
  memories: Memory[];
  exits: Exit[];
  groundProbe: GroundProbe;
  slopeProbe: SlopeProbe;
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
  const height = def.half ? tileSize / 2 : run.height * tileSize;
  const left = run.x * tileSize;
  const top = tileSurfaceTop(tileSize, run.y, def.half);
  const texture = tileTexture(def, textures);

  if (def.collision === 'oneway') {
    const thickness = Math.min(ONEWAY_THICKNESS, height);
    const body = new Actor({
      x: left + width / 2,
      y: top + thickness / 2,
      width,
      height: thickness,
      color: Color.fromHex(def.color),
      collisionType: CollisionType.Fixed,
      collisionGroup: ONEWAY_GROUP,
    });
    if (texture || def.hidden) {
      body.graphics.visible = false;
    }
    scene.add(body);
    if (texture && !def.hidden) {
      addTileGraphic(scene, def, texture, run, tileSize, TILE_IMAGE_TINT, 0);
    }
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
  if (texture || def.hidden) {
    // Painted or collision-only tiles own the visuals; keep the body invisible.
    body.graphics.visible = false;
  }
  scene.add(body);

  if (texture && !def.hidden) {
    addTileGraphic(scene, def, texture, run, tileSize, TILE_IMAGE_TINT, 0);
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
 * Paints the level-wide backdrop. The colour skybox is always laid down first;
 * a per-level scenery preset is then layered over it. Without either, the level
 * falls back to the flat fog rectangle.
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

/** Foreground scenery sits above the player and the pursuer. */
function addForeground(
  scene: Scene,
  level: LevelData,
  widthPx: number,
  heightPx: number,
  textures?: GameTextures,
): void {
  const preset = findForegroundPreset(level.foreground);
  if (preset && textures) {
    addSceneryPreset(scene, preset, textures, widthPx, heightPx, 40, 1);
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

  const solidTopAt = makeSurfaceGrid(level.width, level.height);
  const oneWayTopAt = makeSurfaceGrid(level.width, level.height);
  const slopes: { x0: number; x1: number; y0: number; y1: number }[] = [];

  // Record the actual top surface of every landable tile.
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
        const target = def.collision === 'oneway' ? oneWayTopAt[y] : solidTopAt[y];
        if (target) {
          target[x] = tileSurfaceTop(tileSize, y, def.half);
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
      const solidTop = solidTopAt[tileY]?.[x];
      if (solidTop !== undefined && solidTop >= 0 && feetY >= solidTop - 1 && feetY <= solidTop + 4) {
        return true;
      }
      const oneWayTop = oneWayTopAt[tileY]?.[x];
      if (
        !ignoreOneWay &&
        oneWayTop !== undefined &&
        oneWayTop >= 0 &&
        feetY >= oneWayTop - 1 &&
        feetY <= oneWayTop + 4
      ) {
        return true;
      }
    }
    return false;
  };

  const slopeProbe: SlopeProbe = (centerX, feetY) => {
    let best: number | null = null;
    for (const slope of slopes) {
      if (centerX < slope.x0 || centerX > slope.x1) {
        continue;
      }
      const t = (centerX - slope.x0) / (slope.x1 - slope.x0);
      const surfaceY = slope.y0 + (slope.y1 - slope.y0) * t;
      const distance = Math.abs(surfaceY - feetY);
      if (distance <= 40 && (best === null || distance < Math.abs(best - feetY))) {
        best = surfaceY;
      }
    }
    return best;
  };

  addBackground(scene, level, widthPx, heightPx, textures);
  addForeground(scene, level, widthPx, heightPx, textures);
  addWorldBounds(scene, widthPx, heightPx);

  for (const layer of level.layers) {
    const grid = toGrid(layer.data, level.width, level.height);
    const runs = mergeHorizontal(grid, (id) => id !== EMPTY_TILE);
    for (const run of runs) {
      const def = tiles.get(run.id);
      if (!def) {
        continue;
      }
      if (def.slope) {
        const offset = def.slopeOffset ?? 16;
        const rise = def.slopeRise ?? 12;
        for (let x = run.x; x < run.x + run.width; x += 1) {
          const top = run.y * tileSize;
          const yLeft = def.slope === 'up' ? top + offset + rise : top + offset;
          const yRight = def.slope === 'up' ? top + offset : top + offset + rise;
          slopes.push({
            x0: x * tileSize,
            x1: (x + 1) * tileSize,
            y0: yLeft,
            y1: yRight,
          });
        }
      }
      if (layer.collide && def.collision !== 'none') {
        addSolid(scene, def, run, tileSize, textures);
      } else {
        const texture = tileTexture(def, textures);
        if (def.decor && texture) {
          addDecor(scene, def, texture, run, tileSize);
        } else if (texture) {
          addTileGraphic(scene, def, texture, run, tileSize, TILE_IMAGE_TINT, 0);
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
  let monsterVariant: MonsterVariant | undefined;
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
        monsterVariant = 'ghost';
        break;
      case 'skeleton':
        monsterSpawn = { x, y };
        monsterVariant = 'skeleton';
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
    monsterVariant,
    memories,
    exits,
    groundProbe,
    slopeProbe,
  };
}

function makeSurfaceGrid(width: number, height: number): number[][] {
  const rows: number[][] = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(new Array<number>(width).fill(-1));
  }
  return rows;
}
