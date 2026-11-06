import { Keys, Scene, type Engine } from 'excalibur';
import { LEVEL } from '../config';
import type { LevelData } from '../level/schema';
import type { AssetManifest } from '../level/manifest';
import { buildLevel, type BuiltLevel } from '../level/loader';
import { Player } from '../player/Player';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { CameraFollow } from '../camera/CameraFollow';
import { Hud } from '../ui/Hud';
import { setMode } from '../ui/mode';

export interface PlaySceneOptions {
  fromEditor?: boolean;
  showHud?: boolean;
  onOpenEditor?: (level: LevelData) => void;
  onLevelSelect?: () => void;
  onTitle?: () => void;
}

export class PlayScene extends Scene {
  private readonly hud = new Hud();

  private player!: Player;
  private cameraFollow!: CameraFollow;
  private built!: BuiltLevel;

  private collected = 0;
  private completed = false;
  private levelHeightPx = 0;
  private paused = false;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.togglePause();
    }
  };

  constructor(
    private readonly level: LevelData,
    private readonly manifest: AssetManifest,
    private readonly options: PlaySceneOptions = {},
  ) {
    super();
  }

  override onActivate(_context: unknown): void {
    setMode('playing');
    this.hud.setLevelName(this.level.name);
    this.hud.setVisible(this.options.showHud ?? true);
    this.wireEditorButton();
    this.renderPauseMenu();
    document.addEventListener('keydown', this.onKeyDown);
  }

  override onDeactivate(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    this.setPaused(false);
    const button = document.getElementById('open-editor');
    if (button instanceof HTMLButtonElement) {
      button.onclick = null;
    }
  }

  override onInitialize(_engine: Engine): void {
    this.built = buildLevel(this, this.level, this.manifest);
    this.levelHeightPx = this.built.heightPx;

    this.player = new Player(
      this.built.spawn.x,
      this.built.spawn.y,
      this.built.groundProbe,
    );
    this.player.on('collisionstart', (event) => {
      const other = event.other;
      if (other instanceof Memory) {
        this.collectMemory(other);
      } else if (other instanceof Exit) {
        this.reachExit();
      }
    });
    this.add(this.player);

    this.cameraFollow = new CameraFollow(this, this.built.widthPx, this.built.heightPx);
    this.cameraFollow.update(this.player.pos, 1);
    this.hud.setProgress(0, this.built.memories.length);
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    if (this.paused) {
      return;
    }
    this.cameraFollow.update(this.player.pos, elapsed / 1000);
    this.checkFall();
  }

  override onPostUpdate(engine: Engine): void {
    if (this.paused) {
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
    this.setPaused(!this.paused);
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.engine.timescale = paused ? 0 : 1;
    document.body.classList.toggle('paused', paused);
    document.getElementById('pause-ui')?.classList.toggle('show', paused);
  }

  // ---- gameplay -------------------------------------------------------------

  private get totalMemories(): number {
    return this.built.memories.length;
  }

  private collectMemory(memory: Memory): void {
    if (memory.isKilled()) {
      return;
    }
    memory.kill();
    this.collected += 1;
    this.hud.setProgress(this.collected, this.totalMemories);
    if (this.collected >= this.totalMemories) {
      this.hud.toast('all memories gathered — find the way out', 2400);
    } else {
      this.hud.toast('a memory surfaces', 900);
    }
  }

  private reachExit(): void {
    if (this.completed) {
      return;
    }
    if (this.collected < this.totalMemories) {
      const remaining = this.totalMemories - this.collected;
      this.hud.toast(`the way out is sealed — ${remaining} memories remain`, 1600);
      return;
    }
    this.completed = true;
    this.hud.toast('the graveyard releases you', 4000);
  }

  private checkFall(): void {
    if (this.player.pos.y > this.levelHeightPx + LEVEL.killMargin) {
      this.respawnPlayer();
      this.hud.toast('you slipped into the dark', 1400);
    }
  }

  private respawnPlayer(): void {
    this.player.respawn(this.built.spawn.x, this.built.spawn.y);
    this.cameraFollow.update(this.player.pos, 1);
  }

  private restart(): void {
    for (const memory of this.built.memories) {
      if (memory.isKilled()) {
        memory.unkill();
      }
    }
    this.collected = 0;
    this.completed = false;
    this.hud.setProgress(0, this.totalMemories);
    this.respawnPlayer();
    this.hud.toast('the dead settle back in', 1200);
  }
}
