# Vignette — pinned main feature

The Vignette is a desired main-game feature. It is intentionally **pinned**:
no main implementation, asset or patch has been created yet.

## Current dryfit behaviour

- Per-level `Analog FX` dropdown in the editor.
- Default for the dryfit level is `vignette`.
- Options:
  - None
  - Vignette
  - Scanlines
  - Static / grain
  - Combined (vignette + scanlines + static)
- The editor stores the setting but does **not** preview it.
- The overlay is only rendered in the played level.
- The REC HUD has been removed.
- The LESED assets are local-only and not committed.

## Pinned decisions

### Licence path

The LESED Analog Horror Screen FX sampler is custom-licensed, not CC0/CC-BY.
Under the current main-project policy it should not go into main without a
deliberate exception.

Options to decide later:

1. Generate an original pixel-stepped vignette asset we own.
2. Use a CC0 or CC-BY 4.0 vignette.
3. Implement the Vignette as original CSS/code only.
4. Make an explicit policy exception for LESED.

Recommendation for the eventual main pass: generate an original stepped
vignette so the look is preserved without a custom-licence dependency.

### Behaviour

Options to decide on main:

1. Always-on.
2. Options toggle, on by default.
3. Per-level default only.

The dryfit per-level dropdown is a test harness, not necessarily the main-game
design.

## What not to do yet

- Do not commit the LESED overlay files to main.
- Do not add a main Vignette patch until the licence path and behaviour are
  chosen.
- Do not promote Scanlines, Static or Combined as part of the camera patch.
  Those remain on the hold list.
