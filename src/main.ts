import { Color, DisplayMode, Engine } from 'excalibur';
import { VIEW } from './game/config';
import { MainScene } from './game/scenes/MainScene';
import './style.css';

const game = new Engine({
  canvasElementId: 'game',
  width: VIEW.width,
  height: VIEW.height,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex('#05060a'),
  antialiasing: true,
});

game.add('main', new MainScene());

void game.start().then(() => {
  // Runtime handle for debugging in the console, same spirit as the reference rig.
  (window as unknown as { graveyard: Engine }).graveyard = game;
});
