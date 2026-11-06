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
