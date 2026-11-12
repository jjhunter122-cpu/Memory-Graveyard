import { MenuScene } from './MenuScene';

export interface CreditsCallbacks {
  onBack: () => void;
}

export class CreditsScene extends MenuScene {
  constructor(private readonly callbacks: CreditsCallbacks) {
    super();
  }

  protected render(): string {
    return `
      <div class="menu-panel credits-panel">
        <h2 class="menu-heading">Credits</h2>

        <div class="credits-section">
          <h3>Game</h3>
          <p>Memory Graveyard — project team.</p>
        </div>

        <div class="credits-section">
          <h3>Art</h3>
          <p>Pixel Platformer World — Szadi art. Free for personal and commercial use; credit appreciated.</p>
          <p class="credit-line">https://szadiart.itch.io/</p>
          <p>Grunge tileset — Luis Zuno (@ansimuz). CC0 1.0.</p>
          <p class="credit-line">https://ansimuz.com</p>
          <p>Analog Horror Screen FX — LESED. Custom free-use licence, used for the Vignette.</p>
          <p class="credit-line">https://lesed.itch.io/analog-horror-screen-fx-free</p>
          <p>Old Guardian — placeholder monster. Licence pending course approval; do not redistribute separately.</p>
        </div>

        <div class="credits-section">
          <h3>Audio</h3>
          <p>Footsteps Sounds Volume 02 — The Sound Guild. Free for commercial use; the raw pack may not be redistributed.</p>
          <p class="credit-line">https://the-sound-guild.itch.io/footsteps-sounds-02</p>
          <p>8-bit Haunting — project team, generated with Suno.</p>
          <p class="credit-line">"ambience spooky forest.mp3" by marchon11 -- https://freesound.org/s/493720/ -- License: Attribution 3.0</p>
        </div>

        <div class="menu-buttons">
          <button id="menu-back" class="menu-button">Back</button>
        </div>
      </div>`;
  }

  protected bind(): void {
    this.click('menu-back', () => this.callbacks.onBack());
  }
}
