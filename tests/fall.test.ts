import { describe, expect, it } from 'vitest';
import { shouldStartPitFall } from '../src/game/run/fall';

const FLOOR_TOP = 512;

describe('pit fall trigger', () => {
  it('does not start while the player is still on solid ground', () => {
    expect(shouldStartPitFall(false, FLOOR_TOP, FLOOR_TOP)).toBe(false);
    expect(shouldStartPitFall(false, FLOOR_TOP + 40, FLOOR_TOP)).toBe(false);
  });

  it('does not start while the player is jumping above the floor line', () => {
    expect(shouldStartPitFall(true, FLOOR_TOP - 2, FLOOR_TOP)).toBe(false);
    expect(shouldStartPitFall(true, FLOOR_TOP - 80, FLOOR_TOP)).toBe(false);
  });

  it('starts once the centre is over the pit at the floor line', () => {
    expect(shouldStartPitFall(true, FLOOR_TOP - 1, FLOOR_TOP)).toBe(true);
    expect(shouldStartPitFall(true, FLOOR_TOP, FLOOR_TOP)).toBe(true);
    expect(shouldStartPitFall(true, FLOOR_TOP + 20, FLOOR_TOP)).toBe(true);
  });
});
