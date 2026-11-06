import {
  EMPTY_TILE,
  type LevelData,
  type LevelEntity,
} from '../game/level/schema';

/** Immutable level-document operations used by the editor. */

export function inBounds(level: LevelData, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

export function tileAt(
  level: LevelData,
  layerIndex: number,
  x: number,
  y: number,
): number {
  const layer = level.layers[layerIndex];
  if (!layer || !inBounds(level, x, y)) {
    return EMPTY_TILE;
  }
  return layer.data[y * level.width + x] ?? EMPTY_TILE;
}

/** Returns a new level with one tile changed (or the same level if unchanged). */
export function setTile(
  level: LevelData,
  layerIndex: number,
  x: number,
  y: number,
  tileId: number,
): LevelData {
  const layer = level.layers[layerIndex];
  if (!layer || !inBounds(level, x, y)) {
    return level;
  }
  const index = y * level.width + x;
  if ((layer.data[index] ?? EMPTY_TILE) === tileId) {
    return level;
  }
  const data = layer.data.slice();
  data[index] = tileId;
  const layers = level.layers.map((candidate, i) =>
    i === layerIndex ? { ...candidate, data } : candidate,
  );
  return { ...level, layers };
}

export function entitiesAt(level: LevelData, x: number, y: number): LevelEntity[] {
  return level.entities.filter((entity) => entity.x === x && entity.y === y);
}

/** Adds an entity. Placing a second spawn replaces the first. */
export function addEntity(
  level: LevelData,
  type: string,
  x: number,
  y: number,
): LevelData {
  if (!inBounds(level, x, y)) {
    return level;
  }
  const base =
    type === 'spawn'
      ? level.entities.filter((entity) => entity.type !== 'spawn')
      : level.entities;
  return { ...level, entities: [...base, { type, x, y }] };
}

/** Removes every entity sitting on a tile. */
export function removeEntitiesAt(level: LevelData, x: number, y: number): LevelData {
  const entities = level.entities.filter(
    (entity) => !(entity.x === x && entity.y === y),
  );
  if (entities.length === level.entities.length) {
    return level;
  }
  return { ...level, entities };
}

export function renameLevel(level: LevelData, name: string): LevelData {
  return { ...level, name };
}

/** Blanks every layer and removes all entities. */
export function clearLevel(level: LevelData): LevelData {
  const empty = new Array(level.width * level.height).fill(EMPTY_TILE) as number[];
  const layers = level.layers.map((layer) => ({ ...layer, data: empty.slice() }));
  return { ...level, layers, entities: [] };
}
