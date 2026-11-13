# Known issues

Small quirks and open decisions we are deliberately leaving for later.

## Third-party placeholder assets

The **Old Guardian** monster and **The Sound Guild Footsteps Volume 02** are
credited placeholder assets. Old Guardian is free for personal and commercial
use from Eddie's Workshop; the footsteps pack is CC0 1.0, confirmed by the
author in the pack's public comments.

Status: **licences resolved**. Both are credited in `CREDITS.md`. They remain
placeholder-quality art/audio and can be replaced later without code changes.

## Leaderboard is deferred

Only the local high score is stored. There is no online leaderboard or score
submission.

Status: **out of scope for this submission**.

## No slopes

The manifest still describes generic tile collision, but the run only uses
axis-aligned moss tiles. Sloped surfaces are not implemented and are not needed
by the endless acts.

Status: **documented only**.

## Occasional wall-top corner clip

Holding into a solid wall while jumping can occasionally resolve the player onto
the wall's top edge. Movement through the wall stays blocked.

Likely cause: Arcade AABB corner resolution choosing the vertical axis at a tile
corner.

Status: **documented only**. The endless run has no vertical wall faces to catch
on, so this is low priority.

## Audio unlock needs a gesture

Browsers require a real pointer or key gesture before WebAudio starts. The game
unlocks audio on the first click or key press.

Status: **expected browser behaviour**.
