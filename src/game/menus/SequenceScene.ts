import type { LevelEntry } from '../storage/levels';
import { escapeHtml, MenuScene } from './MenuScene';

export interface SequenceCallbacks {
  devLevels: LevelEntry[];
  campaignName: string;
  initial: string[];
  onSave: (levels: string[], name: string) => Promise<{ ok: boolean; message: string }>;
  onBack: () => void;
}

/** Dev-only screen for ordering the main campaign (Dev Made levels). */
export class SequenceScene extends MenuScene {
  private order: string[];
  private name: string;
  private status = '';
  private readonly byId: Map<string, LevelEntry>;

  constructor(private readonly callbacks: SequenceCallbacks) {
    super();
    this.order = [...callbacks.initial];
    this.name = callbacks.campaignName;
    this.byId = new Map(callbacks.devLevels.map((level) => [level.id, level]));
  }

  protected render(): string {
    const rows =
      this.order
        .map((id, index) => {
          const entry = this.byId.get(id);
          const label = entry ? entry.name : `${id} (missing)`;
          return `
          <div class="seq-row">
            <span class="seq-index">${index + 1}</span>
            <span class="seq-name">${escapeHtml(label)}</span>
            <button class="seq-act" data-up="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="seq-act" data-down="${index}" ${index === this.order.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="seq-act danger" data-remove="${index}">✕</button>
          </div>`;
        })
        .join('') || '<p class="menu-empty">no levels in the campaign yet</p>';

    const available =
      this.callbacks.devLevels
        .filter((level) => !this.order.includes(level.id))
        .map(
          (level) => `
        <button class="level-row" data-add="${escapeHtml(level.id)}">
          <span class="level-name">${escapeHtml(level.name)}</span>
          <span class="level-tag">add</span>
        </button>`,
        )
        .join('') || '<p class="menu-empty">every Dev Made level is already in the campaign</p>';

    return `
      <div class="menu-panel wide">
        <h2 class="menu-heading">Campaign sequence</h2>
        <label class="option-row">
          <span>Name</span>
          <input id="seq-name" class="ed-name" value="${escapeHtml(this.name)}" />
        </label>
        <h3 class="menu-section">Order</h3>
        <div class="seq-list">${rows}</div>
        <h3 class="menu-section">Dev Made levels</h3>
        <div class="level-list">${available}</div>
        <div class="menu-buttons">
          <button id="seq-save" class="menu-button primary">Save to project</button>
          <button id="seq-back" class="menu-button">Back</button>
        </div>
        <p class="menu-footnote">${escapeHtml(this.status)}</p>
      </div>`;
  }

  protected bind(): void {
    this.clickAll('[data-up]', (data) => this.move(Number(data.up), -1));
    this.clickAll('[data-down]', (data) => this.move(Number(data.down), 1));
    this.clickAll('[data-remove]', (data) => {
      this.order.splice(Number(data.remove), 1);
      this.redraw();
    });
    this.clickAll('[data-add]', (data) => {
      if (data.add) {
        this.order.push(data.add);
        this.redraw();
      }
    });
    const nameInput = document.getElementById('seq-name');
    nameInput?.addEventListener('change', () => {
      if (nameInput instanceof HTMLInputElement) {
        this.name = nameInput.value;
      }
    });
    this.click('seq-save', () => void this.save());
    this.click('seq-back', () => this.callbacks.onBack());
  }

  private move(index: number, direction: number): void {
    const target = index + direction;
    if (target < 0 || target >= this.order.length) {
      return;
    }
    const moved = this.order[index];
    const swapped = this.order[target];
    if (moved === undefined || swapped === undefined) {
      return;
    }
    this.order[index] = swapped;
    this.order[target] = moved;
    this.redraw();
  }

  private async save(): Promise<void> {
    const result = await this.callbacks.onSave(this.order, this.name);
    this.status = result.message;
    this.redraw();
  }
}
