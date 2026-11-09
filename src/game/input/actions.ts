import type { Keyboard, Keys } from 'excalibur';
import type { PlayerInput } from '../player/PlayerController';

/**
 * Gameplay actions and their default bindings. Keeping this in one place makes
 * future rebinding, gamepad support and reserved actions straightforward.
 *
 * The values use the same strings as Excalibur's `Keys` enum so this module
 * stays free of engine runtime imports (and testable in Node).
 */
export type Action =
  | 'left'
  | 'right'
  | 'jump'
  | 'drop'
  | 'sprint'
  | 'slide'
  | 'interact'
  | 'holdBreath';

/**
 * Gameplay is WASD-only. Arrow keys are intentionally not bound.
 *
 * `sprint`, `slide`, `interact` and `holdBreath` are reserved for the pinned
 * stamina/hiding work; they are mapped here but no system consumes them yet.
 */
export const BINDINGS = {
  left: ['KeyA'],
  right: ['KeyD'],
  jump: ['Space', 'KeyW'],
  drop: ['KeyS'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  slide: ['ControlLeft', 'ControlRight'],
  interact: ['KeyE'],
  holdBreath: ['KeyF'],
} as const satisfies Record<Action, readonly string[]>;

export function isActionHeld(keyboard: Keyboard, action: Action): boolean {
  return BINDINGS[action].some((key) => keyboard.isHeld(key as Keys));
}

export function wasActionPressed(keyboard: Keyboard, action: Action): boolean {
  return BINDINGS[action].some((key) => keyboard.wasPressed(key as Keys));
}

/** Snapshots the movement/jump intent for the player controller. */
export function readPlayerInput(keyboard: Keyboard): PlayerInput {
  const left = isActionHeld(keyboard, 'left');
  const right = isActionHeld(keyboard, 'right');
  return {
    axisX: (right ? 1 : 0) - (left ? 1 : 0),
    jumpPressed: wasActionPressed(keyboard, 'jump'),
    jumpHeld: isActionHeld(keyboard, 'jump'),
    downHeld: isActionHeld(keyboard, 'drop'),
  };
}
