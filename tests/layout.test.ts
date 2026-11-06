import { describe, expect, it } from 'vitest';
import { PLAYER, VIEW } from '../src/game/config';
import {
  GRAVE_SPOTS,
  MEMORY_SPOTS,
  PLAYER_START,
  spotWithinBounds,
} from '../src/game/level/spots';

describe('level layout', () => {
  it('keeps every memory inside the playable frame', () => {
    for (const spot of MEMORY_SPOTS) {
      expect(spotWithinBounds(spot), `memory at ${spot.x},${spot.y}`).toBe(true);
    }
  });

  it('keeps every gravestone inside the playable frame', () => {
    for (const spot of GRAVE_SPOTS) {
      expect(
        spotWithinBounds({ x: spot.x, y: spot.y }),
        `grave at ${spot.x},${spot.y}`,
      ).toBe(true);
    }
  });

  it('starts the caretaker inside the frame and clear of the player radius', () => {
    expect(spotWithinBounds(PLAYER_START)).toBe(true);
    expect(PLAYER_START.x).toBeGreaterThanOrEqual(PLAYER.radius);
    expect(PLAYER_START.x).toBeLessThanOrEqual(VIEW.width - PLAYER.radius);
    expect(PLAYER_START.y).toBeGreaterThanOrEqual(PLAYER.radius);
    expect(PLAYER_START.y).toBeLessThanOrEqual(VIEW.height - PLAYER.radius);
  });

  it('does not spawn a memory on top of the caretaker', () => {
    for (const spot of MEMORY_SPOTS) {
      const distance = Math.hypot(spot.x - PLAYER_START.x, spot.y - PLAYER_START.y);
      expect(distance).toBeGreaterThan(PLAYER.radius + 20);
    }
  });

  it('gives every memory a unique position', () => {
    const keys = new Set(MEMORY_SPOTS.map((spot) => `${spot.x},${spot.y}`));
    expect(keys.size).toBe(MEMORY_SPOTS.length);
  });
});
