/**
 * A tiny always-available diagnostics panel (toggled with `F3`).
 * Shows frame pacing and live player state so stutter can be told apart from
 * physics feel.
 */
export class DebugOverlay {
  private readonly element: HTMLElement;
  private visible = false;
  private lastFrame = performance.now();
  private smoothedFps = 60;

  constructor() {
    this.element = document.createElement('pre');
    this.element.id = 'debug-overlay';
    this.element.className = 'debug-overlay';
    this.element.hidden = true;
    (document.getElementById('shell') ?? document.body).append(this.element);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'F3' || event.code === 'F3') {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  get isVisible(): boolean {
    return this.visible;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.hidden = !this.visible;
  }

  /** Call once per rendered frame; returns the smoothed FPS. */
  frame(): number {
    const now = performance.now();
    const dt = now - this.lastFrame;
    this.lastFrame = now;
    if (dt > 0) {
      this.smoothedFps = this.smoothedFps * 0.85 + (1000 / dt) * 0.15;
    }
    return this.smoothedFps;
  }

  render(fields: Record<string, string>): void {
    if (!this.visible) {
      return;
    }
    this.element.textContent = Object.entries(fields)
      .map(([key, value]) => `${key.padEnd(10)} ${value}`)
      .join('\n');
  }
}

let instance: DebugOverlay | null = null;

/** Shared overlay so it survives scene switches. */
export function debugOverlay(): DebugOverlay {
  if (!instance) {
    instance = new DebugOverlay();
  }
  return instance;
}
