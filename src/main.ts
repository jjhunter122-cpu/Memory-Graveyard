import { Color, DisplayMode, Engine, SolverStrategy, Vector } from 'excalibur';
import { COLORS, PHYSICS, VIEW } from './game/config';
import { PlayScene } from './game/scenes/PlayScene';
import './style.css';

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

game.addScene('play', new PlayScene());

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

void game
  .start()
  .then(() => game.goToScene('play'))
  .then(() => {
    // Runtime handle for debugging in the console.
    (window as unknown as { graveyard: Engine }).graveyard = game;
  })
  .catch((error: unknown) => {
    console.error('Failed to start Memory Graveyard', error);
  });
