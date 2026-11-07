# Assets

`manifest.json` maps level tile ids to collision behaviour and art.

## Folders

```text
TEMP/        unlicensed stand-ins; gated by TEMP_ASSETS; must not ship
tiles/       permanent tile art (planned)
props/       permanent props and hide-spot art (planned)
characters/  player and monster sheets (planned)
ui/          permanent interface art (planned)
```

## Rules

- Do not ship anything without a verified licence.
- Record every permanent asset in `CREDITS.md`.
- Keep unlicensed work in `TEMP/` only.
- Tiles target the 32px grid; see `docs/ASSETS.md` for the full spec.
- The loader falls back to a tile's placeholder `color` when no image is set.
