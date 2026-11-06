import { describe, expect, it } from 'vitest';
import { clamp, rankFor } from '../src/game/systems/graveyard';

describe('clamp', () => {
  it('leaves values inside the range alone', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('pulls values up to the minimum and down to the maximum', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('centres values when the range is inverted', () => {
    expect(clamp(5, 10, 0)).toBe(5);
  });
});

describe('rankFor', () => {
  it('starts as a wanderer and ends as the gravekeeper', () => {
    expect(rankFor(0, 8)).toBe('Wanderer');
    expect(rankFor(8, 8)).toBe('Gravekeeper');
  });

  it('climbs through listener and medium', () => {
    expect(rankFor(3, 8)).toBe('Listener');
    expect(rankFor(5, 8)).toBe('Medium');
  });

  it('never divides by zero', () => {
    expect(rankFor(0, 0)).toBe('Wanderer');
  });
});
