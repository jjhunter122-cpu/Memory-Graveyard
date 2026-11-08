/**
 * The asset manifest: how logical tile ids become art and collision.
 *
 * Until real tilesets arrive, every tile uses a flat placeholder `color`. When a
 * tileset is added later, fill in `image` (and optional `source` rect) and the
 * loader can render sprites instead — tile ids and levels stay unchanged.
 */

export type CollisionKind = 'none' | 'solid' | 'oneway';

export interface TileDef {
  id: number;
  name: string;
  collision: CollisionKind;
  /** Placeholder fill colour, used until real art exists. */
  color: string;
  /** Optional lighter cap drawn along the top edge of solid tiles. */
  cap?: string;
  /** Optional image path (relative to the manifest) for real art. */
  image?: string;
  /** Optional source rect within `image`, defaulting to a full tile. */
  source?: { x: number; y: number; width: number; height: number };
  /** Draw this tile as a free-standing prop anchored to the tile's bottom edge. */
  decor?: boolean;
  /** Optional display width for decor art, in pixels. */
  width?: number;
  /** Optional display height for decor art, in pixels. */
  height?: number;
  /** Optional multiplier used when `width` / `height` are not supplied. */
  scale?: number;
  /** Which tile edge decor art is pinned to. Defaults to bottom. */
  anchor?: 'bottom' | 'top';
  /** Restrict collision and art to one 16px half of the tile. */
  half?: 'top' | 'bottom';
  /** Marks this tile as a walkable ramp surface. */
  slope?: 'up' | 'down';
  /** Distance from the tile top to the high end of a slope surface. */
  slopeOffset?: number;
  /** Vertical rise across the width of a slope tile. */
  slopeRise?: number;
}

export interface Tileset {
  name: string;
  tiles: TileDef[];
}

export interface AssetManifest {
  version: number;
  tileSize: number;
  tilesets: Tileset[];
}

export const MANIFEST_VERSION = 1;

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

const COLLISION_KINDS: readonly CollisionKind[] = ['none', 'solid', 'oneway'];

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ManifestValidationError(`${what} must be an object`);
  }
  return value as Record<string, unknown>;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function validateTile(raw: unknown, index: number): TileDef {
  const tile = asRecord(raw, `tile ${index}`);
  if (!isPositiveInteger(tile.id)) {
    throw new ManifestValidationError(`tile ${index} needs a positive integer id`);
  }
  const name = tile.name;
  if (typeof name !== 'string' || name.length === 0) {
    throw new ManifestValidationError(`tile ${tile.id} needs a non-empty name`);
  }
  const collision = tile.collision;
  if (
    typeof collision !== 'string' ||
    !COLLISION_KINDS.includes(collision as CollisionKind)
  ) {
    throw new ManifestValidationError(
      `tile ${tile.id} collision must be one of ${COLLISION_KINDS.join(', ')}`,
    );
  }
  const color = tile.color;
  if (typeof color !== 'string' || color.length === 0) {
    throw new ManifestValidationError(`tile ${tile.id} needs a placeholder colour`);
  }

  const def: TileDef = {
    id: tile.id,
    name,
    collision: collision as CollisionKind,
    color,
  };
  if (typeof tile.cap === 'string') {
    def.cap = tile.cap;
  }
  if (typeof tile.image === 'string') {
    def.image = tile.image;
  }
  const source = tile.source;
  if (source !== undefined) {
    const rect = asRecord(source, `tile ${tile.id} source`);
    if (
      !isPositiveInteger(rect.width) ||
      !isPositiveInteger(rect.height) ||
      typeof rect.x !== 'number' ||
      typeof rect.y !== 'number'
    ) {
      throw new ManifestValidationError(`tile ${tile.id} source must be a numeric rect`);
    }
    def.source = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }
  if (tile.decor === true) {
    def.decor = true;
  }
  if (tile.width !== undefined) {
    if (!isPositiveNumber(tile.width)) {
      throw new ManifestValidationError(`tile ${tile.id} width must be a positive number`);
    }
    def.width = tile.width;
  }
  if (tile.height !== undefined) {
    if (!isPositiveNumber(tile.height)) {
      throw new ManifestValidationError(`tile ${tile.id} height must be a positive number`);
    }
    def.height = tile.height;
  }
  if (tile.scale !== undefined) {
    if (!isPositiveNumber(tile.scale)) {
      throw new ManifestValidationError(`tile ${tile.id} scale must be a positive number`);
    }
    def.scale = tile.scale;
  }
  if (tile.anchor !== undefined) {
    if (tile.anchor !== 'bottom' && tile.anchor !== 'top') {
      throw new ManifestValidationError(`tile ${tile.id} anchor must be bottom or top`);
    }
    def.anchor = tile.anchor;
  }
  if (tile.half !== undefined) {
    if (tile.half !== 'top' && tile.half !== 'bottom') {
      throw new ManifestValidationError(`tile ${tile.id} half must be top or bottom`);
    }
    def.half = tile.half;
  }
  if (tile.slope !== undefined) {
    if (tile.slope !== 'up' && tile.slope !== 'down') {
      throw new ManifestValidationError(`tile ${tile.id} slope must be up or down`);
    }
    def.slope = tile.slope;
  }
  if (tile.slopeOffset !== undefined) {
    if (!isNonNegativeNumber(tile.slopeOffset)) {
      throw new ManifestValidationError(`tile ${tile.id} slopeOffset must be non-negative`);
    }
    def.slopeOffset = tile.slopeOffset;
  }
  if (tile.slopeRise !== undefined) {
    if (!isPositiveNumber(tile.slopeRise)) {
      throw new ManifestValidationError(`tile ${tile.id} slopeRise must be a positive number`);
    }
    def.slopeRise = tile.slopeRise;
  }
  return def;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function validateManifest(raw: unknown): AssetManifest {
  const obj = asRecord(raw, 'manifest');
  if (obj.version !== MANIFEST_VERSION) {
    throw new ManifestValidationError(
      `unsupported manifest version ${String(obj.version)} (expected ${MANIFEST_VERSION})`,
    );
  }
  if (!isPositiveInteger(obj.tileSize)) {
    throw new ManifestValidationError('manifest tileSize must be a positive integer');
  }
  if (!Array.isArray(obj.tilesets) || obj.tilesets.length === 0) {
    throw new ManifestValidationError('manifest tilesets must be a non-empty array');
  }

  const tilesets: Tileset[] = obj.tilesets.map((rawTileset, setIndex) => {
    const tileset = asRecord(rawTileset, `tileset ${setIndex}`);
    const name = tileset.name;
    if (typeof name !== 'string' || name.length === 0) {
      throw new ManifestValidationError(`tileset ${setIndex} needs a non-empty name`);
    }
    if (!Array.isArray(tileset.tiles)) {
      throw new ManifestValidationError(`tileset ${name} must have a tiles array`);
    }
    const tiles = tileset.tiles.map((tile, tileIndex) => validateTile(tile, tileIndex));
    return { name, tiles };
  });

  const seen = new Set<number>();
  for (const tileset of tilesets) {
    for (const tile of tileset.tiles) {
      if (seen.has(tile.id)) {
        throw new ManifestValidationError(`duplicate tile id ${tile.id}`);
      }
      seen.add(tile.id);
    }
  }

  return { version: MANIFEST_VERSION, tileSize: obj.tileSize, tilesets };
}

/** Flat id -> tile lookup across every tileset. */
export function tileIndex(manifest: AssetManifest): Map<number, TileDef> {
  const index = new Map<number, TileDef>();
  for (const tileset of manifest.tilesets) {
    for (const tile of tileset.tiles) {
      index.set(tile.id, tile);
    }
  }
  return index;
}
