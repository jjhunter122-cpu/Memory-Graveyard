import { Actor, CollisionType, Color, Vector } from 'excalibur';
import { MONSTER } from '../config';

/**
 * The thing following the player. It has no body of its own: the chase
 * controller moves it along the recorded trail, so it can follow jumps and
 * vertical routes without pathfinding.
 */
export class Monster extends Actor {
  constructor(
    x: number,
    y: number,
    size: { width: number; height: number } = { width: MONSTER.width, height: MONSTER.height },
  ) {
    super({
      x,
      y,
      width: size.width,
      height: size.height,
      color: Color.fromHex(MONSTER.color),
      collisionType: CollisionType.PreventCollision,
      anchor: new Vector(0.5, 0.5),
      z: 2,
    });
  }
}
