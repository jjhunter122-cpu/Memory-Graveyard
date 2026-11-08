import { describe, expect, it } from 'vitest';
import {
  ANALOG_FX_OPTIONS,
  normalizeAnalogFxPreset,
} from '../src/game/analogFx';

describe('analog FX presets', () => {
  it('lists the supported presets without the retired REC HUD', () => {
    const ids = ANALOG_FX_OPTIONS.map((option) => option.id);
    expect(ids).toEqual(['', 'vignette', 'scanlines', 'static', 'combined']);
    expect(ids).not.toContain('rec');
  });

  it('normalizes the retired full preset to combined', () => {
    expect(normalizeAnalogFxPreset('full')).toBe('combined');
    expect(normalizeAnalogFxPreset('combined')).toBe('combined');
  });

  it('rejects unknown and retired presets', () => {
    expect(normalizeAnalogFxPreset('rec')).toBeUndefined();
    expect(normalizeAnalogFxPreset('nonsense')).toBeUndefined();
    expect(normalizeAnalogFxPreset(undefined)).toBeUndefined();
  });
});
