import { describe, expect, it } from 'vitest';
import type { Scene, Vector } from 'excalibur';
import {
  CAMERA_ZOOM_OPTIONS,
  cameraCoverage,
  isCameraZoom,
  normalizeCameraZoom,
} from '../src/game/camera/cameraZoom';
import {
  CAMERA_FOLLOW_PRESETS,
  cameraFallLead,
  findCameraFollowPreset,
  normalizeCameraFollow,
} from '../src/game/camera/cameraFollowSettings';
import { CameraFollow } from '../src/game/camera/CameraFollow';
import { CAMERA } from '../src/game/config';
import { createLevel, parseLevel, serializeLevel, validateLevel } from '../src/game/level/schema';
import { setCameraFollow, setCameraZoom } from '../src/editor/ops';

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

function vec(x: number, y: number): Vector {
  const v = {
    x,
    y,
    setTo(nx: number, ny: number) {
      v.x = nx;
      v.y = ny;
    },
  };
  return v as unknown as Vector;
}

function fakeScene(x: number, y: number): Scene {
  return {
    camera: { pos: vec(x, y), zoom: 1 },
  } as unknown as Scene;
}

describe('camera follow presets', () => {
  it('offers current, soft, momentum and impact behaviour', () => {
    expect(CAMERA_FOLLOW_PRESETS.map((preset) => preset.id)).toEqual([
      'current',
      'soft',
      'momentum',
      'impact',
    ]);
    expect(normalizeCameraFollow('momentum')).toBe('momentum');
    expect(normalizeCameraFollow(undefined)).toBe('current');
    expect(normalizeCameraFollow('nope')).toBe('current');
  });

  it('clamps the fall lead to the configured range', () => {
    const momentum = findCameraFollowPreset('momentum');
    expect(cameraFallLead(momentum, 100)).toBeCloseTo(3.5, 2);
    expect(cameraFallLead(momentum, 2000)).toBe(momentum.maxFallLead);
    expect(cameraFallLead(momentum, -2000)).toBe(-momentum.jumpLead);
    expect(cameraFallLead(findCameraFollowPreset('current'), 2000)).toBe(0);
  });

  it('stores and validates the follow preset on the level', () => {
    const level = createLevel('Camera', 4, 3, 32);
    level.cameraFollow = 'momentum';
    expect(parseLevel(serializeLevel(level))).toEqual(level);
    expect(() => validateLevel({ ...level, cameraFollow: 'nope' })).toThrow(/cameraFollow/);
    expect(setCameraFollow(level, 'impact').cameraFollow).toBe('impact');
    expect(setCameraFollow(level, 'current').cameraFollow).toBeUndefined();
  });

  it('keeps the current preset insensitive to small vertical moves', () => {
    const scene = fakeScene(100, 100);
    const follow = new CameraFollow(scene, findCameraFollowPreset('current'));
    follow.snap(vec(100, 100));
    follow.update(vec(100, 112), 1 / 60, { vy: 600, grounded: false });
    expect(scene.camera.pos.y).toBe(100);
  });

  it('leads downward when falling and settles back after landing', () => {
    const scene = fakeScene(100, 100);
    const follow = new CameraFollow(scene, findCameraFollowPreset('momentum'));
    follow.snap(vec(100, 100));
    for (let i = 0; i < 60; i += 1) {
      follow.update(vec(100, 100), 1 / 60, { vy: 600, grounded: false });
    }
    const fallingY = scene.camera.pos.y;
    expect(fallingY).toBeGreaterThan(110);

    for (let i = 0; i < 180; i += 1) {
      follow.update(vec(100, 100), 1 / 60, { vy: 0, grounded: true });
    }
    expect(scene.camera.pos.y).toBeLessThan(fallingY);
    expect(scene.camera.pos.y).toBeCloseTo(104, 0);
  });

  it('adds an extra landing dip for the impact preset', () => {
    const scene = fakeScene(100, 100);
    const follow = new CameraFollow(scene, findCameraFollowPreset('impact'));
    follow.snap(vec(100, 100));
    for (let i = 0; i < 60; i += 1) {
      follow.update(vec(100, 100), 1 / 60, { vy: 600, grounded: false });
    }
    const beforeLanding = scene.camera.pos.y;
    follow.update(vec(100, 100), 1 / 60, { vy: 0, grounded: true });
    expect(scene.camera.pos.y).toBeGreaterThanOrEqual(beforeLanding);
  });

  it('clamps the camera to the scene canvas when bounds are set', () => {
    const scene = fakeScene(400, 776);
    const follow = new CameraFollow(
      scene,
      findCameraFollowPreset('momentum'),
      { width: 1920, height: 864 },
    );
    follow.snap(vec(400, 776));
    expect(scene.camera.pos.x).toBe(480);
    expect(scene.camera.pos.y).toBe(594);
  });
});
