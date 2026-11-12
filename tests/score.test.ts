import { describe, expect, it } from 'vitest';
import {
  MEMORY_SPACING,
  SCORE_PER_MEMORY,
  distanceScore,
  runScore,
} from '../src/game/run/score';

describe('run score', () => {
  it('scores distance', () => {
    expect(distanceScore(0)).toBe(0);
    expect(distanceScore(999)).toBe(99);
    expect(distanceScore(-50)).toBe(0);
  });

  it('adds memory points to distance', () => {
    expect(runScore(1000, 0)).toBe(100);
    expect(runScore(1000, 3)).toBe(100 + 3 * SCORE_PER_MEMORY);
  });

  it('uses a positive memory cluster spacing', () => {
    expect(MEMORY_SPACING).toBeGreaterThan(0);
  });
});
