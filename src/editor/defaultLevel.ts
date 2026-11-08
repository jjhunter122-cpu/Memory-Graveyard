import { createLevel, type LevelData, type PlayArea } from '../game/level/schema';
import { blankSlabPresetFor, defaultPlayArea } from '../game/level/sizes';

export const DEFAULT_LEVEL_WIDTH = 60;
export const DEFAULT_LEVEL_HEIGHT = 27;
export const DEFAULT_LEVEL_TILE_SIZE = 32;
/** Pixel Platformer World moss grass top + fill. */
export const DEFAULT_FLOOR_TOP_TILE = 79;
export const DEFAULT_FLOOR_FILL_TILE = 80;
/** Name used by the editor's New button and the shipped Blank Slab level. */
export const BLANK_SLAB_NAME = 'Blank Slab';
/** Default playable area for the 60 × 27 Blank Slab canvas. */
export const DEFAULT_PLAY_AREA: PlayArea = { x: 10, y: 8, width: 40, height: 19 };

/**
 * The blank baseline used by the editor's New level button and the Blank Slab
 * level: Pixel moss floor across the full canvas, a smaller playable rectangle,
 * layered Pixel background, Vignette, larger character and the Wide + momentum
 * camera.
 */
export function createDefaultLevel(
  name: string = BLANK_SLAB_NAME,
  width: number = DEFAULT_LEVEL_WIDTH,
  height: number = DEFAULT_LEVEL_HEIGHT,
): LevelData {
  const level = createLevel(
    name,
    width,
    height,
    DEFAULT_LEVEL_TILE_SIZE,
  );

  const playArea =
    blankSlabPresetFor(width, height)?.playArea ?? defaultPlayArea(width, height);

  const terrain = level.layers[0];
  if (terrain) {
    const data = terrain.data.slice();
    for (let x = 0; x < width; x += 1) {
      data[(height - 2) * width + x] = DEFAULT_FLOOR_TOP_TILE;
      data[(height - 1) * width + x] = DEFAULT_FLOOR_FILL_TILE;
    }
    level.layers[0] = { ...terrain, data };
  }

  level.entities = [
    {
      type: 'spawn',
      x: playArea.x + 2,
      y: height - 3,
    },
  ];
  level.playArea = playArea;
  level.skybox = '#0a0b10';
  level.background = 'pixel-platformer-world-layers';
  level.analogFx = 'vignette';
  level.characterScale = 1.75;
  level.cameraZoom = 1;
  level.cameraFollow = 'momentum';
  return level;
}
