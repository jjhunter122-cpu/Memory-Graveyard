import { MenuScene } from './MenuScene';

export interface OptionsCallbacks {
  showHud: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  draftCount: number;
  onChangeShowHud: (value: boolean) => void;
  onChangeMasterVolume: (value: number) => void;
  onChangeMusicVolume: (value: number) => void;
  onChangeSfxVolume: (value: number) => void;
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
        <div class="menu-section">Audio</div>
        <label class="option-row option-slider">
          <span>Master volume <em id="option-master-value">${Math.round(this.callbacks.masterVolume * 100)}%</em></span>
          <input id="option-master" type="range" min="0" max="100" step="1" value="${Math.round(this.callbacks.masterVolume * 100)}" />
        </label>
        <label class="option-row option-slider">
          <span>Music volume <em id="option-music-value">${Math.round(this.callbacks.musicVolume * 100)}%</em></span>
          <input id="option-music" type="range" min="0" max="100" step="1" value="${Math.round(this.callbacks.musicVolume * 100)}" />
        </label>
        <label class="option-row option-slider">
          <span>SFX volume <em id="option-sfx-value">${Math.round(this.callbacks.sfxVolume * 100)}%</em></span>
          <input id="option-sfx" type="range" min="0" max="100" step="1" value="${Math.round(this.callbacks.sfxVolume * 100)}" />
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
    this.bindVolume('option-master', 'option-master-value', this.callbacks.onChangeMasterVolume);
    this.bindVolume('option-music', 'option-music-value', this.callbacks.onChangeMusicVolume);
    this.bindVolume('option-sfx', 'option-sfx-value', this.callbacks.onChangeSfxVolume);
    this.click('option-clear', () => this.callbacks.onClearDrafts());
    this.click('menu-back', () => this.callbacks.onBack());
  }

  private bindVolume(
    inputId: string,
    valueId: string,
    onChange: (value: number) => void,
  ): void {
    const input = document.getElementById(inputId);
    const value = document.getElementById(valueId);
    input?.addEventListener('input', () => {
      if (input instanceof HTMLInputElement) {
        const volume = Number(input.value) / 100;
        value?.replaceChildren(`${Math.round(volume * 100)}%`);
        onChange(volume);
      }
    });
  }
}
