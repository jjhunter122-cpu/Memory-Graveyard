import { Animation, AnimationStrategy, Sprite, type ImageSource } from 'excalibur';
import type { GameTextures } from '../assets';

export interface HeroAnimations {
  idle: Animation;
  run: Animation;
  jump: Animation;
  landing: Animation;
  dead: Animation;
}

function build(
  images: readonly ImageSource[],
  frameDuration: number,
  strategy: AnimationStrategy,
  display: number,
): Animation {
  const frames = images.map((image) => {
    const sprite = new Sprite({
      image,
      destSize: { width: display, height: display },
    });
    return { graphic: sprite, duration: frameDuration };
  });
  return new Animation({ frames, strategy });
}

export function createHeroAnimations(
  textures: GameTextures,
  display: number,
): HeroAnimations | undefined {
  if (
    textures.heroIdle.length === 0 ||
    textures.heroRun.length === 0 ||
    textures.heroJump.length === 0 ||
    textures.heroLanding.length === 0 ||
    textures.heroDead.length === 0
  ) {
    return undefined;
  }
  return {
    idle: build(textures.heroIdle, 150, AnimationStrategy.Loop, display),
    run: build(textures.heroRun, 85, AnimationStrategy.Loop, display),
    jump: build(textures.heroJump, 140, AnimationStrategy.Loop, display),
    landing: build(textures.heroLanding, 80, AnimationStrategy.Freeze, display),
    dead: build(textures.heroDead, 150, AnimationStrategy.Freeze, display),
  };
}
