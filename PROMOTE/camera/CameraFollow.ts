import type { Scene, Vector } from 'excalibur';
import { CAMERA } from '../config';

/**
 * Smoothly follows a target with a small deadzone. It deliberately does not
 * clamp to the level bounds, so the target stays centered even at the edges.
 */
export class CameraFollow {
  constructor(private readonly scene: Scene) {}

  update(target: Vector, dt: number): void {
    const camera = this.scene.camera;
    let x = camera.pos.x;
    let y = camera.pos.y;

    const dx = target.x - x;
    const dy = target.y - y;
    const lerp = Math.min(1, CAMERA.followLerp * dt);

    if (Math.abs(dx) > CAMERA.deadzoneX) {
      x += (dx - Math.sign(dx) * CAMERA.deadzoneX) * lerp;
    }
    if (Math.abs(dy) > CAMERA.deadzoneY) {
      y += (dy - Math.sign(dy) * CAMERA.deadzoneY) * lerp;
    }

    camera.pos.setTo(x, y);
  }

  /** Center immediately, e.g. on level start or respawn. */
  snap(target: Vector): void {
    this.scene.camera.pos.setTo(target.x, target.y);
  }
}
