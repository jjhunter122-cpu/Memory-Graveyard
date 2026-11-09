import { describe, expect, it } from 'vitest';
import {
  CHARACTER_SCALE_OPTIONS,
  characterMetrics,
  isCharacterScale,
  normalizeCharacterScale,
} from '../src/game/characterScale';
import { MONSTER, PLAYER } from '../src/game/config';

describe('character scale options', () => {
  it('offers base plus the three tile-height targets', () => {
    expect(CHARACTER_SCALE_OPTIONS.map((option) => option.value)).toEqual([1, 1.5, 1.75, 2]);
  });

  it('normalizes unknown values back to the base scale', () => {
    expect(normalizeCharacterScale(1.5)).toBe(1.5);
    expect(normalizeCharacterScale(2)).toBe(2);
    expect(normalizeCharacterScale(3)).toBe(1);
    expect(normalizeCharacterScale(undefined)).toBe(1);
    expect(isCharacterScale(1.75)).toBe(true);
    expect(isCharacterScale('2')).toBe(false);
  });
});

describe('character metrics', () => {
  it('keeps the existing sizes for the current/base option', () => {
    const metrics = characterMetrics(1, 32);
    expect(metrics.playerWidth).toBe(PLAYER.width);
    expect(metrics.playerHeight).toBe(PLAYER.height);
    expect(metrics.monsterWidth).toBe(MONSTER.width);
    expect(metrics.monsterHeight).toBe(MONSTER.height);
    expect(metrics.catchRadius).toBe(MONSTER.catchRadius);
  });

  it('sets both characters to the same height for scaled options', () => {
    for (const scale of [1.5, 1.75, 2] as const) {
      const metrics = characterMetrics(scale, 32);
      const target = Math.round(32 * scale);
      expect(metrics.playerHeight).toBe(target);
      expect(metrics.monsterHeight).toBe(target);
      expect(metrics.heroDisplayHeight).toBe(target);
      expect(metrics.skeletonDisplayHeight).toBe(target);
      expect(metrics.ghostDisplaySize).toBe(target);
      expect(metrics.playerWidth).toBeGreaterThan(0);
      expect(metrics.monsterWidth).toBeGreaterThan(0);
    }
  });

  it('scales with the level tile size', () => {
    const small = characterMetrics(2, 16);
    const large = characterMetrics(2, 32);
    expect(small.playerHeight).toBe(32);
    expect(large.playerHeight).toBe(64);
    expect(large.catchRadius).toBeGreaterThan(small.catchRadius);
  });
});
