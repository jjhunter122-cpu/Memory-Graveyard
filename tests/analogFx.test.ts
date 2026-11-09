import { describe, expect, it } from 'vitest';
import {
  ANALOG_FX_OPTIONS,
  normalizeAnalogFxPreset,
} from '../src/game/analogFx';

describe('analog FX presets', () => {
  it('lists None and Vignette only', () => {
    const ids = ANALOG_FX_OPTIONS.map((option) => option.id);
    expect(ids).toEqual(['', 'vignette']);
  });

  it('normalizes the retired full preset to the Vignette', () => {
    expect(normalizeAnalogFxPreset('full')).toBe('vignette');
    expect(normalizeAnalogFxPreset('vignette')).toBe('vignette');
  });

  it('rejects retired and unknown presets', () => {
    expect(normalizeAnalogFxPreset('rec')).toBeUndefined();
    expect(normalizeAnalogFxPreset('scanlines')).toBeUndefined();
    expect(normalizeAnalogFxPreset('static')).toBeUndefined();
    expect(normalizeAnalogFxPreset('combined')).toBeUndefined();
    expect(normalizeAnalogFxPreset(undefined)).toBeUndefined();
  });
});
