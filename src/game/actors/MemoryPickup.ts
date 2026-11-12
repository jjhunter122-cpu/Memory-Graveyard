import { CollisionType } from 'excalibur';
import { Memory } from './Memory';

/**
 * Score pickup. It keeps the Memory orb look and bob but has no collision
 * body, so it can never support or block the player.
 */
export class MemoryPickup extends Memory {
  constructor(x: number, y: number) {
    super(x, y);
    this.body.collisionType = CollisionType.PreventCollision;
  }
}
