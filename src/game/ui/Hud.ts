import { rankFor } from '../systems/graveyard';

/** Thin wrapper over the DOM overlay so the scene never touches elements directly. */
export class Hud {
  private readonly collectedEl: HTMLElement | null;
  private readonly rankEl: HTMLElement | null;
  private readonly toastEl: HTMLElement | null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.collectedEl = document.getElementById('collected');
    this.rankEl = document.getElementById('rank');
    this.toastEl = document.getElementById('toast');
  }

  setProgress(collected: number, total: number): void {
    if (this.collectedEl) {
      this.collectedEl.textContent = `${collected} / ${total}`;
    }
    if (this.rankEl) {
      this.rankEl.textContent = rankFor(collected, total).toUpperCase();
    }
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
