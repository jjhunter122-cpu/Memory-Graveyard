import { describe, expect, it } from 'vitest';
import { PLAYER } from '../src/game/config';
import {
  PlayerController,
  type PlayerInput,
} from '../src/game/player/PlayerController';

const DT = 1 / 120;

const idle: PlayerInput = {
  axisX: 0,
  jumpPressed: false,
  jumpHeld: false,
  downHeld: false,
};

function input(overrides: Partial<PlayerInput>): PlayerInput {
  return { ...idle, ...overrides };
}

function groundedController(): PlayerController {
  const controller = new PlayerController();
  controller.setGrounded(true);
  return controller;
}

describe('PlayerController horizontal movement', () => {
  it('accelerates to the run speed on the ground', () => {
    const controller = groundedController();
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < 240; i += 1) {
      const step = controller.update({ vx, vy }, input({ axisX: 1 }), DT);
      vx = step.vx;
      vy = step.vy;
    }
    expect(vx).toBeCloseTo(PLAYER.runSpeed, 5);
  });

  it('frictions back to a stop when there is no input', () => {
    const controller = groundedController();
    let vx: number = PLAYER.runSpeed;
    let vy = 0;
    for (let i = 0; i < 60; i += 1) {
      const step = controller.update({ vx, vy }, idle, DT);
      vx = step.vx;
      vy = step.vy;
    }
    expect(vx).toBe(0);
  });
});

describe('PlayerController jumping', () => {
  it('jumps from the ground', () => {
    const controller = groundedController();
    const step = controller.update(
      { vx: 0, vy: 0 },
      input({ jumpPressed: true, jumpHeld: true }),
      DT,
    );
    expect(step.jumped).toBe(true);
    expect(step.vy).toBeLessThan(0);
  });

  it('allows a jump inside the coyote window', () => {
    const controller = groundedController();
    controller.update({ vx: 0, vy: 0 }, idle, DT);
    controller.setGrounded(false);
    controller.update({ vx: 0, vy: 0 }, idle, DT);
    const step = controller.update(
      { vx: 0, vy: 0 },
      input({ jumpPressed: true, jumpHeld: true }),
      DT,
    );
    expect(step.jumped).toBe(true);
  });

  it('refuses a jump once coyote time has expired', () => {
    const controller = groundedController();
    controller.update({ vx: 0, vy: 0 }, idle, DT);
    controller.setGrounded(false);
    for (let i = 0; i < 20; i += 1) {
      controller.update({ vx: 0, vy: 0 }, idle, DT);
    }
    const step = controller.update(
      { vx: 0, vy: 0 },
      input({ jumpPressed: true, jumpHeld: true }),
      DT,
    );
    expect(step.jumped).toBe(false);
  });

  it('buffers a jump pressed just before landing', () => {
    const controller = new PlayerController();
    controller.setGrounded(false);
    const airborne = controller.update(
      { vx: 0, vy: -100 },
      input({ jumpPressed: true, jumpHeld: true }),
      DT,
    );
    expect(airborne.jumped).toBe(false);

    controller.setGrounded(true);
    const landing = controller.update(
      { vx: 0, vy: 0 },
      input({ jumpHeld: true }),
      DT,
    );
    expect(landing.jumped).toBe(true);
  });

  it('cuts upward velocity when the jump button is released', () => {
    const controller = groundedController();
    const jump = controller.update(
      { vx: 0, vy: 0 },
      input({ jumpPressed: true, jumpHeld: true }),
      DT,
    );
    const cut = controller.update(
      { vx: 0, vy: jump.vy },
      input({ jumpHeld: false }),
      DT,
    );
    expect(cut.jumpCut).toBe(true);
    expect(cut.vy).toBeGreaterThan(jump.vy);
  });

  it('caps falling speed', () => {
    const controller = new PlayerController();
    controller.setGrounded(false);
    let vy = 0;
    for (let i = 0; i < 400; i += 1) {
      vy = controller.update({ vx: 0, vy }, idle, DT).vy;
    }
    expect(vy).toBe(PLAYER.maxFallSpeed);
  });
});

describe('PlayerController drop-through', () => {
  it('drops through instead of jumping when down is held on the ground', () => {
    const controller = groundedController();
    const step = controller.update(
      { vx: 0, vy: 0 },
      input({ downHeld: true, jumpPressed: true, jumpHeld: true }),
      DT,
    );
    expect(step.dropThrough).toBe(true);
    expect(step.jumped).toBe(false);
    expect(step.vy).toBeGreaterThanOrEqual(0);
  });
});
