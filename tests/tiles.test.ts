import { describe, expect, it } from 'vitest';
import { fromGrid, mergeHorizontal, toGrid } from '../src/game/level/tiles';
import { EMPTY_TILE } from '../src/game/level/schema';

describe('tile grid', () => {
  it('reshapes flat data into rows and back', () => {
    const data = [1, 2, 3, 4, EMPTY_TILE, 6];
    const grid = toGrid(data, 3, 2);
    expect(grid.rows).toEqual([
      [1, 2, 3],
      [4, EMPTY_TILE, 6],
    ]);
    expect(fromGrid(grid)).toEqual(data);
  });

  it('fills missing entries with EMPTY_TILE', () => {
    const grid = toGrid([1], 2, 2);
    expect(grid.rows).toEqual([
      [1, EMPTY_TILE],
      [EMPTY_TILE, EMPTY_TILE],
    ]);
  });
});

describe('mergeHorizontal', () => {
  it('merges adjacent equal non-empty tiles into runs', () => {
    const grid = toGrid([1, 1, 1, EMPTY_TILE, 2, 2, 1, EMPTY_TILE, 1], 9, 1);
    expect(mergeHorizontal(grid, (id) => id !== EMPTY_TILE)).toEqual([
      { x: 0, y: 0, width: 3, height: 1, id: 1 },
      { x: 4, y: 0, width: 2, height: 1, id: 2 },
      { x: 6, y: 0, width: 1, height: 1, id: 1 },
      { x: 8, y: 0, width: 1, height: 1, id: 1 },
    ]);
  });

  it('only includes ids accepted by the predicate', () => {
    const grid = toGrid([1, 2, 1, 1], 4, 1);
    expect(mergeHorizontal(grid, (id) => id === 1)).toEqual([
      { x: 0, y: 0, width: 1, height: 1, id: 1 },
      { x: 2, y: 0, width: 2, height: 1, id: 1 },
    ]);
  });
});
