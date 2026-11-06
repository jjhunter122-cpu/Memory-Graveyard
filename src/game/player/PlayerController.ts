import { GRAVITY, PLAYER } from '../config';

export interface PlayerInput {
  /** -1, 0 or 1. */
  axisX: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  downHeld: boolean;
}

export interface PlayerKinematics {
  vx: number;
  vy: number;
}

export interface PlayerStep extends PlayerKinematics {
  jumped: boolean;
  jumpCut: boolean;
  dropThrough: boolean;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) {
    return Math.min(current + maxDelta, target);
  }
  if (current > target) {
    return Math.max(current - maxDelta, target);
  }
  return target;
}

/**
 * Pure platformer movement decisions: acceleration, gravity, variable-height
 * jump, coyote time and jump buffering. Excalibur's Arcade solver handles
 * collision resolution; everything the *feel* depends on lives here so it can be
 * replayed deterministically in Vitest.
 */
export class PlayerController {
  private grounded = false;
  private coyote = 0;
  private buffer = 0;
  private jumping = false;

  /** Called each step with the ground contact reported by the physics solver. */
  setGrounded(grounded: boolean): void {
    this.grounded = grounded;
    if (grounded) {
      this.coyote = PLAYER.coyoteTime;
      this.jumping = false;
    }
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  /** Clears all timers, e.g. after a respawn. */
  reset(): void {
    this.grounded = false;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
  }

  update(kin: PlayerKinematics, input: PlayerInput, dt: number): PlayerStep {
    this.coyote = this.grounded ? PLAYER.coyoteTime : Math.max(0, this.coyote - dt);
    this.buffer = input.jumpPressed ? PLAYER.jumpBufferTime : Math.max(0, this.buffer - dt);

    let vx = kin.vx;
    let vy = kin.vy;
    let jumped = false;
    let jumpCut = false;
    let dropThrough = false;

    // Horizontal acceleration / friction.
    if (input.axisX !== 0) {
      const accel = this.grounded ? PLAYER.groundAccel : PLAYER.airAccel;
      vx = approach(vx, input.axisX * PLAYER.runSpeed, accel * dt);
    } else {
      const friction = this.grounded ? PLAYER.groundFriction : PLAYER.airFriction;
      vx = approach(vx, 0, friction * dt);
    }

    // Down + jump on the ground drops through a one-way plank.
    if (this.grounded && input.downHeld && input.jumpPressed) {
      dropThrough = true;
      this.buffer = 0;
      this.coyote = 0;
    }

    // Jump, honouring buffered input and coyote time.
    if (!dropThrough && this.buffer > 0 && this.coyote > 0) {
      vy = -PLAYER.jumpSpeed;
      jumped = true;
      this.jumping = true;
      this.buffer = 0;
      this.coyote = 0;
      this.grounded = false;
    }

    // Variable-height jump: cut upward velocity once when the button is released.
    if (this.jumping && !input.jumpHeld && vy < 0) {
      vy *= PLAYER.jumpCutMultiplier;
      jumpCut = true;
      this.jumping = false;
    }
    if (vy >= 0) {
      this.jumping = false;
    }

    // Gravity, softened briefly near the apex for a floatier hang.
    const nearApex = Math.abs(vy) < PLAYER.apexVelocity;
    vy += GRAVITY * (nearApex ? PLAYER.apexGravityScale : 1) * dt;
    if (vy > PLAYER.maxFallSpeed) {
      vy = PLAYER.maxFallSpeed;
    }

    // Standing on ground: cancel any downward velocity.
    if (this.grounded && vy > 0) {
      vy = 0;
    }

    return { vx, vy, jumped, jumpCut, dropThrough };
  }
}
