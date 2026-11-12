import {
  Actor,
  CollisionType,
  Sprite,
  Vector,
  type Engine,
  type ImageSource,
} from 'excalibur';

const COIN_DISPLAY = 24;
const BOB = 4;
const BOB_SPEED = 2.2;

/**
 * Score pickup. The silver coin replaces the old memory orb but keeps the same
 * bob and collection behaviour.
 */
export class MemoryPickup extends Actor {
  readonly home: Vector;
  private elapsedMs = Math.random() * 1000;

  constructor(x: number, y: number, image: ImageSource) {
    super({
      x,
      y,
      width: COIN_DISPLAY,
      height: COIN_DISPLAY,
      collisionType: CollisionType.PreventCollision,
      anchor: new Vector(0.5, 0.5),
      z: 2,
    });
    this.home = new Vector(x, y);
    this.graphics.use(
      new Sprite({
        image,
        destSize: { width: COIN_DISPLAY, height: COIN_DISPLAY },
      }),
    );
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.elapsedMs += elapsed;
    const phase = (this.elapsedMs / 1000) * BOB_SPEED;
    this.pos.setTo(this.home.x, this.home.y + Math.sin(phase) * BOB);
  }
}
