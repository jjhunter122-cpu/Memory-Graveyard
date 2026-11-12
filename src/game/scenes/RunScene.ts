import { Scene, type Engine } from 'excalibur';
import { Monster } from '../actors/Monster';
import { ambienceAudio } from '../audio/ambience';
import { footstepAudio } from '../audio/footsteps';
import { metalFootstepVolume } from '../audio/proximity';
import type { GameTextures } from '../assets';
import { CameraFollow } from '../camera/CameraFollow';
import { findCameraFollowPreset } from '../camera/cameraFollowSettings';
import { characterMetrics } from '../characterScale';
import { TrailRecorder, trailYAt } from '../chase/trail';
import { VIEW } from '../config';
import type { AssetManifest } from '../level/manifest';
import { Player } from '../player/Player';
import { ActStream } from '../run/actStream';
import {
  ACT_FLOOR_ROW,
  ACT_HEIGHT,
  ACT_TILE_SIZE,
  speedAt,
} from '../run/generator';
import {
  LOW_STAMINA_THRESHOLD,
  SHARD_REFILL,
  STAMINA_DRAIN,
  STAMINA_MAX,
  staminaSpeedFactor,
} from '../run/stamina';
import { runScore } from '../run/score';
import { analogOverlay } from '../ui/analogFx';
import { Hud } from '../ui/Hud';
import { setMode } from '../ui/mode';
import {
  createGuardianAnimations,
  type GuardianAnimations,
} from '../visuals/guardian';

const START_X = 200;
const CHARACTER_SCALE = 1.75;
const MONSTER_RENDER_HEIGHT = 80;
const MONSTER_GAP = 160;
const CATCH_RADIUS = 24;
const FLOOR_TOP = ACT_FLOOR_ROW * ACT_TILE_SIZE;
const MONSTER_Y = FLOOR_TOP - MONSTER_RENDER_HEIGHT / 2;
const KILL_Y = FLOOR_TOP + 220;
/** Keep the floor near the bottom of the screen instead of following jumps. */
const CAMERA_Y = ACT_HEIGHT * ACT_TILE_SIZE - VIEW.height / 2;

export interface RunSceneOptions {
  seed: number;
  onRestart: () => void;
  onHome: () => void;
  bestScore: number;
  onRunEnd: (score: number) => void;
}

/**
 * Endless auto-run: random forest acts, falling pits, stamina shards and a
 * straight-line Guardian that closes in when stamina runs out.
 */
export class RunScene extends Scene {
  private readonly hud = new Hud();
  private readonly trail = new TrailRecorder(10);
  private stream!: ActStream;
  private player!: Player;
  private monster!: Monster;
  private cameraFollow!: CameraFollow;
  private guardianAnimations?: GuardianAnimations;
  private guardianAnimationName: 'walk' | null = null;
  private dead = false;
  private caught = false;
  private falling = false;
  private attackTimer = 0;
  private monsterYOffset = 0;
  private stamina = STAMINA_MAX;
  private memories = 0;
  private score = 0;
  private bestScore = 0;
  private scoreSaved = false;
  private footstepDistance = 0;
  private wasGrounded = true;
  private wasMoving = false;
  private fallSpeed = 0;
  private monsterFootstepDistance = 0;
  private monsterStepInitialized = false;
  private lastMonsterStepX = 0;

  constructor(
    private readonly manifest: AssetManifest,
    private readonly textures: GameTextures,
    private readonly options: RunSceneOptions,
  ) {
    super();
  }

  override onInitialize(_engine: Engine): void {
    this.stream = new ActStream(
      this,
      this.manifest,
      this.textures,
      this.options.seed,
    );

    const metrics = characterMetrics(CHARACTER_SCALE, ACT_TILE_SIZE);
    const startY = FLOOR_TOP - metrics.playerHeight / 2;
    this.monsterYOffset = (metrics.playerHeight - MONSTER_RENDER_HEIGHT) / 2;

    this.player = new Player(
      START_X,
      startY,
      (centerX, feetY, halfWidth) =>
        this.stream.hasFloorAt(centerX, feetY, halfWidth),
      undefined,
      { width: metrics.playerWidth, height: metrics.playerHeight },
    );
    this.player.setAutoRun(speedAt(0));
    this.add(this.player);

    this.monster = new Monster(
      START_X - MONSTER_GAP,
      MONSTER_Y,
      { width: 67, height: MONSTER_RENDER_HEIGHT },
    );
    this.add(this.monster);
    this.trail.reset({ x: this.player.pos.x, y: this.player.pos.y });

    const idle = this.textures.guardianIdleSheet;
    const walk = this.textures.guardianWalkSheet;
    const attack = this.textures.guardianAttackSheet;
    if (idle && walk && attack) {
      this.guardianAnimations = createGuardianAnimations(idle, walk, attack);
      this.guardianAnimationName = 'walk';
      this.monster.graphics.use(this.guardianAnimations.walk);
    }

    this.camera.zoom = 1;
    this.cameraFollow = new CameraFollow(this, findCameraFollowPreset('momentum'));
    this.cameraFollow.snap(this.player.pos);
    this.camera.pos.y = CAMERA_Y;
  }

  override onActivate(): void {
    setMode('playing');
    analogOverlay.setPreset('vignette');
    ambienceAudio.play('spooky-forest');
    this.hud.setVisible(false);
    this.hud.toast('W / SPACE JUMP · GREEN SHARDS REFILL STAMINA', 3600);
    this.stamina = STAMINA_MAX;
    this.memories = 0;
    this.score = 0;
    this.bestScore = this.options.bestScore;
    this.scoreSaved = false;
    this.updateStaminaUi();
    this.updateScoreUi();
    this.clearDeath();
    document.addEventListener('keydown', this.onKeyDown);
  }

  override onDeactivate(): void {
    analogOverlay.clear();
    ambienceAudio.stop();
    this.clearDeath();
    document.removeEventListener('keydown', this.onKeyDown);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.dead) {
      return;
    }
    const dt = elapsed / 1000;

    if (this.caught) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      if (this.attackTimer === 0) {
        this.finishCaught();
      }
      return;
    }

    const distancePx = Math.max(0, this.player.pos.x - START_X);
    const baseSpeed = speedAt(distancePx);

    this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
    this.player.setAutoRun(baseSpeed * staminaSpeedFactor(this.stamina));
    this.stream.update(this.player.pos.x);
    this.trail.record(this.player.pos.x, this.player.pos.y);
    this.trail.pruneBefore(this.monster.pos.x - 200);
    this.monster.pos.x += baseSpeed * dt;
    const trailY =
      trailYAt(this.trail.all, this.monster.pos.x) ?? this.player.pos.y;
    this.monster.pos.y = trailY + this.monsterYOffset;
    this.updateStaminaUi();

    const collected = this.stream.collectShards(
      this.player.pos.x,
      this.player.pos.y,
      this.player.width,
      this.player.height,
    );
    if (collected > 0) {
      this.refillStamina(SHARD_REFILL * collected);
    }

    const collectedMemories = this.stream.collectMemories(
      this.player.pos.x,
      this.player.pos.y,
      this.player.width,
      this.player.height,
    );
    if (collectedMemories > 0) {
      this.memories += collectedMemories;
    }
    this.score = runScore(distancePx, this.memories);
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    this.updateScoreUi();

    if (this.monster.pos.x >= this.player.pos.x - CATCH_RADIUS) {
      this.beginCaught();
      return;
    }

    if (
      !this.falling &&
      this.stream.isOverPitAt(this.player.pos.x) &&
      this.player.pos.y + this.player.height / 2 > FLOOR_TOP + 2
    ) {
      this.falling = true;
      this.player.setGhost(true);
    }

    this.updateMonsterVisual();
    this.cameraFollow.update(this.player.pos, dt, {
      vy: this.player.vel.y,
      grounded: this.player.controller.isGrounded,
    });
    this.camera.pos.y = CAMERA_Y;
    this.updateFootsteps(dt);
    this.updateMonsterFootsteps();
    this.checkFall();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyR') {
      event.preventDefault();
      this.recordScore();
      this.options.onRestart();
    }
  };

  private checkFall(): void {
    if (this.player.pos.y > KILL_Y) {
      this.die('fell');
    }
  }

  private die(cause: 'fell' | 'caught'): void {
    if (this.dead) {
      return;
    }
    this.dead = true;
    this.player.setFrozen(true);
    this.showDeath(cause);
  }

  private beginCaught(): void {
    if (this.dead || this.caught) {
      return;
    }
    this.caught = true;
    this.player.setFrozen(true);
    this.attackTimer = 1;
    if (this.guardianAnimations) {
      this.monster.graphics.use(this.guardianAnimations.attack);
    } else {
      this.finishCaught();
    }
  }

  private finishCaught(): void {
    if (this.dead) {
      return;
    }
    this.dead = true;
    this.showDeath('caught');
  }

  private showDeath(cause: 'fell' | 'caught'): void {
    this.recordScore();
    const title = cause === 'caught' ? 'CAUGHT' : 'YOU FELL';
    const ui = document.getElementById('run-ui');
    if (!ui) {
      return;
    }
    ui.innerHTML = `
      <div class="run-death">
        <h2>${title}</h2>
        <div class="run-death-actions">
          <button id="run-retry" class="menu-button primary">Retry</button>
          <button id="run-home" class="menu-button">Back to Home Menu</button>
        </div>
      </div>`;
    document
      .getElementById('run-retry')
      ?.addEventListener('click', () => this.options.onRestart());
    document
      .getElementById('run-home')
      ?.addEventListener('click', () => this.options.onHome());
  }

  private refillStamina(amount = SHARD_REFILL): void {
    if (this.dead || this.caught) {
      return;
    }
    this.stamina = Math.min(STAMINA_MAX, this.stamina + amount);
    this.updateStaminaUi();
  }

  private updateStaminaUi(): void {
    const fill = document.getElementById('stamina-fill');
    if (!fill) {
      return;
    }
    const percent = Math.max(0, Math.min(100, this.stamina));
    fill.style.width = `${percent}%`;
    fill.dataset.level =
      percent <= LOW_STAMINA_THRESHOLD
        ? 'low'
        : percent <= 50
          ? 'mid'
          : 'high';
  }

  private updateScoreUi(): void {
    const scoreEl = document.getElementById('run-score-value');
    if (scoreEl) {
      scoreEl.textContent = formatScore(this.score);
    }
    const bestEl = document.getElementById('run-best-value');
    if (bestEl) {
      bestEl.textContent = formatScore(this.bestScore);
    }
  }

  private recordScore(): void {
    if (this.scoreSaved) {
      return;
    }
    this.scoreSaved = true;
    this.options.onRunEnd(this.score);
  }

  private clearDeath(): void {
    const ui = document.getElementById('run-ui');
    if (ui) {
      ui.innerHTML = '';
    }
  }

  private updateMonsterVisual(): void {
    if (!this.guardianAnimations) {
      return;
    }
    if (this.guardianAnimationName !== 'walk') {
      this.guardianAnimationName = 'walk';
      this.monster.graphics.use(this.guardianAnimations.walk);
    }
    const graphic = this.monster.graphics.current;
    if (graphic) {
      // The Guardian art faces right and the chase only moves right.
      graphic.flipHorizontal = false;
    }
  }

  private updateFootsteps(dt: number): void {
    const grounded = this.player.controller.isGrounded;
    const speed = Math.abs(this.player.vel.x);

    if (!grounded) {
      this.fallSpeed = Math.max(this.fallSpeed, Math.max(0, this.player.vel.y));
      this.wasGrounded = false;
      this.wasMoving = false;
      this.footstepDistance = 0;
      return;
    }

    if (!this.wasGrounded) {
      if (this.fallSpeed > 160) {
        const volume = Math.min(0.9, 0.55 + this.fallSpeed / 1600);
        footstepAudio.playLanding(volume);
      }
      this.fallSpeed = 0;
      this.wasGrounded = true;
      this.wasMoving = speed >= 30;
      this.footstepDistance = 0;
      return;
    }

    if (speed < 30) {
      this.footstepDistance = 0;
      this.wasMoving = false;
      return;
    }

    if (!this.wasMoving) {
      this.wasMoving = true;
      this.footstepDistance = 0;
      footstepAudio.playGrass();
      return;
    }

    this.footstepDistance += speed * dt;
    const stride = speed > 180 ? 58 : 68;
    if (this.footstepDistance >= stride) {
      this.footstepDistance = 0;
      footstepAudio.playGrass();
    }
  }

  private updateMonsterFootsteps(): void {
    const feet = this.monster.pos.y + MONSTER_RENDER_HEIGHT / 2;
    const surface = this.stream.surfaceAt(this.monster.pos.x);
    if (surface === null || Math.abs(feet - surface) > 24) {
      this.lastMonsterStepX = this.monster.pos.x;
      this.monsterFootstepDistance = 0;
      return;
    }
    if (!this.monsterStepInitialized) {
      this.lastMonsterStepX = this.monster.pos.x;
      this.monsterStepInitialized = true;
      return;
    }
    const dx = this.monster.pos.x - this.lastMonsterStepX;
    this.lastMonsterStepX = this.monster.pos.x;
    this.monsterFootstepDistance += Math.abs(dx);
    if (this.monsterFootstepDistance < 46) {
      return;
    }
    this.monsterFootstepDistance = 0;
    const gap = Math.abs(this.player.pos.x - this.monster.pos.x);
    const volume = metalFootstepVolume(gap);
    if (volume > 0) {
      footstepAudio.playMetal(volume);
    }
  }
}

function formatScore(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(6, '0');
}
