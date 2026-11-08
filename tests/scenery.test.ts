import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_PRESETS,
  findBackgroundPreset,
  findForegroundPreset,
} from '../src/game/scenery';

describe('Pixel Platformer World scenery presets', () => {
  it('offers flat, layered and room variants', () => {
    const flat = findBackgroundPreset('pixel-platformer-world-flat');
    const layers = findBackgroundPreset('pixel-platformer-world-layers');
    const room = findBackgroundPreset('pixel-platformer-world');
    expect(flat?.layers).toHaveLength(1);
    expect(layers?.layers).toHaveLength(6);
    expect(room?.layers).toHaveLength(7);
    expect(room?.layers.some((layer) => layer.image.endsWith('room-test.png'))).toBe(true);
  });

  it('adds every pre-built room palette as a background option', () => {
    for (let index = 1; index <= 9; index += 1) {
      const preset = findBackgroundPreset(`pixel-platformer-world-room-${index}`);
      expect(preset, `missing room ${index}`).toBeDefined();
      expect(preset?.layers).toHaveLength(7);
      expect(
        preset?.layers.some((layer) => layer.image.endsWith(`rooms/room-${index}.png`)),
      ).toBe(true);
    }
  });

  it('keeps blank/none as the solid-sky option', () => {
    expect(findBackgroundPreset(undefined)).toBeUndefined();
    expect(findBackgroundPreset('none')).toBeUndefined();
    expect(findForegroundPreset(undefined)).toBeUndefined();
  });

  it('does not duplicate the flat and layered presets', () => {
    const ids = BACKGROUND_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
