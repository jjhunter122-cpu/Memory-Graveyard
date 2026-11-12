import { describe, expect, it } from 'vitest';
import {
  LOW_STAMINA_SPEED,
  LOW_STAMINA_THRESHOLD,
  SHARD_MAX_SPACING,
  SHARD_MIN_SPACING,
  STAMINA_MAX,
  shardRowOffset,
  shardSpacingAt,
  staminaSpeedFactor,
} from '../src/game/run/stamina';

describe('stamina', () => {
  it('keeps full speed until the bar is empty', () => {
    expect(staminaSpeedFactor(STAMINA_MAX)).toBe(1);
    expect(staminaSpeedFactor(LOW_STAMINA_THRESHOLD)).toBe(1);
    expect(staminaSpeedFactor(1)).toBe(1);
    expect(staminaSpeedFactor(0)).toBe(LOW_STAMINA_SPEED);
  });

  it('widens shard spacing to the cap', () => {
    expect(shardSpacingAt(0)).toBe(SHARD_MIN_SPACING);
    expect(shardSpacingAt(100000)).toBe(SHARD_MAX_SPACING);
    expect(shardSpacingAt(10000)).toBeGreaterThan(SHARD_MIN_SPACING);
    expect(shardSpacingAt(10000)).toBeLessThan(SHARD_MAX_SPACING);
  });

  it('alternates ground and air shard offsets', () => {
    expect(shardRowOffset(0)).toBe(1);
    expect(shardRowOffset(1)).toBe(3);
    expect(shardRowOffset(2)).toBe(1);
  });
});
