# Archive

This folder preserves the previous direction of Memory Graveyard so the change
of course can be compared side by side.

- [`old-system/`](old-system/) — the editor, campaign, level select, sequences,
  authored levels and old chase scene, copied before they were removed from the
  final build.
- The same state is tagged in git as `archive/old-system-2026-11-12`
  (commit `9875944`).

The final product is the endless forest run that now lives in `src/`:

| Old system | Final direction |
| --- | --- |
| Top-down/level-based chase | Endless auto-run through procedural forest acts |
| Editor + campaign + level select | Title / Options / Credits / Run |
| Authored `public/levels/*.json` | Seeded acts built by `run/generator.ts` |
| Memory orbs and exit tiles | Coins and stamina bolts |
| Placeholder rectangles | Pixel Platformer World hero and moss forest |
| TEMP / Grunge / DRYFIT test art | Used Pixel pack only |

Nothing in `archive/` is compiled, bundled, typechecked or served. It is a
read-only snapshot; the old build is runnable by checking out the tag.
