import { Actor, CollisionType, Color, Vector, type Engine } from 'excalibur';
import { MEMORY } from '../config';
import { TRIGGER_GROUP } from '../physics/collisionGroups';

/** A single glowing memory. Bobs in place until the caretaker walks into it. */
export class Memory extends Actor {
  readonly home: Vector;
  private elapsedMs = Math.random() * 1000;

  constructor(x: number, y: number) {
    super({
      x,
      y,
      radius: MEMORY.radius,
      color: Color.fromHex(MEMORY.color),
      collisionType: CollisionType.Passive,
      collisionGroup: TRIGGER_GROUP,
      anchor: new Vector(0.5, 0.5),
    });
    this.home = new Vector(x, y);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.elapsedMs += elapsed;
    const phase = (this.elapsedMs / 1000) * MEMORY.bobSpeed;
    this.pos.setTo(this.home.x, this.home.y + Math.sin(phase) * MEMORY.bob);
  }
}
