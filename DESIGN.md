# Memory Graveyard — Design Document

**Course / team:** [fill in]  
**Version:** Day 1 working draft  
**Platform:** Browser, desktop  
**Engine:** Excalibur.js / TypeScript / Vite

## 1. Game concept

**Memory Graveyard** is a 2D side-scrolling horror chase-platformer set inside the Backrooms' memory.

The Backrooms is the graveyard. You are an intruder inside a place made of forgotten rooms, and the thing following you is one of its discarded memories. It does not patrol randomly: it follows the route you have already run, including your jumps, drops and vertical climbs. Your own path becomes the threat.

The player's goal is simple: **reach the exit before the memory catches you.**

There is no combat. The game is about movement, route reading, momentum and the pressure of a pursuer that is always retracing your steps.

### High concept

> A Backrooms chase-platformer where the level remembers your route, and something follows it.

### Design pillars

1. **The route is the threat.** The monster follows the trail the player leaves, so every jump and detour matters.
2. **Readable horror.** The game should feel tense, not confusing. The player must always understand where to go next.
3. **Fair pressure.** Deaths should feel earned; retries should be fast.
4. **The graveyard is the Backrooms.** The title is literal: the halls are the graveyard, and its memories are the things left behind.
5. **Optional memory fragments.** Fragments add flavour and discovery, but never block the exit.

### Anti-goals

- No required collectathon.
- No combat system.
- No slow, puzzle-first pacing during a chase.
- No unreadable dark mazes where the player cannot identify the route.

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
| 2:00–3:30 | First chase | Learns the 3-second grace, sees the pursuer wake, runs the first corridor; likely dies once and retries | Trail monster, threat HUD, death overlay, retry |
| 3:30–5:30 | Vertical chase | Climbs a shaft, drops between floors, takes a higher route to avoid the trail; collects an optional fragment | Vertical level reading, one-way platforms, fragments |
| 5:30–7:30 | Longer chase | Chooses between a safe lower route and a faster upper route; the pursuer rubber-bands when the gap grows | Route choice, momentum, catch-up tuning |
| 7:30–9:30 | Finale | Long final dash with narrow platforms and a visible exit; one or two deaths are expected | Chase pacing, death/retry, exit |
| 9:30–10:00 | Return / authoring | Replays a level from Level Select or opens the editor to inspect or change a room | Level Select, editor, test play |

### 10-minute experience goal

By the end of ten minutes the player should have:

- learned the movement set,
- understood that the monster follows their exact route,
- experienced at least one death and one successful escape,
- seen a vertical route and an optional fragment,
- and either replayed a level or opened the editor.

## 5. Content plan

| Level type | Purpose |
|---|---|
| Tutorial | Teach movement and exit with no pursuer |
| First chase | Introduce grace, trail pursuit and death/retry |
| Vertical chase | Teach climbing and dropping with pressure |
| Longer chase | Test route choice and sustained movement |
| Finale | Combine everything into one last escape |

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

### Slopes
- 45° stone slopes: left and right, one tile each.
- 2-tile gentle stone slope, later.
- Needs custom surface collision; Arcade has no native slopes.

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
- Pixel-art side-view tiles, character, monster, props and slopes.
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
- How much of the Backrooms should be literal versus implied?
- What is the final name of the “memory” collectible if it returns as lore?
