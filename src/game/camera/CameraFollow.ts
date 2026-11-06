import type { Scene, Vector } from 'excalibur';
import { VIEW } from '../config';
import { clamp } from '../systems/graveyard';

const DEADZONE_X = 48;
const DEADZONE_Y = 36;
const FOLLOW_LERP = 6;

/** Smoothly follows a target, with a deadzone, clamped to the level bounds. */
export class CameraFollow {
  private readonly halfWidth = VIEW.width / 2;
  private readonly halfHeight = VIEW.height / 2;

  constructor(
    private readonly scene: Scene,
    private readonly levelWidth: number,
    private readonly levelHeight: number,
  ) {}

  update(target: Vector, dt: number): void {
    const camera = this.scene.camera;
    let x = camera.pos.x;
    let y = camera.pos.y;

    const dx = target.x - x;
    const dy = target.y - y;
    const lerp = Math.min(1, FOLLOW_LERP * dt);

    if (Math.abs(dx) > DEADZONE_X) {
      x += (dx - Math.sign(dx) * DEADZONE_X) * lerp;
    }
    if (Math.abs(dy) > DEADZONE_Y) {
      y += (dy - Math.sign(dy) * DEADZONE_Y) * lerp;
    }

    const clampedX = clamp(x, this.halfWidth, this.levelWidth - this.halfWidth);
    const clampedY = clamp(y, this.halfHeight, this.levelHeight - this.halfHeight);
    camera.pos.setTo(clampedX, clampedY);
  }
}
