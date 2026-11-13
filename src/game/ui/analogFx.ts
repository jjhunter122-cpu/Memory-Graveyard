import { ANALOG_FX_BASE, normalizeAnalogFxPreset } from '../analogFx';

const VIGNETTE_PATH = `${import.meta.env.BASE_URL}${ANALOG_FX_BASE}/vignette/640x360/vignette_000.png`;

/**
 * Screen-space analog-horror overlay. Title, options, credits and the run use
 * the Vignette preset.
 */
class AnalogOverlay {
  private root: HTMLElement | null = null;
  private image: HTMLImageElement | null = null;

  setPreset(preset: string | undefined): void {
    const normalized = normalizeAnalogFxPreset(preset);
    if (!normalized) {
      this.clear();
      return;
    }

    this.ensureRoot();
    if (!this.root || !this.image) {
      return;
    }
    this.root.classList.add('active');
    this.image.style.display = 'block';
    if (!this.image.getAttribute('src')) {
      this.image.src = VIGNETTE_PATH;
    }
  }

  clear(): void {
    this.root?.classList.remove('active');
    if (this.image) {
      this.image.style.display = 'none';
    }
  }

  private ensureRoot(): void {
    if (!this.root) {
      const existing = document.getElementById('analog-fx');
      if (existing) {
        this.root = existing;
      } else {
        const created = document.createElement('div');
        created.id = 'analog-fx';
        created.className = 'analog-fx';
        created.setAttribute('aria-hidden', 'true');
        (document.getElementById('shell') ?? document.body).append(created);
        this.root = created;
      }
    }

    if (!this.image) {
      const image = document.createElement('img');
      image.className = 'analog-layer';
      image.dataset.layer = 'vignette';
      image.alt = '';
      image.draggable = false;
      image.addEventListener('error', () => {
        image.style.display = 'none';
      });
      this.root.append(image);
      this.image = image;
    }
  }
}

export const analogOverlay = new AnalogOverlay();
