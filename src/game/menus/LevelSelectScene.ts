import type { DraftSummary, LevelEntry } from '../storage/levels';
import { escapeHtml, MenuScene } from './MenuScene';

export interface LevelSelectCallbacks {
  shipped: LevelEntry[];
  drafts: DraftSummary[];
  dev: boolean;
  onPlayShipped: (id: string) => void;
  onPlayDraft: (id: string) => void;
  onEditDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onBack: () => void;
}

export class LevelSelectScene extends MenuScene {
  constructor(private readonly callbacks: LevelSelectCallbacks) {
    super();
  }

  protected render(): string {
    const shipped = this.callbacks.shipped
      .map(
        (entry) => `
        <button class="level-row" data-shipped="${escapeHtml(entry.id)}">
          <span class="level-name">${escapeHtml(entry.name)}</span>
          <span class="level-tag">course</span>
        </button>`,
      )
      .join('');

    const drafts = this.callbacks.drafts
      .map(
        (draft) => `
        <div class="level-row">
          <button class="level-name" data-draft="${escapeHtml(draft.id)}">${escapeHtml(draft.name)}</button>
          <span class="level-tag draft">draft</span>
          ${this.callbacks.dev ? `<button class="level-action" data-edit="${escapeHtml(draft.id)}">edit</button>` : ''}
          <button class="level-action danger" data-delete="${escapeHtml(draft.id)}">delete</button>
        </div>`,
      )
      .join('');

    return `
      <div class="menu-panel wide">
        <h2 class="menu-heading">Level select</h2>
        <h3 class="menu-section">Courses</h3>
        <div class="level-list">${shipped || '<p class="menu-empty">no levels found</p>'}</div>
        <h3 class="menu-section">My levels</h3>
        <div class="level-list">${drafts || '<p class="menu-empty">no drafts yet — save one in the editor</p>'}</div>
        <div class="menu-buttons">
          <button id="menu-back" class="menu-button">Back</button>
        </div>
      </div>`;
  }

  protected bind(): void {
    this.clickAll('[data-shipped]', (data) => {
      if (data.shipped) {
        this.callbacks.onPlayShipped(data.shipped);
      }
    });
    this.clickAll('[data-draft]', (data) => {
      if (data.draft) {
        this.callbacks.onPlayDraft(data.draft);
      }
    });
    this.clickAll('[data-edit]', (data) => {
      if (data.edit) {
        this.callbacks.onEditDraft(data.edit);
      }
    });
    this.clickAll('[data-delete]', (data) => {
      if (data.delete) {
        this.callbacks.onDeleteDraft(data.delete);
      }
    });
    this.click('menu-back', () => this.callbacks.onBack());
  }
}
