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
  // Deterministic fixed step so the platformer feels identical on every machine.
  fixedUpdateFps: PHYSICS.fixedFps,
  physics: {
    // The Arcade solver is Excalibur's simple AABB solver, built for platformers.
    solver: SolverStrategy.Arcade,
    gravity: new Vector(0, PHYSICS.gravityY),
  },
  antialiasing: true,
});

game.add('play', new PlayScene());

void game.start().then(() => {
  // Runtime handle for debugging in the console.
  (window as unknown as { graveyard: Engine }).graveyard = game;
});
