/**
 * The level grid used by the endless runner. Each act is a small in-memory
 * level: one terrain layer plus an optional backdrop id. Nothing here imports
 * Excalibur, so the format can be validated in tests.
 */

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

export interface LevelData {
  version: number;
  name: string;
  tileSize: number;
  width: number;
  height: number;
  layers: TileLayer[];
  /** Optional solid skybox colour behind the level. */
  skybox?: string;
  /** Optional background scenery preset id. */
  background?: string;
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

  const result: LevelData = {
    version: LEVEL_VERSION,
    name,
    tileSize,
    width,
    height,
    layers,
  };
  if (obj.skybox !== undefined) {
    if (typeof obj.skybox !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(obj.skybox)) {
      throw new LevelValidationError('skybox must be a six-digit hex colour');
    }
    result.skybox = obj.skybox;
  }
  if (obj.background !== undefined) {
    if (typeof obj.background !== 'string' || obj.background.length === 0) {
      throw new LevelValidationError('background must be a non-empty string');
    }
    result.background = obj.background;
  }
  return result;
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
  };
}
