import { MenuScene } from './MenuScene';

export interface OptionsCallbacks {
  showHud: boolean;
  draftCount: number;
  onChangeShowHud: (value: boolean) => void;
  onClearDrafts: () => void;
  onBack: () => void;
}

export class OptionsScene extends MenuScene {
  constructor(private readonly callbacks: OptionsCallbacks) {
    super();
  }

  protected render(): string {
    return `
      <div class="menu-panel">
        <h2 class="menu-heading">Options</h2>
        <label class="option-row">
          <span>Show HUD</span>
          <input id="option-hud" type="checkbox" ${this.callbacks.showHud ? 'checked' : ''} />
        </label>
        <div class="option-row">
          <span>Saved drafts</span>
          <button id="option-clear" class="menu-button small" ${this.callbacks.draftCount === 0 ? 'disabled' : ''}>
            Clear ${this.callbacks.draftCount}
          </button>
        </div>
        <div class="menu-buttons">
          <button id="menu-back" class="menu-button">Back</button>
        </div>
      </div>`;
  }

  protected bind(): void {
    const checkbox = document.getElementById('option-hud');
    checkbox?.addEventListener('change', () => {
      this.callbacks.onChangeShowHud(checkbox instanceof HTMLInputElement ? checkbox.checked : true);
    });
    this.click('option-clear', () => this.callbacks.onClearDrafts());
    this.click('menu-back', () => this.callbacks.onBack());
  }
}
