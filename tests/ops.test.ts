import { describe, expect, it } from 'vitest';
import {
  addEntity,
  clearLevel,
  entitiesAt,
  removeEntitiesAt,
  renameLevel,
  setTile,
  tileAt,
} from '../src/editor/ops';
import { createLevel, EMPTY_TILE } from '../src/game/level/schema';

function makeLevel() {
  return createLevel('Edit', 4, 3, 32);
}

describe('tile operations', () => {
  it('sets a tile without mutating the original', () => {
    const level = makeLevel();
    const next = setTile(level, 0, 1, 1, 5);
    expect(tileAt(next, 0, 1, 1)).toBe(5);
    expect(tileAt(level, 0, 1, 1)).toBe(EMPTY_TILE);
    expect(next).not.toBe(level);
  });

  it('returns the same level when the tile is unchanged', () => {
    const level = makeLevel();
    expect(setTile(level, 0, 0, 0, EMPTY_TILE)).toBe(level);
  });

  it('ignores out-of-bounds and missing layers', () => {
    const level = makeLevel();
    expect(setTile(level, 0, -1, 0, 5)).toBe(level);
    expect(setTile(level, 0, 4, 0, 5)).toBe(level);
    expect(setTile(level, 9, 0, 0, 5)).toBe(level);
    expect(tileAt(level, 9, 0, 0)).toBe(EMPTY_TILE);
  });
});

describe('entity operations', () => {
  it('adds entities and reads them back', () => {
    const level = addEntity(makeLevel(), 'memory', 2, 1);
    expect(level.entities).toHaveLength(1);
    expect(entitiesAt(level, 2, 1)).toEqual([{ type: 'memory', x: 2, y: 1 }]);
  });

  it('keeps only one spawn', () => {
    let level = addEntity(makeLevel(), 'spawn', 0, 0);
    level = addEntity(level, 'spawn', 1, 1);
    expect(level.entities.filter((e) => e.type === 'spawn')).toEqual([
      { type: 'spawn', x: 1, y: 1 },
    ]);
  });

  it('removes every entity on a tile', () => {
    let level = addEntity(makeLevel(), 'memory', 1, 1);
    level = addEntity(level, 'checkpoint', 1, 1);
    level = removeEntitiesAt(level, 1, 1);
    expect(level.entities).toHaveLength(0);
  });

  it('ignores out-of-bounds placements', () => {
    const level = addEntity(makeLevel(), 'memory', 99, 0);
    expect(level.entities).toHaveLength(0);
  });
});

describe('level operations', () => {
  it('renames the level', () => {
    expect(renameLevel(makeLevel(), 'New Name').name).toBe('New Name');
  });

  it('clears tiles and entities', () => {
    let level = setTile(makeLevel(), 0, 0, 0, 3);
    level = addEntity(level, 'memory', 0, 0);
    const cleared = clearLevel(level);
    expect(cleared.entities).toHaveLength(0);
    expect(tileAt(cleared, 0, 0, 0)).toBe(EMPTY_TILE);
  });
});
