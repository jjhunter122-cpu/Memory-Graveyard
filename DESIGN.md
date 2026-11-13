# Memory Graveyard — Design Document

**Course:** final assignment build  
**Version:** Final, 2026-11-13  
**Platform:** Browser, desktop  
**Engine:** Excalibur.js / TypeScript / Vite

## 1. What the game is trying to do

**Memory Graveyard** is a one-button endless platformer about outrunning the
forest's memory of you. The player auto-runs through a procedurally streamed
forest, jumps pits, collects coins for score and grabs green bolts to keep
stamina up. A Guardian follows the exact trail the player has already run, so
the player's own path becomes the threat.

The target experience is a short, readable action loop: every few seconds there
is one clear decision (jump now, wait, line up a coin cluster, grab a bolt), and
every minute the run gets slightly faster and less forgiving. A run should be
easy to understand in ten seconds, hard to master in ten minutes, and worth
retrying immediately after a death.

## 2. The big loop (minutes)

```text
Title ─► Play ─► Run ─► collect coins / spend stamina / dodge pits
                    │
                    ├─ fall into a pit ─► YOU FELL ─┐
                    └─ Guardian catches ─► CAUGHT ──┤
                                                    ▼
                                   Retry ───────────┘
                                     │
                                     └─ Back to Home Menu ─► Title
```

- The player starts a run from the title screen.
- The run continues until a pit or the Guardian ends it.
- The score and best score are shown during the run; the best score persists.
- Retry starts a new seed immediately; Home returns to the title, Options or
  Credits.

The big loop is the **replay loop**: a run is short enough to lose, learn one
thing, and start again. Progress is measured by the best score, not by saved
levels.

## 3. The small loop (seconds)

```text
read next gap ─► jump / hold ─► land ─► collect coins ─► check stamina
       ▲                                                    │
       └──────────── adjust speed and jump timing ◄─────────┘
```

- **Read:** the next pit, raised section or floating platform enters the screen.
- **Act:** jump with `Space` / `W`; the jump has coyote time, buffering and a
  variable-height cut, so short taps and held jumps feel different.
- **Collect:** coins sit in short clusters worth 100 points each.
- **Manage:** stamina drains constantly; green bolts refill 25 points. At zero,
  the player slows and the Guardian closes the gap.
- **Repeat:** the camera keeps the player moving right, the stream builds new
  acts ahead and recycles old ones behind.

The small loop is deliberately about **one decision at a time**. There is no
inventory, no combat input and no branching path, so the challenge stays in
timing and risk management.

## 4. Ten minutes of planned gameplay

The run is endless, so "ten minutes" is a designed first-session arc rather than
a hard level boundary. A typical first run dies before the end; an experienced
player reaches the later sections.

| Time | What the player is doing | Systems in play |
| --- | --- | --- |
| 0:00–0:45 | Starts from the title, learns that the character auto-runs, makes the first jumps. | Title, auto-run, jump, coyote time, jump buffer |
| 0:45–2:00 | Meets the first coin cluster and the first pit. The Guardian is visible behind but not yet a threat. | Coins, first pit, trail recording, camera follow |
| 2:00–3:30 | Stamina bar becomes noticeable. The first green bolt appears on the ground; the next appears in the air. | Stamina drain, ground/air bolt placement, 25-point refill |
| 3:30–5:00 | Raised ground and floating platforms break up the floor. Pits get wider. The player starts planning two jumps ahead. | Raised sections, floating platforms, pit width scaling |
| 5:00–6:30 | Run speed has ramped up. Coin clusters are harder to line up and jumps need earlier input. | Speed curve (220 → 360 px/s), score per distance |
| 6:30–8:00 | Score chase. The player weighs grabbing a risky coin cluster against keeping enough stamina to stay ahead. | Score, best score, stamina pressure, Guardian gap |
| 8:00–9:30 | A mistake ends the run. The death screen shows how far the run got; the player retries with a new seed. | Pit fall, Guardian catch, Retry, new seed |
| 9:30–10:00 | A second run applies one lesson from the first. The best score is visible on the title screen. | Persistent high score, title return, replay loop |

Expected shape of a first ten minutes:

- A new player survives roughly 30–90 seconds per attempt.
- A comfortable run reaches 4,000–8,000 points.
- A strong run reaches the 10,000+ range; the current saved best on the test
  machine is 12,206.
- The run speed reaches its cap after roughly 30,000 px of travel, so the
  ten-minute arc is dominated by jump consistency rather than waiting for speed.

## 5. Assets and why they support the game

| Asset | Role in the game | Why it fits |
| --- | --- | --- |
| **Pixel Platformer World** moss tiles | The floor, raised sections and floating platforms | 16×16 pixel art scaled 2× into the 32px grid; the moss top reads clearly against the dark forest and the fill tile gives platforms weight |
| **Pixel Platformer World** forest backgrounds (6 layers) | Parallax backdrop for every act | Layered silhouettes create depth without hiding the play line; the muted red/green palette matches the haunted-forest tone |
| **Pixel Platformer World** character frames | Idle, run, jump, landing and death animation | Side-view frames with a readable silhouette; the run cycle sells the auto-run and the death frame gives failure weight |
| **Old Guardian** by Eddie's Workshop | The pursuer | 64×64 pixel monster with idle, walk, attack and death strips; it is large enough to feel threatening behind the player |
| **Silver coin** by AntumDeluge / OpenClipart (CC0) | Score pickup and score icon | A simple metallic circle reads at 24px against moss and forest; the same icon appears in the HUD |
| **Green bolt** by pix3lcat (CC0) | Stamina pickup and stamina icon | Bright green separates it from the coin and matches the stamina bar; the bolt shape is readable at 26px |
| **Footsteps / ambience / title music** | Movement feedback and mood | Grass steps and soft landings confirm ground contact; metal steps make the Guardian audible; the forest ambience and title loop set the tone |
| **LESED Vignette** | Screen framing | Darkens the edges, keeps attention on the play line and reinforces the analog-horror presentation |

The old editor asset packs (TEMP, Grunge, DRYFIT and the unused room/tile art)
were removed from the final build. The old editor/campaign version is kept in
`archive/old-system/` for comparison.

## 6. Tuning and difficulty

- **Speed:** starts at 220 px/s, rises to 360 px/s over 30,000 px.
- **Pits:** width grows with the act index, capped so every gap remains
  jumpable with a full jump.
- **Stamina:** drains at 3 points per second; a bolt refills 25.
- **Low stamina:** full speed until the bar hits zero, then a 0.55× crawl.
- **Guardian:** follows the recorded trail; it closes in when stamina runs out
  and ends the run on contact.
- **Coin spacing:** clusters appear every ~1,800 px, with three coins per
  cluster.
- **Bolt spacing:** starts at ~1,600 px and widens to ~2,600 px with distance.

The difficulty curve is intentionally gentle at the start and readable at the
end: the player always has enough information to make the next jump, but the
window gets tighter.

## 7. Presentation and feedback

- **HUD:** score and best score with coin icons; stamina bar with a bolt icon.
- **Toast:** one short control reminder at the start of a run.
- **Death screens:** `YOU FELL` or `CAUGHT`, with Retry and Back to Home Menu.
- **Audio:** title music, looping forest ambience, grass footsteps, landing
  thumps and metal Guardian footsteps.
- **Vignette:** applied on the title, menus and run.
- **Menus:** title, options and credits use the same forest stage with a slow
  camera drift and a reverse slide when returning.

## 8. Current build and scope

Included:

- Endless procedural forest with pits, raised sections and floating platforms.
- Coins, stamina bolts, stamina drain, score and persistent high score.
- Guardian trail chase, pit falls, catch animation and death screens.
- Title, Options (three volume sliders), Credits and Run.
- Audio, Vignette, responsive canvas and DOM HUD.

Not included:

- Online leaderboard.
- Authored levels, editor, campaign or level select (archived).
- Slopes or one-way authored platforms (the run uses solid moss tiles).
- Additional monsters or player abilities.

## 9. Future work

- Add a small set of authored "act themes" so the forest changes every few
  minutes.
- Add a second pursuer behaviour that cuts corners instead of replaying the
  trail.
- Add accessibility options for jump buffering and flash intensity.
- Add a local score history, then an online leaderboard if the backend exists.
