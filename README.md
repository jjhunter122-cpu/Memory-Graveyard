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

Then open the printed local URL — the app boots to the **title screen**. The
level editor is a dev tool: open it from the title (dev builds only) or with
`?editor`.

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
  main.ts                     boot: index + sequences + manifest, engine
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
    scenes/PlayScene.ts       level assembly, loop, pause, completion
    systems/graveyard.ts      pure clamp + rank helpers
    app.ts                    menu graph + scene navigation + campaign
    menus/                    Title / LevelSelect / Options / Sequence (DOM)
    storage/                  index + tiers, drafts, sequences, settings
    ui/                       Hud, mode helpers, F3 debug overlay
  editor/
    history.ts                snapshot undo/redo stack
    ops.ts                    immutable level-document operations
    EditorUi.ts               DOM toolbar / palette / status bar
    EditorScene.ts            painting, pan/zoom, save/load, drafts, test-play
  util/slug.ts
public/
  levels/index.json           registry of shipped levels (+ tier)
  levels/sequences.json       the main campaign order
  levels/*.json               authored levels
  assets/manifest.json        placeholder tile manifest
plugins/devLevels.ts          dev-only write-back (levels + sequences)
scripts/smoke.mjs             headless Firefox end-to-end smoke test
tests/                        headless vitest suite
```

### Key decisions

- **Excalibur's built-in Arcade solver**, not the Realistic (matter.js) solver.
  Arcade is Excalibur's simple AABB solver, designed for platforming. It runs on
  the engine's **variable timestep** (smoother on high-refresh displays); a fixed
  step is opt-in via `PHYSICS.fixedFps`.
- **Pure movement decisions.** Gravity, acceleration, variable-height jump,
  coyote time and jump buffering live in `PlayerController`, which has no
  Excalibur imports and is replayed deterministically in tests. The engine only
  resolves collisions.
- **Collision owner pattern.** Actor collision events carry the geometry
  `Collider`, not the actor — pickups test `event.other.owner instanceof Memory`.
- **Deterministic ground probe.** Arcade does not report a resting ground contact
  on every step, so the player also probes the level's collision grid directly.
  A short event latch bridges gaps; coyote time keeps jumps forgiving.
- **One-way platforms via collision groups.** Arcade has no native one-way
  platforms, so the player swaps to a group that ignores one-way planks while
  rising or while dropping through (`S` + `Space`).
- **Levels and art are data.** A level is versioned JSON; a manifest maps tile
  ids to collision behaviour and (eventually) real art. See `docs/LEVELS.md`.
- **Dev Made vs community, and one campaign.** Levels are tagged `dev` or
  `community`; a shipped `sequences.json` orders the dev levels into the main
  campaign that **Play** runs.
- **DOM menus, gated editor.** Title / level select / options / sequence / pause
  are HTML overlays over the canvas. The editor ships in the bundle but is only
  revealed from the title in dev builds (and via `?editor`).
- **`F3` debug overlay** shows FPS, frame time, velocity and grounded state.
- **DOM HUD over engine text** keeps labels crisp at any resolution.

## Level format

A level is a small JSON document (`public/levels/*.json`): a grid of tile ids
per layer plus a list of entities (`spawn`, `memory`, `exit`, ...). Collision
comes from each tile's definition in the manifest, not from the level, so
painting a tile automatically gives it the right physics. Full details are in
[`docs/LEVELS.md`](docs/LEVELS.md).

## Menus & flow

```
Boot ─► Title ─► Play campaign ─► Level 1 ─► Level 2 ─► …
             ├► Level select ─► Courses / Community / My levels / Play campaign
             ├► Options
             └► Edit campaign (dev)   Level editor (dev)
Play:  Esc ─► Pause  (Resume / Restart / Level select / Title)
```

The title's **Play campaign** runs the shipped **main campaign** — the ordered
list of **Dev Made** levels from `public/levels/sequences.json`. Completing a
level (all memories + exit) shows *level complete* and advances; the last level
returns to Level select.

**Level select** is split into **Courses** (dev-made), **Community**, and
**My levels** (browser drafts), with a **Play campaign** button when a campaign
exists. In dev builds each course/draft also has an **edit** action.

In dev builds the title additionally shows **Edit campaign** (drag levels into
order and save to project) and **Level editor**.

## Level editor

The editor is a development tool — open it from the title (dev builds) or go
straight to it with `?editor`:

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

The toolbar has the tools, **New**, **Export**, **Import**, the **Dev Made**
tier toggle, **Save draft**, **Save to project**, **Test play** and **Menu**.
The left panel lists your **My drafts**. Editing operates on immutable
snapshots, so undo/redo is exact.

## Levels: tiers, drafts & shipping

| Kind | Lives in | Shows up in |
| --- | --- | --- |
| **Dev Made** | `index.json` (`tier: "dev"`) | Play campaign + Level select → Courses |
| **Community** | `index.json` (`tier: "community"`) | Level select → Community |
| **Draft** | `localStorage` | Level select → My levels |

**Save to project** (dev only) POSTs to the `devLevels` Vite plugin, which writes
`public/levels/<id>.json`, records the tier in `index.json`, and (from the
sequence screen) writes `sequences.json`. A production build still edits and
exports/imports files, but has no server to write to.

The **campaign** is a `sequences.json` entry:

```jsonc
{ "version": 1, "sequences": [ { "id": "main", "name": "Main Campaign", "levels": ["test-course", "first-test"] } ] }
```

## Testing

- `pnpm test` — pure logic, level/manifest formats, tiers and sequences in Vitest.
- `pnpm smoke` — boots the real app in headless Firefox via WebDriver and checks
  that the scene builds, the character moves and jumps, and a memory is
  collected. Requires a running server (`pnpm dev`) and `geckodriver --port 4444`.

Press **`F3`** in-game for the debug overlay (FPS, frame time, velocity).

## Roadmap

- [x] **M1 — Platformer core:** Arcade physics, player controller, camera,
  one-way planks, test course.
- [x] **M2 — Level pipeline:** JSON level schema, asset manifest, placeholder
  tiles, `LevelLoader`.
- [x] **M3 — Level designer:** in-browser editor (paint tiles, place entities,
  undo/redo, save/load, test-play).
- [x] **M4 — Title screen & general UI:** Boot → Title → Level select → Play →
  Pause → Options, level registry, drafts library, dev write-back.
- [x] **M4.5 — Polish & authoring:** collectable/exit collision fix, variable
  timestep + `F3` overlay, Dev Made / community tiers, main campaign sequences.
- [ ] **M5 — Asset integration:** drop real tilesets into the manifest
  *(pinned until assets are ready)*.
