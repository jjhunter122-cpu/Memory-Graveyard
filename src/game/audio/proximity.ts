/** Distance-based volume curve for the placeholder Guardian's metal steps. */

export const MONSTER_AUDIO = {
  /** Full volume within this distance of the player. */
  nearDistance: 100,
  /** Volume reaches the far value here. */
  farDistance: 600,
  /** No metal footsteps at or beyond this distance. */
  silentDistance: 650,
  nearVolume: 0.62,
  farVolume: 0.05,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns 0 at silence distance, full volume when close, and a smooth falloff
 * between. The final 50px fades from the far volume to zero.
 */
export function metalFootstepVolume(distance: number): number {
  const { nearDistance, farDistance, silentDistance, nearVolume, farVolume } =
    MONSTER_AUDIO;
  if (distance >= silentDistance) {
    return 0;
  }
  if (distance <= nearDistance) {
    return nearVolume;
  }
  if (distance <= farDistance) {
    const t = clamp(
      (distance - nearDistance) / (farDistance - nearDistance),
      0,
      1,
    );
    const smooth = t * t * (3 - 2 * t);
    return nearVolume + (farVolume - nearVolume) * smooth;
  }
  const t = clamp((distance - farDistance) / (silentDistance - farDistance), 0, 1);
  return farVolume * (1 - t);
}
