import { Keys, Scene, type Engine } from 'excalibur';
import { LEVEL, MONSTER } from '../config';
import type { LevelData } from '../level/schema';
import type { AssetManifest } from '../level/manifest';
import type { GameTextures } from '../assets';
import { buildLevel, type BuiltLevel } from '../level/loader';
import { Player } from '../player/Player';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { Monster } from '../actors/Monster';
import { TrailFollower, TrailRecorder } from '../chase/trail';
import { CameraFollow } from '../camera/CameraFollow';
import { Hud } from '../ui/Hud';
import { setMode } from '../ui/mode';
import { debugOverlay } from '../ui/DebugOverlay';

export interface PlaySceneOptions {
  fromEditor?: boolean;
  showHud?: boolean;
  sequence?: { index: number; total: number };
  onOpenEditor?: (level: LevelData) => void;
  onLevelSelect?: () => void;
  onTitle?: () => void;
  onLevelComplete?: (level: LevelData) => void;
  onSaveDraft?: (level: LevelData) => void;
}

export class PlayScene extends Scene {
  private readonly hud = new Hud();
  private readonly trail = new TrailRecorder(MONSTER.trailSpacing);

  private player!: Player;
  private monster?: Monster;
  private follower?: TrailFollower;
  private cameraFollow!: CameraFollow;
  private built!: BuiltLevel;

  private collected = 0;
  private completed = false;
  private dead = false;
  private graceRemaining: number = MONSTER.graceSeconds;
  private levelHeightPx = 0;
  private paused = false;
  private completeTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.dead) {
      if (event.key === 'r' || event.key === 'R' || event.key === 'Enter') {
        event.preventDefault();
        this.retry();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.togglePause();
    }
  };

  constructor(
    private readonly level: LevelData,
    private readonly manifest: AssetManifest,
    private readonly textures: GameTextures,
    private readonly options: PlaySceneOptions = {},
  ) {
    super();
  }

  override onActivate(_context: unknown): void {
    setMode('playing');
    this.hud.setLevelName(this.level.name);
    this.hud.setVisible(this.options.showHud ?? true);
    this.hud.setThreat(
      this.built?.monsterSpawn ? 'DORMANT' : 'SAFE',
      this.built?.monsterSpawn ? 'dormant' : 'calm',
    );
    this.wireEditorButton();
    this.renderPauseMenu();
    this.clearDeath();
    document.addEventListener('keydown', this.onKeyDown);
  }

  override onDeactivate(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.completeTimer !== null) {
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }
    this.setPaused(false);
    this.clearDeath();
    this.engine.timescale = 1;
    const button = document.getElementById('open-editor');
    if (button instanceof HTMLButtonElement) {
      button.onclick = null;
    }
  }

  override onInitialize(_engine: Engine): void {
    this.built = buildLevel(this, this.level, this.manifest, this.textures);
    this.levelHeightPx = this.built.heightPx;

    this.player = new Player(
      this.built.spawn.x,
      this.built.spawn.y,
      this.built.groundProbe,
    );
    this.player.on('collisionstart', (event) => {
      // Actor-level collision events carry the geometry Collider; the actor is
      // its `owner`.
      const owner = event.other.owner;
      if (owner instanceof Memory) {
        this.collectMemory(owner);
      } else if (owner instanceof Exit) {
        this.reachExit();
      }
    });
    this.add(this.player);

    if (this.built.monsterSpawn) {
      this.monster = new Monster(this.built.monsterSpawn.x, this.built.monsterSpawn.y);
      this.follower = new TrailFollower(this.built.monsterSpawn);
      this.trail.reset(this.built.spawn);
      this.graceRemaining = MONSTER.graceSeconds;
      this.add(this.monster);
    }

    this.cameraFollow = new CameraFollow(this, this.built.widthPx, this.built.heightPx);
    this.cameraFollow.update(this.player.pos, 1);
    this.hud.setProgress(0, this.built.memories.length);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.paused || this.dead) {
      return;
    }

    const dt = elapsed / 1000;
    const monster = this.monster;
    const follower = this.follower;
    let threatDistance: number | null = null;

    if (monster && follower) {
      this.trail.record(this.player.pos.x, this.player.pos.y);
      threatDistance = this.distanceBetweenMonsterAndPlayer();

      if (this.graceRemaining > 0) {
        this.graceRemaining = Math.max(0, this.graceRemaining - dt);
        this.hud.setThreat('DORMANT', 'dormant');
        if (this.graceRemaining === 0) {
          this.hud.toast('run.', 1200);
        }
      } else {
        const speed =
          threatDistance > MONSTER.catchUpDistance
            ? MONSTER.catchUpSpeed
            : MONSTER.speed;
        follower.update(this.trail.all, speed, dt);
        monster.pos.setTo(follower.pos.x, follower.pos.y);
        threatDistance = this.distanceBetweenMonsterAndPlayer();
        this.updateThreat(threatDistance);
        if (threatDistance <= MONSTER.catchRadius) {
          this.die();
          return;
        }
      }
    } else {
      this.hud.setThreat('SAFE', 'calm');
    }

    this.cameraFollow.update(this.player.pos, dt);
    this.checkFall();
    if (this.dead) {
      return;
    }

    const overlay = debugOverlay();
    const fps = overlay.frame();
    overlay.render({
      FPS: fps.toFixed(0),
      'frame ms': (1000 / Math.max(fps, 1)).toFixed(1),
      velocity: `${this.player.vel.x.toFixed(0)}, ${this.player.vel.y.toFixed(0)}`,
      grounded: String(this.player.controller.isGrounded),
      level: this.level.name,
      memories: `${this.collected}/${this.totalMemories}`,
      monster: threatDistance === null ? '—' : `${threatDistance.toFixed(0)} px`,
      grace: this.monster ? this.graceRemaining.toFixed(1) : '—',
    });
  }

  override onPostUpdate(engine: Engine): void {
    if (this.paused || this.dead) {
      return;
    }
    if (engine.input.keyboard.wasPressed(Keys.R)) {
      this.restart();
    }
  }

  // ---- pause ----------------------------------------------------------------

  private wireEditorButton(): void {
    const button = document.getElementById('open-editor');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const visible = this.options.fromEditor === true || import.meta.env.DEV;
    button.hidden = !visible;
    if (!visible) {
      return;
    }
    button.textContent = this.options.fromEditor ? 'Back to editor' : 'Open editor';
    button.onclick = () => this.options.onOpenEditor?.(this.level);
  }

  private renderPauseMenu(): void {
    const root = document.getElementById('pause-ui');
    if (!root) {
      return;
    }
    root.innerHTML = `
      <div class="menu-panel">
        <h2 class="menu-heading">Paused</h2>
        <div class="menu-buttons">
          <button id="pause-resume" class="menu-button primary">Resume</button>
          <button id="pause-restart" class="menu-button">Restart</button>
          <button id="pause-levels" class="menu-button">Level select</button>
          <button id="pause-title" class="menu-button">Title</button>
        </div>
      </div>`;
    root.querySelector('#pause-resume')?.addEventListener('click', () => this.setPaused(false));
    root.querySelector('#pause-restart')?.addEventListener('click', () => {
      this.restart();
      this.setPaused(false);
    });
    root.querySelector('#pause-levels')?.addEventListener('click', () => {
      this.setPaused(false);
      this.options.onLevelSelect?.();
    });
    root.querySelector('#pause-title')?.addEventListener('click', () => {
      this.setPaused(false);
      this.options.onTitle?.();
    });
  }

  private togglePause(): void {
    if (this.dead) {
      return;
    }
    this.setPaused(!this.paused);
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.engine.timescale = paused ? 0 : 1;
    document.body.classList.toggle('paused', paused);
    document.getElementById('pause-ui')?.classList.toggle('show', paused);
  }

  // ---- death ----------------------------------------------------------------

  private die(cause: 'caught' | 'fell' = 'caught'): void {
    if (this.dead || this.completed) {
      return;
    }
    this.dead = true;
    this.hud.setThreat(cause === 'caught' ? 'CAUGHT' : 'LOST', 'close');
    this.engine.timescale = 0;
    document.body.classList.add('dead');

    const root = document.getElementById('death-ui');
    if (!root) {
      return;
    }

    if (this.options.fromEditor) {
      root.innerHTML = `
        <div class="menu-panel death-panel">
          <h2 class="death-title">YOU DED :(</h2>
          <p class="death-subtitle">A NEW MEMORY FOR THE GRAVEYARD</p>
          <div class="menu-buttons">
            <button id="death-retry" class="menu-button primary">Retry tested level</button>
            <button id="death-save-title" class="menu-button">Save and Exit to Title</button>
            <button id="death-editor" class="menu-button">Back to Editor</button>
          </div>
        </div>`;
      root.querySelector('#death-retry')?.addEventListener('click', () => this.retry());
      root.querySelector('#death-save-title')?.addEventListener('click', () => {
        this.options.onSaveDraft?.(this.level);
        this.leaveDeath();
        this.options.onTitle?.();
      });
      root.querySelector('#death-editor')?.addEventListener('click', () => {
        this.leaveDeath();
        this.options.onOpenEditor?.(this.level);
      });
      return;
    }

    root.innerHTML = `
      <div class="menu-panel death-panel">
        <h2 class="death-title">YOU DIED</h2>
        <p class="death-subtitle">A NEW MEMORY FOR THE GRAVEYARD</p>
        <div class="menu-buttons">
          <button id="death-retry" class="menu-button primary">Retry</button>
          <button id="death-levels" class="menu-button">Level select</button>
          <button id="death-title" class="menu-button">Title</button>
        </div>
      </div>`;
    root.querySelector('#death-retry')?.addEventListener('click', () => this.retry());
    root.querySelector('#death-levels')?.addEventListener('click', () => {
      this.leaveDeath();
      this.options.onLevelSelect?.();
    });
    root.querySelector('#death-title')?.addEventListener('click', () => {
      this.leaveDeath();
      this.options.onTitle?.();
    });
  }

  private retry(): void {
    this.leaveDeath();
    this.restart();
  }

  private leaveDeath(): void {
    this.dead = false;
    this.engine.timescale = 1;
    document.body.classList.remove('dead');
    const root = document.getElementById('death-ui');
    if (root) {
      root.innerHTML = '';
    }
  }

  private clearDeath(): void {
    this.dead = false;
    document.body.classList.remove('dead');
    const root = document.getElementById('death-ui');
    if (root) {
      root.innerHTML = '';
    }
  }

  // ---- gameplay -------------------------------------------------------------

  private get totalMemories(): number {
    return this.built.memories.length;
  }

  private distanceBetweenMonsterAndPlayer(): number {
    if (!this.monster) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.hypot(
      this.player.pos.x - this.monster.pos.x,
      this.player.pos.y - this.monster.pos.y,
    );
  }

  private updateThreat(distance: number): void {
    if (distance <= MONSTER.closeDistance) {
      this.hud.setThreat('CLOSE', 'close');
    } else if (distance <= MONSTER.nearDistance) {
      this.hud.setThreat('NEAR', 'near');
    } else {
      this.hud.setThreat('CALM', 'calm');
    }
  }

  private collectMemory(memory: Memory): void {
    if (memory.isKilled()) {
      return;
    }
    memory.kill();
    this.collected += 1;
    this.hud.setProgress(this.collected, this.totalMemories);
    if (this.collected >= this.totalMemories) {
      this.hud.toast('all fragments found — keep moving', 1800);
    } else {
      this.hud.toast('a memory surfaces', 900);
    }
  }

  private reachExit(): void {
    if (this.completed || this.dead) {
      return;
    }
    this.completed = true;
    const inSequence = this.options.sequence !== undefined;
    this.hud.toast(inSequence ? 'you escaped the memory' : 'the memory lets you go', 1600);
    if (this.options.onLevelComplete) {
      this.completeTimer = setTimeout(() => {
        this.completeTimer = null;
        this.options.onLevelComplete?.(this.level);
      }, 900);
    }
  }

  private checkFall(): void {
    if (this.player.pos.y > this.levelHeightPx + LEVEL.killMargin) {
      this.die('fell');
    }
  }

  private restart(): void {
    if (this.completeTimer !== null) {
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }
    for (const memory of this.built.memories) {
      if (memory.isKilled()) {
        memory.unkill();
      }
    }
    this.collected = 0;
    this.completed = false;
    this.graceRemaining = MONSTER.graceSeconds;
    this.player.respawn(this.built.spawn.x, this.built.spawn.y);
    this.cameraFollow.update(this.player.pos, 1);
    this.hud.setProgress(0, this.totalMemories);

    if (this.built.monsterSpawn) {
      this.trail.reset(this.built.spawn);
      this.follower?.reset(this.built.monsterSpawn);
      this.monster?.pos.setTo(
        this.built.monsterSpawn.x,
        this.built.monsterSpawn.y,
      );
      this.hud.setThreat('DORMANT', 'dormant');
    } else {
      this.hud.setThreat('SAFE', 'calm');
    }
    this.hud.toast('the rooms remember you', 1400);
  }
}
