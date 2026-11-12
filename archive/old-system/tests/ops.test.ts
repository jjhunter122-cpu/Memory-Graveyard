import { describe, expect, it } from 'vitest';
import {
  addEntity,
  clearLevel,
  entitiesAt,
  hasContentOutside,
  removeEntitiesAt,
  renameLevel,
  resizeLevel,
  setAnalogFx,
  setAmbience,
  setBackground,
  setForeground,
  setPlayArea,
  setSkybox,
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

  it('resizes from the top-left and keeps overlapping tiles', () => {
    let level = setTile(makeLevel(), 0, 1, 1, 3);
    level = addEntity(level, 'exit', 1, 1);
    const bigger = resizeLevel(level, 6, 5);
    expect(bigger.width).toBe(6);
    expect(bigger.height).toBe(5);
    expect(tileAt(bigger, 0, 1, 1)).toBe(3);
    expect(bigger.entities).toEqual([{ type: 'exit', x: 1, y: 1 }]);
  });

  it('drops content outside a shrunken level', () => {
    let level = setTile(makeLevel(), 0, 3, 2, 3);
    level = addEntity(level, 'exit', 3, 2);
    expect(hasContentOutside(level, 2, 2)).toBe(true);
    const smaller = resizeLevel(level, 2, 2);
    expect(smaller.entities).toHaveLength(0);
    expect(tileAt(smaller, 0, 1, 1)).toBe(EMPTY_TILE);
  });

  it('sets, clears and clamps the playable area', () => {
    const level = makeLevel();
    const inset = setPlayArea(level, { x: 1, y: 1, width: 2, height: 1 });
    expect(inset.playArea).toEqual({ x: 1, y: 1, width: 2, height: 1 });
    expect(setPlayArea(inset, { x: 0, y: 0, width: 4, height: 3 }).playArea).toBeUndefined();
    expect(setPlayArea(level, { x: 3, y: 2, width: 20, height: 20 }).playArea).toEqual({
      x: 3,
      y: 2,
      width: 1,
      height: 1,
    });
  });

  it('clamps the playable area when resizing the canvas', () => {
    const level = setPlayArea(makeLevel(), { x: 1, y: 0, width: 3, height: 2 });
    const smaller = resizeLevel(level, 3, 2);
    expect(smaller.playArea).toEqual({ x: 1, y: 0, width: 2, height: 2 });
  });

  it('sets and clears the skybox colour', () => {
    const level = makeLevel();
    const withSky = setSkybox(level, '#112233');
    expect(withSky.skybox).toBe('#112233');
    expect(setSkybox(withSky, undefined).skybox).toBeUndefined();
  });

  it('sets and clears scenery presets', () => {
    const level = makeLevel();
    const withBackground = setBackground(level, 'pixel-platformer-world-flat');
    expect(withBackground.background).toBe('pixel-platformer-world-flat');
    expect(setBackground(withBackground, undefined).background).toBeUndefined();

    const withForeground = setForeground(level, 'pixel-platformer-world-room-1');
    expect(withForeground.foreground).toBe('pixel-platformer-world-room-1');
    expect(setForeground(withForeground, 'none').foreground).toBeUndefined();
  });

  it('sets and clears the analog FX preset', () => {
    const level = makeLevel();
    const withFx = setAnalogFx(level, 'vignette');
    expect(withFx.analogFx).toBe('vignette');
    expect(setAnalogFx(withFx, undefined).analogFx).toBeUndefined();
    expect(setAnalogFx(withFx, 'none').analogFx).toBeUndefined();
  });

  it('sets and clears the ambience track', () => {
    const level = makeLevel();
    const withAmbience = setAmbience(level, 'spooky-forest');
    expect(withAmbience.ambience).toBe('spooky-forest');
    expect(setAmbience(withAmbience, undefined).ambience).toBeUndefined();
    expect(setAmbience(withAmbience, 'none').ambience).toBeUndefined();
    expect(setAmbience(withAmbience, '').ambience).toBeUndefined();
  });
});
