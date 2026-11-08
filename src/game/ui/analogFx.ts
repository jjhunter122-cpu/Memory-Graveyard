import {
  ANALOG_FX_BASE,
  ANALOG_FX_FPS,
  ANALOG_FX_FRAMES,
  normalizeAnalogFxPreset,
} from '../analogFx';

type LayerName = 'static' | 'scanlines' | 'vignette';

const LAYERS: readonly LayerName[] = ['static', 'scanlines', 'vignette'];

function staticPath(index: number): string {
  const frame = String(index).padStart(3, '0');
  return `${import.meta.env.BASE_URL}${ANALOG_FX_BASE}/static_light/640x360/static_light_${frame}.png`;
}

const SCANLINES_PATH = `${import.meta.env.BASE_URL}${ANALOG_FX_BASE}/scanlines/640x360/scanlines_000.png`;
const VIGNETTE_PATH = `${import.meta.env.BASE_URL}${ANALOG_FX_BASE}/vignette/640x360/vignette_000.png`;

/**
 * Screen-space analog-horror overlay. Only PlayScene activates it; the editor
 * stores the level setting but never renders the effect.
 */
class AnalogOverlay {
  private root: HTMLElement | null = null;
  private readonly layers: Partial<Record<LayerName, HTMLImageElement>> = {};
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private preloaded = false;

  setPreset(preset: string | undefined): void {
    this.stop();
    const normalized = normalizeAnalogFxPreset(preset);
    if (!normalized) {
      this.clear();
      return;
    }

    this.ensureRoot();
    if (!this.root) {
      return;
    }
    this.root.classList.add('active');

    const combined = normalized === 'combined';
    this.setLayerVisible('static', combined || normalized === 'static');
    this.setLayerVisible('scanlines', combined || normalized === 'scanlines');
    this.setLayerVisible('vignette', combined || normalized === 'vignette');

    const grain = this.layers.static;
    if (grain) {
      grain.src = staticPath(this.frame % ANALOG_FX_FRAMES.static);
    }

    if (combined || normalized === 'static') {
      this.start();
    }
  }

  clear(): void {
    this.stop();
    this.root?.classList.remove('active');
    for (const layer of LAYERS) {
      this.setLayerVisible(layer, false);
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

    for (const layer of LAYERS) {
      if (!this.layers[layer]) {
        const image = document.createElement('img');
        image.className = 'analog-layer';
        image.dataset.layer = layer;
        image.alt = '';
        image.draggable = false;
        image.addEventListener('error', () => {
          image.style.display = 'none';
        });
        this.root.append(image);
        this.layers[layer] = image;
      }
    }

    if (!this.preloaded) {
      this.preloaded = true;
      for (let index = 0; index < ANALOG_FX_FRAMES.static; index += 1) {
        const image = new Image();
        image.src = staticPath(index);
      }
    }

    const scanlines = this.layers.scanlines;
    if (scanlines && !scanlines.getAttribute('src')) {
      scanlines.src = SCANLINES_PATH;
    }
    const vignette = this.layers.vignette;
    if (vignette && !vignette.getAttribute('src')) {
      vignette.src = VIGNETTE_PATH;
    }
  }

  private setLayerVisible(layer: LayerName, visible: boolean): void {
    const image = this.layers[layer];
    if (image) {
      image.style.display = visible ? 'block' : 'none';
    }
  }

  private start(): void {
    if (this.timer !== null) {
      return;
    }
    const interval = 1000 / ANALOG_FX_FPS;
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % ANALOG_FX_FRAMES.static;
      const grain = this.layers.static;
      if (grain) {
        grain.src = staticPath(this.frame % ANALOG_FX_FRAMES.static);
      }
    }, interval);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const analogOverlay = new AnalogOverlay();
