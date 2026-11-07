# Known issues

Small quirks we are deliberately leaving for later.

## Wall-top corner clip

Holding a direction into a solid wall while jumping can occasionally resolve the
player onto the wall's top edge, even when the wall is too tall to jump. Movement
through the wall is still blocked; the player simply lands on top of it.

Likely cause: Arcade AABB corner resolution choosing the vertical axis when the
player is pressed against a tile corner.

Status: **documented only**. A fix needs a reproducible test case and should not
destabilise normal jumping or ground detection.

## Memory fragments stay collected after retry

Repro:

1. Play a level with memory fragments.
2. Collect one.
3. Die, then choose Retry.

Actual: the HUD counter resets, but the collected fragment does not return.

Expected: every fragment returns on retry/restart.

Likely cause: `Memory.kill()` / `unkill()` not restoring the actor or its
collision state, or the restart order not resetting fragments correctly.

Status: **documented; fix pending** while fragments remain optional.

## Stacked one-way platforms trap the player

Repro:

1. Place two plank/one-way platforms one tile apart vertically.
2. Walk or jump into the narrow space between them.

Actual: the player jitters or catches between the two platforms instead of
standing cleanly on the lower one or passing through the gap. The monster's
trail can also bunch up, making it appear to slow down.

Expected: the player can stand on the lower platform or move through the gap
without colliding repeatedly.

Likely cause: the one-way collision slab and the player's rising/falling group
swap create an unresolved overlap in a gap that is too tight for the player
body. The trail records the jitter, which slows the follower.

Status: **documented; fix pending**.

## One-way platform top-edge snap

Repro:

1. Jump into a plank/platform so the player barely clips its top edge.
2. Keep moving into the edge.

Actual: the player snaps up onto the platform surface instead of being blocked
or falling past it.

Expected: the player either lands normally from above or is stopped by the edge;
no free teleport onto the platform.

Likely cause: Arcade AABB corner resolution choosing the vertical axis when the
player's feet overlap the platform's top edge by a few pixels. This is closely
related to the wall-top corner clip.

Status: **documented; fix pending**.

## Slopes are not implemented

The manifest and editor only support axis-aligned collision. Sloped tiles need a
custom surface resolver or stepped colliders; see `docs/ASSETS.md` for asset
requirements.
