import { Color, DisplayMode, Engine, SolverStrategy, Vector } from 'excalibur';
import { COLORS, PHYSICS, VIEW } from './game/config';
import { validateLevel } from './game/level/schema';
import { validateManifest } from './game/level/manifest';
import { PlayScene } from './game/scenes/PlayScene';
import './style.css';

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to load ${url} (${response.status})`);
  }
  return response.json();
}

async function boot(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  const [levelRaw, manifestRaw] = await Promise.all([
    fetchJson(`${base}levels/test-course.json`),
    fetchJson(`${base}assets/manifest.json`),
  ]);

  const level = validateLevel(levelRaw);
  const manifest = validateManifest(manifestRaw);

  const game = new Engine({
    canvasElementId: 'game',
    width: VIEW.width,
    height: VIEW.height,
    displayMode: DisplayMode.FitScreen,
    backgroundColor: Color.fromHex(COLORS.background),
    // No external resources yet, so skip the "click to play" overlay.
    suppressPlayButton: true,
    // Deterministic fixed step so the platformer feels identical on every machine.
    fixedUpdateFps: PHYSICS.fixedFps,
    physics: {
      // The Arcade solver is Excalibur's simple AABB solver, built for platformers.
      solver: SolverStrategy.Arcade,
      gravity: new Vector(0, PHYSICS.gravityY),
    },
    antialiasing: true,
  });

  game.addScene('play', new PlayScene(level, manifest));

  // Stop the page from scrolling while playing.
  const prevent = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  window.addEventListener(
    'keydown',
    (event) => {
      if (prevent.has(event.code) || prevent.has(event.key)) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  await game.start();
  await game.goToScene('play');

  // Runtime handle for debugging in the console.
  (window as unknown as { graveyard: Engine }).graveyard = game;
}

void boot().catch((error: unknown) => {
  console.error('Failed to start Memory Graveyard', error);
});
