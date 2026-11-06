import { GRAVE, VIEW } from '../config';

/** Everything the player can stand on or read at start-up. */
export const PLAYER_START = { x: VIEW.width / 2, y: VIEW.height - 70 } as const;

/** Where each glowing memory rests. Pure data so tests can assert the layout. */
export const MEMORY_SPOTS = [
  { x: 150, y: 130 },
  { x: 810, y: 140 },
  { x: 480, y: 96 },
  { x: 250, y: 300 },
  { x: 710, y: 320 },
  { x: 470, y: 410 },
  { x: 120, y: 450 },
  { x: 845, y: 452 },
] as const;

/** Purely decorative headstones. */
export const GRAVE_SPOTS = [
  { x: 90, y: 110, width: 46, height: 34 },
  { x: 360, y: 205, width: 40, height: 30 },
  { x: 620, y: 205, width: 40, height: 30 },
  { x: 890, y: 96, width: 44, height: 32 },
  { x: 180, y: 360, width: 40, height: 30 },
  { x: 780, y: 400, width: 44, height: 32 },
] as const;

/** Layout contract: keeps every spot inside the playable frame. */
export const LAYOUT_MARGIN = 40;

export function spotWithinBounds(spot: { x: number; y: number }): boolean {
  return (
    spot.x >= LAYOUT_MARGIN &&
    spot.x <= VIEW.width - LAYOUT_MARGIN &&
    spot.y >= LAYOUT_MARGIN &&
    spot.y <= VIEW.height - LAYOUT_MARGIN
  );
}

export { GRAVE };
