import {
  PreviewMenuScene,
  type PreviewStageOptions,
} from './PreviewMenuScene';

export interface CreditsCallbacks {
  onBack: () => void;
}

export class CreditsScene extends PreviewMenuScene {
  constructor(
    private readonly callbacks: CreditsCallbacks,
    preview: PreviewStageOptions,
  ) {
    super(preview);
  }

  protected render(): string {
    return `
      <div class="menu-panel credits-panel">
        <h1 class="menu-title">MEMORY GRAVEYARD</h1>
        <p class="menu-subtitle">credits</p>

        <div class="credits-section">
          <h3>Game</h3>
          <p>Memory Graveyard — project team.</p>
        </div>

        <div class="credits-section">
          <h3>Art</h3>
          <p>Pixel Platformer World — Szadi art. Free for personal and commercial use; credit appreciated.</p>
          <p class="credit-line">https://szadiart.itch.io/</p>
          <p>CC0 Currency Icons (silver coin) — AntumDeluge, OpenGameArt compilation; original OpenClipart Library. CC0 1.0.</p>
          <p class="credit-line">https://opengameart.org/node/121237</p>
          <p>Lightning Bolt Icons/Buttons Collection (green bolt) — pix3lcat (pix3lcat.github.io). CC0 1.0.</p>
          <p class="credit-line">https://pix3lcat.github.io/</p>
          <div class="credits-license">
            <p class="license-heading">Analog Horror Screen FX Free Sampler — License</p>
            <p class="license-copyright">Copyright (c) 2026 LESED (lesed.itch.io)</p>
            <ol>
              <li>You may use these overlays in personal and commercial projects: games, videos, streams, trailers and apps.</li>
              <li>You may modify them (recolour, crop, retime, combine) for use in your projects.</li>
              <li>You may not sell or share the overlay files themselves, alone or modified, including in other asset packs or templates.</li>
              <li>You may not use them to train or fine-tune generative AI models, or claim them as your own original work.</li>
              <li>Credit is appreciated but not required.</li>
              <li>The overlays are provided "as is", without warranty of any kind.</li>
            </ol>
          </div>
          <p class="credit-line">https://lesed.itch.io/analog-horror-screen-fx-free</p>
        </div>

        <div class="credits-section">
          <h3>Audio</h3>
          <p>8-bit Haunting — project team, generated with Suno.</p>
          <p>Spooky Forest Ambience — marchon11</p>
          <p class="credit-line">License: Attribution 3.0 (CC BY 3.0)</p>
          <p class="credit-line">"ambience spooky forest.mp3" by marchon11 -- https://freesound.org/s/493720/ -- License: Attribution 3.0</p>
          <p>Footsteps Sounds Volume 02 — The Sound Guild. Free for commercial use; the raw pack may not be redistributed. Final course approval pending.</p>
          <p class="credit-line">https://the-sound-guild.itch.io/footsteps-sounds-02</p>
          <p>Old Guardian — placeholder monster. Licence pending course approval; do not redistribute separately.</p>
        </div>

        <div class="menu-buttons">
          <button id="menu-back" class="menu-button">Back</button>
        </div>
      </div>`;
  }

  protected bind(): void {
    this.click('menu-back', () => this.close(() => this.callbacks.onBack()));
  }
}
