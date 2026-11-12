import { Sound } from 'excalibur';

const GRASS_COUNT = 7;
const FOOTSTEP_VOLUME = 0.32;

function grassPath(base: string, index: number): string {
  const frame = String(index).padStart(2, '0');
  return `${base}assets/audio/sound-guild/footsteps/grass/grass-${frame}.wav`;
}

/**
 * Small footstep sample bank. Sounds are loaded lazily by `load` so the game
 * can still boot if an audio file is missing.
 */
class FootstepAudio {
  private grass: Sound[] = [];
  private lastIndex = -1;

  async load(base: string): Promise<void> {
    const sounds = Array.from(
      { length: GRASS_COUNT },
      (_, index) => new Sound(grassPath(base, index + 1)),
    );
    const results = await Promise.allSettled(sounds.map((sound) => sound.load()));
    this.grass = sounds.filter((_, index) => results[index]?.status === 'fulfilled');
  }

  playGrass(volume: number = FOOTSTEP_VOLUME): void {
    if (this.grass.length === 0) {
      return;
    }
    let index = Math.floor(Math.random() * this.grass.length);
    if (this.grass.length > 1 && index === this.lastIndex) {
      index = (index + 1) % this.grass.length;
    }
    this.lastIndex = index;
    const sound = this.grass[index];
    if (!sound) {
      return;
    }
    void sound.play(volume).catch(() => undefined);
  }
}

export const footstepAudio = new FootstepAudio();
