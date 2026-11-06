import { MenuScene } from './MenuScene';

export interface TitleCallbacks {
  dev: boolean;
  onPlay: () => void;
  onLevelSelect: () => void;
  onOptions: () => void;
  onEditor: () => void;
  onSequence: () => void;
}

export class TitleScene extends MenuScene {
  constructor(private readonly callbacks: TitleCallbacks) {
    super();
  }

  protected render(): string {
    return `
      <div class="menu-panel title-panel">
        <h1 class="menu-title">MEMORY GRAVEYARD</h1>
        <p class="menu-subtitle">collect what the dead left behind</p>
        <div class="menu-buttons">
          <button id="menu-play" class="menu-button primary">Play campaign</button>
          <button id="menu-levels" class="menu-button">Level select</button>
          <button id="menu-options" class="menu-button">Options</button>
          ${this.callbacks.dev ? '<button id="menu-sequence" class="menu-button ghost">Edit campaign</button>' : ''}
          ${this.callbacks.dev ? '<button id="menu-editor" class="menu-button ghost">Level editor</button>' : ''}
        </div>
        <p class="menu-footnote">${this.callbacks.dev ? 'dev build · authoring enabled' : '\u00a0'}</p>
      </div>`;
  }

  protected bind(): void {
    this.click('menu-play', () => this.callbacks.onPlay());
    this.click('menu-levels', () => this.callbacks.onLevelSelect());
    this.click('menu-options', () => this.callbacks.onOptions());
    if (this.callbacks.dev) {
      this.click('menu-sequence', () => this.callbacks.onSequence());
      this.click('menu-editor', () => this.callbacks.onEditor());
    }
  }
}
