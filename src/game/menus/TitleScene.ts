import type { Engine } from 'excalibur';
import { MenuScene } from './MenuScene';
import { titleMusic } from '../audio/titleMusic';
import { analogOverlay } from '../ui/analogFx';
import type { GameTextures } from '../assets';
import { characterMetrics } from '../characterScale';
import { buildLevel } from '../level/loader';
import type { AssetManifest } from '../level/manifest';
import { createLevel } from '../level/schema';
import { Monster } from '../actors/Monster';
import { Player } from '../player/Player';
import {
  createGuardianDeathAnimations,
  type GuardianDeathAnimations,
} from '../visuals/guardian';
import { VIEW } from '../config';

const TITLE_WIDTH = 40;
const TITLE_HEIGHT = 18;
const TITLE_TILE_SIZE = 32;
/** Pixel Platformer World moss grass top + fill, matching the default level. */
const TITLE_FLOOR_TOP_TILE = 79;
const TITLE_FLOOR_FILL_TILE = 80;
const TITLE_FLOOR_ROW = 16;
const TITLE_PLAYER_X = 300;
const TITLE_MONSTER_X = 140;
const TITLE_CHARACTER_SCALE = 1.75;

export interface TitleCallbacks {
  highScore: number;
  manifest: AssetManifest;
  textures: GameTextures;
  onPlay: () => void;
  onOptions: () => void;
}

export class TitleScene extends MenuScene {
  private monster?: Monster;
  private death?: GuardianDeathAnimations;
  private starting = false;

  constructor(private readonly callbacks: TitleCallbacks) {
    super();
  }

  override onInitialize(_engine: Engine): void {
    this.buildStage();
  }

  override onActivate(): void {
    super.onActivate();
    this.root?.classList.add('title-stage');
    analogOverlay.setPreset('vignette');
    titleMusic.playTitle();
  }

  override onDeactivate(): void {
    analogOverlay.clear();
    this.root?.classList.remove('title-stage', 'title-playing');
    super.onDeactivate();
  }

  private buildStage(): void {
    const level = createLevel(
      'Title',
      TITLE_WIDTH,
      TITLE_HEIGHT,
      TITLE_TILE_SIZE,
    );
    const terrain = level.layers[0];
    if (terrain) {
      const data = terrain.data.slice();
      for (let x = 0; x < TITLE_WIDTH; x += 1) {
        data[TITLE_FLOOR_ROW * TITLE_WIDTH + x] = TITLE_FLOOR_TOP_TILE;
        data[(TITLE_FLOOR_ROW + 1) * TITLE_WIDTH + x] = TITLE_FLOOR_FILL_TILE;
      }
      level.layers[0] = { ...terrain, data };
    }
    level.skybox = '#0a0b10';
    level.background = 'pixel-platformer-world-layers';

    buildLevel(this, level, this.callbacks.manifest, this.callbacks.textures);

    const floorTop = TITLE_FLOOR_ROW * TITLE_TILE_SIZE;
    const metrics = characterMetrics(TITLE_CHARACTER_SCALE, TITLE_TILE_SIZE);

    const player = new Player(
      TITLE_PLAYER_X,
      floorTop - metrics.playerHeight / 2,
      undefined,
      undefined,
      { width: metrics.playerWidth, height: metrics.playerHeight },
    );
    player.setFrozen(true);
    this.add(player);

    this.monster = new Monster(TITLE_MONSTER_X, floorTop - 40, {
      width: 67,
      height: 80,
    });
    this.add(this.monster);

    const deathSheet = this.callbacks.textures.guardianDeathSheet;
    if (deathSheet) {
      this.death = createGuardianDeathAnimations(deathSheet);
      this.monster.graphics.use(this.death.still);
    }

    this.camera.zoom = 1;
    this.camera.pos.setTo(VIEW.width / 2, VIEW.height / 2 + 30);
  }

  protected render(): string {
    return `
      <div class="menu-panel title-panel">
        <h1 class="menu-title">MEMORY GRAVEYARD</h1>
        <p class="menu-subtitle">the forest remembers you</p>
        <p class="title-high-score">High score <strong>${formatScore(this.callbacks.highScore)}</strong></p>
        <div class="menu-buttons">
          <button id="menu-play" class="menu-button primary">Play</button>
          <button id="menu-options" class="menu-button">Options</button>
          <button id="menu-credits" class="menu-button">Credits</button>
        </div>
        <p id="title-note" class="title-note" aria-live="polite"></p>
      </div>`;
  }

  protected bind(): void {
    this.click('menu-play', () => this.startRun());
    this.click('menu-options', () => this.callbacks.onOptions());
    this.click('menu-credits', () => this.showCreditsNote());
  }

  private startRun(): void {
    if (this.starting) {
      return;
    }
    this.starting = true;
    titleMusic.stop();
    this.root?.classList.add('title-playing');

    const revive = this.death?.revive;
    if (!revive || !this.monster) {
      this.callbacks.onPlay();
      return;
    }
    revive.events.once('end', () => this.callbacks.onPlay());
    this.monster.graphics.use(revive);
    revive.play();
  }

  private showCreditsNote(): void {
    const note = document.getElementById('title-note');
    if (note) {
      note.textContent = 'Credits coming soon';
    }
  }
}

function formatScore(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(6, '0');
}
