import {
  Color,
  DisplayMode,
  Engine,
  SolverStrategy,
  Vector,
  WebAudio,
} from 'excalibur';
import { createGameTextures } from './game/assets';
import { footstepAudio } from './game/audio/footsteps';
import { ambienceAudio } from './game/audio/ambience';
import { titleMusic } from './game/audio/titleMusic';
import { COLORS, PHYSICS, VIEW } from './game/config';
import { validateManifest } from './game/level/manifest';
import { GameApp } from './game/app';
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
  const manifest = validateManifest(
    await fetchJson(`${base}assets/manifest.json`),
  );

  const settings = new SettingsStore(safeLocalStorage());

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
    ambienceAudio.load(base),
  ]);

  // The game preloads directly instead of using Excalibur's Loader, so unlock
  // the shared WebAudio context on the first real user gesture ourselves.
  const unlockAudio = (): void => {
    void WebAudio.unlock();
  };
  window.addEventListener('pointerdown', unlockAudio, {
    once: true,
    capture: true,
  });
  window.addEventListener('keydown', unlockAudio, { once: true, capture: true });

  const app = new GameApp(engine, manifest, settings, assets.textures);
  await app.start();

  // Runtime handles for debugging in the console.
  (window as unknown as { graveyard: Engine }).graveyard = engine;
  (window as unknown as { graveyardApp: GameApp }).graveyardApp = app;
}

void boot().catch((error: unknown) => {
  console.error('Failed to start Memory Graveyard', error);
});
