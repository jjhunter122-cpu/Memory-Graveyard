import { Color, DisplayMode, Engine, SolverStrategy, Vector, WebAudio } from 'excalibur';
import { createGameTextures } from './game/assets';
import { footstepAudio } from './game/audio/footsteps';
import { titleMusic } from './game/audio/titleMusic';
import { COLORS, PHYSICS, VIEW } from './game/config';
import { validateManifest } from './game/level/manifest';
import type { LevelData } from './game/level/schema';
import { GameApp } from './game/app';
import {
  DraftStore,
  EMPTY_SEQUENCES,
  LevelLibrary,
  validateLevelIndex,
  validateSequences,
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
  const [manifestRaw, indexRaw, sequencesRaw] = await Promise.all([
    fetchJson(`${base}assets/manifest.json`),
    fetchJson(`${base}levels/index.json`),
    fetchJson(`${base}levels/sequences.json`).catch(() => undefined),
  ]);

  const manifest = validateManifest(manifestRaw);
  const index = validateLevelIndex(indexRaw);
  const sequences = sequencesRaw === undefined ? EMPTY_SEQUENCES : validateSequences(sequencesRaw);

  const storage = safeLocalStorage();
  const drafts = new DraftStore(storage);
  const settings = new SettingsStore(storage);
  const library = new LevelLibrary(base, index, drafts, sequences);

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
    // Images are preloaded before the engine starts; skip the "click to play"
    // overlay so the game boots straight into the title screen.
    suppressPlayButton: true,
    // Fixed step is opt-in via config; variable step avoids judder on
    // high-refresh displays.
    ...(PHYSICS.fixedFps > 0 ? { fixedUpdateFps: PHYSICS.fixedFps } : {}),
    physics: {
      // The Arcade solver is Excalibur's simple AABB solver, built for platformers.
      solver: SolverStrategy.Arcade,
      gravity: new Vector(0, PHYSICS.gravityY),
    },
    antialiasing: true,
  });

  const assets = createGameTextures(base, manifest);
  await Promise.all([
    ...assets.resources.map((resource) => resource.load()),
    footstepAudio.load(base),
    titleMusic.load(base),
  ]);

  // The game preloads directly instead of using Excalibur's Loader, so unlock
  // the shared WebAudio context on the first real user gesture ourselves.
  const unlockAudio = (): void => {
    void WebAudio.unlock();
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { once: true, capture: true });
  const app = new GameApp(engine, manifest, library, drafts, settings, assets.textures);
  await app.start({ startInEditor, initialLevel });

  // Runtime handles for debugging in the console.
  (window as unknown as { graveyard: Engine }).graveyard = engine;
  (window as unknown as { graveyardApp: GameApp }).graveyardApp = app;
}

void boot().catch((error: unknown) => {
  console.error('Failed to start Memory Graveyard', error);
});
