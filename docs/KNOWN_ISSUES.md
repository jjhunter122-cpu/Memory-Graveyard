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

## Slopes are not implemented

The manifest and editor only support axis-aligned collision. Sloped tiles need a
custom surface resolver or stepped colliders; see `docs/ASSETS.md` for asset
requirements.
