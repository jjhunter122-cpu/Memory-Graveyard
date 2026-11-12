import { Actor, CollisionType, Color, Vector } from 'excalibur';
import { COLORS, TILE } from '../config';

/**
 * Stamina pickup. It reuses the old green exit colour and size but is a pure
 * sensor: no collision body, so it can never be stood on or block the player.
 */
export class StaminaShard extends Actor {
  constructor(x: number, y: number) {
    super({
      x,
      y,
      width: TILE,
      height: TILE,
      color: Color.fromHex(COLORS.exit),
      collisionType: CollisionType.PreventCollision,
      anchor: new Vector(0.5, 0.5),
      z: 1,
    });
  }
}
