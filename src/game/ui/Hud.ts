export type ThreatTone = 'dormant' | 'calm' | 'near' | 'close';

/** Thin wrapper over the DOM overlay so the scene never touches elements directly. */
export class Hud {
  private readonly collectedEl: HTMLElement | null;
  private readonly threatEl: HTMLElement | null;
  private readonly levelEl: HTMLElement | null;
  private readonly panelEl: HTMLElement | null;
  private readonly toastEl: HTMLElement | null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.collectedEl = document.getElementById('collected');
    this.threatEl = document.getElementById('threat');
    this.levelEl = document.getElementById('level-name');
    this.panelEl = document.getElementById('hud-panel');
    this.toastEl = document.getElementById('toast');
  }

  setLevelName(name: string): void {
    if (this.levelEl) {
      this.levelEl.textContent = name;
    }
  }

  setVisible(visible: boolean): void {
    if (this.panelEl) {
      this.panelEl.hidden = !visible;
    }
  }

  /** Memory fragments are optional, so this is just a counter. */
  setProgress(collected: number, total: number): void {
    if (this.collectedEl) {
      this.collectedEl.textContent = `${collected} / ${total}`;
    }
  }

  setThreat(label: string, tone: ThreatTone = 'calm'): void {
    if (this.threatEl) {
      this.threatEl.textContent = label.toUpperCase();
      this.threatEl.className = `value threat ${tone}`;
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
