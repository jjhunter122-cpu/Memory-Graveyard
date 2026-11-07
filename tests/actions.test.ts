import { describe, expect, it } from 'vitest';
import type { Keyboard } from 'excalibur';
import { isActionHeld, readPlayerInput, wasActionPressed } from '../src/game/input/actions';

function keyboard(held: string[] = [], pressed: string[] = []): Keyboard {
  return {
    isHeld: (key: string) => held.includes(key),
    wasPressed: (key: string) => pressed.includes(key),
  } as unknown as Keyboard;
}

describe('gameplay bindings', () => {
  it('moves with A and D only', () => {
    expect(readPlayerInput(keyboard(['KeyA'])).axisX).toBe(-1);
    expect(readPlayerInput(keyboard(['KeyD'])).axisX).toBe(1);
    expect(readPlayerInput(keyboard(['ArrowLeft'])).axisX).toBe(0);
    expect(readPlayerInput(keyboard(['ArrowRight'])).axisX).toBe(0);
  });

  it('keeps arrows out of the jump binding', () => {
    expect(readPlayerInput(keyboard([], ['ArrowUp'])).jumpPressed).toBe(false);
    expect(readPlayerInput(keyboard([], ['Space'])).jumpPressed).toBe(true);
    expect(readPlayerInput(keyboard(['KeyW'])).jumpHeld).toBe(true);
  });

  it('uses S for dropping through planks', () => {
    expect(readPlayerInput(keyboard(['KeyS'])).downHeld).toBe(true);
    expect(readPlayerInput(keyboard(['ArrowDown'])).downHeld).toBe(false);
  });

  it('reserves the future sprint, slide, interact and breath keys', () => {
    expect(isActionHeld(keyboard(['ShiftLeft']), 'sprint')).toBe(true);
    expect(isActionHeld(keyboard(['ControlLeft']), 'slide')).toBe(true);
    expect(wasActionPressed(keyboard([], ['KeyE']), 'interact')).toBe(true);
    expect(isActionHeld(keyboard(['KeyF']), 'holdBreath')).toBe(true);
  });
});
