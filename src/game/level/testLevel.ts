import type { EntitySpot, TileRect } from './geometry';

/** The in-memory shape of a level. M2 will persist this as JSON. */
export interface LevelData {
  name: string;
  widthTiles: number;
  heightTiles: number;
  solid: TileRect[];
  oneWay: TileRect[];
  spawn: EntitySpot;
  exit: EntitySpot;
  memories: EntitySpot[];
}

/**
 * M1 test course. Two ground runs split by a pit, a stack of one-way planks to
 * climb, a raised block, and six memories to gather before the exit.
 */
export const TEST_LEVEL: LevelData = {
  name: 'Test Course',
  widthTiles: 40,
  heightTiles: 18,
  solid: [
    { x: 0, y: 15, width: 8, height: 3 },
    { x: 18, y: 15, width: 22, height: 3 },
    { x: 24, y: 12, width: 2, height: 3 },
    { x: 34, y: 13, width: 2, height: 2 },
  ],
  oneWay: [
    { x: 9, y: 13, width: 3, height: 1 },
    { x: 13, y: 11, width: 3, height: 1 },
    { x: 16, y: 9, width: 3, height: 1 },
    { x: 28, y: 12, width: 4, height: 1 },
  ],
  spawn: { x: 3, y: 14 },
  exit: { x: 38, y: 14 },
  memories: [
    { x: 3, y: 12 },
    { x: 35, y: 12 },
    { x: 10, y: 11 },
    { x: 14, y: 9 },
    { x: 17, y: 7 },
    { x: 29, y: 10 },
  ],
};
