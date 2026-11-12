import { Sound, WebAudio } from 'excalibur';
import { AMBIENCE_TRACKS } from './ambienceTracks';

const AMBIENCE_VOLUME = 0.26;

class AmbienceAudio {
  private readonly sounds = new Map<string, Sound>();
  private readonly loaded = new Set<string>();
  private volume = AMBIENCE_VOLUME;
  private wanted: string | undefined;
  private playingId: string | undefined;
  private gestureBound = false;

  private readonly onGesture = (): void => {
    this.unbindGesture();
    void WebAudio.unlock()
      .then(() => this.start())
      .catch(() => undefined);
  };

  async load(base: string): Promise<void> {
    await Promise.allSettled(
      AMBIENCE_TRACKS.map(async (track) => {
        const sound = new Sound({
          paths: [`${base}${track.path}`],
          volume: this.volume,
          loop: true,
        });
        try {
          await sound.load();
          this.sounds.set(track.id, sound);
          this.loaded.add(track.id);
        } catch {
          // Missing ambience should never block the game from starting.
        }
      }),
    );
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    for (const sound of this.sounds.values()) {
      sound.volume = this.volume;
    }
  }

  play(id: string | undefined): void {
    this.wanted = id && this.loaded.has(id) ? id : undefined;
    if (!this.wanted) {
      this.stop();
      return;
    }
    if (WebAudio.isUnlocked()) {
      this.start();
      return;
    }
    this.bindGesture();
  }

  stop(): void {
    this.wanted = undefined;
    this.playingId = undefined;
    this.unbindGesture();
    for (const sound of this.sounds.values()) {
      sound.stop();
    }
  }

  private start(): void {
    if (!this.wanted || this.playingId === this.wanted) {
      return;
    }
    const sound = this.sounds.get(this.wanted);
    if (!sound) {
      return;
    }
    for (const [id, other] of this.sounds) {
      if (id !== this.wanted) {
        other.stop();
      }
    }
    this.playingId = this.wanted;
    sound.volume = this.volume;
    void sound.play(this.volume).catch(() => {
      if (this.playingId === this.wanted) {
        this.playingId = undefined;
      }
    });
  }

  private bindGesture(): void {
    if (this.gestureBound) {
      return;
    }
    this.gestureBound = true;
    window.addEventListener('pointerdown', this.onGesture, {
      once: true,
      capture: true,
    });
    window.addEventListener('keydown', this.onGesture, {
      once: true,
      capture: true,
    });
  }

  private unbindGesture(): void {
    if (!this.gestureBound) {
      return;
    }
    this.gestureBound = false;
    window.removeEventListener('pointerdown', this.onGesture, { capture: true });
    window.removeEventListener('keydown', this.onGesture, { capture: true });
  }
}

export const ambienceAudio = new AmbienceAudio();
