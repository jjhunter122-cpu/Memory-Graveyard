/**
 * The persisted level format (v1) and its validator.
 *
 * A level is a small versioned JSON document: a grid of tile ids per layer
 * plus a list of entities. Nothing here imports Excalibur, so the format can be
 * validated and round-tripped in tests and reused by the editor (M3).
 */

import { isCameraFollowId } from '../camera/cameraFollowSettings';

export const LEVEL_VERSION = 1;

/** Tile id used for "nothing here". */
export const EMPTY_TILE = -1;

export interface TileLayer {
  name: string;
  /** When true, tiles in this layer contribute collision bodies. */
  collide: boolean;
  /** Row-major, `width * height` entries of tile ids (or EMPTY_TILE). */
  data: number[];
}

export interface LevelEntity {
  type: string;
  /** Tile coordinates. */
  x: number;
  y: number;
}

/** Playable rectangle in tile coordinates. The rest of the canvas is scenery. */
export interface PlayArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  version: number;
  name: string;
  tileSize: number;
  width: number;
  height: number;
  layers: TileLayer[];
  entities: LevelEntity[];
  /** Optional playable rectangle. Missing means the whole canvas is playable. */
  playArea?: PlayArea;
  /** Optional solid skybox colour behind the level. */
  skybox?: string;
  /** Optional background scenery preset id. */
  background?: string;
  /** Optional foreground scenery preset id. */
  foreground?: string;
  /** Optional analog-horror screen FX preset id. */
  analogFx?: string;
  /** Optional looping ambience track id. Missing means no ambience. */
  ambience?: string;
  /**
   * Character height multiplier for this level. 1 is the existing baseline;
   * 1.5, 1.75 and 2 make both the player and the monster that tall in tiles.
   */
  characterScale?: number;
  /** Optional world zoom. Lower pulls the camera back and shows more level. */
  cameraZoom?: number;
  /** Optional camera-follow preset id. */
  cameraFollow?: string;
}

export class LevelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelValidationError';
  }
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LevelValidationError(`${what} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function validateLevel(raw: unknown): LevelData {
  const obj = asRecord(raw, 'level');

  if (obj.version !== LEVEL_VERSION) {
    throw new LevelValidationError(
      `unsupported level version ${String(obj.version)} (expected ${LEVEL_VERSION})`,
    );
  }

  const name = obj.name;
  if (typeof name !== 'string' || name.length === 0) {
    throw new LevelValidationError('level name must be a non-empty string');
  }

  const tileSize = obj.tileSize;
  if (!isInteger(tileSize) || tileSize <= 0) {
    throw new LevelValidationError('tileSize must be a positive integer');
  }

  const width = obj.width;
  if (!isInteger(width) || width <= 0) {
    throw new LevelValidationError('width must be a positive integer');
  }

  const height = obj.height;
  if (!isInteger(height) || height <= 0) {
    throw new LevelValidationError('height must be a positive integer');
  }

  const expected = width * height;

  if (!Array.isArray(obj.layers) || obj.layers.length === 0) {
    throw new LevelValidationError('layers must be a non-empty array');
  }
  const layers: TileLayer[] = obj.layers.map((rawLayer, index) => {
    const layer = asRecord(rawLayer, `layer ${index}`);
    const layerName = layer.name;
    if (typeof layerName !== 'string' || layerName.length === 0) {
      throw new LevelValidationError(`layer ${index} needs a non-empty name`);
    }
    if (!Array.isArray(layer.data) || layer.data.length !== expected) {
      throw new LevelValidationError(
        `layer ${index} data must have ${expected} entries (width * height)`,
      );
    }
    const data: number[] = layer.data.map((tile, tileIndex) => {
      if (!isInteger(tile) || tile < EMPTY_TILE) {
        throw new LevelValidationError(
          `layer ${index} has an invalid tile id at index ${tileIndex}`,
        );
      }
      return tile;
    });
    return { name: layerName, collide: layer.collide === true, data };
  });

  const rawEntities = obj.entities ?? [];
  if (!Array.isArray(rawEntities)) {
    throw new LevelValidationError('entities must be an array');
  }
  const entities: LevelEntity[] = rawEntities.map((rawEntity, index) => {
    const entity = asRecord(rawEntity, `entity ${index}`);
    const type = entity.type;
    if (typeof type !== 'string' || type.length === 0) {
      throw new LevelValidationError(`entity ${index} needs a non-empty type`);
    }
    if (!isInteger(entity.x) || !isInteger(entity.y)) {
      throw new LevelValidationError(`entity ${index} needs integer x/y tile coordinates`);
    }
    return { type, x: entity.x, y: entity.y };
  });

  const result: LevelData = {
    version: LEVEL_VERSION,
    name,
    tileSize,
    width,
    height,
    layers,
    entities,
  };
  if (obj.playArea !== undefined) {
    const area = asRecord(obj.playArea, 'playArea');
    if (
      !isInteger(area.x) ||
      !isInteger(area.y) ||
      !isInteger(area.width) ||
      !isInteger(area.height) ||
      area.width <= 0 ||
      area.height <= 0 ||
      area.x < 0 ||
      area.y < 0 ||
      area.x + area.width > width ||
      area.y + area.height > height
    ) {
      throw new LevelValidationError('playArea must fit inside the level canvas');
    }
    result.playArea = {
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
    };
  }
  if (obj.skybox !== undefined) {
    if (typeof obj.skybox !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(obj.skybox)) {
      throw new LevelValidationError('skybox must be a six-digit hex colour');
    }
    result.skybox = obj.skybox;
  }
  for (const key of ['background', 'foreground', 'analogFx', 'ambience'] as const) {
    const value = obj[key];
    if (value !== undefined) {
      if (typeof value !== 'string' || value.length === 0) {
        throw new LevelValidationError(`${key} must be a non-empty string`);
      }
      result[key] = value;
    }
  }
  if (obj.characterScale !== undefined) {
    const scale = obj.characterScale;
    if (scale !== 1 && scale !== 1.5 && scale !== 1.75 && scale !== 2) {
      throw new LevelValidationError('characterScale must be 1, 1.5, 1.75 or 2');
    }
    result.characterScale = scale;
  }
  if (obj.cameraZoom !== undefined) {
    const zoom = obj.cameraZoom;
    if (typeof zoom !== 'number' || !Number.isFinite(zoom) || zoom < 0.5 || zoom > 2) {
      throw new LevelValidationError('cameraZoom must be a number between 0.5 and 2');
    }
    result.cameraZoom = zoom;
  }
  if (obj.cameraFollow !== undefined) {
    if (!isCameraFollowId(obj.cameraFollow)) {
      throw new LevelValidationError(
        'cameraFollow must be current, soft, momentum or impact',
      );
    }
    result.cameraFollow = obj.cameraFollow;
  }
  return result;
}

/** Returns the level play rectangle, defaulting to the whole canvas. */
export function resolvePlayArea(level: LevelData): PlayArea {
  return (
    level.playArea ?? {
      x: 0,
      y: 0,
      width: level.width,
      height: level.height,
    }
  );
}

export function parseLevel(text: string): LevelData {  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new LevelValidationError(`level is not valid JSON: ${String(error)}`);
  }
  return validateLevel(raw);
}

export function serializeLevel(level: LevelData): string {
  return `${JSON.stringify(level, null, 2)}\n`;
}

/** Builds a level with a single empty terrain layer. */
export function createLevel(
  name: string,
  width: number,
  height: number,
  tileSize: number,
): LevelData {
  return {
    version: LEVEL_VERSION,
    name,
    tileSize,
    width,
    height,
    layers: [
      { name: 'terrain', collide: true, data: new Array(width * height).fill(EMPTY_TILE) },
    ],
    entities: [],
  };
}
