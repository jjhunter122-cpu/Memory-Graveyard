import { describe, expect, it } from 'vitest';
import {
  MONSTER_AUDIO,
  metalFootstepVolume,
} from '../src/game/audio/proximity';

describe('monster metal footstep proximity', () => {
  it('is loud when the monster is on top of the player', () => {
    expect(metalFootstepVolume(0)).toBe(MONSTER_AUDIO.nearVolume);
    expect(metalFootstepVolume(MONSTER_AUDIO.nearDistance)).toBe(
      MONSTER_AUDIO.nearVolume,
    );
  });

  it('fades with distance', () => {
    const near = metalFootstepVolume(100);
    const mid = metalFootstepVolume(350);
    const far = metalFootstepVolume(600);
    expect(mid).toBeLessThan(near);
    expect(far).toBeLessThan(mid);
    expect(far).toBeCloseTo(MONSTER_AUDIO.farVolume, 5);
  });

  it('goes silent beyond the proximity range', () => {
    expect(metalFootstepVolume(MONSTER_AUDIO.silentDistance)).toBe(0);
    expect(metalFootstepVolume(2000)).toBe(0);
  });
});
