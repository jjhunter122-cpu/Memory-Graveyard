import { TILE } from '../config';

/** A rectangular run of tiles, in tile coordinates (top-left origin). */
export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single point, in tile coordinates. */
export interface EntitySpot {
  x: number;
  y: number;
}

export function tileCenterX(tileX: number): number {
  return tileX * TILE + TILE / 2;
}

export function tileCenterY(tileY: number): number {
  return tileY * TILE + TILE / 2;
}

export function rectPixelWidth(rect: TileRect): number {
  return rect.width * TILE;
}

export function rectPixelHeight(rect: TileRect): number {
  return rect.height * TILE;
}

export function rectCenterX(rect: TileRect): number {
  return (rect.x + rect.width / 2) * TILE;
}

export function rectCenterY(rect: TileRect): number {
  return (rect.y + rect.height / 2) * TILE;
}
