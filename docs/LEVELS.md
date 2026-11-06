# Level & asset formats

Memory Graveyard keeps **level layout** and **art/collision** separate:

- a **level** (`public/levels/*.json`) is a grid of tile ids plus entities;
- a **manifest** (`public/assets/manifest.json`) maps each tile id to its
  collision behaviour and its look.

That split means painting a tile in the editor gives it physics automatically,
and swapping placeholder colours for real tilesets is a manifest-only change.

## Level JSON (version 1)

```jsonc
{
  "version": 1,
  "name": "Test Course",
  "tileSize": 32,
  "width": 40,
  "height": 18,
  "layers": [
    {
      "name": "terrain",
      "collide": true,          // tiles here contribute collision bodies
      "data": [ /* width * height ids, row-major, -1 = empty */ ]
    }
  ],
  "entities": [
    { "type": "spawn",  "x": 3,  "y": 14 },
    { "type": "memory", "x": 10, "y": 11 },
    { "type": "exit",   "x": 38, "y": 14 }
  ]
}
```

- `data` is row-major and must contain exactly `width * height` entries.
- `-1` (`EMPTY_TILE`) means "nothing here".
- Entity `x`/`y` are **tile coordinates**. Known types: `spawn`, `memory`,
  `exit`. Unknown types are ignored, so newer levels still load in older builds.
- Coordinates are in **tiles**, not pixels. Rendering multiplies by `tileSize`.

Levels are validated on load (`src/game/level/schema.ts`). A bad level throws a
`LevelValidationError` rather than starting a broken scene.

## Asset manifest (version 1)

```jsonc
{
  "version": 1,
  "tileSize": 32,
  "tilesets": [
    {
      "name": "placeholder",
      "tiles": [
        {
          "id": 1,
          "name": "stone",
          "collision": "solid",   // "none" | "solid" | "oneway"
          "color": "#2a2f45",     // placeholder fill colour
          "cap": "#3b4162"        // optional lighter top edge
        },
        {
          "id": 2,
          "name": "plank",
          "collision": "oneway",
          "color": "#8a754e"
        }
      ]
    }
  ]
}
```

- Tile **ids must be unique** across every tileset.
- `collision`:
  - `solid` — immovable block, collides on all sides.
  - `oneway` — thin plank you can jump through from below and drop through with
    `S` + `Space`.
  - `none` — decoration only.
- `color` (and optional `cap`) drive the procedural placeholder art.

### Adding real art later

Fill in `image` (a path relative to the manifest) and an optional `source`
rectangle. The loader already understands both fields, so the level files and
tile ids do not change:

```jsonc
{
  "id": 1,
  "name": "stone",
  "collision": "solid",
  "color": "#2a2f45",
  "image": "tiles/stone.png",
  "source": { "x": 0, "y": 0, "width": 32, "height": 32 }
}
```

## Adding a level

1. Create `public/levels/my-level.json` following the schema above.
2. Point the boot code in `src/main.ts` at the new file, or (from M3 onward)
   pick it in the level-select menu.
3. Run `pnpm test` — the schema and layout tests will catch malformed levels.
4. Run `pnpm smoke` with `pnpm dev` to confirm it plays.
