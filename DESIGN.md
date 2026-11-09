# Memory Graveyard — Design Document

**Course / team:** [fill in]  
**Version:** Day 1 working draft  
**Platform:** Browser, desktop  
**Engine:** Excalibur.js / TypeScript / Vite

## 1. Game concept

**Memory Graveyard** is a 2D side-scrolling horror chase-platformer set inside the Backrooms' buried memory — a place that has decayed into a graveyard.

The Backrooms is the source, but the setting is no longer an endless yellow office. It is an overgrown cemetery of forgotten rooms: cracked stone, wet moss, iron gates, mausoleums, collapsed chapels, catacomb shafts and cold night air. The thing following you is one of the place's discarded memories. It does not patrol randomly: it follows the route you have already run, including your jumps, drops and vertical climbs. Your own path becomes the threat.

The player's goal is simple: **reach the exit before the memory catches you.**

There is no combat. The game is about movement, route reading, momentum and the pressure of a pursuer that is always retracing your steps.

### High concept

> A chase-platformer through a graveyard made of the Backrooms' buried memory, where the level remembers your route and something follows it.

### Design pillars

1. **The route is the threat.** The monster follows the trail the player leaves, so every jump and detour matters.
2. **Readable horror.** The game should feel tense, not confusing. The player must always understand where to go next.
3. **Fair pressure.** Deaths should feel earned; retries should be fast.
4. **The graveyard is the memory.** The Backrooms has rotted into a cemetery of forgotten rooms; the title is literal, and its memories are the things left behind.
5. **Optional memory fragments.** Fragments add flavour and discovery, but never block the exit.

### Anti-goals

- No required collectathon.
- No combat system.
- No slow, puzzle-first pacing during a chase.
- No unreadable dark mazes where the player cannot identify the route.

### Visual identity

The visual target is a **run-down graveyard at night**, with the Backrooms surviving as an afterimage rather than the main scenery.

- overgrown cemetery paths, dead grass, roots and rubble
- cracked stone, wet moss, iron fences, gates, urns and mausoleums
- collapsed chapel and catacomb interiors
- candlelight, lanterns, fog and cold moonlight
- occasional liminal interior — a gravekeeper's office, a forgotten waiting room — used as a contrast, not the whole game
- muted, desaturated palette; strong silhouettes for the player and pursuer
- 1-bit or high-contrast pixel art is a strong candidate, but the final palette is still open

**Analog horror is a treatment, not the setting.** Grain, scanlines, flicker, cold colour grading and low-resolution texture can create the eerie recorded feeling. The core mood is loneliness and dread in a graveyard at night, not a literal VHS tape.

## 2. Core rules

- Reach the exit to complete a level.
- The exit is always open.
- Memory fragments are optional.
- The pursuer wakes after a **three-second grace period**.
- The pursuer follows the player's recorded trail.
- Being caught, or falling off the level, ends the run.
- Death shows a retry screen.
- Levels are authored as JSON and can be created in the in-browser editor.

## 3. Game loops

### 3.1 Big loop — the campaign run

```text
Title
  → Level Select / Play Campaign
  → Level start
  → 3-second grace
  → Pursuit begins
  → Platform through the level
  → Reach the exit
  → Next level / return to Level Select
       ↘ Caught or fell
         → Death overlay
         → Retry / Level Select
```

The big loop is the session-level loop: choose a level or campaign, survive one memory, and move on. Progress is measured by levels escaped, not by a score or required pickup count.

### 3.2 Small loop — the moment-to-moment chase

```text
Read the room
  → Choose a route
  → Run / jump / drop through a plank
  → Manage the gap between you and the pursuer
  → Optional: collect a memory fragment
  → Reach the next safe beat
  → Repeat until the exit
```

The small loop is the second-to-second loop. Each room asks the player to read terrain, pick a line, and keep moving before the trail catches up.

### 3.3 Authoring loop — the level editor

```text
Open the editor
  → Choose or create a level
  → Paint tiles / place entities
  → Set size and skybox
  → Test play
  → Win: return to editor
  → Die: You Ded :( → Retry / Save and Exit / Back to Editor
  → Adjust and repeat
```

The editor is part of the course deliverable and a practical content pipeline. Test play is the feedback loop that turns level ideas into playable chases.

## 4. Ten minutes of planned gameplay

This is a first-session estimate. Deaths and retries add time; a confident player will finish faster.

| Time | Beat | What the player is doing | Systems exercised |
|---|---|---|---|
| 0:00–0:30 | Title | Reads the premise, chooses **Play campaign** | Menus, campaign |
| 0:30–2:00 | Tutorial level | Learns `A`/`D`, `Space`/`W`, `S` + `Space`; no monster; reaches exit | Movement, jumping, drop-through, exit |
| 2:00–3:30 | First chase | Learns the 3-second grace, sees the pursuer wake, runs the first cemetery path; likely dies once and retries | Trail monster, threat HUD, death overlay, retry |
| 3:30–5:30 | Vertical chase | Climbs a crypt shaft, drops between burial floors, takes a higher route to avoid the trail; collects an optional fragment | Vertical level reading, one-way platforms, fragments |
| 5:30–7:30 | Longer chase | Chooses between a safe lower path and a faster upper route through the ruins; the pursuer rubber-bands when the gap grows | Route choice, momentum, catch-up tuning |
| 7:30–9:30 | Finale | Long final dash through the cemetery gate with narrow platforms and a visible exit; one or two deaths are expected | Chase pacing, death/retry, exit |
| 9:30–10:00 | Return / authoring | Replays a level from Level Select or opens the editor to inspect or change a room | Level Select, editor, test play |

### 10-minute experience goal

By the end of ten minutes the player should have:

- learned the movement set,
- understood that the monster follows their exact route,
- experienced at least one death and one successful escape,
- seen a vertical route and an optional fragment,
- and either replayed a level or opened the editor.

## 5. Content plan

| Level type | Purpose | Visual beat |
|---|---|---|
| Tutorial | Teach movement and exit with no pursuer | Overgrown cemetery path |
| First chase | Introduce grace, trail pursuit and death/retry | Collapsed chapel entrance |
| Vertical chase | Teach climbing and dropping with pressure | Catacomb shaft |
| Longer chase | Test route choice and sustained movement | Mausoleum and ruins |
| Finale | Combine everything into one last escape | The iron cemetery gate |

The editor supports shipped levels, drafts and dev-only custom sizes. Campaign levels are ordered by `sequences.json`; single levels played from Level Select return to Level Select when completed.

## 6. Controls

| Action | Key |
|---|---|
| Move | `A` / `D` |
| Jump | `Space` or `W` |
| Drop through | `S` + `Space` |
| Pause | `Esc` |
| Reset | `R` |

Reserved for future work, not active yet:

| Action | Key |
|---|---|
| Sprint | `Shift` |
| Slide | `Ctrl` |
| Interact / hide | `E` |
| Hold breath | `F` |

Gameplay is WASD-only. Arrow keys are intentionally unbound.

## 7. Current technical snapshot

- Excalibur Arcade physics, variable timestep.
- Pure player movement decisions in `PlayerController`.
- Trail recorder and follower in `src/game/chase/trail.ts`.
- Monster follows a distance-spaced polyline of the player's positions.
- Level JSON schema with spawn, monster, exit and optional memory entities.
- Optional per-level skybox colour.
- Invisible left/right world bounds; bottom fall is the kill plane.
- Editor: Paint/Erase, Tiles/Entities modes, `B` tool toggle, `Q` mode toggle, `G` grid, `V` save draft, size presets, skybox, shipped/draft browser.
- Local commits only at this stage; no remote push yet.

## 8. Work completed so far

- Replaced the original collectathon identity with a chase identity.
- Made the exit always open and memories optional.
- Added the three-second grace period and trail-following monster.
- Added threat HUD, death overlay, retry flow and editor-specific `You Ded :(` screen.
- Added WASD-only input with reserved future keys.
- Added editor level browsing, new levels, resizing, skybox and world bounds.
- Added credits/licence scaffolding and an asset guide.
- Added tests for player movement, trail following, level operations and editor state.

## 9. Pins / future work

### Slopes — short list
- 45° stone slopes: left and right, one tile each.
- 2-tile gentle stone slope, later.
- Needs a custom surface resolver; Arcade has no native slopes.
- Preferred tilesets should include slope pieces; graveyard/crypt ramps are part of the visual identity.
- Test walking up/down, jumping onto, walking off, and monster trail traversal.

### Movement
- Sprint and stamina.
- Slide.
- Vault while sprinting.
- Tune chase pacing around those abilities.

### Hiding and stealth
- Hide spots and hold-breath.
- Monster search state.
- Decide between trail-break stealth and full hunter AI.
- Multi-monster levels, possibly a paired “Gemini” encounter, are under discussion; the current loader supports only one monster per level.

### Audio and voice
- Audio director and volume buses.
- Ambient hum and music.
- Voice performance by JJ *(pending course approval)*.
- Monster lines such as “Found you” and the death line “A new plaything… enjoy the memories.”

### Assets
- Replace all unlicensed TEMP files.
- CC0 preferred; CC-BY acceptable with attribution.
- Search **graveyard / crypt / catacombs / ruins / gothic platformer** tilesets, not literal Backrooms.
- Require **side-view 2D**, not top-down, isometric or 3D.
- 16×16 or 32×32 native; slopes included where possible.
- Props: gravestones, iron fences, gates, urns, candles, lanterns, doors, stairs, rubble, vines.
- Pixel-art character, monster, tiles and props.
- Kenney 1-Bit Pack is a style/character/UI candidate; it is not enough on its own for environment props.
- Pixel filtering support is not implemented yet.

### Known issue
- Occasional wall-top corner clip when pressing into a tall solid tile. Documented in `docs/KNOWN_ISSUES.md`; not fixed yet.

### Editor and content
- Campaign / Dev / Community editor split.
- More vertical and longer levels.
- Proper pause/credits screen.
- Remote GitHub push after local work stabilises.

## 10. Success criteria

- A new player can understand the controls and goal within one minute.
- The trail monster is visibly following the player's route.
- Deaths are quick to retry and clearly communicated.
- A 10-minute session contains at least three distinct level experiences.
- The editor can create, test and save a playable chase level.
- No unlicensed asset enters the release build.

## 11. Open questions

- Should the monster ever become a full hunter AI instead of a trail follower?
- How should multiple monsters share a level?
- Should sprint be a core mechanic or a later difficulty modifier?
- How much of the Backrooms should remain literal versus implied?
- Is the final look stark 1-bit monochrome, muted desaturated colour, or a mix?
- What is the final name of the “memory” collectible if it returns as lore?

## Second Major Update — 2026-11-07 to 2026-11-08

### Editor and authoring
- Added Tiles / Visual / Entities tabs to the editor sidebar.
- Grouped tiles by tileset with an OG and Pixel Platformer World selector.
- Added a tile grid, selected-tile readout and animated entity placeholders.
- Moved level size, skybox, background/foreground, character scale, camera and
  Analog FX into the Visual tab.
- Added a Default Test baseline and new-level template.
- New levels start on a 32px grid with a Pixel moss floor.

### Character scale
- Added a per-level character height setting:
  Current/base, 1.5, 1.75 and 2 tiles.
- 1 tile is treated as roughly 1 metre; 1.75 tiles is the current target.
- Player and monster share the same target height for now.
- Character art is still placeholder; the dryfit hero/ghost/skeleton files were
  archived rather than promoted.

### Camera
- Added per-level camera distance, defaulting new levels to Wide 1.0×.
- Added Current, Soft, Momentum and Impact follow presets.
- Soft + fall momentum is the current keeper: the camera follows small jumps,
  leads downward during falls and settles back up after landing.
- The landing dip was dropped as too subtle.
- Camera remains unclamped at level edges and snaps on start/respawn.

### Pixel Platformer World
- Adopted the Pixel Platformer World pack as the current tile and background set.
- Imported 92 tiles, nine room palettes, six backgrounds and source art into
  tracked `public/assets/pixel-platformer-world/`.
- Added walkable palettes for moss, rose, olive, crimson, teal, blood, lime,
  slate and ocean.
- Added platform trim, walls, panels, arches, columns, rails, steps and props.
- Slopes/slants are visual-only until their collision surfaces are wired.
- Fixed 16px Pixel art scaling into 32px level cells.

### Vignette
- Vignette is the default Analog FX for new levels.
- Scanlines, Static and Combined are held back for now.
- LESED Vignette asset and licence are tracked.
- `CREDITS.md` credits LESED with both the asset page and creator page.

### Repository and testing
- Promoted the editor, camera, character-scale and Pixel work to local
  `develop`; nothing was pushed.
- Existing OG levels remain unchanged and keep their old camera/scale.
- Archived the dryfit branch as `archive/dryfit-2026-11-08` and removed it from
  active work.
- 133 tests pass; typecheck and production build pass.

### Still open
- Real player/monster art and animation.
- Slope collision and collision for large decor pieces.
- Replacing the old OG levels with new Pixel levels.
- In-game credits screen.
