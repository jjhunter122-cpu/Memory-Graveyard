# Assets removed from the final build

These paths were deleted from the final tree. They are recoverable from the
`archive/old-system-2026-11-12` tag.

## Unlicensed or old test packs

| Path | Reason |
| --- | --- |
| `public/assets/TEMP/` | Unlicensed teammate stand-ins; never shipped |
| `public/assets/grunge/` | Old editor test import; unused by the run |
| `public/assets/DRYFIT/` | Old LESED pack copy; unused |

## Unused Pixel Platformer World art

| Path | Reason |
| --- | --- |
| `pixel-platformer-world/Anim/` | Torch and diamond animations, unused |
| `pixel-platformer-world/rooms/` | Nine room backgrounds, unused |
| `pixel-platformer-world/main_lev_buildA.png`, `main_lev_buildB.png` | Source sheets, unused at runtime |
| `pixel-platformer-world/room-test.png` | Test image, unused |
| `pixel-platformer-world/tiles/*` except `palette-moss-grass-top.png` and `palette-moss-grass-fill.png` | Other palettes, slopes, props and trim tiles |
| `pixel-platformer-world/Character/Sprite/attack-*.png` | Attack frames, unused by the run |

## Unused LESED overlays

Only the vignette remains:

```text
public/assets/analog-fx/LESED_Analog_Horror_Screen_FX_Free/overlays/vignette/640x360/vignette_000.png
```

The other overlays and resolutions were not used by the final build.

## Recover a path

```bash
git show archive/old-system-2026-11-12:public/assets/TEMP/wallpaper_color.png > wallpaper_color.png
```

Or check out the whole old tree:

```bash
git checkout archive/old-system-2026-11-12
```
