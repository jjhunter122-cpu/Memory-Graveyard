import type { Actor, Scene } from 'excalibur';
import { CoinPickup } from '../actors/CoinPickup';
import { StaminaBolt } from '../actors/StaminaBolt';
import type { GameTextures } from '../assets';
import { VIEW } from '../config';
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
  BOLT_START_X,
  boltRowOffset,
  boltSpacingAt,
} from './stamina';
import {
  COIN_CLUSTER_SIZE,
  COIN_SPACING,
  COIN_START_X,
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
  bolts: StaminaBolt[];
  coins: CoinPickup[];
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
  private nextBoltX = BOLT_START_X;
  private boltIndex = 0;
  private nextCoinX = COIN_START_X;

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
    this.nextBoltX = BOLT_START_X;
    this.boltIndex = 0;
    this.nextCoinX = COIN_START_X;
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
    const coinSpecs: { tile: number }[] = [];
    while (this.nextCoinX < actEndX) {
      let tile = Math.max(
        0,
        Math.floor((this.nextCoinX - startX) / ACT_TILE_SIZE),
      );
      while (tile + COIN_CLUSTER_SIZE <= ACT_WIDTH) {
        let blocked = false;
        for (let i = 0; i < COIN_CLUSTER_SIZE; i += 1) {
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
      if (tile + COIN_CLUSTER_SIZE > ACT_WIDTH) {
        break;
      }
      coinSpecs.push({ tile });
      this.nextCoinX += COIN_SPACING;
    }

    const boltSpecs: { tile: number; rowOffset: number }[] = [];
    while (this.nextBoltX < actEndX) {
      let tile = Math.max(
        0,
        Math.floor((this.nextBoltX - startX) / ACT_TILE_SIZE),
      );
      while (tile < ACT_WIDTH && isOverPit(pits, tile)) {
        tile += 1;
      }
      if (tile >= ACT_WIDTH) {
        break;
      }
      boltSpecs.push({ tile, rowOffset: boltRowOffset(this.boltIndex) });
      this.boltIndex += 1;
      this.nextBoltX += boltSpacingAt(this.nextBoltX);
    }

    const actors = buildLevel(this.scene, level, this.manifest, this.textures, {
      background: true,
    });
    for (const actor of actors) {
      actor.pos.x += startX;
    }

    const bolts: StaminaBolt[] = [];
    for (const spec of boltSpecs) {
      const surface = surfaceTops[spec.tile];
      if (surface === undefined || surface < 0) {
        continue;
      }
      const bolt = new StaminaBolt(
        startX + spec.tile * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
        surface - spec.rowOffset * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
        this.textures.staminaBolt,
      );
      this.scene.add(bolt);
      bolts.push(bolt);
    }

    const coins: CoinPickup[] = [];
    for (const spec of coinSpecs) {
      for (let i = 0; i < COIN_CLUSTER_SIZE; i += 1) {
        const tile = spec.tile + i;
        const surface = surfaceTops[tile];
        if (surface === undefined || surface < 0) {
          continue;
        }
        const coin = new CoinPickup(
          startX + tile * ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
          surface - ACT_TILE_SIZE + ACT_TILE_SIZE / 2,
          this.textures.scoreCoin,
        );
        this.scene.add(coin);
        coins.push(coin);
      }
    }

    this.acts.push({
      index,
      startX,
      endX: actEndX,
      actors: [...actors, ...bolts, ...coins],
      pits: pits.map((pit: Pit) => ({
        startX: startX + pit.start * ACT_TILE_SIZE,
        endX: startX + (pit.start + pit.width) * ACT_TILE_SIZE,
      })),
      bolts,
      coins,
      surfaceTops,
    });
  }

  /**
   * Collects any bolt whose square overlaps the player's body. Bolts are
   * sensors, so this replaces collision events entirely.
   */
  collectBolts(
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    let collected = 0;
    for (const act of this.acts) {
      for (let index = act.bolts.length - 1; index >= 0; index -= 1) {
        const bolt = act.bolts[index]!;
        if (
          Math.abs(x - bolt.pos.x) < width / 2 + bolt.width / 2 &&
          Math.abs(y - bolt.pos.y) < height / 2 + bolt.height / 2
        ) {
          bolt.kill();
          act.bolts.splice(index, 1);
          collected += 1;
        }
      }
    }
    return collected;
  }

  /** Collects coins by body overlap, like the stamina bolts. */
  collectCoins(
    x: number,
    y: number,
    width: number,
    height: number,
  ): number {
    let collected = 0;
    for (const act of this.acts) {
      for (let index = act.coins.length - 1; index >= 0; index -= 1) {
        const coin = act.coins[index]!;
        if (
          Math.abs(x - coin.pos.x) < width / 2 + coin.width / 2 &&
          Math.abs(y - coin.pos.y) < height / 2 + coin.height / 2
        ) {
          coin.kill();
          act.coins.splice(index, 1);
          collected += 1;
        }
      }
    }
    return collected;
  }
}
