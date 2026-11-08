/** Plain data shared by the editor dropdown and the in-game overlay. */

export type AnalogFxPreset = 'vignette' | 'scanlines' | 'static' | 'combined';

export interface AnalogFxOption {
  id: string;
  label: string;
}

export const ANALOG_FX_OPTIONS: readonly AnalogFxOption[] = [
  { id: '', label: 'None' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'scanlines', label: 'Scanlines' },
  { id: 'static', label: 'Static / grain' },
  { id: 'combined', label: 'Combined (vignette + scanlines + static)' },
];

export const ANALOG_FX_BASE =
  'assets/DRYFIT/analog-fx/LESED_Analog_Horror_Screen_FX_Free/overlays';

export const ANALOG_FX_FRAMES = {
  static: 8,
} as const;

export const ANALOG_FX_FPS = 12;

/** Maps the retired `full` preset onto the new combined preset. */
export function normalizeAnalogFxPreset(
  value: string | undefined,
): AnalogFxPreset | undefined {
  if (value === 'full') {
    return 'combined';
  }
  if (
    value === 'vignette' ||
    value === 'scanlines' ||
    value === 'static' ||
    value === 'combined'
  ) {
    return value;
  }
  return undefined;
}
