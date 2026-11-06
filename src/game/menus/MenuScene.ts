import { Scene } from 'excalibur';
import { setMode } from '../ui/mode';

/** Base class for DOM-overlay menu screens. */
export abstract class MenuScene extends Scene {
  protected root: HTMLElement | null = null;

  override onActivate(): void {
    setMode('menu');
    this.root = document.getElementById('menu-ui');
    if (this.root) {
      this.root.innerHTML = this.render();
      this.bind();
    }
  }

  override onDeactivate(): void {
    if (this.root) {
      this.root.innerHTML = '';
    }
  }

  protected abstract render(): string;

  protected bind(): void {
    /* overridden as needed */
  }

  protected click(id: string, handler: () => void): void {
    document.getElementById(id)?.addEventListener('click', () => handler());
  }

  protected clickAll(selector: string, handler: (dataset: DOMStringMap) => void): void {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.addEventListener('click', () => handler(element.dataset));
    });
  }
}

export function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
