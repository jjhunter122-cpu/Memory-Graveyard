import { Scene, type Engine } from 'excalibur';
import { Monster } from '../actors/Monster';
import { ambienceAudio } from '../audio/ambience';
import { footstepAudio } from '../audio/footsteps';
import { metalFootstepVolume } from '../audio/proximity';
import type { GameTextures } from '../assets';
import { CameraFollow } from '../camera/CameraFollow';
import { findCameraFollowPreset } from '../camera/cameraFollowSettings';
import { characterMetrics } from '../characterScale';
import { TrailFollower, TrailRecorder } from '../chase/trail';
import { MONSTER, VIEW } from '../config';
import { buildLevel, type BuiltLevel } from '../level/loader';
import type { AssetManifest } from '../level/manifest';
import { createLevel } from '../level/schema';
import { Player } from '../player/Player';
import { analogOverlay } from '../ui/analogFx';
import { Hud } from '../ui/Hud';
import { setMode } from '../ui/mode';
import {
  createGuardianAnimations,
  type GuardianAnimations,
} from '../visuals/guardian';

const RUN_WIDTH = 480;
const RUN_HEIGHT = 18;
const RUN_TILE_SIZE = 32;
const FLOOR_ROW = 16;
/** Pixel Platformer World moss grass top + fill. */
const FLOOR_TOP_TILE = 79;
const FLOOR_FILL_TILE = 80;
const START_X = 200;
const AUTO_RUN_SPEED = 220;
const MONSTER_START_X = 80;
const CHARACTER_SCALE = 1.75;
const MONSTER_RENDER_HEIGHT = 80;
/** Keep the floor near the bottom of the screen instead of following jumps. */
const CAMERA_Y = RUN_HEIGHT * RUN_TILE_SIZE - VIEW.height / 2;

/**
 * Movement lab for the new direction: a flat forest run, auto-run to the right,
 * one-button jump and the Guardian following behind. Stamina, memories, gaps and
 * chunks come in later passes.
 */
export class RunScene extends Scene {
  private readonly hud = new Hud();
  private readonly trail = new TrailRecorder(MONSTER.trailSpacing);
  private built!: BuiltLevel;
  private player!: Player;
  private monster!: Monster;
  private follower!: TrailFollower;
  private cameraFollow!: CameraFollow;
  private guardianAnimations?: GuardianAnimations;
  private guardianAnimationName: 'idle' | 'walk' | null = null;
  private monsterYOffset = 0;
  private monsterFacingRight = true;
  private lastMonsterX = 0;
  private footstepDistance = 0;
  private wasGrounded = true;
  private wasMoving = false;
  private fallSpeed = 0;
  private monsterFootstepDistance = 0;
  private monsterStepInitialized = false;
  private lastMonsterStepX = 0;
  private lastMonsterStepY = 0;

  constructor(
    private readonly manifest: AssetManifest,
    private readonly textures: GameTextures,
  ) {
    super();
  }

  override onInitialize(_engine: Engine): void {
    const level = createLevel('Run', RUN_WIDTH, RUN_HEIGHT, RUN_TILE_SIZE);
    const terrain = level.layers[0];
    if (terrain) {
      const data = terrain.data.slice();
      for (let x = 0; x < RUN_WIDTH; x += 1) {
        data[FLOOR_ROW * RUN_WIDTH + x] = FLOOR_TOP_TILE;
        data[(FLOOR_ROW + 1) * RUN_WIDTH + x] = FLOOR_FILL_TILE;
      }
      level.layers[0] = { ...terrain, data };
    }
    level.skybox = '#0a0b10';
    level.background = 'pixel-platformer-world-layers';
    this.built = buildLevel(this, level, this.manifest, this.textures);

    const floorTop = FLOOR_ROW * RUN_TILE_SIZE;
    const metrics = characterMetrics(CHARACTER_SCALE, RUN_TILE_SIZE);
    const startY = floorTop - metrics.playerHeight / 2;

    this.player = new Player(
      START_X,
      startY,
      this.built.groundProbe,
      this.built.slopeProbe,
      { width: metrics.playerWidth, height: metrics.playerHeight },
    );
    this.player.setAutoRun(AUTO_RUN_SPEED);
    this.add(this.player);

    this.monsterYOffset = (metrics.playerHeight - MONSTER_RENDER_HEIGHT) / 2;
    this.monster = new Monster(
      MONSTER_START_X,
      startY + this.monsterYOffset,
      { width: 67, height: MONSTER_RENDER_HEIGHT },
    );
    this.add(this.monster);

    this.trail.reset({ x: START_X, y: startY });
    this.follower = new TrailFollower({ x: MONSTER_START_X, y: startY });
    this.lastMonsterX = this.monster.pos.x;

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
    document.addEventListener('keydown', this.onKeyDown);
  }

  override onDeactivate(): void {
    analogOverlay.clear();
    ambienceAudio.stop();
    document.removeEventListener('keydown', this.onKeyDown);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    const dt = elapsed / 1000;

    this.trail.record(this.player.pos.x, this.player.pos.y);
    const distance = this.distanceBetweenMonsterAndPlayer();
    const speed =
      distance > MONSTER.catchUpDistance
        ? MONSTER.catchUpSpeed
        : MONSTER.speed;
    this.follower.update(this.trail.all, speed, dt);
    this.monster.pos.setTo(
      this.follower.pos.x,
      this.follower.pos.y + this.monsterYOffset,
    );

    this.updateMonsterVisual();
    this.cameraFollow.update(this.player.pos, dt, {
      vy: this.player.vel.y,
      grounded: this.player.controller.isGrounded,
    });
    this.camera.pos.y = CAMERA_Y;
    this.updateFootsteps(dt);
    this.updateMonsterFootsteps();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyR') {
      event.preventDefault();
      this.restart();
    }
  };

  private restart(): void {
    const floorTop = FLOOR_ROW * RUN_TILE_SIZE;
    const metrics = characterMetrics(CHARACTER_SCALE, RUN_TILE_SIZE);
    const startY = floorTop - metrics.playerHeight / 2;

    this.player.respawn(START_X, startY);
    this.player.setAutoRun(AUTO_RUN_SPEED);
    this.trail.reset({ x: START_X, y: startY });
    this.follower.reset({ x: MONSTER_START_X, y: startY });
    this.monster.pos.setTo(MONSTER_START_X, startY + this.monsterYOffset);
    this.lastMonsterX = this.monster.pos.x;
    this.cameraFollow.snap(this.player.pos);
    this.camera.pos.y = CAMERA_Y;

    this.footstepDistance = 0;
    this.wasGrounded = true;
    this.wasMoving = false;
    this.fallSpeed = 0;
    this.monsterFootstepDistance = 0;
    this.monsterStepInitialized = false;
  }

  private distanceBetweenMonsterAndPlayer(): number {
    return Math.hypot(
      this.player.pos.x - this.monster.pos.x,
      this.player.pos.y - (this.monster.pos.y - this.monsterYOffset),
    );
  }

  private updateMonsterVisual(): void {
    if (!this.guardianAnimations) {
      return;
    }
    const dx = this.monster.pos.x - this.lastMonsterX;
    if (Math.abs(dx) > 0.05) {
      this.monsterFacingRight = dx > 0;
    }
    this.lastMonsterX = this.monster.pos.x;

    const name = Math.abs(dx) > 0.05 ? 'walk' : 'idle';
    if (this.guardianAnimationName !== name) {
      this.guardianAnimationName = name;
      this.monster.graphics.use(this.guardianAnimations[name]);
    }
    const graphic = this.monster.graphics.current;
    if (graphic) {
      // The Guardian art faces right, so flip it when moving left.
      graphic.flipHorizontal = !this.monsterFacingRight;
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
      this.lastMonsterStepY = this.monster.pos.y;
      this.monsterStepInitialized = true;
      return;
    }
    const dx = this.monster.pos.x - this.lastMonsterStepX;
    const dy = this.monster.pos.y - this.lastMonsterStepY;
    this.lastMonsterStepX = this.monster.pos.x;
    this.lastMonsterStepY = this.monster.pos.y;
    this.monsterFootstepDistance += Math.hypot(dx, dy);
    if (this.monsterFootstepDistance < 46) {
      return;
    }
    this.monsterFootstepDistance = 0;
    const volume = metalFootstepVolume(this.distanceBetweenMonsterAndPlayer());
    if (volume > 0) {
      footstepAudio.playMetal(volume);
    }
  }
}
