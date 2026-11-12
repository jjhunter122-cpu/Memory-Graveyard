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
 * green shards and memory orbs, with no player or Guardian. The camera eases
 * from the home composition into the act, then drifts.
 */
export abstract class PreviewMenuScene extends MenuScene {
  private elapsed = 0;

  constructor(private readonly preview: PreviewStageOptions) {
    super();
  }

  override onInitialize(_engine: Engine): void {
    new ActStream(this, this.preview.manifest, this.preview.textures, this.preview.seed);
    this.camera.zoom = 1;
    this.camera.pos.setTo(START_X, CAMERA_Y);
  }

  override onActivate(): void {
    super.onActivate();
    this.root?.classList.add('preview-stage');
    analogOverlay.setPreset('vignette');
    this.elapsed = 0;
  }

  override onDeactivate(): void {
    analogOverlay.clear();
    this.root?.classList.remove('preview-stage');
    super.onDeactivate();
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    const dt = elapsed / 1000;
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / SLIDE_SECONDS);
    const eased = 1 - Math.pow(1 - t, 3);
    const drift = Math.max(0, this.elapsed - SLIDE_SECONDS) * DRIFT_SPEED;
    this.camera.pos.setTo(
      START_X + (TARGET_X - START_X) * eased + drift,
      CAMERA_Y,
    );
  }
}
