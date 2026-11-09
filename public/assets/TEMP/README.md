# TEMP assets — do not ship

These files are **temporary development stand-ins only**.

They were supplied without author credits or a licence that permits release, so
they must be replaced (or removed) before the game is published.

| File | Used as |
| --- | --- |
| `wallpaper_color.png` | level backdrop |
| `softblurwhite.png` | `stone` tile (id `1`) texture |

## How to remove them

1. Delete this `TEMP` folder.
2. Set `TEMP_ASSETS` to `false` in `src/game/assets.ts`.

That is enough: tile images are ignored and the game falls back to the original
placeholder colours and flat fog backdrop. The `image` entry on tile `1` in
`public/assets/manifest.json` can stay for a future licensed tileset, or be
removed with it.
