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

export class PlayScene extends Scene {
  private readonly hud = new Hud();

  private player!: Player;
  private cameraFollow!: CameraFollow;
  private built!: BuiltLevel;

  private collected = 0;
  private completed = false;
  private levelHeightPx = 0;

  constructor(
    private readonly level: LevelData,
    private readonly manifest: AssetManifest,
  ) {
    super();
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
    this.cameraFollow.update(this.player.pos, elapsed / 1000);
    this.checkFall();
  }

  override onPostUpdate(engine: Engine): void {
    if (engine.input.keyboard.wasPressed(Keys.R)) {
      this.restart();
    }
  }

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
