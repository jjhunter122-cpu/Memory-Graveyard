import { createLevel, type LevelData } from '../game/level/schema';

export const DEFAULT_LEVEL_WIDTH = 40;
export const DEFAULT_LEVEL_HEIGHT = 18;
export const DEFAULT_LEVEL_TILE_SIZE = 32;
export const DEFAULT_FLOOR_TILE = 1;

/**
 * The blank baseline used by the editor's New level button and the Default
 * Test level: smallest canvas, two rows of OG stone, dark sky and Vignette.
 */
export function createDefaultLevel(name: string): LevelData {
  const level = createLevel(
    name,
    DEFAULT_LEVEL_WIDTH,
    DEFAULT_LEVEL_HEIGHT,
    DEFAULT_LEVEL_TILE_SIZE,
  );

  const terrain = level.layers[0];
  if (terrain) {
    const data = terrain.data.slice();
    for (let y = DEFAULT_LEVEL_HEIGHT - 2; y < DEFAULT_LEVEL_HEIGHT; y += 1) {
      for (let x = 0; x < DEFAULT_LEVEL_WIDTH; x += 1) {
        data[y * DEFAULT_LEVEL_WIDTH + x] = DEFAULT_FLOOR_TILE;
      }
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
  level.analogFx = 'vignette';
  return level;
}
