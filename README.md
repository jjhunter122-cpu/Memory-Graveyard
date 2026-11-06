# Memory Graveyard

A small top-down graveyard where you play the caretaker and collect the glowing
memories the dead left behind. Built on the same stack as
[drunk-panda](https://github.com/NatTuck/drunk-panda):

- **Excalibur.js** 0.32
- **TypeScript** 7
- **Vite** 8
- **Vitest** 5
- **pnpm**

Everything is client-side; there is no backend.

## Run it

```bash
pnpm install
pnpm dev
```

Then open the printed local URL.

```bash
pnpm test       # headless layout / collection / rank tests
pnpm typecheck
pnpm build      # static production build in dist/
pnpm preview
```

## Controls

| Action | Keyboard |
| --- | --- |
| Move | `W` `A` `S` `D` or arrow keys |
| Reset | `R` |

Walk over a glowing memory to collect it. Collect them all to earn the rank of
**Gravekeeper**.

## Project layout

```
src/
  game/
    config.ts             gameplay tunables and palette
    level/spots.ts        memory, gravestone and player-spawn data
    systems/graveyard.ts  pure helpers (clamp, reach, rank)
    actors/Gravekeeper.ts player actor + movement
    actors/Memory.ts      bobbing collectible actor
    ui/Hud.ts             DOM overlay writer
    scenes/MainScene.ts   assembly and game loop
  main.ts
tests/                     headless vitest suite
```

## Design notes

- **Pure logic is separated from the engine.** `systems/graveyard.ts` has no
  Excalibur imports, so collection and ranking rules are unit-testable in Node.
- **Level data is a contract.** `level/spots.ts` holds plain coordinates and the
  test suite asserts every spot stays inside the playable frame.
- **DOM HUD over engine text** keeps labels crisp at any resolution.
