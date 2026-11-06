# Memory Graveyard

A 2D platformer where you play the caretaker of a graveyard, gathering the
glowing memories of the dead before finding your way out. Built on the same
stack as [drunk-panda](https://github.com/NatTuck/drunk-panda):

- **Excalibur.js** 0.32 (Arcade physics solver)
- **TypeScript** 7
- **Vite** 8
- **Vitest** 5
- **pnpm**

Everything is client-side; there is no backend.

> **Branch:** this work lives on `develop`. `main` is the original top-down
> scaffold kept as a snapshot.

## Run it

```bash
pnpm install
pnpm dev
```

Then open the printed local URL.

```bash
pnpm test       # headless physics-decision / level-layout tests
pnpm typecheck
pnpm build      # static production build in dist/
pnpm preview
```

## Controls

| Action | Keyboard |
| --- | --- |
| Move | `A` `D` or `←` `→` |
| Jump | `Space`, `W` or `↑` |
| Drop through a plank | `S` + `Space` |
| Reset | `R` |

Gather all six memories, then reach the green exit. Falling off the course
respawns you at the start.

## Architecture

```
src/
  main.ts                     boot: engine, fixed step, Arcade physics
  game/
    config.ts                 gameplay tunables + palette + tile size
    physics/collisionGroups.ts bitmask groups (solid / one-way / player / trigger)
    player/
      PlayerController.ts     pure run/jump/coyote/buffer decisions (testable)
      Player.ts               Excalibur actor: input, body, one-way pass-through
    actors/{Memory,Exit}.ts   passive trigger actors
    level/
      geometry.ts             tile <-> pixel helpers
      testLevel.ts            the M1 course as data
    camera/CameraFollow.ts    deadzone follow, clamped to level bounds
    scenes/PlayScene.ts       level assembly and loop
    systems/graveyard.ts      pure clamp + rank helpers
    ui/Hud.ts                 DOM overlay writer
tests/                        headless vitest suite
```

### Key decisions

- **Excalibur's built-in Arcade solver**, not the Realistic (matter.js) solver.
  Arcade is Excalibur's simple AABB solver, designed for platforming, and we run
  it on a **fixed 120 Hz step** (`fixedUpdateFps`).
- **Pure movement decisions.** Gravity, acceleration, variable-height jump,
  coyote time and jump buffering live in `PlayerController`, which has no
  Excalibur imports and is replayed deterministically in tests. The engine only
  resolves collisions.
- **One-way platforms via collision groups.** Arcade has no native one-way
  platforms, so the player swaps to a group that ignores one-way planks while
  rising or while dropping through (`S` + `Space`).
- **Levels are data.** `testLevel.ts` describes solids, planks, spawn, exit and
  memories in tile coordinates. This becomes a JSON format in the next milestone.
- **DOM HUD over engine text** keeps labels crisp at any resolution.

## Roadmap

- [x] **M1 — Platformer core:** Arcade physics, player controller, camera,
  one-way planks, test course.
- [ ] **M2 — Level pipeline:** JSON level schema, asset manifest, placeholder
  tiles, `LevelLoader`.
- [ ] **M3 — Level designer:** in-browser editor (paint tiles, place entities,
  undo/redo, save/load, test-play).
- [ ] **M4 — Title screen & general UI:** Boot → Title → Level Select → Play →
  Pause → Settings.
- [ ] **M5 — Asset integration:** drop real tilesets into the manifest.
