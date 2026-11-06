import type { DraftSummary, LevelEntry } from '../storage/levels';
import { escapeHtml, MenuScene } from './MenuScene';

export interface LevelSelectCallbacks {
  devLevels: LevelEntry[];
  communityLevels: LevelEntry[];
  drafts: DraftSummary[];
  hasCampaign: boolean;
  dev: boolean;
  onPlayCampaign: () => void;
  onPlayShipped: (id: string) => void;
  onEditLevel: (id: string) => void;
  onPlayDraft: (id: string) => void;
  onEditDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onBack: () => void;
}

export class LevelSelectScene extends MenuScene {
  constructor(private readonly callbacks: LevelSelectCallbacks) {
    super();
  }

  private section(title: string, rows: string, empty: string): string {
    return `<h3 class="menu-section">${title}</h3><div class="level-list">${rows || `<p class="menu-empty">${empty}</p>`}</div>`;
  }

  private courseRows(levels: LevelEntry[], tag: string): string {
    return levels
      .map(
        (entry) => `
        <div class="level-row">
          <button class="level-name" data-shipped="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</button>
          <span class="level-tag">${tag}</span>
          ${this.callbacks.dev ? `<button class="level-action" data-edit="${escapeHtml(entry.id)}">edit</button>` : ''}
        </div>`,
      )
      .join('');
  }

  protected render(): string {
    const drafts = this.callbacks.drafts
      .map(
        (draft) => `
        <div class="level-row">
          <button class="level-name" data-draft="${escapeHtml(draft.id)}">${escapeHtml(draft.name)}</button>
          <span class="level-tag draft">draft</span>
          ${this.callbacks.dev ? `<button class="level-action" data-editdraft="${escapeHtml(draft.id)}">edit</button>` : ''}
          <button class="level-action danger" data-delete="${escapeHtml(draft.id)}">delete</button>
        </div>`,
      )
      .join('');

    return `
      <div class="menu-panel wide">
        <h2 class="menu-heading">Level select</h2>
        ${
          this.callbacks.hasCampaign
            ? `<div class="menu-buttons"><button id="menu-campaign" class="menu-button primary">Play campaign</button></div>`
            : ''
        }
        ${this.section('Courses', this.courseRows(this.callbacks.devLevels, 'dev'), 'no dev-made levels')}
        ${this.section('Community', this.courseRows(this.callbacks.communityLevels, 'community'), 'no community levels')}
        ${this.section('My levels', drafts, 'no drafts yet — save one in the editor')}
        <div class="menu-buttons">
          <button id="menu-back" class="menu-button">Back</button>
        </div>
      </div>`;
  }

  protected bind(): void {
    this.click('menu-campaign', () => this.callbacks.onPlayCampaign());
    this.clickAll('[data-shipped]', (data) => {
      if (data.shipped) {
        this.callbacks.onPlayShipped(data.shipped);
      }
    });
    this.clickAll('[data-edit]', (data) => {
      if (data.edit) {
        this.callbacks.onEditLevel(data.edit);
      }
    });
    this.clickAll('[data-draft]', (data) => {
      if (data.draft) {
        this.callbacks.onPlayDraft(data.draft);
      }
    });
    this.clickAll('[data-editdraft]', (data) => {
      if (data.editdraft) {
        this.callbacks.onEditDraft(data.editdraft);
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
