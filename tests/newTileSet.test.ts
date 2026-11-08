import { describe, expect, it } from 'vitest';
import manifestJson from '../public/assets/manifest.json';
import levelJson from '../public/levels/new-tile-set-test.json';
import { EMPTY_TILE, validateLevel } from '../src/game/level/schema';
import { tileIndex, validateManifest } from '../src/game/level/manifest';

const level = validateLevel(levelJson);
const tiles = tileIndex(validateManifest(manifestJson));

describe('New Tile Set test level', () => {
  it('is a 16px 45x27 test level', () => {
    expect(level.name).toBe('New Tile Set test');
    expect(level.tileSize).toBe(16);
    expect(level.width).toBe(45);
    expect(level.height).toBe(27);
  });

  it('uses the Pixel Platformer World background and the vignette', () => {
    expect(level.background).toBe('pixel-platformer-world');
    expect(level.analogFx).toBe('vignette');
  });

  it('has one spawn and no monster, memories or exit', () => {
    expect(level.entities.filter((entity) => entity.type === 'spawn')).toHaveLength(1);
    expect(level.entities.filter((entity) => entity.type === 'monster')).toHaveLength(0);
    expect(level.entities.filter((entity) => entity.type === 'memory')).toHaveLength(0);
    expect(level.entities.filter((entity) => entity.type === 'exit')).toHaveLength(0);
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

  it('uses the hidden collision tile and the pack decor tiles', () => {
    const used = new Set(level.layers.flatMap((layer) => layer.data));
    expect(used.has(60)).toBe(true);
    expect(used.has(61)).toBe(true);
    expect(used.has(62)).toBe(true);
    expect(tiles.get(60)?.hidden).toBe(true);
    expect(tiles.get(61)?.decor).toBe(true);
    expect(tiles.get(62)?.decor).toBe(true);
  });
});
