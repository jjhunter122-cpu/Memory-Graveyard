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
    expect(index.get(1)?.collision).toBe('solid');
    expect(index.get(2)?.collision).toBe('oneway');
  });

  it('ships the Pixel set from tracked assets, not DRYFIT', () => {
    const manifest = validateManifest(manifestJson);
    const pixel = manifest.tilesets.find((tileset) => tileset.name === 'pixel-platformer-world');
    expect(pixel?.tiles.length).toBeGreaterThanOrEqual(90);
    for (const tileset of manifest.tilesets) {
      for (const tile of tileset.tiles) {
        if (tile.image) {
          expect(tile.image.startsWith('DRYFIT/')).toBe(false);
        }
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

  it('accepts half blocks and slope surfaces', () => {
    const manifest = validateManifest({
      version: 1,
      tileSize: 32,
      tilesets: [
        {
          name: 'test',
          tiles: [
            { id: 1, name: 'half', collision: 'solid', color: '#000', half: 'bottom' },
            {
              id: 2,
              name: 'ramp',
              collision: 'none',
              color: '#000',
              slope: 'up',
              slopeOffset: 16,
              slopeRise: 12,
            },
          ],
        },
      ],
    });
    const index = tileIndex(manifest);
    expect(index.get(1)?.half).toBe('bottom');
    expect(index.get(2)?.slope).toBe('up');
    expect(index.get(2)?.slopeRise).toBe(12);
  });

  it('rejects invalid half and slope values', () => {
    const base = { version: 1, tileSize: 32 };
    expect(() =>
      validateManifest({
        ...base,
        tilesets: [
          { name: 'x', tiles: [{ id: 1, name: 'x', collision: 'solid', color: '#000', half: 'middle' }] },
        ],
      }),
    ).toThrow(/half/);
    expect(() =>
      validateManifest({
        ...base,
        tilesets: [
          { name: 'x', tiles: [{ id: 1, name: 'x', collision: 'none', color: '#000', slope: 'sideways' }] },
        ],
      }),
    ).toThrow(/slope/);
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
