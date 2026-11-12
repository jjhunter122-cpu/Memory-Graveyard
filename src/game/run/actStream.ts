import type { Actor, Scene } from 'excalibur';
import { MemoryPickup } from '../actors/MemoryPickup';
import { StaminaShard } from '../actors/StaminaShard';
import type { GameTextures } from '../assets';
import { MEMORY, VIEW } from '../config';
import { buildLevel } from '../level/loader';
import type { AssetManifest } from '../level/manifest';
import { createLevel, EMPTY_TILE } from '../level/schema';
import {
  ACT_FLOOR_ROW,
  ACT_HEIGHT,
  ACT_TILE_SIZE,
  ACT_WIDTH,
  FLOOR_FILL_TILE,
  FLOOR_TOP_TILE,
  generateFeatures,
  generatePits,
  isOverPit,
  type Pit,
} from './generator';
import {
  SHARD_START_X,
  shardRowOffset,
  shardSpacingAt,
} from './stamina';
import {
  MEMORY_CLUSTER_SIZE,
  MEMORY_SPACING,
  MEMORY_START_X,
} from './score';

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
  memories: MemoryPickup[];
  /** World-space top surface per local tile column; -1 means a pit. */
  surfaceTops: number[];
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
  private nextMemoryX = MEMORY_START_X;

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
    this.nextMemoryX = MEMORY_START_X;
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

  /** World-space top surface at an x, or null over a pit. */
  surfaceAt(worldX: number): number | null {
    const act = this.acts.find(
      (candidate) => worldX >= candidate.startX && worldX < candidate.endX,
    );
    if (!act) {
      return null;
    }
    const tile = Math.floor((worldX - act.startX) / ACT_TILE_SIZE);
    const surface = act.surfaceTops[tile];
    return surface === undefined || surface < 0 ? null : surface;
  }

  /** Ground probe used by the player while streaming acts exist ahead. */
  hasFloorAt(worldX: number, feetY: number, halfWidth: number): boolean {
    const samples = [worldX, worldX - halfWidth, worldX + halfWidth];
    for (const sample of samples) {
      const surface = this.surfaceAt(sample);
      if (surface !== null && feetY >= surface - 2 && feetY <= surface + 14) {
        return true;
      }
    }
    return false;
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
    const features = generateFeatures(this.seed, index, pits);
    const level = createLevel(
      `Act ${index + 1}`,
      ACT_WIDTH,
      ACT_HEIGHT,
      ACT_TILE_SIZE,
    );
    const terrain = level.layers[0];
    const data = terrain ? terrain.data.slice() : [];

    if (terrain) {
      for (let x = 0; x < ACT_WIDTH; x += 1) {
        if (isOverPit(pits, x)) {
          continue;
        }
        data[ACT_FLOOR_ROW * ACT_WIDTH + x] = FLOOR_TOP_TILE;
        data[(ACT_FLOOR_ROW + 1) * ACT_WIDTH + x] = FLOOR_FILL_TILE;
      }
    }

    const fillRaised = (start: number, width: number, topRow: number): void => {
      for (let x = start; x < start + width; x += 1) {
        for (let y = topRow; y < ACT_HEIGHT; y += 1) {
          data[y * ACT_WIDTH + x] =
            y === topRow ? FLOOR_TOP_TILE : FLOOR_FILL_TILE;
        }
      }
    };

    for (const section of features.raised) {
      fillRaised(section.start, section.width, section.topRow);
    }
    for (const platform of features.floating) {
      for (let x = platform.start; x < platform.start + platform.width; x += 1) {
        for (let y = platform.topRow; y < ACT_FLOOR_ROW; y += 1) {
          data[y * ACT_WIDTH + x] =
            y === platform.topRow ? FLOOR_TOP_TILE : FLOOR_FILL_TILE;
        }
      }
    }

    const surfaceTops = new Array<number>(ACT_WIDTH).fill(-1);
    for (let x = 0; x < ACT_WIDTH; x += 1) {
      for (let y = 0; y < ACT_HEIGHT; y += 1) {
        if (data[y * ACT_WIDTH + x] !== EMPTY_TILE) {
          surfaceTops[x] = y * ACT_TILE_SIZE;
          break;
        }
      }
    }

    if (terrain) {
      level.layers[0] = { ...terrain, data };
    }
    level.skybox = '#0a0b10';
    level.background = 'pixel-platformer-world-layers';

    const actEndX = startX + ACT_WIDTH * ACT_TILE_SIZE;
    const memorySpecs: { tile: number }[] = [];
    while (this.nextMemoryX < actEndX) {
      let tile = Math.max(
        0,
        Math.floor((this.nextMemoryX - startX) / ACT_TILE_SIZE),
      );
      while (tile + MEMORY_CLUSTER_SIZE <= ACT_WIDTH) {
        let blocked = false;
        for (let i = 0; i < MEMORY_CLUSTER_SIZE; i += 1) {
          if (isOverPit(pits, tile + i)) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          break;
        }
        tile += 1;
      }
      if (tile + MEMORY_CLUSTER_SIZE > ACT_WIDTH) {
        break;
      }
      memorySpecs.push({ tile });
      this.nextMemoryX += MEMORY_SPACING;
    }

    const shardSpecs: { tile: number; rowOffset: number }[] = [];
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
      shardSpecs.push({ tile, rowOffset: shardRowOffset(this.shardIndex) });
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

    const shards: StaminaShard[] = [];
    for (const spec of shardSpecs) {
      const surface = surfaceTops[spec.tile];
      if (surface === undefined || surface < 0) {
        continue;
      }
      const shard = new StaminaShard(
        startX + spec.tile * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
        surface - spec.rowOffset * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
      );
      this.scene.add(shard);
      shards.push(shard);
    }

    const memories: MemoryPickup[] = [];
    for (const spec of memorySpecs) {
      for (let i = 0; i < MEMORY_CLUSTER_SIZE; i += 1) {
        const tile = spec.tile + i;
        const surface = surfaceTops[tile];
        if (surface === undefined || surface < 0) {
          continue;
        }
        const memory = new MemoryPickup(
          startX + tile * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
          surface - ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
        );
        this.scene.add(memory);
        memories.push(memory);
      }
    }

    this.acts.push({
      index,
      startX,
      endX: actEndX,
      actors: [...actors, ...shards, ...memories],
      pits: pits.map((pit: Pit) => ({
        startX: startX + pit.start * ACT_TILE_SIZE,
        endX: startX + (pit.start + pit.width) * ACT_TILE_SIZE,
      })),
      shards,
      memories,
      surfaceTops,
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

  /** Collects memory orbs by body overlap, like the stamina shards. */
  collectMemories(
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    let collected = 0;
    for (const act of this.acts) {
      for (let index = act.memories.length - 1; index >= 0; index -= 1) {
        const memory = act.memories[index]!;
        if (
          Math.abs(x - memory.pos.x) < width / 2 + MEMORY.radius &&
          Math.abs(y - memory.pos.y) < height / 2 + MEMORY.radius
        ) {
          memory.kill();
          act.memories.splice(index, 1);
          collected += 1;
        }
      }
    }
    return collected;
  }
}
