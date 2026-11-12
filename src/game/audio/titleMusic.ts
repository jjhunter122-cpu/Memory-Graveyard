import { Sound, WebAudio } from 'excalibur';

const TITLE_MUSIC_PATH = 'assets/audio/music/8-bit-haunting.mp3';
const DEFAULT_TITLE_VOLUME = 0.32;

/**
 * Title-screen music. Browsers block audio until a user gesture, so the track
 * waits for the first pointer or key press if the shared context is still
 * locked.
 */
class TitleMusic {
  private sound?: Sound;
  private loaded = false;
  private wanted = false;
  private playing = false;
  private gestureBound = false;
  private volume = DEFAULT_TITLE_VOLUME;

  private readonly onGesture = (): void => {
    this.unbindGesture();
    void WebAudio.unlock()
      .then(() => this.start())
      .catch(() => undefined);
  };

  async load(base: string): Promise<void> {
    this.sound = new Sound({
      paths: [`${base}${TITLE_MUSIC_PATH}`],
      volume: this.volume,
      loop: true,
    });
    try {
      await this.sound.load();
      this.loaded = true;
    } catch {
      this.loaded = false;
    }
  }

  playTitle(): void {
    this.wanted = true;
    if (!this.loaded || !this.sound) {
      return;
    }
    if (WebAudio.isUnlocked()) {
      this.start();
      return;
    }
    this.bindGesture();
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.sound) {
      this.sound.volume = this.volume;
    }
  }

  stop(): void {
    this.wanted = false;
    this.playing = false;
    this.unbindGesture();
    this.sound?.stop();
  }

  private start(): void {
    if (!this.wanted || this.playing || !this.sound) {
      return;
    }
    this.playing = true;
    void this.sound.play(this.volume).catch(() => {
      this.playing = false;
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

export const titleMusic = new TitleMusic();
