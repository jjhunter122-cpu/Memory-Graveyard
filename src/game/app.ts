import type { Engine, Scene } from 'excalibur';
import type { GameTextures } from './assets';
import type { AssetManifest } from './level/manifest';
import type { LevelData } from './level/schema';
import { PlayScene, type PlayOrigin } from './scenes/PlayScene';
import { EditorScene } from '../editor/EditorScene';
import { TitleScene } from './menus/TitleScene';
import { LevelSelectScene } from './menus/LevelSelectScene';
import { OptionsScene } from './menus/OptionsScene';
import { SequenceScene } from './menus/SequenceScene';
import type { DraftStore, LevelLibrary } from './storage/levels';
import type { SettingsStore } from './storage/settings';
import { analogOverlay } from './ui/analogFx';

export interface StartOptions {
  startInEditor: boolean;
  initialLevel?: LevelData;
}

interface PlayOptions {
  origin?: PlayOrigin;
  fromEditor?: boolean;
  sequence?: { index: number; total: number };
  onLevelComplete?: (level: LevelData) => void;
}

/**
 * Owns Excalibur scenes and the menu graph between them. Scenes are recreated on
 * every switch so each starts clean with the data it was handed.
 */
export class GameApp {
  private readonly dev = import.meta.env.DEV;
  private lastKey: string | null = null;
  private counter = 0;

  constructor(
    private readonly engine: Engine,
    private readonly manifest: AssetManifest,
    private readonly library: LevelLibrary,
    private readonly drafts: DraftStore,
    private readonly settings: SettingsStore,
    private readonly textures: GameTextures,
  ) {}

  async start(options: StartOptions): Promise<void> {
    const editor = options.startInEditor && options.initialLevel;
    const scene = editor
      ? this.editorScene(options.initialLevel as LevelData)
      : this.titleScene();
    const key = this.uniqueKey(editor ? 'editor' : 'title');
    this.engine.addScene(key, scene);
    this.lastKey = key;
    await this.engine.start();
    await this.engine.goToScene(key);
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

  showSequence(): Promise<void> {
    return this.show('sequence', this.sequenceScene());
  }

  async playCampaign(): Promise<void> {
    const entries = this.library.campaignEntries();
    if (entries.length === 0) {
      await this.showLevelSelect();
      return;
    }
    await this.playCampaignAt(entries, 0);
  }

  async playShipped(id: string): Promise<void> {
    try {
      const level = await this.library.loadShipped(id);
      this.settings.update({ lastLevelId: id });
      await this.play(level, {
        origin: 'levelSelect',
        onLevelComplete: () => void this.showLevelSelect(),
      });
    } catch (error) {
      console.error('failed to load level', error);
      await this.showLevelSelect();
    }
  }

  playDraft(id: string): Promise<void> {
    try {
      return this.play(this.library.loadDraft(id), {
        origin: 'levelSelect',
        onLevelComplete: () => void this.showLevelSelect(),
      });
    } catch (error) {
      console.error('failed to load draft', error);
      return this.showLevelSelect();
    }
  }

  play(level: LevelData, options: PlayOptions): Promise<void> {
    const playOptions = options.fromEditor
      ? {
          ...options,
          onLevelComplete: (tested: LevelData) => void this.edit(tested),
        }
      : options;
    return this.show('play', this.playScene(level, playOptions));
  }

  edit(level: LevelData): Promise<void> {
    return this.show('editor', this.editorScene(level));
  }

  // ---- scene factories ------------------------------------------------------

  private titleScene(): TitleScene {
    return new TitleScene({
      dev: this.dev,
      onPlay: () => void this.playCampaign(),
      onLevelSelect: () => void this.showLevelSelect(),
      onOptions: () => void this.showOptions(),
      onEditor: () => void this.editInitial(),
      onSequence: () => void this.showSequence(),
    });
  }

  private levelSelectScene(): LevelSelectScene {
    return new LevelSelectScene({
      devLevels: this.library.devLevels(),
      communityLevels: this.library.communityLevels(),
      drafts: this.library.draftsList(),
      hasCampaign: this.library.campaignEntries().length > 0,
      dev: this.dev,
      onPlayCampaign: () => void this.playCampaign(),
      onPlayShipped: (id) => void this.playShipped(id),
      onEditLevel: (id) => void this.editShipped(id),
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

  private sequenceScene(): SequenceScene {
    const main = this.library.mainSequence();
    return new SequenceScene({
      devLevels: this.library.devLevels(),
      campaignName: main?.name ?? 'Main Campaign',
      initial: main?.levels ?? [],
      onSave: (levels, name) => this.saveSequence(levels, name),
      onBack: () => void this.showTitle(),
    });
  }

  private playScene(level: LevelData, options: PlayOptions): PlayScene {
    return new PlayScene(level, this.manifest, this.textures, {
      origin: options.origin,
      fromEditor: options.fromEditor,
      showHud: this.settings.load().showHud,
      sequence: options.sequence,
      onLevelComplete: options.onLevelComplete,
      onSaveDraft: (level) => this.drafts.save(level),
      onOpenEditor: (edited) => void this.edit(edited),
      onLevelSelect: () => void this.showLevelSelect(),
      onTitle: () => void this.showTitle(),
    });
  }

  private editorScene(level: LevelData): EditorScene {
    return new EditorScene(level, this.manifest, {
      onTestPlay: (tested) =>
        void this.play(tested, { fromEditor: true, origin: 'editor' }),
      onMenu: () => void this.showTitle(),
      drafts: this.drafts,
      library: this.library,
      textures: this.textures,
      onProjectSaved: () => this.library.reload(),
    });
  }

  // ---- helpers --------------------------------------------------------------

  private async playCampaignAt(
    entries: ReturnType<LevelLibrary['campaignEntries']>,
    index: number,
  ): Promise<void> {
    if (index >= entries.length) {
      await this.showLevelSelect();
      return;
    }
    const entry = entries[index];
    if (!entry) {
      await this.showLevelSelect();
      return;
    }
    try {
      const level = await this.library.loadShipped(entry.id);
      this.settings.update({ lastLevelId: entry.id });
      await this.play(level, {
        origin: 'campaign',
        sequence: { index, total: entries.length },
        onLevelComplete: () => void this.playCampaignAt(entries, index + 1),
      });
    } catch (error) {
      console.error('campaign level failed to load', error);
      await this.showLevelSelect();
    }
  }

  private async saveSequence(
    levels: string[],
    name: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch('/__sequences/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: [{ id: 'main', name, levels }] }),
      });
      if (!response.ok) {
        throw new Error(`server returned ${response.status}`);
      }
      await this.library.reload();
      return { ok: true, message: `saved ${levels.length} level(s) to the campaign` };
    } catch (error) {
      return { ok: false, message: `save failed: ${(error as Error).message}` };
    }
  }

  private async editInitial(): Promise<void> {
    const shipped = this.library.devLevels();
    const last = this.settings.load().lastLevelId;
    const entry = shipped.find((level) => level.id === last) ?? shipped[0];
    if (!entry) {
      await this.showLevelSelect();
      return;
    }
    await this.editShipped(entry.id);
  }

  private async editShipped(id: string): Promise<void> {
    try {
      await this.edit(await this.library.loadShipped(id));
    } catch (error) {
      console.error('failed to open editor level', error);
      await this.showLevelSelect();
    }
  }

  private editDraft(id: string): void {
    try {
      void this.edit(this.library.loadDraft(id));
    } catch (error) {
      console.error('failed to open draft', error);
      void this.showLevelSelect();
    }
  }

  private uniqueKey(base: string): string {
    this.counter += 1;
    return `${base}-${this.counter}`;
  }

  private async show(key: string, scene: Scene): Promise<void> {
    analogOverlay.clear();
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
