import { describe, expect, it } from 'vitest';
import defaultTestJson from '../public/levels/default-test.json';
import manifestJson from '../public/assets/manifest.json';
import {
  DEFAULT_FLOOR_FILL_TILE,
  DEFAULT_FLOOR_TOP_TILE,
  DEFAULT_LEVEL_HEIGHT,
  DEFAULT_LEVEL_TILE_SIZE,
  DEFAULT_LEVEL_WIDTH,
  createDefaultLevel,
} from '../src/editor/defaultLevel';
import { validateLevel } from '../src/game/level/schema';
import { tileIndex, validateManifest } from '../src/game/level/manifest';

const tiles = tileIndex(validateManifest(manifestJson));

describe('default level template', () => {
  it('creates the smallest blank level with a Pixel moss floor', () => {
    const level = createDefaultLevel('Untitled level');
    expect(level.name).toBe('Untitled level');
    expect(level.width).toBe(DEFAULT_LEVEL_WIDTH);
    expect(level.height).toBe(DEFAULT_LEVEL_HEIGHT);
    expect(level.tileSize).toBe(DEFAULT_LEVEL_TILE_SIZE);
    expect(level.layers).toHaveLength(1);

    const data = level.layers[0]?.data ?? [];
    for (let x = 0; x < DEFAULT_LEVEL_WIDTH; x += 1) {
      expect(data[(DEFAULT_LEVEL_HEIGHT - 2) * DEFAULT_LEVEL_WIDTH + x]).toBe(
        DEFAULT_FLOOR_TOP_TILE,
      );
      expect(data[(DEFAULT_LEVEL_HEIGHT - 1) * DEFAULT_LEVEL_WIDTH + x]).toBe(
        DEFAULT_FLOOR_FILL_TILE,
      );
    }
    expect(data[0]).toBe(-1);
  });

  it('starts with a spawn, dark sky, Vignette and the new defaults', () => {
    const level = createDefaultLevel('Untitled level');
    expect(level.entities).toEqual([{ type: 'spawn', x: 2, y: 15 }]);
    expect(level.skybox).toBe('#0a0b10');
    expect(level.analogFx).toBe('vignette');
    expect(level.characterScale).toBe(1.75);
    expect(level.cameraZoom).toBe(1);
    expect(level.cameraFollow).toBe('momentum');
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
    expect(level.characterScale).toBe(1.75);
    expect(level.cameraZoom).toBe(1);
    expect(level.cameraFollow).toBe('momentum');
  });
});

describe('Pixel walkable palette', () => {
  it('adds solid walkable Pixel tiles to the manifest', () => {
    for (const id of [63, 64, 65, 66, 67, 68, 69, 70, 71, 75, 76, 77]) {
      const tile = tiles.get(id);
      expect(tile, `missing tile ${id}`).toBeDefined();
      expect(tile?.collision).toBe('solid');
      expect(tile?.image).toMatch(/^pixel-platformer-world\/tiles\//);
    }
  });

  it('keeps the visual-only slants and plant in the palette', () => {
    for (const id of [72, 73, 74]) {
      const tile = tiles.get(id);
      expect(tile?.collision).toBe('none');
      expect(tile?.image).toMatch(/^pixel-platformer-world\/tiles\//);
    }
    expect(tiles.get(78)?.decor).toBe(true);
  });

  it('extracts walkable grass and stone tiles for every room palette', () => {
    const palettes = [
      'moss',
      'rose',
      'olive',
      'crimson',
      'teal',
      'blood',
      'lime',
      'slate',
      'ocean',
    ];
    for (const palette of palettes) {
      const matches = [...tiles.values()].filter(
        (tile) =>
          tile.name.startsWith(`${palette} `) &&
          (tile.name.endsWith('grass top') ||
            tile.name.endsWith('grass fill') ||
            tile.name.endsWith('stone top') ||
            tile.name.endsWith('stone fill')),
      );
      expect(matches, `missing walkable tiles for ${palette}`).toHaveLength(4);
      for (const tile of matches) {
        expect(tile.collision).toBe('solid');
        expect(tile.image).toMatch(/^pixel-platformer-world\/tiles\/palette-/);
      }
    }
  });

  it('keeps slopes visual-only and decor pieces sized', () => {
    const slopes = [...tiles.values()].filter(
      (tile) => tile.name.endsWith('slope (visual)') || tile.name.endsWith('(visual)'),
    );
    expect(slopes.length).toBeGreaterThanOrEqual(11);
    for (const tile of slopes) {
      expect(tile.collision).toBe('none');
    }

    const arch = [...tiles.values()].find((tile) => tile.name === 'brown arch room');
    expect(arch?.decor).toBe(true);
    expect(arch?.width).toBe(224);
    expect(arch?.height).toBe(208);
  });
});
