import { Actor, CollisionType, Color, type Scene } from 'excalibur';
import { COLORS } from '../config';
import { ONEWAY_GROUP, SOLID_GROUP } from '../physics/collisionGroups';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { EMPTY_TILE, type LevelData } from './schema';
import { tileIndex, type AssetManifest, type TileDef } from './manifest';
import { mergeHorizontal, toGrid } from './tiles';

const ONEWAY_THICKNESS = 12;
const CAP_HEIGHT = 6;

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
  memories: Memory[];
  exits: Exit[];
  groundProbe: GroundProbe;
}

function tileCenter(tile: number, tileSize: number): number {
  return tile * tileSize + tileSize / 2;
}

function addSolid(scene: Scene, def: TileDef, run: { x: number; y: number; width: number; height: number }, tileSize: number): void {
  const width = run.width * tileSize;
  const height = run.height * tileSize;
  const left = run.x * tileSize;
  const top = run.y * tileSize;

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

  scene.add(
    new Actor({
      x: left + width / 2,
      y: top + height / 2,
      width,
      height,
      color: Color.fromHex(def.color),
      collisionType: CollisionType.Fixed,
      collisionGroup: SOLID_GROUP,
    }),
  );

  if (def.cap) {
    scene.add(
      new Actor({
        x: left + width / 2,
        y: top + CAP_HEIGHT / 2,
        width,
        height: CAP_HEIGHT,
        color: Color.fromHex(def.cap),
        collisionType: CollisionType.PreventCollision,
      }),
    );
  }
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

  for (const layer of level.layers) {
    const grid = toGrid(layer.data, level.width, level.height);
    const runs = mergeHorizontal(grid, (id) => id !== EMPTY_TILE);
    for (const run of runs) {
      const def = tiles.get(run.id);
      if (!def) {
        continue;
      }
      if (layer.collide && def.collision !== 'none') {
        addSolid(scene, def, run, tileSize);
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

  const memories: Memory[] = [];
  const exits: Exit[] = [];
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
      default:
        // Unknown entity types are ignored for forward compatibility.
        break;
    }
  }

  return { widthPx, heightPx, spawn, memories, exits, groundProbe };
}

function makeGrid(width: number, height: number): boolean[][] {
  const rows: boolean[][] = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(new Array<boolean>(width).fill(false));
  }
  return rows;
}
