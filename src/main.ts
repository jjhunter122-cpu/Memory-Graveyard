import { Color, DisplayMode, Engine, SolverStrategy, Vector } from 'excalibur';
import { COLORS, PHYSICS, VIEW } from './game/config';
import { validateManifest } from './game/level/manifest';
import type { LevelData } from './game/level/schema';
import { GameApp } from './game/app';
import {
  DraftStore,
  LevelLibrary,
  validateLevelIndex,
} from './game/storage/levels';
import { SettingsStore } from './game/storage/settings';
import { safeLocalStorage } from './game/storage/storage';
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
  const [manifestRaw, indexRaw] = await Promise.all([
    fetchJson(`${base}assets/manifest.json`),
    fetchJson(`${base}levels/index.json`),
  ]);

  const manifest = validateManifest(manifestRaw);
  const index = validateLevelIndex(indexRaw);

  const storage = safeLocalStorage();
  const drafts = new DraftStore(storage);
  const settings = new SettingsStore(storage);
  const library = new LevelLibrary(base, index, drafts);

  const params = new URLSearchParams(window.location.search);
  let startInEditor = params.has('editor');
  let initialLevel: LevelData | undefined;
  if (startInEditor) {
    const first = index.levels[0];
    initialLevel = first ? await library.loadShipped(first.id).catch(() => undefined) : undefined;
    if (!initialLevel) {
      startInEditor = false;
    }
  }

  const engine = new Engine({
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

  const app = new GameApp(engine, manifest, library, drafts, settings);
  await app.start({ startInEditor, initialLevel });

  // Runtime handles for debugging in the console.
  (window as unknown as { graveyard: Engine }).graveyard = engine;
  (window as unknown as { graveyardApp: GameApp }).graveyardApp = app;
}

void boot().catch((error: unknown) => {
  console.error('Failed to start Memory Graveyard', error);
});
