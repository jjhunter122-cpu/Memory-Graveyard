import { describe, expect, it } from 'vitest';
import { TILE } from '../src/game/config';
import {
  rectCenterX,
  rectPixelHeight,
  rectPixelWidth,
  tileCenterX,
  tileCenterY,
} from '../src/game/level/geometry';
import { TEST_LEVEL } from '../src/game/level/testLevel';
import type { TileRect } from '../src/game/level/geometry';

const allRects: TileRect[] = [...TEST_LEVEL.solid, ...TEST_LEVEL.oneWay];

describe('level geometry helpers', () => {
  it('centres entities inside a tile', () => {
    expect(tileCenterX(0)).toBe(TILE / 2);
    expect(tileCenterY(2)).toBe(2 * TILE + TILE / 2);
  });

  it('converts tile rects to pixels', () => {
    expect(rectPixelWidth({ x: 0, y: 0, width: 3, height: 1 })).toBe(3 * TILE);
    expect(rectPixelHeight({ x: 0, y: 0, width: 3, height: 2 })).toBe(2 * TILE);
    expect(rectCenterX({ x: 0, y: 0, width: 2, height: 1 })).toBe(TILE);
  });
});

describe('test level layout', () => {
  it('has a sane size and something to stand on', () => {
    expect(TEST_LEVEL.widthTiles).toBeGreaterThan(0);
    expect(TEST_LEVEL.heightTiles).toBeGreaterThan(0);
    expect(TEST_LEVEL.solid.length).toBeGreaterThan(0);
  });

  it('keeps every tile rect inside the level bounds', () => {
    for (const rect of allRects) {
      expect(rect.x, `${rect.x}`).toBeGreaterThanOrEqual(0);
      expect(rect.y, `${rect.y}`).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(TEST_LEVEL.widthTiles);
      expect(rect.y + rect.height).toBeLessThanOrEqual(TEST_LEVEL.heightTiles);
    }
  });

  it('keeps spawn, exit and memories inside the level', () => {
    const spots = [TEST_LEVEL.spawn, TEST_LEVEL.exit, ...TEST_LEVEL.memories];
    for (const spot of spots) {
      expect(spot.x).toBeGreaterThanOrEqual(0);
      expect(spot.x).toBeLessThan(TEST_LEVEL.widthTiles);
      expect(spot.y).toBeGreaterThanOrEqual(0);
      expect(spot.y).toBeLessThan(TEST_LEVEL.heightTiles);
    }
  });

  it('places solid ground directly under the spawn', () => {
    const hasGround = TEST_LEVEL.solid.some(
      (rect) =>
        TEST_LEVEL.spawn.x >= rect.x &&
        TEST_LEVEL.spawn.x < rect.x + rect.width &&
        rect.y === TEST_LEVEL.spawn.y + 1,
    );
    expect(hasGround).toBe(true);
  });

  it('places solid ground directly under the exit', () => {
    const hasGround = TEST_LEVEL.solid.some(
      (rect) =>
        TEST_LEVEL.exit.x >= rect.x &&
        TEST_LEVEL.exit.x < rect.x + rect.width &&
        rect.y === TEST_LEVEL.exit.y + 1,
    );
    expect(hasGround).toBe(true);
  });

  it('gives every memory a unique position', () => {
    const keys = new Set(TEST_LEVEL.memories.map((spot) => `${spot.x},${spot.y}`));
    expect(keys.size).toBe(TEST_LEVEL.memories.length);
  });

  it('does not spawn a memory on top of the player', () => {
    for (const spot of TEST_LEVEL.memories) {
      const distance = Math.hypot(
        spot.x - TEST_LEVEL.spawn.x,
        spot.y - TEST_LEVEL.spawn.y,
      );
      expect(distance).toBeGreaterThan(1.5);
    }
  });
});
