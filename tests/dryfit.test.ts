import { describe, expect, it } from 'vitest';
import manifestJson from '../public/assets/manifest.json';
import levelJson from '../public/levels/dryfit-gothicvania.json';
import { EMPTY_TILE, validateLevel } from '../src/game/level/schema';
import { tileIndex, validateManifest } from '../src/game/level/manifest';

const level = validateLevel(levelJson);
const tiles = tileIndex(validateManifest(manifestJson));

describe('dry-fit GothicVania level', () => {
  it('uses a skeleton pursuer instead of the ghost', () => {
    expect(level.entities.some((entity) => entity.type === 'skeleton')).toBe(true);
    expect(level.entities.some((entity) => entity.type === 'monster')).toBe(false);
  });

  it('keeps the selected background, foreground and analog FX presets', () => {
    expect(level.background).toBe('gothicvania');
    expect(level.foreground).toBe('gothicvines');
    expect(level.analogFx).toBe('vignette');
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

  it('includes half blocks, ramps and dirt-rock transitions', () => {
    const used = new Set(level.layers.flatMap((layer) => layer.data));
    const halfIds = [24, 25, 26, 27, 28, 29];
    const rampIds = [21, 22];
    const transitionIds = [42, 43];
    expect(halfIds.some((id) => used.has(id))).toBe(true);
    expect(rampIds.some((id) => used.has(id))).toBe(true);
    expect(transitionIds.some((id) => used.has(id))).toBe(true);
  });

  it('keeps every entity inside the level', () => {
    for (const entity of level.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.x).toBeLessThan(level.width);
      expect(entity.y).toBeGreaterThanOrEqual(0);
      expect(entity.y).toBeLessThan(level.height);
    }
  });
});
