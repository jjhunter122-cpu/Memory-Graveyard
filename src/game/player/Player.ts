import { Actor, CollisionType, Color, Side, Vector, type Engine } from 'excalibur';
import { PLAYER } from '../config';
import { readPlayerInput } from '../input/actions';
import {
  PLAYER_GROUP,
  PLAYER_IGNORE_ONEWAY_GROUP,
} from '../physics/collisionGroups';
import { PlayerController } from './PlayerController';
import type { GroundProbe } from '../level/loader';

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

  constructor(x: number, y: number, private readonly groundProbe?: GroundProbe) {
    super({
      x,
      y,
      width: PLAYER.width,
      height: PLAYER.height,
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
    const dt = elapsed / 1000;

    // Grounded if the tile probe says so, or a bottom contact fired recently.
    const risen = this.vel.y < -1;
    const ignoreOneWay = risen || this.dropTimer > 0;
    const probeGrounded =
      !risen && this.groundProbe
        ? this.groundProbe(
            this.pos.x,
            this.pos.y + PLAYER.height / 2,
            PLAYER.width / 2,
            ignoreOneWay,
          )
        : false;
    this.controller.setGrounded(probeGrounded || this.groundTimer > 0);

    const input = readPlayerInput(engine.input.keyboard);
    const step = this.controller.update({ vx: this.vel.x, vy: this.vel.y }, input, dt);
    this.vel.setTo(step.vx, step.vy);

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
    this.controller.reset();
  }
}
