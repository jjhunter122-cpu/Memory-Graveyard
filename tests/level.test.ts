import { describe, expect, it } from 'vitest';
import manifestJson from '../public/assets/manifest.json';
import levelJson from '../public/levels/test-course.json';
import { EMPTY_TILE, validateLevel } from '../src/game/level/schema';
import { tileIndex, validateManifest } from '../src/game/level/manifest';
import { toGrid } from '../src/game/level/tiles';

const level = validateLevel(levelJson);
const tiles = tileIndex(validateManifest(manifestJson));

function tileAt(x: number, y: number): number {
  const layer = level.layers[0];
  if (!layer) {
    return EMPTY_TILE;
  }
  const grid = toGrid(layer.data, level.width, level.height);
  return grid.rows[y]?.[x] ?? EMPTY_TILE;
}

function isSolid(x: number, y: number): boolean {
  const id = tileAt(x, y);
  return id !== EMPTY_TILE && tiles.get(id)?.collision === 'solid';
}

describe('test course level', () => {
  it('is a valid 40x18 course', () => {
    expect(level.name).toBe('Test Course');
    expect(level.width).toBe(40);
    expect(level.height).toBe(18);
  });

  it('has exactly one spawn and one exit', () => {
    expect(level.entities.filter((e) => e.type === 'spawn')).toHaveLength(1);
    expect(level.entities.filter((e) => e.type === 'exit')).toHaveLength(1);
  });

  it('has six memories', () => {
    expect(level.entities.filter((e) => e.type === 'memory')).toHaveLength(6);
  });

  it('only references tile ids defined in the manifest', () => {
    for (const layer of level.layers) {
      for (const id of layer.data) {
        if (id !== EMPTY_TILE) {
          expect(tiles.has(id), `unknown tile id ${id}`).toBe(true);
        }
      }
    }
  });

  it('keeps every entity inside the level', () => {
    for (const entity of level.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.x).toBeLessThan(level.width);
      expect(entity.y).toBeGreaterThanOrEqual(0);
      expect(entity.y).toBeLessThan(level.height);
    }
  });

  it('places solid ground under the spawn and the exit', () => {
    const spawn = level.entities.find((e) => e.type === 'spawn');
    const exit = level.entities.find((e) => e.type === 'exit');
    expect(spawn).toBeDefined();
    expect(exit).toBeDefined();
    expect(isSolid(spawn!.x, spawn!.y + 1)).toBe(true);
    expect(isSolid(exit!.x, exit!.y + 1)).toBe(true);
  });

  it('gives every memory a unique position', () => {
    const keys = new Set(
      level.entities.filter((e) => e.type === 'memory').map((e) => `${e.x},${e.y}`),
    );
    expect(keys.size).toBe(6);
  });
});
