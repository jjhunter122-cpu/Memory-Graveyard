import { describe, expect, it } from 'vitest';
import {
  CAMERA_ZOOM_OPTIONS,
  cameraCoverage,
  isCameraZoom,
  normalizeCameraZoom,
} from '../src/game/camera/cameraZoom';
import { CAMERA } from '../src/game/config';
import { createLevel, parseLevel, serializeLevel, validateLevel } from '../src/game/level/schema';
import { setCameraZoom } from '../src/editor/ops';

describe('camera zoom options', () => {
  it('offers current plus wider and closer framing', () => {
    expect(CAMERA_ZOOM_OPTIONS.map((option) => option.value)).toEqual([
      1, 1.15, 1.25, 1.35, 1.5,
    ]);
    expect(CAMERA_ZOOM_OPTIONS.some((option) => option.value === CAMERA.zoom)).toBe(true);
  });

  it('normalizes unknown values back to the current zoom', () => {
    expect(normalizeCameraZoom(1.15)).toBe(1.15);
    expect(normalizeCameraZoom(undefined)).toBe(CAMERA.zoom);
    expect(normalizeCameraZoom(0.1)).toBe(CAMERA.zoom);
    expect(normalizeCameraZoom(3)).toBe(CAMERA.zoom);
    expect(isCameraZoom(1.25)).toBe(true);
    expect(isCameraZoom('1.25')).toBe(false);
  });

  it('reports a wider view as more visible tiles', () => {
    const wide = cameraCoverage(1, 32);
    const close = cameraCoverage(1.5, 32);
    expect(wide.width).toBeGreaterThan(close.width);
    expect(wide.height).toBeGreaterThan(close.height);
    expect(cameraCoverage(1.35, 32).width).toBeCloseTo(22.2, 1);
  });
});

describe('camera zoom level field', () => {
  it('round-trips through the level schema', () => {
    const level = createLevel('Camera', 4, 3, 32);
    level.cameraZoom = 1.15;
    expect(parseLevel(serializeLevel(level))).toEqual(level);
  });

  it('rejects values outside the supported range', () => {
    const level = createLevel('Camera', 4, 3, 32);
    expect(() => validateLevel({ ...level, cameraZoom: 0.2 })).toThrow(/cameraZoom/);
    expect(() => validateLevel({ ...level, cameraZoom: 2.5 })).toThrow(/cameraZoom/);
    expect(() => validateLevel({ ...level, cameraZoom: '1.2' })).toThrow(/cameraZoom/);
  });

  it('omits the default zoom and stores custom zoom values', () => {
    const level = createLevel('Camera', 4, 3, 32);
    const custom = setCameraZoom(level, 1.15);
    expect(custom.cameraZoom).toBe(1.15);
    expect(setCameraZoom(custom, CAMERA.zoom).cameraZoom).toBeUndefined();
  });
});
