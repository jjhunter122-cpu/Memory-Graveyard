import { Actor, CollisionType, Color, Vector } from 'excalibur';
import { COLORS, TILE } from '../config';
import { TRIGGER_GROUP } from '../physics/collisionGroups';

/** The way out of the graveyard. Touching it completes the course. */
export class Exit extends Actor {
  constructor(x: number, y: number) {
    super({
      x,
      y,
      width: TILE,
      height: TILE,
      color: Color.fromHex(COLORS.exit),
      collisionType: CollisionType.Passive,
      collisionGroup: TRIGGER_GROUP,
      anchor: new Vector(0.5, 0.5),
    });
  }
}
