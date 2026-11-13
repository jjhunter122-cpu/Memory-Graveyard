import { describe, expect, it } from 'vitest';
import {
  BOLT_MAX_SPACING,
  BOLT_MIN_SPACING,
  LOW_STAMINA_SPEED,
  LOW_STAMINA_THRESHOLD,
  STAMINA_MAX,
  boltRowOffset,
  boltSpacingAt,
  staminaSpeedFactor,
} from '../src/game/run/stamina';

describe('stamina', () => {
  it('keeps full speed until the bar is empty', () => {
    expect(staminaSpeedFactor(STAMINA_MAX)).toBe(1);
    expect(staminaSpeedFactor(LOW_STAMINA_THRESHOLD)).toBe(1);
    expect(staminaSpeedFactor(1)).toBe(1);
    expect(staminaSpeedFactor(0)).toBe(LOW_STAMINA_SPEED);
  });

  it('widens bolt spacing to the cap', () => {
    expect(boltSpacingAt(0)).toBe(BOLT_MIN_SPACING);
    expect(boltSpacingAt(100000)).toBe(BOLT_MAX_SPACING);
    expect(boltSpacingAt(10000)).toBeGreaterThan(BOLT_MIN_SPACING);
    expect(boltSpacingAt(10000)).toBeLessThan(BOLT_MAX_SPACING);
  });

  it('alternates ground and air bolt offsets', () => {
    expect(boltRowOffset(0)).toBe(1);
    expect(boltRowOffset(1)).toBe(3);
    expect(boltRowOffset(2)).toBe(1);
  });
});
