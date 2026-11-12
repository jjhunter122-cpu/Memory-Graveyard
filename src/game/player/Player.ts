import { Actor, CollisionType, Color, Side, Vector, type Engine } from 'excalibur';
import { PLAYER } from '../config';
import { readPlayerInput } from '../input/actions';
import {
  PLAYER_GROUP,
  PLAYER_IGNORE_ONEWAY_GROUP,
} from '../physics/collisionGroups';
import { PlayerController } from './PlayerController';
import type { GroundProbe } from '../level/loader';
import type { HeroAnimations } from '../visuals/hero';

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
  private hero?: HeroAnimations;
  private animationName: keyof HeroAnimations | null = null;
  private deadLocked = false;
  private wasGrounded = true;
  private landingTimer = 0;

  constructor(
    x: number,
    y: number,
    private readonly groundProbe?: GroundProbe,
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
    // The featureless rectangle reads as hovering on the tile line. Sink the
    // graphics only; the collision body stays exactly on the floor.
    this.graphics.offset = new Vector(0, 3);

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

    const feetY = this.pos.y + height / 2;
    const probeGrounded =
      !risen && this.groundProbe
        ? this.groundProbe(this.pos.x, feetY, halfWidth, ignoreOneWay)
        : false;
    this.controller.setGrounded(probeGrounded || this.groundTimer > 0);

    const input = readPlayerInput(engine.input.keyboard);
    const step = this.controller.update({ vx: this.vel.x, vy: this.vel.y }, input, dt);
    const vx = this.autoRunSpeed !== 0 ? this.autoRunSpeed : step.vx;
    this.vel.setTo(vx, step.vy);
    this.updateAnimation(dt);

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
    this.deadLocked = false;
    this.animationName = null;
    this.controller.reset();
    if (this.hero) {
      this.playAnimation('idle', true);
    }
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

  /** Swaps the placeholder rectangle for the Pixel Platformer character. */
  setAnimations(animations: HeroAnimations): void {
    this.hero = animations;
    this.animationName = null;
    this.deadLocked = false;
    this.playAnimation('idle', true);
  }

  /** Holds the final death frame and stops state animations overriding it. */
  playDeath(): void {
    if (!this.hero) {
      return;
    }
    this.deadLocked = true;
    this.playAnimation('dead', true);
  }

  /** Disables world collision while a pit drop is in progress. */
  setGhost(ghost: boolean): void {
    this.body.collisionType = ghost
      ? CollisionType.PreventCollision
      : CollisionType.Active;
  }

  private playAnimation(
    name: keyof HeroAnimations,
    restart = false,
  ): void {
    if (!this.hero) {
      return;
    }
    if (!restart && this.animationName === name) {
      return;
    }
    const animation = this.hero[name];
    if (restart) {
      animation.goToFrame(0);
      animation.play();
    }
    this.animationName = name;
    this.graphics.use(animation);
  }

  private updateAnimation(dt: number): void {
    if (!this.hero || this.deadLocked) {
      return;
    }
    const grounded = this.controller.isGrounded;
    const speed = Math.abs(this.vel.x);

    if (!grounded) {
      this.wasGrounded = false;
      this.landingTimer = 0;
      this.playAnimation('jump');
      return;
    }

    if (!this.wasGrounded) {
      this.wasGrounded = true;
      this.landingTimer = 0.24;
      this.playAnimation('landing', true);
      return;
    }

    if (this.landingTimer > 0) {
      this.landingTimer = Math.max(0, this.landingTimer - dt);
      this.playAnimation('landing');
      return;
    }

    this.playAnimation(speed > 20 ? 'run' : 'idle');
  }
}
