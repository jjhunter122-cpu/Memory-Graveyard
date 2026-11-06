import { Actor, CollisionType, Color, Keys, Side, Vector, type Engine } from 'excalibur';
import { PLAYER } from '../config';
import {
  PLAYER_GROUP,
  PLAYER_IGNORE_ONEWAY_GROUP,
} from '../physics/collisionGroups';
import { PlayerController, type PlayerInput } from './PlayerController';

/** The living caretaker, now a proper platformer character. */
export class Player extends Actor {
  readonly controller = new PlayerController();

  private groundContact = false;
  private dropTimer = 0;

  constructor(x: number, y: number) {
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
        this.groundContact = true;
      }
    };
    this.on('collisionstart', (event) => markGround(event.side));
    this.on('postcollision', (event) => markGround(event.side));
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    const dt = elapsed / 1000;

    // Consume last frame's ground contact, then clear it; the solver refills it.
    this.controller.setGrounded(this.groundContact);
    this.groundContact = false;

    const keyboard = engine.input.keyboard;
    const right = keyboard.isHeld(Keys.Right) || keyboard.isHeld(Keys.D);
    const left = keyboard.isHeld(Keys.Left) || keyboard.isHeld(Keys.A);
    const jumpPressed =
      keyboard.wasPressed(Keys.Space) ||
      keyboard.wasPressed(Keys.W) ||
      keyboard.wasPressed(Keys.Up);

    const input: PlayerInput = {
      axisX: (right ? 1 : 0) - (left ? 1 : 0),
      jumpPressed,
      jumpHeld:
        keyboard.isHeld(Keys.Space) ||
        keyboard.isHeld(Keys.W) ||
        keyboard.isHeld(Keys.Up),
      downHeld: keyboard.isHeld(Keys.Down) || keyboard.isHeld(Keys.S),
    };

    const step = this.controller.update({ vx: this.vel.x, vy: this.vel.y }, input, dt);
    this.vel.setTo(step.vx, step.vy);

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
    this.groundContact = false;
    this.dropTimer = 0;
    this.controller.reset();
  }
}
