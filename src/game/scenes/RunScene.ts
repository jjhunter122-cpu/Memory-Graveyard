import { Scene, type Engine } from 'excalibur';
import { Monster } from '../actors/Monster';
import { ambienceAudio } from '../audio/ambience';
import { footstepAudio } from '../audio/footsteps';
import { metalFootstepVolume } from '../audio/proximity';
import type { GameTextures } from '../assets';
import { CameraFollow } from '../camera/CameraFollow';
import { findCameraFollowPreset } from '../camera/cameraFollowSettings';
import { characterMetrics } from '../characterScale';
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
const FLOOR_TOP = ACT_FLOOR_ROW * ACT_TILE_SIZE;
const MONSTER_Y = FLOOR_TOP - MONSTER_RENDER_HEIGHT / 2;
const KILL_Y = FLOOR_TOP + 220;
/** Keep the floor near the bottom of the screen instead of following jumps. */
const CAMERA_Y = ACT_HEIGHT * ACT_TILE_SIZE - VIEW.height / 2;

export interface RunSceneOptions {
  seed: number;
  onRestart: () => void;
}

/**
 * Endless auto-run: random forest acts, falling pits, a straight-line Guardian
 * at a fixed gap and a fixed-height camera. Only pits kill in this pass.
 */
export class RunScene extends Scene {
  private readonly hud = new Hud();
  private stream!: ActStream;
  private player!: Player;
  private monster!: Monster;
  private cameraFollow!: CameraFollow;
  private guardianAnimations?: GuardianAnimations;
  private guardianAnimationName: 'walk' | null = null;
  private dead = false;
  private falling = false;
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
    this.hud.toast('W / SPACE JUMP · R RESTART', 3200);
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
    const distancePx = Math.max(0, this.player.pos.x - START_X);
    const speed = speedAt(distancePx);

    this.player.setAutoRun(speed);
    this.stream.update(this.player.pos.x);
    this.monster.pos.setTo(this.player.pos.x - MONSTER_GAP, MONSTER_Y);

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
      this.options.onRestart();
    }
  };

  private checkFall(): void {
    if (this.player.pos.y > KILL_Y) {
      this.die();
    }
  }

  private die(): void {
    if (this.dead) {
      return;
    }
    this.dead = true;
    this.player.setFrozen(true);
    const ui = document.getElementById('run-ui');
    if (ui) {
      ui.innerHTML =
        '<div class="run-death"><h2>YOU FELL</h2><p><kbd>R</kbd> to run again</p></div>';
    }
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
    const volume = metalFootstepVolume(MONSTER_GAP);
    if (volume > 0) {
      footstepAudio.playMetal(volume);
    }
  }
}
