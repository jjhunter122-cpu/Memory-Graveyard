import { Sound } from 'excalibur';

const GRASS_COUNT = 7;
const LANDING_COUNT = 4;
const METAL_COUNT = 7;
const FOOTSTEP_VOLUME = 0.65;
const LANDING_VOLUME = 0.72;
const METAL_VOLUME = 0.55;

function grassPath(base: string, index: number): string {
  const frame = String(index).padStart(2, '0');
  return `${base}assets/audio/sound-guild/footsteps/grass/grass-${frame}.wav`;
}

function landingPath(base: string, index: number): string {
  const frame = String(index).padStart(2, '0');
  return `${base}assets/audio/sound-guild/footsteps/landing/soft-${frame}.wav`;
}

function metalPath(base: string, index: number): string {
  const frame = String(index).padStart(2, '0');
  return `${base}assets/audio/sound-guild/footsteps/metal/metal-${frame}.wav`;
}

function pickRandom(length: number, lastIndex: number): number {
  if (length <= 1) {
    return 0;
  }
  let index = Math.floor(Math.random() * length);
  if (index === lastIndex) {
    index = (index + 1) % length;
  }
  return index;
}

/**
 * Small footstep sample bank. Sounds are loaded lazily by `load` so the game
 * can still boot if an audio file is missing.
 */
class FootstepAudio {
  private grass: Sound[] = [];
  private landing: Sound[] = [];
  private metal: Sound[] = [];
  private lastGrass = -1;
  private lastLanding = -1;
  private lastMetal = -1;

  async load(base: string): Promise<void> {
    const grass = Array.from(
      { length: GRASS_COUNT },
      (_, index) => new Sound(grassPath(base, index + 1)),
    );
    const landing = Array.from(
      { length: LANDING_COUNT },
      (_, index) => new Sound(landingPath(base, index + 1)),
    );
    const metal = Array.from(
      { length: METAL_COUNT },
      (_, index) => new Sound(metalPath(base, index + 1)),
    );
    const results = await Promise.allSettled(
      [...grass, ...landing, ...metal].map((sound) => sound.load()),
    );
    this.grass = grass.filter((_, index) => results[index]?.status === 'fulfilled');
    this.landing = landing.filter(
      (_, index) => results[grass.length + index]?.status === 'fulfilled',
    );
    this.metal = metal.filter(
      (_, index) =>
        results[grass.length + landing.length + index]?.status === 'fulfilled',
    );
  }

  playGrass(volume: number = FOOTSTEP_VOLUME): void {
    if (this.grass.length === 0) {
      return;
    }
    const index = pickRandom(this.grass.length, this.lastGrass);
    this.lastGrass = index;
    const sound = this.grass[index];
    if (sound) {
      void sound.play(volume).catch(() => undefined);
    }
  }

  playLanding(volume: number = LANDING_VOLUME): void {
    if (this.landing.length === 0) {
      return;
    }
    const index = pickRandom(this.landing.length, this.lastLanding);
    this.lastLanding = index;
    const sound = this.landing[index];
    if (sound) {
      void sound.play(volume).catch(() => undefined);
    }
  }

  playMetal(volume: number = METAL_VOLUME): void {
    if (this.metal.length === 0) {
      return;
    }
    const index = pickRandom(this.metal.length, this.lastMetal);
    this.lastMetal = index;
    const sound = this.metal[index];
    if (sound) {
      void sound.play(volume).catch(() => undefined);
    }
  }
}

export const footstepAudio = new FootstepAudio();
