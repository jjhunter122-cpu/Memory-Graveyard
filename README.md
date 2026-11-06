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
pnpm test       # headless logic / level-format tests
pnpm typecheck
pnpm build      # static production build in dist/
pnpm preview
pnpm smoke      # headless Firefox end-to-end check (see below)
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
  main.ts                     boot: load level + manifest, engine, fixed step
  game/
    config.ts                 gameplay tunables + palette + tile size
    physics/collisionGroups.ts bitmask groups (solid / one-way / player / trigger)
    player/
      PlayerController.ts     pure run/jump/coyote/buffer decisions (testable)
      Player.ts               Excalibur actor: input, body, tile ground probe
    actors/{Memory,Exit}.ts   passive trigger actors
    level/
      schema.ts               level JSON format (v1) + validator + round-trip
      manifest.ts             asset manifest: tile id -> art + collision
      tiles.ts                grid reshaping + horizontal run merging
      loader.ts               level + manifest -> live actors
    camera/CameraFollow.ts    deadzone follow, clamped to level bounds
    scenes/PlayScene.ts       level assembly and loop
    systems/graveyard.ts      pure clamp + rank helpers
    app.ts                    scene navigation (play <-> editor)
    ui/Hud.ts                 DOM overlay writer
  editor/
    history.ts                snapshot undo/redo stack
    ops.ts                    immutable level-document operations
    EditorUi.ts               DOM toolbar / palette / status bar
    EditorScene.ts            painting, pan/zoom, save/load, test-play
public/
  levels/test-course.json     the test course, authored as data
  assets/manifest.json        placeholder tile manifest
scripts/smoke.mjs             headless Firefox end-to-end smoke test
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
- **Deterministic ground probe.** Arcade does not report a resting ground contact
  on every step, so the player also probes the level's collision grid directly.
  A short event latch bridges gaps; coyote time keeps jumps forgiving.
- **One-way platforms via collision groups.** Arcade has no native one-way
  platforms, so the player swaps to a group that ignores one-way planks while
  rising or while dropping through (`S` + `Space`).
- **Levels and art are data.** A level is versioned JSON; a manifest maps tile
  ids to collision behaviour and (eventually) real art. Swapping in tilesets
  later is a manifest-only change. See `docs/LEVELS.md`.
- **DOM HUD over engine text** keeps labels crisp at any resolution.

## Level format

A level is a small JSON document (`public/levels/*.json`): a grid of tile ids
per layer plus a list of entities (`spawn`, `memory`, `exit`, ...). Collision
comes from each tile's definition in the manifest, not from the level, so
painting a tile automatically gives it the right physics. Full details are in
[`docs/LEVELS.md`](docs/LEVELS.md).

## Level editor

Open the editor with the **Open editor** button in-game, or go straight to it
with `?editor`:

```
http://localhost:5173/?editor
```

| Action | Control |
| --- | --- |
| Pan | `W` `A` `S` `D` / arrow keys |
| Zoom | mouse wheel |
| Paint / erase | left-click-drag with the Paint / Erase tool |
| Place entity | Entity tool, then click |
| Undo / redo | `Ctrl+Z` / `Ctrl+Y` (or the buttons) |
| Grid | Grid button |

The toolbar has **New**, **Save** (downloads `<name>.json`) and **Load** (reads
a level file back). **Test play** drops you into the level with the current
edits; **Back to editor** returns. Editing operates on immutable snapshots, so
undo/redo is exact.

## Testing

- `pnpm test` — pure logic and the level/manifest formats in Vitest.
- `pnpm smoke` — boots the real app in headless Firefox via WebDriver and checks
  that the scene builds and the character moves and jumps. Requires a running
  server (`pnpm dev`) and `geckodriver --port 4444`.

## Roadmap

- [x] **M1 — Platformer core:** Arcade physics, player controller, camera,
  one-way planks, test course.
- [x] **M2 — Level pipeline:** JSON level schema, asset manifest, placeholder
  tiles, `LevelLoader`.
- [x] **M3 — Level designer:** in-browser editor (paint tiles, place entities,
  undo/redo, save/load, test-play).
- [ ] **M4 — Title screen & general UI:** Boot → Title → Level Select → Play →
  Pause → Settings.
- [ ] **M5 — Asset integration:** drop real tilesets into the manifest.
