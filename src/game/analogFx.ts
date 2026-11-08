/** Plain data shared by the editor dropdown and the in-game overlay. */

export type AnalogFxPreset = 'scanlines' | 'vignette' | 'static' | 'rec' | 'full';

export interface AnalogFxOption {
  id: string;
  label: string;
}

export const ANALOG_FX_OPTIONS: readonly AnalogFxOption[] = [
  { id: '', label: 'None' },
  { id: 'scanlines', label: 'Scanlines' },
  { id: 'vignette', label: 'Vignette' },
  { id: 'static', label: 'Static / grain' },
  { id: 'rec', label: 'REC HUD' },
  { id: 'full', label: 'Full (all overlays)' },
];

export const ANALOG_FX_BASE =
  'assets/DRYFIT/analog-fx/LESED_Analog_Horror_Screen_FX_Free/overlays';

export const ANALOG_FX_FRAMES = {
  rec: 24,
  static: 8,
} as const;

export const ANALOG_FX_FPS = 12;

export function isAnalogFxPreset(value: string | undefined): value is AnalogFxPreset {
  return (
    value === 'scanlines' ||
    value === 'vignette' ||
    value === 'static' ||
    value === 'rec' ||
    value === 'full'
  );
}
