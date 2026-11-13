import type { Engine } from 'excalibur';
import { VIEW } from '../config';
import { ActStream } from '../run/actStream';
import type { AssetManifest } from '../level/manifest';
import type { GameTextures } from '../assets';
import { analogOverlay } from '../ui/analogFx';
import { MenuScene } from './MenuScene';

export interface PreviewStageOptions {
  manifest: AssetManifest;
  textures: GameTextures;
  seed: number;
}

const START_X = VIEW.width / 2;
const TARGET_X = 1900;
const SLIDE_SECONDS = 2.6;
const DRIFT_SPEED = 8;
const CAMERA_Y = 306;

/**
 * Menu background showing a random slice of the endless run: forest, terrain,
 * green shards and silver coins, with no player or Shade. The camera eases
 * from the home composition into the act, then drifts.
 */
export abstract class PreviewMenuScene extends MenuScene {
  private elapsed = 0;
  private closing = false;
  private closeElapsed = 0;
  private closeStartX = 0;
  private afterClose?: () => void;

  constructor(private readonly preview: PreviewStageOptions) {
    super();
  }

  override onInitialize(_engine: Engine): void {
    new ActStream(
      this,
      this.preview.manifest,
      this.preview.textures,
      this.preview.seed,
    );
    this.camera.zoom = 1;
    this.camera.pos.setTo(START_X, CAMERA_Y);
  }

  override onActivate(): void {
    super.onActivate();
    this.root?.classList.add('preview-stage');
    analogOverlay.setPreset('vignette');
    this.elapsed = 0;
    this.closing = false;
    this.closeElapsed = 0;
    this.afterClose = undefined;
  }

  override onDeactivate(): void {
    analogOverlay.clear();
    this.root?.classList.remove('preview-stage');
    this.afterClose = undefined;
    super.onDeactivate();
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    const dt = elapsed / 1000;

    if (this.closing) {
      this.closeElapsed += dt;
      const t = Math.min(1, this.closeElapsed / SLIDE_SECONDS);
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.pos.setTo(
        this.closeStartX + (START_X - this.closeStartX) * eased,
        CAMERA_Y,
      );
      if (t >= 1) {
        this.closing = false;
        const after = this.afterClose;
        this.afterClose = undefined;
        after?.();
      }
      return;
    }

    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / SLIDE_SECONDS);
    const eased = 1 - Math.pow(1 - t, 3);
    const drift = Math.max(0, this.elapsed - SLIDE_SECONDS) * DRIFT_SPEED;
    this.camera.pos.setTo(
      START_X + (TARGET_X - START_X) * eased + drift,
      CAMERA_Y,
    );
  }

  /** Slides back to the starting composition before leaving the menu. */
  protected close(after: () => void): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.closeElapsed = 0;
    this.closeStartX = this.camera.pos.x;
    this.afterClose = after;
    const back = document.getElementById('menu-back');
    if (back instanceof HTMLButtonElement) {
      back.disabled = true;
    }
  }
}
