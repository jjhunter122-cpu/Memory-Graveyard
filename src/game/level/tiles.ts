import { EMPTY_TILE } from './schema';

export interface TileGrid {
  width: number;
  height: number;
  rows: number[][];
}

/** Reshapes a layer's flat row-major data into a 2D grid. */
export function toGrid(data: readonly number[], width: number, height: number): TileGrid {
  const rows: number[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < width; x += 1) {
      row.push(data[y * width + x] ?? EMPTY_TILE);
    }
    rows.push(row);
  }
  return { width, height, rows };
}

/** Flattens a grid back into row-major layer data. */
export function fromGrid(grid: TileGrid): number[] {
  const data: number[] = [];
  for (const row of grid.rows) {
    for (let x = 0; x < grid.width; x += 1) {
      data.push(row[x] ?? EMPTY_TILE);
    }
  }
  return data;
}

export interface TileRun {
  /** Tile coordinates of the run's top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}

/**
 * Merges adjacent, equal tiles in each row into runs. Used to keep actor counts
 * low when rendering placeholder rectangles and building collision bodies.
 */
export function mergeHorizontal(
  grid: TileGrid,
  include: (id: number) => boolean,
): TileRun[] {
  const runs: TileRun[] = [];
  grid.rows.forEach((row, y) => {
    let x = 0;
    while (x < grid.width) {
      const id = row[x] ?? EMPTY_TILE;
      if (!include(id)) {
        x += 1;
        continue;
      }
      let width = 1;
      while (x + width < grid.width && (row[x + width] ?? EMPTY_TILE) === id) {
        width += 1;
      }
      runs.push({ x, y, width, height: 1, id });
      x += width;
    }
  });
  return runs;
}
