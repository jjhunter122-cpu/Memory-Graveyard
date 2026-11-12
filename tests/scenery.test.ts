import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_PRESETS,
  findBackgroundPreset,
  sceneryImagePaths,
} from '../src/game/scenery';

describe('forest scenery presets', () => {
  it('offers one layered Pixel Platformer World backdrop', () => {
    const preset = findBackgroundPreset('pixel-platformer-world-layers');
    expect(BACKGROUND_PRESETS).toHaveLength(1);
    expect(preset?.layers).toHaveLength(6);
    expect(preset?.layers[0]?.image).toBe(
      'pixel-platformer-world/Background/background1.png',
    );
  });

  it('keeps blank/none as the solid-sky option', () => {
    expect(findBackgroundPreset(undefined)).toBeUndefined();
    expect(findBackgroundPreset('none')).toBeUndefined();
  });

  it('lists every backdrop image once', () => {
    const paths = sceneryImagePaths();
    expect(paths).toHaveLength(6);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
