import { describe, expect, it } from 'vitest';
import {
  createLevel,
  EMPTY_TILE,
  LevelValidationError,
  validateLevel,
} from '../src/game/level/schema';

describe('level schema', () => {
  it('creates an empty level with a zeroed terrain layer', () => {
    const level = createLevel('Empty', 4, 3, 32);
    expect(level.layers).toHaveLength(1);
    expect(level.layers[0]?.data).toHaveLength(12);
    expect(level.layers[0]?.data.every((id) => id === EMPTY_TILE)).toBe(true);
    expect(level.layers[0]?.collide).toBe(true);
  });

  it('accepts the run backdrop and skybox ids', () => {
    const level = createLevel('Forest', 2, 2, 32);
    level.background = 'pixel-platformer-world-layers';
    level.skybox = '#0a0b10';
    expect(validateLevel(level)).toEqual(level);
  });

  it('rejects an empty backdrop or malformed skybox', () => {
    const level = createLevel('Forest', 2, 2, 32);
    expect(() => validateLevel({ ...level, background: '' })).toThrow(/background/);
    expect(() => validateLevel({ ...level, skybox: 'yellow' })).toThrow(/skybox/);
  });

  it('rejects an unknown version', () => {
    expect(() => validateLevel({ version: 99 })).toThrow(LevelValidationError);
  });

  it('rejects a layer whose data does not match width * height', () => {
    const bad = {
      version: 1,
      name: 'x',
      tileSize: 32,
      width: 2,
      height: 2,
      layers: [{ name: 't', collide: true, data: [1, 2, 3] }],
    };
    expect(() => validateLevel(bad)).toThrow(/4 entries/);
  });

  it('rejects tile ids below EMPTY_TILE', () => {
    const bad = {
      version: 1,
      name: 'x',
      tileSize: 32,
      width: 1,
      height: 1,
      layers: [{ name: 't', collide: true, data: [-2] }],
    };
    expect(() => validateLevel(bad)).toThrow(LevelValidationError);
  });

  it('rejects an empty level name', () => {
    const level = createLevel('Forest', 1, 1, 32);
    expect(() => validateLevel({ ...level, name: '' })).toThrow(/name/);
  });
});
