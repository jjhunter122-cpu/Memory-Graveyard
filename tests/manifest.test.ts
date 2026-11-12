import { describe, expect, it } from 'vitest';
import manifestJson from '../public/assets/manifest.json';
import {
  ManifestValidationError,
  tileIndex,
  validateManifest,
} from '../src/game/level/manifest';

describe('asset manifest', () => {
  it('accepts the shipped manifest', () => {
    const manifest = validateManifest(manifestJson);
    expect(manifest.tileSize).toBe(32);
    const index = tileIndex(manifest);
    expect(index.get(79)?.image).toContain('palette-moss-grass-top.png');
    expect(index.get(80)?.image).toContain('palette-moss-grass-fill.png');
  });

  it('ships only the used Pixel moss tiles', () => {
    const manifest = validateManifest(manifestJson);
    const pixel = manifest.tilesets.find(
      (tileset) => tileset.name === 'pixel-platformer-world',
    );
    expect(pixel?.tiles).toHaveLength(2);
    for (const tileset of manifest.tilesets) {
      for (const tile of tileset.tiles) {
        expect(tile.image?.startsWith('pixel-platformer-world/')).toBe(true);
      }
    }
  });

  it('rejects duplicate tile ids', () => {
    const bad = {
      version: 1,
      tileSize: 32,
      tilesets: [
        { name: 'a', tiles: [{ id: 1, name: 'x', collision: 'solid', color: '#000' }] },
        { name: 'b', tiles: [{ id: 1, name: 'y', collision: 'solid', color: '#000' }] },
      ],
    };
    expect(() => validateManifest(bad)).toThrow(ManifestValidationError);
  });

  it('accepts hidden collision-only tiles', () => {
    const manifest = validateManifest({
      version: 1,
      tileSize: 32,
      tilesets: [
        {
          name: 'test',
          tiles: [
            { id: 1, name: 'collision', collision: 'solid', color: '#000', hidden: true },
          ],
        },
      ],
    });
    expect(tileIndex(manifest).get(1)?.hidden).toBe(true);
  });

  it('rejects an unknown collision kind', () => {
    const bad = {
      version: 1,
      tileSize: 32,
      tilesets: [{ name: 'a', tiles: [{ id: 1, name: 'x', collision: 'bouncy', color: '#000' }] }],
    };
    expect(() => validateManifest(bad)).toThrow(ManifestValidationError);
  });

  it('rejects an unknown manifest version', () => {
    expect(() => validateManifest({ version: 2 })).toThrow(ManifestValidationError);
  });
});
