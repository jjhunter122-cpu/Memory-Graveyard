/**
 * Thin wrapper over the run's toast element. The HUD itself is static markup in
 * `index.html`; scenes only need to announce short messages.
 */
export class Hud {
  private readonly toastEl: HTMLElement | null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.toastEl = document.getElementById('toast');
  }

  toast(message: string, ms = 1400): void {
    if (!this.toastEl) {
      return;
    }
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastEl?.classList.remove('show');
      this.toastTimer = null;
    }, ms);
  }
}
