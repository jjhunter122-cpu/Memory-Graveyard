import type { Actor, Scene } from 'excalibur';
import { StaminaShard } from '../actors/StaminaShard';
import type { GameTextures } from '../assets';
import { VIEW } from '../config';
import { buildLevel } from '../level/loader';
import type { AssetManifest } from '../level/manifest';
import { createLevel } from '../level/schema';
import {
  ACT_FLOOR_ROW,
  ACT_HEIGHT,
  ACT_TILE_SIZE,
  ACT_WIDTH,
  FLOOR_FILL_TILE,
  FLOOR_TOP_TILE,
  generatePits,
  isOverPit,
  type Pit,
} from './generator';
import {
  SHARD_START_X,
  shardHeightAt,
  shardSpacingAt,
} from './stamina';

interface WorldPit {
  startX: number;
  endX: number;
}

interface Act {
  index: number;
  startX: number;
  endX: number;
  actors: Actor[];
  pits: WorldPit[];
  shards: StaminaShard[];
}

/**
 * Builds random acts ahead of the player and recycles them behind. Each act is
 * a self-contained slice of forest with its own floor, pits and backdrop.
 */
export class ActStream {
  private readonly acts: Act[] = [];
  private nextIndex = 0;
  private seed = 0;
  private nextShardX = SHARD_START_X;
  private shardIndex = 0;

  constructor(
    private readonly scene: Scene,
    private readonly manifest: AssetManifest,
    private readonly textures: GameTextures,
    seed: number,
  ) {
    this.reset(seed);
  }

  reset(seed: number): void {
    for (const act of this.acts) {
      for (const actor of act.actors) {
        actor.kill();
      }
    }
    this.acts.length = 0;
    this.nextIndex = 0;
    this.seed = seed;
    this.nextShardX = SHARD_START_X;
    this.shardIndex = 0;
    this.update(0);
  }

  update(playerX: number): void {
    const ahead = playerX + VIEW.width * 2;
    while (
      this.acts.length === 0 ||
      (this.acts[this.acts.length - 1]?.endX ?? 0) < ahead
    ) {
      const previous = this.acts[this.acts.length - 1];
      const startX = previous ? previous.endX : 0;
      this.buildAct(this.nextIndex, startX);
      this.nextIndex += 1;
    }

    const behind = playerX - VIEW.width * 2;
    while (this.acts.length > 1 && (this.acts[0]?.endX ?? 0) < behind) {
      const act = this.acts.shift();
      if (!act) {
        break;
      }
      for (const actor of act.actors) {
        actor.kill();
      }
    }
  }

  /** Ground probe used by the player while streaming acts exist ahead. */
  hasFloorAt(worldX: number, feetY: number, halfWidth: number): boolean {
    const floorTop = ACT_FLOOR_ROW * ACT_TILE_SIZE;
    if (feetY < floorTop - 2 || feetY > floorTop + 14) {
      return false;
    }

    const act = this.acts.find(
      (candidate) => worldX >= candidate.startX && worldX < candidate.endX,
    );
    if (!act) {
      return false;
    }

    const left = worldX - halfWidth;
    const right = worldX + halfWidth;
    for (const pit of act.pits) {
      // The player is only unsupported when the whole foot span is over air.
      if (left >= pit.startX && right <= pit.endX) {
        return false;
      }
    }
    return true;
  }

  /** True when the player's centre is horizontally inside a pit. */
  isOverPitAt(worldX: number): boolean {
    const act = this.acts.find(
      (candidate) => worldX >= candidate.startX && worldX < candidate.endX,
    );
    if (!act) {
      return false;
    }
    return act.pits.some((pit) => worldX >= pit.startX && worldX < pit.endX);
  }

  private buildAct(index: number, startX: number): void {
    const pits = generatePits(this.seed, index);
    const level = createLevel(
      `Act ${index + 1}`,
      ACT_WIDTH,
      ACT_HEIGHT,
      ACT_TILE_SIZE,
    );
    const terrain = level.layers[0];
    if (terrain) {
      const data = terrain.data.slice();
      for (let x = 0; x < ACT_WIDTH; x += 1) {
        if (isOverPit(pits, x)) {
          continue;
        }
        data[ACT_FLOOR_ROW * ACT_WIDTH + x] = FLOOR_TOP_TILE;
        data[(ACT_FLOOR_ROW + 1) * ACT_WIDTH + x] = FLOOR_FILL_TILE;
      }
      level.layers[0] = { ...terrain, data };
    }
    level.skybox = '#0a0b10';
    level.background = 'pixel-platformer-world-layers';

    const actEndX = startX + ACT_WIDTH * ACT_TILE_SIZE;
    const shardSpecs: { tile: number; y: number }[] = [];
    while (this.nextShardX < actEndX) {
      let tile = Math.max(
        0,
        Math.floor((this.nextShardX - startX) / ACT_TILE_SIZE),
      );
      while (tile < ACT_WIDTH && isOverPit(pits, tile)) {
        tile += 1;
      }
      if (tile >= ACT_WIDTH) {
        break;
      }
      shardSpecs.push({ tile, y: shardHeightAt(this.shardIndex) });
      this.shardIndex += 1;
      this.nextShardX += shardSpacingAt(this.nextShardX);
    }

    const before = new Set(this.scene.actors);
    buildLevel(this.scene, level, this.manifest, this.textures, {
      foreground: false,
      worldBounds: false,
    });
    const actors = this.scene.actors.filter((actor) => !before.has(actor));
    for (const actor of actors) {
      actor.pos.x += startX;
    }

    const shards = shardSpecs.map((spec) => {
      const shard = new StaminaShard(
        startX + spec.tile * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
        spec.y * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
      );
      this.scene.add(shard);
      return shard;
    });

    this.acts.push({
      index,
      startX,
      endX: startX + ACT_WIDTH * ACT_TILE_SIZE,
      actors: [...actors, ...shards],
      pits: pits.map((pit: Pit) => ({
        startX: startX + pit.start * ACT_TILE_SIZE,
        endX: startX + (pit.start + pit.width) * ACT_TILE_SIZE,
      })),
      shards,
    });
  }

  /**
   * Collects any shard whose square overlaps the player's body. Shards are
   * sensors, so this replaces collision events entirely.
   */
  collectShards(
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    let collected = 0;
    for (const act of this.acts) {
      for (let index = act.shards.length - 1; index >= 0; index -= 1) {
        const shard = act.shards[index]!;
        if (
          Math.abs(x - shard.pos.x) < width / 2 + shard.width / 2 &&
          Math.abs(y - shard.pos.y) < height / 2 + shard.height / 2
        ) {
          shard.kill();
          act.shards.splice(index, 1);
          collected += 1;
        }
      }
    }
    return collected;
  }
}
