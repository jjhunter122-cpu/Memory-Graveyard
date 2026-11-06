import { Actor, CollisionType, Color, Keys, Scene, type Engine } from 'excalibur';
import { COLORS, LEVEL, TILE } from '../config';
import {
  ONEWAY_GROUP,
  SOLID_GROUP,
} from '../physics/collisionGroups';
import {
  rectCenterX,
  rectCenterY,
  rectPixelHeight,
  rectPixelWidth,
  tileCenterX,
  tileCenterY,
  type TileRect,
} from '../level/geometry';
import { TEST_LEVEL, type LevelData } from '../level/testLevel';
import { Player } from '../player/Player';
import { Memory } from '../actors/Memory';
import { Exit } from '../actors/Exit';
import { CameraFollow } from '../camera/CameraFollow';
import { Hud } from '../ui/Hud';

const ONEWAY_THICKNESS = 12;

export class PlayScene extends Scene {
  private level: LevelData = TEST_LEVEL;
  private readonly hud = new Hud();

  private player!: Player;
  private cameraFollow!: CameraFollow;

  private memories: Memory[] = [];
  private collected = 0;
  private completed = false;

  private spawnX = 0;
  private spawnY = 0;
  private readonly levelPixelWidth = TEST_LEVEL.widthTiles * TILE;
  private readonly levelPixelHeight = TEST_LEVEL.heightTiles * TILE;

  override onInitialize(_engine: Engine): void {
    this.add(this.makeBackdrop());

    for (const rect of this.level.solid) {
      this.addSolid(rect);
    }
    for (const rect of this.level.oneWay) {
      this.addOneWay(rect);
    }

    this.spawnX = tileCenterX(this.level.spawn.x);
    this.spawnY = tileCenterY(this.level.spawn.y);

    this.player = new Player(this.spawnX, this.spawnY);
    this.player.on('collisionstart', (event) => {
      const other = event.other;
      if (other instanceof Memory) {
        this.collectMemory(other);
      } else if (other instanceof Exit) {
        this.reachExit();
      }
    });
    this.add(this.player);

    this.add(new Exit(tileCenterX(this.level.exit.x), tileCenterY(this.level.exit.y)));

    this.spawnMemories();
    this.hud.setProgress(0, this.memories.length);

    this.cameraFollow = new CameraFollow(this, this.levelPixelWidth, this.levelPixelHeight);
    this.cameraFollow.update(this.player.pos, 1);
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

  private collectMemory(memory: Memory): void {
    if (memory.isKilled()) {
      return;
    }
    memory.kill();
    this.memories = this.memories.filter((candidate) => candidate !== memory);
    this.collected += 1;
    this.hud.setProgress(this.collected, this.level.memories.length);
    if (this.memories.length === 0) {
      this.hud.toast('all memories gathered — find the way out', 2400);
    } else {
      this.hud.toast('a memory surfaces', 900);
    }
  }

  private reachExit(): void {
    if (this.completed) {
      return;
    }
    if (this.collected < this.level.memories.length) {
      const remaining = this.level.memories.length - this.collected;
      this.hud.toast(`the way out is sealed — ${remaining} memories remain`, 1600);
      return;
    }
    this.completed = true;
    this.hud.toast('the graveyard releases you', 4000);
  }

  private checkFall(): void {
    if (this.player.pos.y > this.levelPixelHeight + LEVEL.killMargin) {
      this.respawnPlayer();
      this.hud.toast('you slipped into the dark', 1400);
    }
  }

  private respawnPlayer(): void {
    this.player.respawn(this.spawnX, this.spawnY);
    this.cameraFollow.update(this.player.pos, 1);
  }

  private restart(): void {
    for (const memory of this.memories) {
      memory.kill();
    }
    this.memories = [];
    this.collected = 0;
    this.completed = false;
    this.spawnMemories();
    this.hud.setProgress(0, this.memories.length);
    this.respawnPlayer();
    this.hud.toast('the dead settle back in', 1200);
  }

  private spawnMemories(): void {
    for (const spot of this.level.memories) {
      const memory = new Memory(tileCenterX(spot.x), tileCenterY(spot.y));
      this.memories.push(memory);
      this.add(memory);
    }
  }

  private addSolid(rect: TileRect): void {
    const width = rectPixelWidth(rect);
    const height = rectPixelHeight(rect);
    this.add(
      new Actor({
        x: rectCenterX(rect),
        y: rectCenterY(rect),
        width,
        height,
        color: Color.fromHex(COLORS.solid),
        collisionType: CollisionType.Fixed,
        collisionGroup: SOLID_GROUP,
      }),
    );
    // A lighter cap so platform edges read clearly.
    this.add(
      new Actor({
        x: rectCenterX(rect),
        y: rect.y * TILE + 3,
        width,
        height: 6,
        color: Color.fromHex(COLORS.solidTop),
        collisionType: CollisionType.PreventCollision,
      }),
    );
  }

  private addOneWay(rect: TileRect): void {
    this.add(
      new Actor({
        x: rectCenterX(rect),
        y: rect.y * TILE + ONEWAY_THICKNESS / 2,
        width: rectPixelWidth(rect),
        height: ONEWAY_THICKNESS,
        color: Color.fromHex(COLORS.oneWayTop),
        collisionType: CollisionType.Fixed,
        collisionGroup: ONEWAY_GROUP,
      }),
    );
  }

  private makeBackdrop(): Actor {
    return new Actor({
      x: this.levelPixelWidth / 2,
      y: this.levelPixelHeight / 2,
      width: this.levelPixelWidth,
      height: this.levelPixelHeight,
      color: Color.fromHex(COLORS.fog),
      collisionType: CollisionType.PreventCollision,
      z: -1,
    });
  }
}
