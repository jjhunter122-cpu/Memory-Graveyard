import {
  Actor,
  CollisionType,
  Sprite,
  Vector,
  type Engine,
  type ImageSource,
} from 'excalibur';

const BOLT_DISPLAY = 26;
const BOB = 4;
const BOB_SPEED = 2.2;

/**
 * Stamina pickup using the CC0 green bolt button. It is a pure sensor, so it
 * can never be stood on or block the player.
 */
export class StaminaBolt extends Actor {
  readonly home: Vector;
  private elapsedMs = Math.random() * 1000;

  constructor(x: number, y: number, image: ImageSource) {
    super({
      x,
      y,
      width: BOLT_DISPLAY,
      height: BOLT_DISPLAY,
      collisionType: CollisionType.PreventCollision,
      anchor: new Vector(0.5, 0.5),
      z: 2,
    });
    this.home = new Vector(x, y);
    this.graphics.use(
      new Sprite({
        image,
        destSize: { width: BOLT_DISPLAY, height: BOLT_DISPLAY },
      }),
    );
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    this.elapsedMs += elapsed;
    const phase = (this.elapsedMs / 1000) * BOB_SPEED;
    this.pos.setTo(this.home.x, this.home.y + Math.sin(phase) * BOB);
  }
}
