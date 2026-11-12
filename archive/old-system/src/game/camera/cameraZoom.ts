import { CAMERA, VIEW } from '../config';

/**
 * Per-level camera zoom choices. A lower zoom pulls the camera back and shows
 * more of the level; the default preserves the current gameplay framing.
 */
export interface CameraZoomOption {
  value: number;
  label: string;
}

export const CAMERA_ZOOM_OPTIONS: readonly CameraZoomOption[] = [
  { value: 1, label: 'Wide (1.0×)' },
  { value: 1.15, label: 'Wider (1.15×)' },
  { value: 1.25, label: 'Mid (1.25×)' },
  { value: 1.35, label: 'Current (1.35×)' },
  { value: 1.5, label: 'Close (1.5×)' },
];

export function isCameraZoom(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0.5 &&
    value <= 2
  );
}

export function normalizeCameraZoom(value: unknown): number {
  return isCameraZoom(value) ? value : CAMERA.zoom;
}

export interface CameraCoverage {
  width: number;
  height: number;
}

/** Approximate number of tiles visible at a zoom and tile size. */
export function cameraCoverage(zoom: number, tileSize: number): CameraCoverage {
  const safeZoom = zoom > 0 ? zoom : CAMERA.zoom;
  const safeTile = tileSize > 0 ? tileSize : 32;
  return {
    width: VIEW.width / (safeTile * safeZoom),
    height: VIEW.height / (safeTile * safeZoom),
  };
}
