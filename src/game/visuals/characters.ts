import { Animation, AnimationStrategy, SpriteSheet, type ImageSource } from 'excalibur';

/** The dry-fit hero sheet is 28 cropped 90x50 frames in one row. */
const HERO_FRAME_WIDTH = 90;
const HERO_FRAME_HEIGHT = 50;
const HERO_COLUMNS = 28;
const HERO_DISPLAY_WIDTH = 54;
const HERO_DISPLAY_HEIGHT = 30;

export type HeroAnimationName = 'idle' | 'run' | 'jump' | 'fall';

interface HeroRange {
  indices: number[];
  frameDuration: number;
}

/**
 * Frame ranges in the hero sheet:
 * idle 0-3, run 4-9, jump 10-13, attack 14-18, crouch 19, hurt 20, death 21-27.
 * Only the movement set is wired for now.
 */
const HERO_RANGES: Record<HeroAnimationName, HeroRange> = {
  idle: { indices: [0, 1, 2, 3], frameDuration: 160 },
  run: { indices: [4, 5, 6, 7, 8, 9], frameDuration: 90 },
  jump: { indices: [10, 11], frameDuration: 140 },
  fall: { indices: [12, 13], frameDuration: 180 },
};

export function createHeroAnimations(
  image: ImageSource,
): Record<HeroAnimationName, Animation> {
  const sheet = SpriteSheet.fromImageSource({
    image,
    grid: {
      rows: 1,
      columns: HERO_COLUMNS,
      spriteWidth: HERO_FRAME_WIDTH,
      spriteHeight: HERO_FRAME_HEIGHT,
    },
  });

  const animations = {} as Record<HeroAnimationName, Animation>;
  for (const name of Object.keys(HERO_RANGES) as HeroAnimationName[]) {
    const range = HERO_RANGES[name];
    const frames = [];
    for (const index of range.indices) {
      const sprite = sheet.sprites[index];
      if (!sprite) {
        continue;
      }
      sprite.width = HERO_DISPLAY_WIDTH;
      sprite.height = HERO_DISPLAY_HEIGHT;
      frames.push({ graphic: sprite, duration: range.frameDuration });
    }
    animations[name] = new Animation({
      frames,
      strategy: AnimationStrategy.Loop,
    });
  }
  return animations;
}

const GHOST_FRAME_SIZE = 32;
const GHOST_COLUMNS = 6;
const GHOST_DISPLAY_SIZE = 40;

/** `anim-nme-ghost.png` is a six-frame 32x32 walk cycle. */
export function createGhostAnimation(image: ImageSource): Animation {
  const sheet = SpriteSheet.fromImageSource({
    image,
    grid: {
      rows: 1,
      columns: GHOST_COLUMNS,
      spriteWidth: GHOST_FRAME_SIZE,
      spriteHeight: GHOST_FRAME_SIZE,
    },
  });
  const frames = [];
  for (const sprite of sheet.sprites) {
    sprite.width = GHOST_DISPLAY_SIZE;
    sprite.height = GHOST_DISPLAY_SIZE;
    frames.push({ graphic: sprite, duration: 120 });
  }
  return new Animation({ frames, strategy: AnimationStrategy.Loop });
}
