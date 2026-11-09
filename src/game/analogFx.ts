/** Plain data shared by the editor dropdown and the in-game overlay. */

export type AnalogFxPreset = 'vignette';

export interface AnalogFxOption {
  id: string;
  label: string;
}

export const ANALOG_FX_OPTIONS: readonly AnalogFxOption[] = [
  { id: '', label: 'None' },
  { id: 'vignette', label: 'Vignette' },
];

export const ANALOG_FX_BASE =
  'assets/analog-fx/LESED_Analog_Horror_Screen_FX_Free/overlays';

/** Maps the retired `full` preset onto the Vignette. */
export function normalizeAnalogFxPreset(
  value: string | undefined,
): AnalogFxPreset | undefined {
  if (value === 'full') {
    return 'vignette';
  }
  if (value === 'vignette') {
    return value;
  }
  return undefined;
}
