# Asset guide

Rules and targets for bringing art, audio and voice into Memory Graveyard.

## Current state

- **Pixel Platformer World** is imported in `public/assets/pixel-platformer-world/`
  and is the current tile and background set.
- **Grunge** is imported in `public/assets/grunge/` as a test set and corridor
  background.
- New levels use a 32px grid with 16px Pixel art scaled into each cell.
- `public/assets/TEMP/` still contains **unlicensed** stand-ins gated by
  `TEMP_ASSETS` in `src/game/assets.ts`. They must not ship.
- Player and monster visuals are still placeholder rectangles; the Pixel
  character sprites are imported but not wired yet.
- The LESED Vignette is in `public/assets/analog-fx/` and is the default
  screen effect for new levels. Its custom licence is recorded in `CREDITS.md`.
- The Old Guardian sprite strips in `public/assets/enemies/old-guardian/` are a
  **placeholder monster** with licence pending approval.
- Grass footstep, soft landing and metal monster footsteps from The Sound Guild
  are in `public/assets/audio/` and are wired to movement and landing.

## Visual direction

- **Pixel art** for tiles, characters, props and UI.
- **Side-view 2D platformer**, not top-down.
- **32×32 px** native tiles. 16×16 packs are acceptable only if scaled 2×.
- Muted, limited palette; readable silhouettes at small size.
- Analog-horror mood comes from presentation — scanlines, grain, vignette,
  flicker and sound — not from noisy art.

## Target sizes

| Asset | Target |
| --- | --- |
| Tile | 32×32 |
| Player frame | around 32×48 |
| Monster frame | around 48×64 |
| Props | tile-aligned where possible |

Sprite sheets should use consistent frame sizes and transparent PNGs. Player
and monster are side-view and may be flipped horizontally.

## Required first kit

- **Tiles:** floor, wall, ceiling, carpet, platform edges, trim.
- **Slopes:** 45° one-tile triangle and a 2-tile-wide gentle ramp, both
  directions. These need custom collision support before import.
- **Props:** door, exit sign, locker, desk, chair, vent, light fixture, boxes.
- **Characters:** player idle / walk / run / jump / fall; sprint and slide are
  optional.
- **Monster:** idle / walk / run / catch; search is optional.
- **Later:** hide-spot props and monster search animation.

## Licence policy

Preferred order:

1. **CC0 1.0** — preferred.
2. **CC-BY 4.0 / 3.0** — acceptable with clear attribution.
3. **CC-BY-SA** — only if the pack is exceptional; share-alike adds obligations.
4. **NC / ND / unclear / ripped / uncredited** — reject.

### Recorded exceptions

- **LESED Analog Horror Screen FX — Free Sampler** is a custom licence, not
  CC0/CC-BY. It is allowed for this project because it explicitly permits use
  in games and modification, with credit recorded in `CREDITS.md`. The overlay
  files may not be redistributed on their own, so revisit this exception if the
  repository is ever made public.

Every shipped asset needs an entry in `CREDITS.md` with:

- title
- author
- licence and version
- source URL
- intended use
- modifications
- date added

Keep licence texts in `licenses/`. Keep the original pack's licence file when
one is included.

## Candidate review workflow

1. Send the **asset-page URL** first, not only a preview image.
2. We verify author, licence, terms and whether the pack is side-view.
3. Download the pack into `ASSETS HERE/candidates/<pack-name>/` — outside the
   repo.
4. We inspect PNG dimensions, transparency, frame grid, palette and file sizes.
5. Approve one pack, then import it into `public/assets/` with a credits entry.
6. Do a one-screen style test before committing to the whole art direction.

## Import layout

```text
public/assets/
  manifest.json
  tiles/
  props/
  characters/
  ui/
  TEMP/          unlicensed stand-ins, never ship
```

The manifest maps tile ids to `image` and optional `source` rectangles. A tile
can fall back to its placeholder `color` if no image is available.

## TEMP policy

Anything without a verified licence goes in `public/assets/TEMP/` and stays
behind `TEMP_ASSETS`. Do not mix TEMP assets into permanent folders, even
temporarily.
