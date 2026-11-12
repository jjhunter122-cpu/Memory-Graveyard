# Assets

`manifest.json` maps act tile ids to collision behaviour and art.

## Folders

```text
pixel-platformer-world/  moss tiles, forest backgrounds, hero frames, licence
audio/                   music, ambience, footsteps and licence
enemies/                 placeholder Guardian monster sheets, licence pending
analog-fx/               LESED Vignette overlay + licence
ui/                      coin, bolt and licence notices
```

## Rules

- Do not ship anything without a verified licence.
- Record every shipped asset in `CREDITS.md`.
- Tiles target the 32px grid; see `docs/ASSETS.md` for the full spec.
- The loader falls back to a tile's placeholder `color` when no image is set.
