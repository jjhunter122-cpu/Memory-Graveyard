import { Actor, Color, Keys, Scene, Vector, type Engine } from 'excalibur';
import { GRAVE, MEMORY, PLAYER, VIEW } from '../config';
import { GRAVE_SPOTS, MEMORY_SPOTS, PLAYER_START } from '../level/spots';
import { memoriesInReach } from '../systems/graveyard';
import { Gravekeeper } from '../actors/Gravekeeper';
import { Memory } from '../actors/Memory';
import { Hud } from '../ui/Hud';

export class MainScene extends Scene {
  private keeper!: Gravekeeper;
  private memories: Memory[] = [];
  private readonly hud = new Hud();
  private collected = 0;

  override onInitialize(engine: Engine): void {
    this.add(this.makeBackdrop());

    for (const grave of GRAVE_SPOTS) {
      this.addGrave(grave.x, grave.y, grave.width, grave.height);
    }

    this.keeper = new Gravekeeper(PLAYER_START.x, PLAYER_START.y);
    this.add(this.keeper);

    this.spawnMemories();
    this.hud.setProgress(0, this.memories.length);
    void engine;
  }

  override onPreUpdate(_engine: Engine, elapsed: number): void {
    void elapsed;

    const reach = PLAYER.radius + MEMORY.radius + MEMORY.reach;
    const active = this.memories;
    const hits = memoriesInReach(
      this.keeper.pos,
      reach,
      active.map((memory) => ({ x: memory.spotX, y: memory.spotY })),
    );

    // Collect every memory under the caretaker this frame.
    for (let i = hits.length - 1; i >= 0; i -= 1) {
      const index = hits[i];
      if (index === undefined) {
        continue;
      }
      const memory = active[index];
      if (memory === undefined) {
        continue;
      }
      memory.kill();
      active.splice(index, 1);
      this.collected += 1;
    }

    if (hits.length > 0) {
      this.hud.setProgress(this.collected, this.memories.length + this.collected);
      if (this.memories.length === 0) {
        this.hud.toast('the graveyard remembers you', 2600);
      } else {
        this.hud.toast('a memory surfaces', 900);
      }
    }
  }

  override onPostUpdate(engine: Engine): void {
    if (engine.input.keyboard.wasPressed(Keys.R)) {
      this.resetCourse();
    }
  }

  resetCourse(): void {
    for (const memory of this.memories) {
      memory.kill();
    }
    this.memories = [];
    this.collected = 0;
    this.keeper.reset(PLAYER_START.x, PLAYER_START.y);
    this.spawnMemories();
    this.hud.setProgress(0, this.memories.length);
    this.hud.toast('the dead settle back in', 1200);
  }

  private spawnMemories(): void {
    for (const spot of MEMORY_SPOTS) {
      const memory = new Memory(spot.x, spot.y);
      this.memories.push(memory);
      this.add(memory);
    }
  }

  private addGrave(x: number, y: number, width: number, height: number): void {
    const stone = new Actor({
      x,
      y,
      width,
      height,
      color: Color.fromHex(GRAVE.color),
      anchor: new Vector(0.5, 0.5),
    });
    this.add(stone);

    const cap = new Actor({
      x,
      y: y - height / 2 - 3,
      width: width + 10,
      height: 6,
      color: Color.fromHex(GRAVE.cap),
      anchor: new Vector(0.5, 0.5),
    });
    this.add(cap);
  }

  private makeBackdrop(): Actor {
    return new Actor({
      x: VIEW.width / 2,
      y: VIEW.height / 2,
      width: VIEW.width,
      height: VIEW.height,
      color: Color.fromHex('#0f1018'),
      anchor: new Vector(0.5, 0.5),
    });
  }
}
