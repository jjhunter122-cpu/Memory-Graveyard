import { Actor, CollisionType, Color, Keys, Vector, type Engine } from 'excalibur';
import { PLAYER, VIEW } from '../config';
import { clamp } from '../systems/graveyard';

/** The living caretaker. WASD / arrow movement with a hard clamp to the frame. */
export class Gravekeeper extends Actor {
  constructor(x: number, y: number) {
    super({
      x,
      y,
      radius: PLAYER.radius,
      color: Color.fromHex(PLAYER.color),
      collisionType: CollisionType.Passive,
      anchor: new Vector(0.5, 0.5),
    });
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    const dt = elapsed / 1000;
    const keyboard = engine.input.keyboard;

    const direction = new Vector(0, 0);
    if (keyboard.isHeld(Keys.Left) || keyboard.isHeld(Keys.A)) {
      direction.x -= 1;
    }
    if (keyboard.isHeld(Keys.Right) || keyboard.isHeld(Keys.D)) {
      direction.x += 1;
    }
    if (keyboard.isHeld(Keys.Up) || keyboard.isHeld(Keys.W)) {
      direction.y -= 1;
    }
    if (keyboard.isHeld(Keys.Down) || keyboard.isHeld(Keys.S)) {
      direction.y += 1;
    }

    if (direction.magnitude > 0) {
      const step = direction.normalize().scale(PLAYER.speed * dt);
      this.pos = this.pos.add(step);
    }

    this.pos.x = clamp(this.pos.x, PLAYER.radius, VIEW.width - PLAYER.radius);
    this.pos.y = clamp(this.pos.y, PLAYER.radius, VIEW.height - PLAYER.radius);
  }

  reset(x: number, y: number): void {
    this.pos.setTo(x, y);
  }
}
