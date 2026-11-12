# Old system snapshot

This is the previous Memory Graveyard build: a level-based chase platformer with
an in-browser editor and a campaign of authored levels.

It was copied out of the working tree on 2026-11-12, before the final direction
replaced it with the endless forest run. The exact commit is tagged
`archive/old-system-2026-11-12` (`9875944`).

## What is here

| Path | What it was |
| --- | --- |
| `src/editor/` | Paint/entity editor, toolbar, undo history, immutable level ops |
| `src/game/scenes/PlayScene.ts` | Old chase loop: spawn, exit, memories, pause, death |
| `src/game/menus/LevelSelectScene.ts` | Courses / Community / My levels browser |
| `src/game/menus/SequenceScene.ts` | Campaign ordering screen |
| `src/game/storage/levels.ts` | Level index, drafts, sequences and campaign loading |
| `src/game/actors/Memory.ts`, `Exit.ts` | Collectable orb and level exit |
| `src/game/systems/graveyard.ts` | Pure clamp helper |
| `src/game/ui/DebugOverlay.ts` | F3 debug readout |
| `src/game/camera/cameraZoom.ts` | Editor camera zoom presets |
| `src/game/level/sizes.ts` | Editor size presets |
| `src/game/util/slug.ts` | Level id slugs |
| `public/levels/` | Nine authored levels, index and campaign sequence |
| `tests/` | Tests for the editor, levels, drafts and sequences |
| `docs/LEVELS.md` | Old level-format documentation |
| `docs/DESIGN.md` | Day-one design document |
| `docs/README-old.md` | Old README |
| `docs/ASSETS-old.md` | Old asset guide |
| `plugins/devLevels.ts` | Dev-only level write-back Vite plugin |
| `scripts/smoke.mjs` | Old headless Firefox smoke test |

## Running the old build

The snapshot is read-only and imports paths that no longer exist in `src/`.
To actually run it, check out the tag:

```bash
git checkout archive/old-system-2026-11-12
pnpm install
pnpm dev
```

Return to the final product with `git checkout new-direction`.

## Removed assets

TEMP, Grunge, DRYFIT, unused Pixel room/tile art and unused character frames
were deleted from the final tree. See [`assets-removed.md`](assets-removed.md)
for the exact paths and how to recover them from the tag.
