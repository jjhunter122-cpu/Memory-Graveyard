import { describe, expect, it } from 'vitest';
import defaultTestJson from '../public/levels/default-test.json';
import manifestJson from '../public/assets/manifest.json';
import {
  DEFAULT_FLOOR_TILE,
  DEFAULT_LEVEL_HEIGHT,
  DEFAULT_LEVEL_TILE_SIZE,
  DEFAULT_LEVEL_WIDTH,
  createDefaultLevel,
} from '../src/editor/defaultLevel';
import { validateLevel } from '../src/game/level/schema';
import { tileIndex, validateManifest } from '../src/game/level/manifest';

const tiles = tileIndex(validateManifest(manifestJson));

describe('default level template', () => {
  it('creates the smallest blank level with an OG stone floor', () => {
    const level = createDefaultLevel('Untitled level');
    expect(level.name).toBe('Untitled level');
    expect(level.width).toBe(DEFAULT_LEVEL_WIDTH);
    expect(level.height).toBe(DEFAULT_LEVEL_HEIGHT);
    expect(level.tileSize).toBe(DEFAULT_LEVEL_TILE_SIZE);
    expect(level.layers).toHaveLength(1);

    const data = level.layers[0]?.data ?? [];
    for (let y = DEFAULT_LEVEL_HEIGHT - 2; y < DEFAULT_LEVEL_HEIGHT; y += 1) {
      for (let x = 0; x < DEFAULT_LEVEL_WIDTH; x += 1) {
        expect(data[y * DEFAULT_LEVEL_WIDTH + x]).toBe(DEFAULT_FLOOR_TILE);
      }
    }
    expect(data[0]).toBe(-1);
  });

  it('starts with a spawn, a dark blank sky and the Vignette', () => {
    const level = createDefaultLevel('Untitled level');
    expect(level.entities).toEqual([{ type: 'spawn', x: 2, y: 15 }]);
    expect(level.skybox).toBe('#0a0b10');
    expect(level.analogFx).toBe('vignette');
    expect(level.background).toBeUndefined();
    expect(level.foreground).toBeUndefined();
  });

  it('ships the Default Test level with the same baseline', () => {
    const level = validateLevel(defaultTestJson);
    expect(level.name).toBe('Default Test');
    expect(level.width).toBe(40);
    expect(level.height).toBe(18);
    expect(level.tileSize).toBe(32);
    expect(level.entities).toEqual([{ type: 'spawn', x: 2, y: 15 }]);
    expect(level.skybox).toBe('#0a0b10');
    expect(level.analogFx).toBe('vignette');
  });
});

describe('Pixel walkable palette', () => {
  it('adds solid walkable Pixel tiles to the manifest', () => {
    for (const id of [63, 64, 65, 66, 67, 68, 69, 70, 71, 75, 76, 77]) {
      const tile = tiles.get(id);
      expect(tile, `missing tile ${id}`).toBeDefined();
      expect(tile?.collision).toBe('solid');
      expect(tile?.image).toMatch(/^DRYFIT\/pixel-platformer-world\/tiles\//);
    }
  });

  it('keeps the visual-only slants and plant in the palette', () => {
    for (const id of [72, 73, 74]) {
      const tile = tiles.get(id);
      expect(tile?.collision).toBe('none');
      expect(tile?.image).toMatch(/^DRYFIT\/pixel-platformer-world\/tiles\//);
    }
    expect(tiles.get(78)?.decor).toBe(true);
  });
});
