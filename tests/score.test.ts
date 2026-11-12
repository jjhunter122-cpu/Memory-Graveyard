import { describe, expect, it } from 'vitest';
import {
  COIN_SPACING,
  SCORE_PER_COIN,
  distanceScore,
  runScore,
} from '../src/game/run/score';

describe('run score', () => {
  it('scores distance', () => {
    expect(distanceScore(0)).toBe(0);
    expect(distanceScore(999)).toBe(99);
    expect(distanceScore(-50)).toBe(0);
  });

  it('adds coin points to distance', () => {
    expect(runScore(1000, 0)).toBe(100);
    expect(runScore(1000, 3)).toBe(100 + 3 * SCORE_PER_COIN);
  });

  it('uses a positive coin cluster spacing', () => {
    expect(COIN_SPACING).toBeGreaterThan(0);
  });
});
