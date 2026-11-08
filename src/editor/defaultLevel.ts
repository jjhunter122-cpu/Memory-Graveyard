import { createLevel, type LevelData } from '../game/level/schema';

export const DEFAULT_LEVEL_WIDTH = 40;
export const DEFAULT_LEVEL_HEIGHT = 18;
export const DEFAULT_LEVEL_TILE_SIZE = 32;
/** Pixel Platformer World moss grass top + fill. */
export const DEFAULT_FLOOR_TOP_TILE = 79;
export const DEFAULT_FLOOR_FILL_TILE = 80;
/** Name used by the editor's New button and the shipped Blank Slab level. */
export const BLANK_SLAB_NAME = 'Blank Slab';

/**
 * The blank baseline used by the editor's New level button and the Blank Slab
 * level: Pixel moss floor, layered Pixel background, Vignette, larger character
 * and the Wide + momentum camera.
 */
export function createDefaultLevel(name: string = BLANK_SLAB_NAME): LevelData {
  const level = createLevel(
    name,
    DEFAULT_LEVEL_WIDTH,
    DEFAULT_LEVEL_HEIGHT,
    DEFAULT_LEVEL_TILE_SIZE,
  );

  const terrain = level.layers[0];
  if (terrain) {
    const data = terrain.data.slice();
    for (let x = 0; x < DEFAULT_LEVEL_WIDTH; x += 1) {
      data[(DEFAULT_LEVEL_HEIGHT - 2) * DEFAULT_LEVEL_WIDTH + x] = DEFAULT_FLOOR_TOP_TILE;
      data[(DEFAULT_LEVEL_HEIGHT - 1) * DEFAULT_LEVEL_WIDTH + x] = DEFAULT_FLOOR_FILL_TILE;
    }
    level.layers[0] = { ...terrain, data };
  }

  level.entities = [
    {
      type: 'spawn',
      x: 2,
      y: DEFAULT_LEVEL_HEIGHT - 3,
    },
  ];
  level.skybox = '#0a0b10';
  level.background = 'pixel-platformer-world-layers';
  level.analogFx = 'vignette';
  level.characterScale = 1.75;
  level.cameraZoom = 1;
  level.cameraFollow = 'momentum';
  return level;
}
