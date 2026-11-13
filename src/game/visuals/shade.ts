import {
  Animation,
  AnimationStrategy,
  SpriteSheet,
  type ImageSource,
} from 'excalibur';

/** One 48x48 cell in the Dark Fantasy Monster Pack 2 (Monster 1) sheet. */
const FRAME_SIZE = 48;
/** The sheet is a 10-column grid; each animation starts in column 0 of its row. */
const SHEET_COLUMNS = 10;
const SHEET_ROWS = 9;
/**
 * A 48px cell scaled 4.5x: the roughly 17px silhouette inside it then stands
 * about 80px tall, matching the 56px player and the old monster's presence.
 */
const FRAME_DISPLAY = 216;
/** Pushes the drawn cell down so the creature's feet meet the actor's feet. */
export const SHADE_GRAPHIC_OFFSET_Y = 6;

const ROWS = {
  idle: { row: 0, frames: 8 },
  walk: { row: 1, frames: 8 },
  death: { row: 2, frames: 10 },
  attack: { row: 4, frames: 8 },
} as const;

export interface ShadeAnimations {
  idle: Animation;
  walk: Animation;
  attack: Animation;
  /** Collapses into a puddle; the title screen plays it before starting a run. */
  death: Animation;
}

function createSheet(image: ImageSource): SpriteSheet {
  return SpriteSheet.fromImageSource({
    image,
    grid: {
      rows: SHEET_ROWS,
      columns: SHEET_COLUMNS,
      spriteWidth: FRAME_SIZE,
      spriteHeight: FRAME_SIZE,
    },
  });
}

function createAnimation(
  sheet: SpriteSheet,
  row: number,
  frames: number,
  frameDuration: number,
  freeze = false,
  reverse = false,
): Animation {
  const sprites = [];
  for (let column = 0; column < frames; column += 1) {
    const sprite = sheet.getSprite(column, row);
    sprite.width = FRAME_DISPLAY;
    sprite.height = FRAME_DISPLAY;
    sprites.push({ graphic: sprite, duration: frameDuration });
  }
  return new Animation({
    frames: sprites,
    strategy: freeze ? AnimationStrategy.Freeze : AnimationStrategy.Loop,
    reverse,
  });
}

/**
 * The Shade is a 48x48 grid sheet: idle, walk, death, death 2, attack, ...
 * Only the rows the run and title screens need are sliced.
 */
export function createShadeAnimations(image: ImageSource): ShadeAnimations {
  const sheet = createSheet(image);
  return {
    idle: createAnimation(sheet, ROWS.idle.row, ROWS.idle.frames, 160),
    walk: createAnimation(sheet, ROWS.walk.row, ROWS.walk.frames, 100),
    attack: createAnimation(
      sheet,
      ROWS.attack.row,
      ROWS.attack.frames,
      100,
      true,
    ),
    death: createAnimation(
      sheet,
      ROWS.death.row,
      ROWS.death.frames,
      100,
      true,
    ),
  };
}
