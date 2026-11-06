import type { Engine, Scene } from 'excalibur';
import type { AssetManifest } from './level/manifest';
import type { LevelData } from './level/schema';
import { PlayScene } from './scenes/PlayScene';
import { EditorScene } from '../editor/EditorScene';
import { TitleScene } from './menus/TitleScene';
import { LevelSelectScene } from './menus/LevelSelectScene';
import { OptionsScene } from './menus/OptionsScene';
import type { DraftStore, LevelLibrary } from './storage/levels';
import type { SettingsStore } from './storage/settings';

export interface StartOptions {
  startInEditor: boolean;
  initialLevel?: LevelData;
}

/**
 * Owns Excalibur scenes and the menu graph between them. Scenes are recreated on
 * every switch so each starts clean with the data it was handed.
 */
export class GameApp {
  private readonly keys = new Set<string>();
  private readonly dev = import.meta.env.DEV;

  constructor(
    private readonly engine: Engine,
    private readonly manifest: AssetManifest,
    private readonly library: LevelLibrary,
    private readonly drafts: DraftStore,
    private readonly settings: SettingsStore,
  ) {}

  async start(options: StartOptions): Promise<void> {
    if (options.startInEditor && options.initialLevel) {
      this.prepare('editor', this.editorScene(options.initialLevel));
      await this.engine.start();
      await this.engine.goToScene('editor');
      return;
    }
    this.prepare('title', this.titleScene());
    await this.engine.start();
    await this.engine.goToScene('title');
  }

  // ---- menu navigation ------------------------------------------------------

  showTitle(): Promise<void> {
    return this.show('title', this.titleScene());
  }

  showLevelSelect(): Promise<void> {
    return this.show('levels', this.levelSelectScene());
  }

  showOptions(): Promise<void> {
    return this.show('options', this.optionsScene());
  }

  async playShipped(id: string): Promise<void> {
    try {
      const level = await this.library.loadShipped(id);
      this.settings.update({ lastLevelId: id });
      await this.play(level);
    } catch (error) {
      console.error('failed to load level', error);
      await this.showLevelSelect();
    }
  }

  playDraft(id: string): Promise<void> {
    try {
      const level = this.library.loadDraft(id);
      return this.play(level);
    } catch (error) {
      console.error('failed to load draft', error);
      return this.showLevelSelect();
    }
  }

  play(level: LevelData, fromEditor = false): Promise<void> {
    return this.show('play', this.playScene(level, fromEditor));
  }

  edit(level: LevelData): Promise<void> {
    return this.show('editor', this.editorScene(level));
  }

  // ---- scene factories ------------------------------------------------------

  private titleScene(): TitleScene {
    return new TitleScene({
      dev: this.dev,
      onPlay: () => void this.playLast(),
      onLevelSelect: () => void this.showLevelSelect(),
      onOptions: () => void this.showOptions(),
      onEditor: () => void this.editInitial(),
    });
  }

  private levelSelectScene(): LevelSelectScene {
    return new LevelSelectScene({
      shipped: this.library.shipped(),
      drafts: this.library.draftsList(),
      dev: this.dev,
      onPlayShipped: (id) => void this.playShipped(id),
      onPlayDraft: (id) => void this.playDraft(id),
      onEditDraft: (id) => void this.editDraft(id),
      onDeleteDraft: (id) => {
        this.drafts.remove(id);
        void this.showLevelSelect();
      },
      onBack: () => void this.showTitle(),
    });
  }

  private optionsScene(): OptionsScene {
    const settings = this.settings.load();
    return new OptionsScene({
      showHud: settings.showHud,
      draftCount: this.library.draftsList().length,
      onChangeShowHud: (value) => this.settings.update({ showHud: value }),
      onClearDrafts: () => {
        for (const draft of this.library.draftsList()) {
          this.drafts.remove(draft.id);
        }
        void this.showOptions();
      },
      onBack: () => void this.showTitle(),
    });
  }

  private playScene(level: LevelData, fromEditor: boolean): PlayScene {
    return new PlayScene(level, this.manifest, {
      fromEditor,
      showHud: this.settings.load().showHud,
      onOpenEditor: (edited) => void this.edit(edited),
      onLevelSelect: () => void this.showLevelSelect(),
      onTitle: () => void this.showTitle(),
    });
  }

  private editorScene(level: LevelData): EditorScene {
    return new EditorScene(level, this.manifest, {
      onTestPlay: (tested) => void this.play(tested, true),
      onMenu: () => void this.showTitle(),
      drafts: this.drafts,
    });
  }

  // ---- helpers --------------------------------------------------------------

  private async playLast(): Promise<void> {
    const shipped = this.library.shipped();
    const last = this.settings.load().lastLevelId;
    const entry = shipped.find((level) => level.id === last) ?? shipped[0];
    if (!entry) {
      await this.showLevelSelect();
      return;
    }
    await this.playShipped(entry.id);
  }

  private editInitial(): Promise<void> {
    const shipped = this.library.shipped();
    const last = this.settings.load().lastLevelId;
    const entry = shipped.find((level) => level.id === last) ?? shipped[0];
    if (!entry) {
      return this.showLevelSelect();
    }
    return this.playShippedForEdit(entry.id);
  }

  private async playShippedForEdit(id: string): Promise<void> {
    try {
      await this.edit(await this.library.loadShipped(id));
    } catch (error) {
      console.error('failed to open editor level', error);
      await this.showLevelSelect();
    }
  }

  private editDraft(id: string): void {
    const level = this.library.loadDraft(id);
    void this.edit(level);
  }

  private prepare(key: string, scene: Scene): void {
    if (this.keys.has(key)) {
      this.engine.removeScene(key);
      this.keys.delete(key);
    }
    this.engine.addScene(key, scene);
    this.keys.add(key);
  }

  private async show(key: string, scene: Scene): Promise<void> {
    this.prepare(key, scene);
    await this.engine.goToScene(key);
  }
}
