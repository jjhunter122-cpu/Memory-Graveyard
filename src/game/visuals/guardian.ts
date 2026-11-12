import { Animation, AnimationStrategy, SpriteSheet, type ImageSource } from 'excalibur';

const FRAME_SIZE = 120;
const FRAME_DISPLAY = 160;

export interface GuardianAnimations {
  idle: Animation;
  walk: Animation;
  attack: Animation;
}

function createAnimation(
  image: ImageSource,
  frames: number,
  frameDuration: number,
  freeze = false,
): Animation {
  const sheet = SpriteSheet.fromImageSource({
    image,
    grid: {
      rows: frames,
      columns: 1,
      spriteWidth: FRAME_SIZE,
      spriteHeight: FRAME_SIZE,
    },
  });
  const sprites = [];
  for (let index = 0; index < frames; index += 1) {
    const sprite = sheet.sprites[index];
    if (!sprite) {
      continue;
    }
    sprite.width = FRAME_DISPLAY;
    sprite.height = FRAME_DISPLAY;
    sprites.push({ graphic: sprite, duration: frameDuration });
  }
  return new Animation({
    frames: sprites,
    strategy: freeze ? AnimationStrategy.Freeze : AnimationStrategy.Loop,
  });
}

/**
 * The placeholder Old Guardian strips are vertical 120x120 frames. The frame is
 * displayed at 160px so the roughly 60px creature inside it renders at about
 * 80px, clearly taller than the 56px player.
 */
export function createGuardianAnimations(
  idleImage: ImageSource,
  walkImage: ImageSource,
  attackImage: ImageSource,
): GuardianAnimations {
  const idleFrames = Math.max(1, Math.floor(idleImage.height / FRAME_SIZE));
  const walkFrames = Math.max(1, Math.floor(walkImage.height / FRAME_SIZE));
  const attackFrames = Math.max(1, Math.floor(attackImage.height / FRAME_SIZE));
  return {
    idle: createAnimation(idleImage, idleFrames, 160),
    walk: createAnimation(walkImage, walkFrames, 100),
    attack: createAnimation(attackImage, attackFrames, 100, true),
  };
}
