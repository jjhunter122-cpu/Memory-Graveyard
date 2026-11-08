# Camera POV promotion

This is the camera-only promotion from the dryfit branch. It is independent of
the dryfit tiles, skeleton, half blocks, ramps and analog FX.

## What changes

- `src/game/config.ts`
  - adds a `CAMERA` block:
    - `zoom: 1.35`
    - `deadzoneX: 24`
    - `deadzoneY: 18`
    - `followLerp: 5`
- `src/game/camera/CameraFollow.ts`
  - uses the `CAMERA` settings
  - removes the level-bound clamp so the player stays centered at the edges
  - adds `snap(target)` for level start and respawn
- `src/game/scenes/PlayScene.ts`
  - sets `this.camera.zoom = CAMERA.zoom`
  - constructs `new CameraFollow(this)`
  - uses `cameraFollow.snap(this.player.pos)` on initialize and restart

## Apply

From the main worktree on `develop`:

```powershell
git -C "C:\Users\alpha\OneDrive\Documents\BEAN\Git\Memory-Graveyard" apply --ignore-whitespace "C:\Users\alpha\OneDrive\Documents\BEAN\Git\Memory-Graveyard-dryfit\PROMOTE\patches\0001-camera-pov.patch"
```

Then:

```powershell
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

`--ignore-whitespace` is required because the main worktree uses CRLF and the
patch was generated from LF. The patch has been checked against the current
`develop` files with that flag.

If you prefer, apply the patch in a scratch worktree/branch first, play a level,
then merge it into `develop`.

## Playtest checklist

Record any level-specific camera problems here:

- [ ] Test Course
- [ ] Tutorial/longer level test
- [ ] First test
- [ ] Length Test
- [ ] Dry-fit GothicVania

Specific things to watch:

- Does the character stay comfortably inside the clear center of the Vignette?
- Does the camera lag feel right when running and jumping?
- At level edges, is the dark outside-level space distracting?
- Does the 1.35 zoom show enough vertical context for the level design?

## Known trade-off

Removing the level-bound clamp means the camera can show dark space beyond the
level edges. With the Vignette it is largely hidden. If it becomes distracting,
the follow-up is to extend the background/skybox draw area beyond the level
bounds rather than reintroducing the clamp.
