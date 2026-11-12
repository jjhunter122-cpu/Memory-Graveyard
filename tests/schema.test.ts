import { describe, expect, it } from 'vitest';
import {
  createLevel,
  EMPTY_TILE,
  LevelValidationError,
  parseLevel,
  serializeLevel,
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

  it('round-trips through serialize/parse', () => {
    const level = createLevel('Loop', 2, 2, 16);
    level.entities.push({ type: 'spawn', x: 0, y: 0 });
    level.layers[0]!.data[0] = 1;
    level.skybox = '#102030';
    expect(parseLevel(serializeLevel(level))).toEqual(level);
  });

  it('round-trips background, foreground and analog FX ids', () => {
    const level = createLevel('Scenery', 2, 2, 32);
    level.background = 'pixel-platformer-world-flat';
    level.foreground = 'pixel-platformer-world-room-1';
    level.analogFx = 'vignette';
    level.ambience = 'spooky-forest';
    expect(parseLevel(serializeLevel(level))).toEqual(level);
  });

  it('rejects empty scenery or analog FX ids', () => {
    const level = createLevel('Scenery', 2, 2, 32);
    expect(() =>
      validateLevel({ ...level, background: '' }),
    ).toThrow(/background/);
    expect(() =>
      validateLevel({ ...level, foreground: '' }),
    ).toThrow(/foreground/);
    expect(() =>
      validateLevel({ ...level, analogFx: '' }),
    ).toThrow(/analogFx/);
    expect(() =>
      validateLevel({ ...level, ambience: '' }),
    ).toThrow(/ambience/);
  });

  it('round-trips a playable area', () => {
    const level = createLevel('Playable', 20, 12, 32);
    level.playArea = { x: 2, y: 3, width: 16, height: 8 };
    expect(parseLevel(serializeLevel(level))).toEqual(level);
  });

  it('rejects playable areas outside the canvas', () => {
    const level = createLevel('Playable', 10, 10, 32);
    expect(() =>
      validateLevel({ ...level, playArea: { x: 0, y: 0, width: 11, height: 4 } }),
    ).toThrow(/playArea/);
    expect(() =>
      validateLevel({ ...level, playArea: { x: 0, y: 0, width: 0, height: 4 } }),
    ).toThrow(/playArea/);
  });

  it('rejects a malformed skybox colour', () => {
    const bad = {
      version: 1,
      name: 'x',
      tileSize: 32,
      width: 1,
      height: 1,
      layers: [{ name: 't', collide: true, data: [1] }],
      entities: [],
      skybox: 'yellow',
    };
    expect(() => validateLevel(bad)).toThrow(/skybox/);
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
      entities: [],
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
      entities: [],
    };
    expect(() => validateLevel(bad)).toThrow(LevelValidationError);
  });

  it('rejects entities with fractional tile coordinates', () => {
    const bad = {
      version: 1,
      name: 'x',
      tileSize: 32,
      width: 1,
      height: 1,
      layers: [{ name: 't', collide: true, data: [1] }],
      entities: [{ type: 'spawn', x: 0.5, y: 0 }],
    };
    expect(() => validateLevel(bad)).toThrow(LevelValidationError);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseLevel('{ not json')).toThrow(LevelValidationError);
  });
});
