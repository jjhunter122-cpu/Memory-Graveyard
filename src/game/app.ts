import type { Engine, Scene } from 'excalibur';
import type { AssetManifest } from './level/manifest';
import type { LevelData } from './level/schema';
import { PlayScene } from './scenes/PlayScene';
import { EditorScene } from '../editor/EditorScene';

/**
 * Owns Excalibur scenes and the transitions between them.
 *
 * Scenes are recreated on every switch so each one starts from a clean slate
 * with the data it was handed. `main` wires "test play" and "open editor"
 * through here until the title screen (M4) takes over navigation.
 */
export class GameApp {
  private readonly keys = new Set<string>();

  constructor(
    private readonly engine: Engine,
    private readonly manifest: AssetManifest,
  ) {}

  /** Registers the first scene, starts the engine, then activates it. */
  async start(level: LevelData, startInEditor: boolean): Promise<void> {
    const key = startInEditor ? 'editor' : 'play';
    this.prepare(key, startInEditor ? this.editorScene(level) : this.playScene(level, false));
    await this.engine.start();
    await this.engine.goToScene(key);
  }

  play(level: LevelData, fromEditor: boolean): Promise<void> {
    return this.show('play', this.playScene(level, fromEditor));
  }

  edit(level: LevelData): Promise<void> {
    return this.show('editor', this.editorScene(level));
  }

  private playScene(level: LevelData, fromEditor: boolean): PlayScene {
    return new PlayScene(level, this.manifest, {
      fromEditor,
      onOpenEditor: (edited) => void this.edit(edited),
    });
  }

  private editorScene(level: LevelData): EditorScene {
    return new EditorScene(level, this.manifest, {
      onTestPlay: (tested) => void this.play(tested, true),
    });
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
