# Asset guide

Rules and targets for bringing art, audio and voice into Memory Graveyard.

## Current state

- **Pixel Platformer World** is the shipped art set in
  `public/assets/pixel-platformer-world/`. The run uses only the two moss tiles,
  the six forest backgrounds and the player idle/run/jump/landing/death frames.
- Tiles use a 32px grid: the 16px moss art is scaled 2× into each cell.
- The player uses the Pixel Platformer World character. The monster is the
  **Shade**, drawn from Monster 1 of **Dark Fantasy Monster Pack 2** by zneeke,
  a free sheet cleared for commercial use and modification.
- The LESED **Vignette** is the only screen effect and lives in
  `public/assets/analog-fx/`. Its custom licence is recorded in `CREDITS.md`.
- The Shade's 48×48 silhouette sheet lives in
  `public/assets/enemies/dark-fantasy-monster-2/`. It may be used in this
  project but not resold or redistributed on its own; see
  `licenses/Dark-Fantasy-Monster-Pack-2.txt`.
- Grass footsteps, soft landings and metal monster footsteps from The Sound
  Guild are wired to movement. The pack is CC0 1.0, confirmed by the author in
  the pack's public comments.
- The title screen loops `public/assets/audio/music/8-bit-haunting.mp3`.
- The Spooky Forest Ambience loops during the run. It is CC BY 3.0, credited to
  marchon11 in `CREDITS.md`.
- The score pickup and score icon use the CC0 silver coin from `CC0 Currency
  Icons` (AntumDeluge / OpenClipart). The stamina pickups and HUD use the CC0
  green bolt from pix3lcat. Both are CC0 1.0 and credited in `CREDITS.md`.
- The old editor-only packs (TEMP, Grunge, DRYFIT), extra room backgrounds and
  unused character frames were removed from the final tree. They remain
  recoverable from the `archive/old-system-2026-11-12` tag.

## Visual direction

- **Pixel art** for tiles, characters, props and UI.
- **Side-view 2D platformer**, not top-down.
- **32×32 px** native tiles. 16×16 packs are acceptable when scaled 2×.
- Muted, limited palette; readable silhouettes at small size.
- Analog-horror mood comes from presentation — vignette, grain, flicker and
  sound — not from noisy art.

## Target sizes

| Asset | Target |
| --- | --- |
| Tile | 32×32 |
| Player frame | around 32×48 |
| Monster frame | 48×48 (Shade sheet), scaled up in game |
| Pickup | 16–32 px, readable in one colour |

Sprite sheets should use consistent frame sizes and transparent PNGs. Player
and monster are side-view and may be flipped horizontally.

## Current kit

- **Tiles:** moss grass top and fill.
- **Backgrounds:** six forest layers.
- **Characters:** player idle / run / jump / landing / death.
- **Monster (Shade):** idle / walk / attack / death frames from Monster 1 of
  Dark Fantasy Monster Pack 2, scaled 4.5×.
- **Pickups:** silver coin and green bolt.
- **UI:** DOM text, coin/bolt icons, Vignette overlay.

## Licence policy

Preferred order:

1. **CC0 1.0** — preferred.
2. **CC-BY 4.0 / 3.0** — acceptable with clear attribution.
3. **CC-BY-SA** — only if the pack is exceptional; share-alike adds obligations.
4. **NC / ND / unclear / ripped / uncredited** — reject.

### Recorded exceptions

- **LESED Analog Horror Screen FX — Free Sampler** is a custom licence, not
  CC0/CC-BY. It permits use in games and modification, with credit recorded in
  `CREDITS.md`. The overlay files may not be redistributed on their own, so
  revisit this exception if the repository is made public.
- **Dark Fantasy Monster Pack 2** and **The Sound Guild Footsteps Volume 02**
  are credited third-party assets. The monster pack permits commercial use and
  modification but may not be resold, repackaged or redistributed on its own
  (including modified), used to train AI, or used in crypto/NFT/p2e/meta
  projects. The footsteps pack is CC0 1.0. Keep the credit lines and do not
  redistribute the raw packs on their own.

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
2. Verify author, licence, terms and whether the pack is side-view.
3. Download candidates outside the repo.
4. Inspect PNG dimensions, transparency, frame grid, palette and file sizes.
5. Approve one pack, then import it into `public/assets/` with a credits entry.
6. Do a one-screen style test before committing to the whole art direction.

## Import layout

```text
public/assets/
  manifest.json                    the two used moss tiles
  pixel-platformer-world/
    tiles/                         moss top + fill
    Background/                    forest layers 1–6
    Character/Sprite/              hero frames
    LICENSE.txt
  enemies/dark-fantasy-monster-2/   the Shade sheet + licence notice
  audio/                           music, ambience, footsteps
  analog-fx/                       LESED vignette
  ui/                              coin, bolt, licence notices
```

The manifest maps tile ids to `image`. A tile falls back to its placeholder
`color` if no image is available.
