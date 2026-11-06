import { Actor, CollisionType, Color, Vector, type Engine } from 'excalibur';
import { MEMORY } from '../config';

/** A single glowing memory. Bobs in place until the caretaker walks into it. */
export class Memory extends Actor {
  readonly spotX: number;
  readonly spotY: number;
  private elapsedMs = Math.random() * 1000;

  constructor(x: number, y: number) {
    super({
      x,
      y,
      radius: MEMORY.radius,
      color: Color.fromHex(MEMORY.color),
      collisionType: CollisionType.Passive,
      anchor: new Vector(0.5, 0.5),
    });
    this.spotX = x;
    this.spotY = y;
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.elapsedMs += elapsed;
    const phase = (this.elapsedMs / 1000) * MEMORY.bobSpeed;
    this.pos.setTo(this.spotX, this.spotY + Math.sin(phase) * MEMORY.bob);
  }
}
