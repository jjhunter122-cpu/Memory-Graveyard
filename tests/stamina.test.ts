import { describe, expect, it } from 'vitest';
import { ACT_FLOOR_ROW } from '../src/game/run/generator';
import {
  LOW_STAMINA_SPEED,
  LOW_STAMINA_THRESHOLD,
  SHARD_MAX_SPACING,
  SHARD_MIN_SPACING,
  STAMINA_MAX,
  shardHeightAt,
  shardSpacingAt,
  staminaSpeedFactor,
} from '../src/game/run/stamina';

describe('stamina', () => {
  it('keeps full speed until the low threshold', () => {
    expect(staminaSpeedFactor(STAMINA_MAX)).toBe(1);
    expect(staminaSpeedFactor(LOW_STAMINA_THRESHOLD)).toBe(1);
  });

  it('slows linearly to the low speed', () => {
    expect(staminaSpeedFactor(0)).toBe(LOW_STAMINA_SPEED);
    expect(staminaSpeedFactor(LOW_STAMINA_THRESHOLD / 2)).toBeCloseTo(
      (1 + LOW_STAMINA_SPEED) / 2,
    );
  });

  it('widens shard spacing to the cap', () => {
    expect(shardSpacingAt(0)).toBe(SHARD_MIN_SPACING);
    expect(shardSpacingAt(100000)).toBe(SHARD_MAX_SPACING);
    expect(shardSpacingAt(10000)).toBeGreaterThan(SHARD_MIN_SPACING);
    expect(shardSpacingAt(10000)).toBeLessThan(SHARD_MAX_SPACING);
  });

  it('alternates ground and air shards', () => {
    expect(shardHeightAt(0)).toBe(ACT_FLOOR_ROW - 1);
    expect(shardHeightAt(1)).toBe(ACT_FLOOR_ROW - 3);
    expect(shardHeightAt(2)).toBe(ACT_FLOOR_ROW - 1);
  });
});
