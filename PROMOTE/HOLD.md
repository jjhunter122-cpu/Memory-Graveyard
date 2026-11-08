# Dryfit-only hold list

These are deliberately not part of the camera promotion patch.

## Visual / FX

- Scanlines
- Static / grain
- Combined Vignette + Scanlines + Static
- REC HUD — removed from the dryfit options entirely
- LESED analog assets in main — custom licence, no policy exception made yet

## Environment

- Castlevania tiles and backgrounds
- Woods backgrounds
- Grunge / liminal CC0 tileset — still a future candidate, not integrated
- GothicVania props, gravestones, trees and statues
- Pixel Platformer World (Szadi art) — dryfit test level only, not promoted

## Mechanics

- Half-block collision and topper tiles
- Grass-edge ramps and smooth slope snapping
- Skeleton pursuer, rise and walk animations
- Per-level `analogFx` dropdown (the main game currently only needs the camera
  and the pinned Vignette decision)

## Why

These features are still being evaluated in the dryfit branch. Promoting them
before the tile-set and FX direction is settled would make main harder to
revert. The camera POV is independent and safe to stage separately.
