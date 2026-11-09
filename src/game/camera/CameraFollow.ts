import type { Scene, Vector } from 'excalibur';
import { VIEW } from '../config';
import {
  DEFAULT_CAMERA_FOLLOW,
  cameraFallLead,
  findCameraFollowPreset,
  type CameraFollowSettings,
} from './cameraFollowSettings';

export interface CameraBounds {
  width: number;
  height: number;
}

/**
 * Smoothly follows a target with a small deadzone. It deliberately does not
 * clamp to the level bounds, so the target stays centered even at the edges.
 *
 * The presets can add a soft vertical lead while falling and a short landing
 * dip, which gives jumps and drops a bit of weight without moving the
 * horizontal framing.
 */
export class CameraFollow {
  private readonly settings: CameraFollowSettings;
  private leadY = 0;
  private dip = 0;
  private wasGrounded = true;

  constructor(
    private readonly scene: Scene,
    settings: CameraFollowSettings = findCameraFollowPreset(DEFAULT_CAMERA_FOLLOW),
    private readonly bounds?: CameraBounds,
  ) {
    this.settings = settings;
  }

  update(target: Vector, dt: number, motion?: { vy: number; grounded: boolean }): void {
    const camera = this.scene.camera;
    const settings = this.settings;

    if (motion) {
      const targetLead = cameraFallLead(settings, motion.vy);
      const leadLerp = Math.min(1, settings.leadLerp * dt);
      if (leadLerp > 0) {
        this.leadY += (targetLead - this.leadY) * leadLerp;
      } else {
        this.leadY = targetLead;
      }

      if (settings.landingDip > 0 && !this.wasGrounded && motion.grounded) {
        this.dip = settings.landingDip;
      }
      this.wasGrounded = motion.grounded;
    }

    if (this.dip > 0) {
      this.dip = Math.max(0, this.dip - settings.dipDecay * dt);
    }

    const targetY = target.y + this.leadY + this.dip;
    let x = camera.pos.x;
    let y = camera.pos.y;

    const dx = target.x - x;
    const dy = targetY - y;
    const lerpX = Math.min(1, settings.lerpX * dt);
    const lerpY = Math.min(1, settings.lerpY * dt);

    if (Math.abs(dx) > settings.deadzoneX) {
      x += (dx - Math.sign(dx) * settings.deadzoneX) * lerpX;
    }
    if (Math.abs(dy) > settings.deadzoneY) {
      y += (dy - Math.sign(dy) * settings.deadzoneY) * lerpY;
    }

    const position = this.clamp(x, y);
    camera.pos.setTo(position.x, position.y);
  }

  /** Center immediately, e.g. on level start or respawn. */
  snap(target: Vector): void {
    const position = this.clamp(target.x, target.y);
    this.scene.camera.pos.setTo(position.x, position.y);
    this.leadY = 0;
    this.dip = 0;
    this.wasGrounded = true;
  }

  private clamp(x: number, y: number): { x: number; y: number } {
    if (!this.bounds) {
      return { x, y };
    }
    const zoom = this.scene.camera.zoom || 1;
    const halfWidth = VIEW.width / (2 * zoom);
    const halfHeight = VIEW.height / (2 * zoom);
    return {
      x:
        this.bounds.width >= halfWidth * 2
          ? Math.min(Math.max(x, halfWidth), this.bounds.width - halfWidth)
          : this.bounds.width / 2,
      y:
        this.bounds.height >= halfHeight * 2
          ? Math.min(Math.max(y, halfHeight), this.bounds.height - halfHeight)
          : this.bounds.height / 2,
    };
  }
}
