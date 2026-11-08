# PROMOTE — dryfit → main staging area

This folder is for changes we intend to send from the dryfit branch to the main
local repo. Nothing here changes `develop` automatically.

## Ready to promote

### Camera POV

- Patch: `patches/0001-camera-pov.patch`
- Clean reference file: `camera/CameraFollow.ts`
- Status: ready pending the past-level playtest checklist in `camera/README.md`
- What it does:
  - gameplay camera zoom `1.35`
  - visible world about `711 × 400` (`22 × 12.5` tiles)
  - deadzone `24 × 18`
  - follow lerp `5`
  - snaps to the player on start and respawn
  - no level-bound clamp, so the player stays centered at the edges
- Files touched:
  - `src/game/config.ts`
  - `src/game/camera/CameraFollow.ts`
  - `src/game/scenes/PlayScene.ts`

Apply it to main with:

```powershell
git -C "C:\Users\alpha\OneDrive\Documents\BEAN\Git\Memory-Graveyard" apply --ignore-whitespace "C:\Users\alpha\OneDrive\Documents\BEAN\Git\Memory-Graveyard-dryfit\PROMOTE\patches\0001-camera-pov.patch"
```

Then run:

```powershell
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

`--ignore-whitespace` is needed because the main worktree uses CRLF while the
patch was generated from LF. The patch itself is camera-only and does not touch
any dryfit tile, skeleton, ramps or analog FX assets.

## Pinned

### Vignette

The Vignette is a desired main feature, but its licence and behaviour are still
pinned. See `vignette/README.md`.

## Hold

Everything that should remain dryfit-only for now is listed in `HOLD.md`.

## Status and licences

- `STATUS.md` — ready / pinned / hold table
- `LICENCES.md` — asset and policy notes
