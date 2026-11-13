/**
 * Pit-fall trigger shared by the run scene and tests.
 *
 * The player's *centre* must be over a pit, not just its front edge: checking
 * the front edge used to start the fall while the player was still standing on
 * solid ground, which disabled tile collisions too early.
 */
export const PIT_FALL_FLOOR_GRACE = 1;

export function shouldStartPitFall(
  centerOverPit: boolean,
  feetY: number,
  floorTop: number,
): boolean {
  return centerOverPit && feetY >= floorTop - PIT_FALL_FLOOR_GRACE;
}
