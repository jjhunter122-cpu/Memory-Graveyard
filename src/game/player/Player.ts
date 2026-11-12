import { Actor, CollisionType, Color, Side, Vector, type Engine } from 'excalibur';
import { PLAYER } from '../config';
import { readPlayerInput } from '../input/actions';
import {
  PLAYER_GROUP,
  PLAYER_IGNORE_ONEWAY_GROUP,
} from '../physics/collisionGroups';
import { PlayerController } from './PlayerController';
import type { GroundProbe, SlopeProbe } from '../level/loader';

/**
 * The Arcade solver does not report a ground contact on every physics step
 * while resting, so a raw per-frame flag flaps. The tile-level `groundProbe`
 * is the source of truth; a short event latch bridges the gaps.
 */
const GROUND_GRACE = 0.09;

/** The living caretaker, now a proper platformer character. */
export class Player extends Actor {
  readonly controller = new PlayerController();

  private groundTimer = 0;
  private dropTimer = 0;
  private frozen = false;
  private autoRunSpeed = 0;

  constructor(
    x: number,
    y: number,
    private readonly groundProbe?: GroundProbe,
    private readonly slopeProbe?: SlopeProbe,
    size: { width: number; height: number } = { width: PLAYER.width, height: PLAYER.height },
  ) {
    super({
      x,
      y,
      width: size.width,
      height: size.height,
      color: Color.fromHex(PLAYER.color),
      collisionType: CollisionType.Active,
      collisionGroup: PLAYER_GROUP,
      anchor: new Vector(0.5, 0.5),
    });
    this.body.useGravity = false;
    this.body.canSleep = false;

    const markGround = (side: Side): void => {
      if (side === Side.Bottom) {
        this.groundTimer = GROUND_GRACE;
      }
    };
    this.on('collisionstart', (event) => markGround(event.side));
    this.on('postcollision', (event) => markGround(event.side));
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    if (this.frozen) {
      this.vel.setTo(0, 0);
      this.controller.reset();
      return;
    }
    const dt = elapsed / 1000;
    const height = this.height;
    const halfWidth = this.width / 2;

    // Grounded if the tile probe says so, or a bottom contact fired recently.
    const risen = this.vel.y < -1;
    const ignoreOneWay = risen || this.dropTimer > 0;

    let onSlope = false;
    if (!risen && this.slopeProbe) {
      const feetY = this.pos.y + height / 2;
      const surfaceY = this.slopeProbe(this.pos.x, feetY, halfWidth);
      if (surfaceY !== null) {
        const delta = surfaceY - feetY;
        if (delta >= -14 && delta <= 22) {
          this.pos.y = surfaceY - height / 2;
          if (this.vel.y > 0) {
            this.vel.y = 0;
          }
          onSlope = true;
        }
      }
    }

    const feetY = this.pos.y + height / 2;
    const probeGrounded =
      !risen && this.groundProbe
        ? this.groundProbe(this.pos.x, feetY, halfWidth, ignoreOneWay)
        : false;
    this.controller.setGrounded(probeGrounded || onSlope || this.groundTimer > 0);

    const input = readPlayerInput(engine.input.keyboard);
    const step = this.controller.update({ vx: this.vel.x, vy: this.vel.y }, input, dt);
    const vx = this.autoRunSpeed !== 0 ? this.autoRunSpeed : step.vx;
    this.vel.setTo(vx, step.vy);

    // A jump clears the latch immediately so it cannot re-ground while rising.
    this.groundTimer = step.jumped ? 0 : Math.max(0, this.groundTimer - dt);

    if (step.dropThrough) {
      this.dropTimer = PLAYER.dropThroughTime;
    } else {
      this.dropTimer = Math.max(0, this.dropTimer - dt);
    }

    // Ignore one-way planks while rising or dropping through them.
    const passThrough = this.vel.y < -1 || this.dropTimer > 0;
    this.body.group = passThrough
      ? PLAYER_IGNORE_ONEWAY_GROUP
      : PLAYER_GROUP;
  }

  respawn(x: number, y: number): void {
    this.pos.setTo(x, y);
    this.vel.setTo(0, 0);
    this.groundTimer = 0;
    this.dropTimer = 0;
    this.frozen = false;
    this.controller.reset();
  }

  setFrozen(frozen: boolean): void {
    this.frozen = frozen;
    if (frozen) {
      this.vel.setTo(0, 0);
      this.controller.reset();
    }
  }

  /** Forces forward motion while leaving jump, gravity and collision intact. */
  setAutoRun(speed: number): void {
    this.autoRunSpeed = speed;
  }
}
