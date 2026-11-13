# Playtest report

> Historical note: these sessions predate the monster swap. The pursuer is now
> the **Shade** (Dark Fantasy Monster Pack 2 by zneeke); any "Guardian" below
> refers to its earlier placeholder.

Two developer playtest sessions were run on the final direction, plus a review
of the week's iteration. Both sessions used the real browser build (`pnpm dev`)
at `127.0.0.1:5173` and checked the run, HUD and menus.

## Session 1 — first endless-run build

**When:** 2026-11-11, after the endless-act, pit and Guardian work landed.  
**Build:** endless forest acts, trail-following Guardian, first stamina pickups,
no coin score yet.  
**Goal:** check that the auto-run loop was readable and that failure states were
correct.

What was tried:

- Started a run and played several attempts without using debug tools.
- Jumped the first pits, let the Guardian catch up, and deliberately ran into
  pits.
- Collected the green stamina pickups and watched the bar.
- Tested the title, options and credits screens.

What we found:

- The run read well: the player auto-runs, the next gap is visible early, and
  the Guardian behind the player creates pressure without blocking the view.
- **Pit edges were unreliable.** If only the front of the player left the floor,
  the body could catch on the pit wall. Some falls ended with the Guardian
  catching the player instead of `YOU FELL`.
- **Stamina pickups were the weak link.** They were flat green squares, could
  behave like solid objects in some frames, and did not read as collectables.
- The run had no coin/score identity yet, so the only feedback was distance and
  survival.
- Menu transitions were one-way: entering Options or Credits slid the preview
  camera, but returning popped straight back.

Changes made from this session:

- Changed pit detection to use the player's centre **and front edge**, and drop
  the player as soon as the front edge leaves the floor.
- Made stamina pickups sensor-only so they can never block a jump.
- Replaced the memory orb with the silver coin and added score plus a persistent
  best score.
- Added the reverse camera slide for Options and Credits.
- Made the healthy stamina bar green and kept amber/red for low stamina.

## Session 2 — final pickup and cleanup pass

**When:** 2026-11-12, after the coin, bolt, HUD and cleanup changes.  
**Build:** final endless run; old editor/campaign build already archived.  
**Goal:** verify the final flow end to end and catch regressions from the
cleanup.

What was tried:

- Fresh load to the title, then Play.
- Checked the run actors and HUD: 27 coins and 8 bolts active near the start.
- Collected a bolt and confirmed stamina refill.
- Forced a pit death and used Retry / Back to Home Menu.
- Opened Options, changed the music slider, and returned to the title.
- Opened Credits and checked the asset list.
- Ran the automated suite, typecheck and production build.

What we found:

- The coin and bolt pickups were both rendering as sprites, not placeholder
  squares.
- Stamina started at 97% and a bolt refill moved it from 50 to 74.
- The score HUD updated from distance and coins; the best score persisted.
- A forced pit fall showed `YOU FELL` with Retry and Back to Home Menu.
- Options showed exactly three sliders and no retired Show HUD or draft
  controls.
- Credits showed the coin, bolt, Guardian and footsteps entries, with no Grunge
  or TEMP text.
- No console errors on the title, run, death, options or credits screens.

Changes made from this session:

- Replaced the temporary green stamina square with the CC0 green bolt sprite
  and the same bob used by coins.
- Added the coin and bolt icons to the score HUD and stamina bar.
- Removed the old editor, campaign, level select, sequences, drafts and authored
  levels from the final tree.
- Moved the old system into `archive/old-system/` and tagged it
  `archive/old-system-2026-11-12`.
- Removed TEMP, Grunge, DRYFIT and unused Pixel/LESED art from the final build.
- Simplified the loader, schema, manifest and scenery to the moss tiles and the
  six forest layers.

## How iteration improved the game over the week

| Date | Build state | What changed |
| --- | --- | --- |
| **Nov 6** | Excalibur scaffold, platformer core, editor, campaign, chase identity | Established movement, level format, editor, title flow and the trail-following monster |
| **Nov 7** | Audio and Art/identity pass | Added title music, footsteps, camera/audio settings, Dry-fit art tests and editor shortcuts |
| **Nov 8** | Pixel Platformer World and Vignette | Promoted the Pixel pack, forest backgrounds and Vignette; added playable areas, camera presets and the Grunge test import |
| **Nov 11** | Endless direction begins | Rebuilt the title as a forest stage, added the auto-run movement lab, procedural acts, pits, the Guardian placeholder, stamina and ambience |
| **Nov 12** | Final endless runner | Added coin score and high score, raised/floating platforms, menu previews, Pixel hero animations, bolt pickups, the green stamina bar, pit-edge fix and the full archive cleanup |
| **Nov 13** | Submission pass | Final credits, design document, playtest report, README screenshot and repository check |

The measurable result:

- The first endless build had one temporary pickup type and no score identity.
  The final build has coins, stamina bolts, score, best score, stamina drain,
  pit falls, Guardian catches and Retry/Home.
- The pre-cleanup suite had 171 tests across both directions. The final suite
  keeps **81 tests across 16 files** focused on the shipped direction, all
  passing.
- The production build is **49 modules**, about **525 kB JS / 6.9 kB CSS**, and
  boots straight to the title screen.
- The final tree is about 11.5 MB of assets, down from roughly 16.4 MB before
  TEMP, Grunge, DRYFIT and unused Pixel/LESED art were removed.

## Remaining issues

- Online leaderboard is not implemented.
- The Guardian and footsteps are now credited, but they remain third-party
  placeholder-quality assets.
- The run uses axis-aligned moss tiles only; slopes are not implemented.

## Workflow note

The project was originally structured as a two-member workflow. The second
member became unreachable before the final week and did not create a fork, open
pull requests or provide reviews. The final direction, cleanup, documentation
and verification were completed solo on the `new-direction` branch and merged
into `main` for submission. The repository keeps the full commit history and the
archived old system so the iteration is still visible.
