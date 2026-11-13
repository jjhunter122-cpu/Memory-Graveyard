import type { Engine, Scene } from 'excalibur';
import type { GameTextures } from './assets';
import type { AssetManifest } from './level/manifest';
import { RunScene } from './scenes/RunScene';
import { TitleScene } from './menus/TitleScene';
import { CreditsScene } from './menus/CreditsScene';
import { OptionsScene } from './menus/OptionsScene';
import type { Settings, SettingsStore } from './storage/settings';
import { titleMusic } from './audio/titleMusic';
import { footstepAudio } from './audio/footsteps';
import { ambienceAudio } from './audio/ambience';
import { analogOverlay } from './ui/analogFx';

/**
 * Owns Excalibur scenes and the menu graph between them. Scenes are recreated on
 * every switch so each starts clean with the data it was handed.
 */
export class GameApp {
  private lastKey: string | null = null;
  private counter = 0;

  constructor(
    private readonly engine: Engine,
    private readonly manifest: AssetManifest,
    private readonly settings: SettingsStore,
    private readonly textures: GameTextures,
  ) {}

  async start(): Promise<void> {
    this.applyAudioSettings();
    const key = this.uniqueKey('title');
    this.engine.addScene(key, this.titleScene());
    this.lastKey = key;
    await this.engine.start();
    await this.engine.goToScene(key);
  }

  // ---- menu navigation ------------------------------------------------------

  showTitle(): Promise<void> {
    return this.show('title', this.titleScene());
  }

  showOptions(): Promise<void> {
    return this.show('options', this.optionsScene());
  }

  showCredits(): Promise<void> {
    return this.show(
      'credits',
      new CreditsScene(
        { onBack: () => void this.showTitle() },
        {
          manifest: this.manifest,
          textures: this.textures,
          seed: Math.floor(Math.random() * 0xffffffff),
        },
      ),
    );
  }

  startRun(): Promise<void> {
    const seed = Math.floor(Math.random() * 0xffffffff);
    const bestScore = this.settings.load().highScore;
    return this.show(
      'run',
      new RunScene(this.manifest, this.textures, {
        seed,
        bestScore,
        onRestart: () => void this.startRun(),
        onHome: () => void this.showTitle(),
        onRunEnd: (score) => {
          if (score > this.settings.load().highScore) {
            this.settings.update({ highScore: score });
          }
        },
      }),
    );
  }

  // ---- scene factories ------------------------------------------------------

  private titleScene(): TitleScene {
    return new TitleScene({
      highScore: this.settings.load().highScore,
      manifest: this.manifest,
      textures: this.textures,
      onPlay: () => void this.startRun(),
      onOptions: () => void this.showOptions(),
      onCredits: () => void this.showCredits(),
    });
  }

  private optionsScene(): OptionsScene {
    const settings = this.settings.load();
    return new OptionsScene(
      {
        masterVolume: settings.masterVolume,
        musicVolume: settings.musicVolume,
        sfxVolume: settings.sfxVolume,
        onChangeMasterVolume: (value) =>
          this.setVolumeSetting({ masterVolume: value }),
        onChangeMusicVolume: (value) =>
          this.setVolumeSetting({ musicVolume: value }),
        onChangeSfxVolume: (value) =>
          this.setVolumeSetting({ sfxVolume: value }),
        onBack: () => void this.showTitle(),
      },
      {
        manifest: this.manifest,
        textures: this.textures,
        seed: Math.floor(Math.random() * 0xffffffff),
      },
    );
  }

  // ---- helpers --------------------------------------------------------------

  private uniqueKey(base: string): string {
    this.counter += 1;
    return `${base}-${this.counter}`;
  }

  private applyAudioSettings(): Settings {
    const settings = this.settings.load();
    titleMusic.setVolume(settings.masterVolume * settings.musicVolume);
    ambienceAudio.setVolume(settings.masterVolume * settings.musicVolume * 0.8);
    footstepAudio.setVolumeScale(settings.masterVolume * settings.sfxVolume);
    return settings;
  }

  private setVolumeSetting(
    patch: Partial<Pick<Settings, 'masterVolume' | 'musicVolume' | 'sfxVolume'>>,
  ): void {
    this.settings.update(patch);
    this.applyAudioSettings();
  }

  private async show(key: string, scene: Scene): Promise<void> {
    analogOverlay.clear();
    const keepMusic =
      scene instanceof TitleScene ||
      scene instanceof CreditsScene ||
      scene instanceof OptionsScene;
    if (keepMusic) {
      titleMusic.playTitle();
    } else {
      titleMusic.stop();
    }
    const previous = this.lastKey;
    const unique = this.uniqueKey(key);
    this.engine.addScene(unique, scene);
    this.lastKey = unique;
    await this.engine.goToScene(unique);
    if (previous && previous !== unique) {
      this.engine.removeScene(previous);
    }
  }
}
