import {
  EMPTY_TILE,
  type LevelData,
  type LevelEntity,
} from '../game/level/schema';
import { CAMERA } from '../game/config';

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

export function setSkybox(level: LevelData, skybox: string | undefined): LevelData {
  if (level.skybox === skybox) {
    return level;
  }
  const next = { ...level };
  if (skybox === undefined) {
    delete next.skybox;
  } else {
    next.skybox = skybox;
  }
  return next;
}

export function setBackground(level: LevelData, id: string | undefined): LevelData {
  return setOptionalField(level, 'background', id);
}

export function setForeground(level: LevelData, id: string | undefined): LevelData {
  return setOptionalField(level, 'foreground', id);
}

export function setAnalogFx(level: LevelData, id: string | undefined): LevelData {
  return setOptionalField(level, 'analogFx', id);
}

/**
 * Sets the level-wide character height multiplier. The base scale (1) is the
 * default and is omitted from the document so existing levels stay unchanged.
 */
export function setCharacterScale(level: LevelData, scale: number): LevelData {
  const next = scale === 1 ? undefined : scale;
  if (level.characterScale === next) {
    return level;
  }
  const result = { ...level };
  if (next === undefined) {
    delete result.characterScale;
  } else {
    result.characterScale = next;
  }
  return result;
}

/**
 * Sets the level's camera zoom. The default gameplay zoom is omitted so
 * existing levels keep their current framing.
 */
export function setCameraZoom(level: LevelData, zoom: number): LevelData {
  const next = zoom === CAMERA.zoom ? undefined : zoom;
  if (level.cameraZoom === next) {
    return level;
  }
  const result = { ...level };
  if (next === undefined) {
    delete result.cameraZoom;
  } else {
    result.cameraZoom = next;
  }
  return result;
}

/** Sets the level's camera-follow preset. Current is the default and omitted. */
export function setCameraFollow(level: LevelData, id: string | undefined): LevelData {
  const next = id === 'current' || id === '' ? undefined : id;
  if (level.cameraFollow === next) {
    return level;
  }
  const result = { ...level };
  if (next === undefined) {
    delete result.cameraFollow;
  } else {
    result.cameraFollow = next;
  }
  return result;
}

function setOptionalField(
  level: LevelData,
  key: 'background' | 'foreground' | 'analogFx',
  value: string | undefined,
): LevelData {
  const next = value === '' || value === 'none' ? undefined : value;
  if (level[key] === next) {
    return level;
  }
  const result = { ...level };
  if (next === undefined) {
    delete result[key];
  } else {
    result[key] = next;
  }
  return result;
}

/** True when resizing to width x height would discard tiles or entities. */
export function hasContentOutside(
  level: LevelData,
  width: number,
  height: number,
): boolean {
  if (level.entities.some((entity) => entity.x >= width || entity.y >= height)) {
    return true;
  }
  for (const layer of level.layers) {
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        if (x < width && y < height) {
          continue;
        }
        if ((layer.data[y * level.width + x] ?? EMPTY_TILE) !== EMPTY_TILE) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Resizes in place from the top-left, preserving the overlapping content. */
export function resizeLevel(level: LevelData, width: number, height: number): LevelData {
  if (level.width === width && level.height === height) {
    return level;
  }
  const layers = level.layers.map((layer) => {
    const data = new Array<number>(width * height).fill(EMPTY_TILE);
    const copyWidth = Math.min(width, level.width);
    const copyHeight = Math.min(height, level.height);
    for (let y = 0; y < copyHeight; y += 1) {
      for (let x = 0; x < copyWidth; x += 1) {
        data[y * width + x] = layer.data[y * level.width + x] ?? EMPTY_TILE;
      }
    }
    return { ...layer, data };
  });
  return {
    ...level,
    width,
    height,
    layers,
    entities: level.entities.filter((entity) => entity.x < width && entity.y < height),
  };
}

/** Blanks every layer and removes all entities. */
export function clearLevel(level: LevelData): LevelData {
  const empty = new Array(level.width * level.height).fill(EMPTY_TILE) as number[];
  const layers = level.layers.map((layer) => ({ ...layer, data: empty.slice() }));
  return { ...level, layers, entities: [] };
}
