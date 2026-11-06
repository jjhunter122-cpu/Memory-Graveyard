import { describe, expect, it } from 'vitest';
import {
  clamp,
  distanceBetween,
  memoriesInReach,
  rankFor,
} from '../src/game/systems/graveyard';

describe('clamp', () => {
  it('leaves values inside the range alone', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('pulls values up to the minimum and down to the maximum', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('distanceBetween', () => {
  it('measures euclidean distance', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('memoriesInReach', () => {
  const memories = [
    { x: 5, y: 0 },
    { x: 20, y: 0 },
    { x: 0, y: -8 },
  ];

  it('returns the indices of memories inside the reach', () => {
    expect(memoriesInReach({ x: 0, y: 0 }, 10, memories)).toEqual([0, 2]);
  });

  it('treats the reach boundary as inclusive', () => {
    expect(memoriesInReach({ x: 0, y: 0 }, 20, memories)).toEqual([0, 1, 2]);
  });

  it('returns nothing when every memory is out of range', () => {
    expect(memoriesInReach({ x: 999, y: 999 }, 10, memories)).toEqual([]);
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
