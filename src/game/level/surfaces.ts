/** Collision-surface helpers shared by the loader and tests. */

export type TileHalf = 'top' | 'bottom';

/**
 * Top of the collision surface for a tile, accounting for half-height tiles.
 * Full and top-half tiles use the cell top; bottom-half tiles use the cell
 * midpoint.
 */
export function tileSurfaceTop(
  tileSize: number,
  tileY: number,
  half?: TileHalf,
): number {
  return tileY * tileSize + (half === 'bottom' ? tileSize / 2 : 0);
}
