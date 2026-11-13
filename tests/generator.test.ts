import { describe, expect, it } from 'vitest';
import {
  ACT_SAFE_END,
  ACT_SAFE_START,
  ACT_WIDTH,
  BASE_SPEED,
  MAX_SPEED,
  MIN_PIT_SPACING,
  SPEED_RAMP_DISTANCE,
  generateFeatures,
  generatePits,
  isOverPit,
  maxPitWidth,
  speedAt,
} from '../src/game/run/generator';

describe('run generator', () => {
  it('is deterministic for the same seed', () => {
    expect(generatePits(1234, 0)).toEqual(generatePits(1234, 0));
  });

  it('differs across seeds', () => {
    expect(generatePits(1, 0)).not.toEqual(generatePits(2, 0));
  });

  it('keeps the act start and end flat', () => {
    for (let act = 0; act < 12; act += 1) {
      for (const pit of generatePits(99, act)) {
        expect(pit.start).toBeGreaterThanOrEqual(
          ACT_SAFE_START + MIN_PIT_SPACING,
        );
        expect(pit.start + pit.width).toBeLessThanOrEqual(
          ACT_WIDTH - ACT_SAFE_END,
        );
      }
    }
  });

  it('spaces pits apart and caps their width by act', () => {
    for (let act = 0; act < 12; act += 1) {
      let previousEnd = ACT_SAFE_START;
      for (const pit of generatePits(4321, act)) {
        expect(pit.start - previousEnd).toBeGreaterThanOrEqual(MIN_PIT_SPACING);
        expect(pit.width).toBeGreaterThanOrEqual(2);
        expect(pit.width).toBeLessThanOrEqual(maxPitWidth(act));
        previousEnd = pit.start + pit.width;
      }
    }
  });

  it('finds tiles inside a pit', () => {
    const pits = [{ start: 30, width: 3 }];
    expect(isOverPit(pits, 29)).toBe(false);
    expect(isOverPit(pits, 30)).toBe(true);
    expect(isOverPit(pits, 32)).toBe(true);
    expect(isOverPit(pits, 33)).toBe(false);
  });

  it('ramps speed and caps it', () => {
    expect(speedAt(0)).toBe(BASE_SPEED);
    expect(speedAt(SPEED_RAMP_DISTANCE)).toBe(MAX_SPEED);
    expect(speedAt(SPEED_RAMP_DISTANCE * 2)).toBe(MAX_SPEED);
    expect(speedAt(15000)).toBeGreaterThan(BASE_SPEED);
    expect(speedAt(15000)).toBeLessThan(MAX_SPEED);
  });
});

describe('act features', () => {
  it('is deterministic for the same seed', () => {
    const pits = generatePits(2024, 3);
    expect(generateFeatures(2024, 3, pits)).toEqual(
      generateFeatures(2024, 3, pits),
    );
  });

  it('keeps raised sections on flat ground with safe margins', () => {
    for (let act = 0; act < 12; act += 1) {
      const pits = generatePits(777, act);
      const features = generateFeatures(777, act, pits);
      for (const section of features.raised) {
        expect(section.width).toBeGreaterThanOrEqual(2);
        expect(section.topRow === 14 || section.topRow === 15).toBe(true);
        expect(section.start).toBeGreaterThanOrEqual(ACT_SAFE_START + 3);
        expect(section.start + section.width).toBeLessThanOrEqual(
          ACT_WIDTH - ACT_SAFE_END - 3,
        );
        for (let x = section.start; x < section.start + section.width; x += 1) {
          expect(isOverPit(pits, x)).toBe(false);
        }
        for (const pit of pits) {
          const before = section.start + section.width <= pit.start - 3;
          const after = section.start >= pit.start + pit.width + 3;
          expect(before || after).toBe(true);
        }
      }
    }
  });

  it('places floating platforms inside pits', () => {
    for (let act = 0; act < 12; act += 1) {
      const pits = generatePits(888, act);
      const features = generateFeatures(888, act, pits);
      for (const platform of features.floating) {
        expect(platform.topRow === 14 || platform.topRow === 15).toBe(true);
        const host = pits.find(
          (pit) =>
            platform.start >= pit.start &&
            platform.start + platform.width <= pit.start + pit.width,
        );
        expect(host).toBeDefined();
      }
    }
  });
});
