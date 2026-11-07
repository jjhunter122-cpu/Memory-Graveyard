import type { AssetManifest } from '../game/level/manifest';
import type { LevelData } from '../game/level/schema';
import { LEVEL_SIZE_PRESETS, keyForSize, presetForKey } from '../game/level/sizes';
import type { DraftSummary } from '../game/storage/levels';
import type { EditorEntityType, EditorMode, EditorTool } from './types';

export interface EditorUiCallbacks {
  onTool(tool: EditorTool): void;
  onMode(mode: EditorMode): void;
  onTile(id: number): void;
  onEntity(type: EditorEntityType): void;
  onLayer(index: number): void;
  onResize(width: number, height: number): void;
  onSkybox(color: string | undefined): void;
  onToggleGrid(): void;
  onUndo(): void;
  onRedo(): void;
  onNew(): void;
  onSave(): void;
  onSaveDraft(): void;
  onSaveToProject(): void;
  onLoadDraft(id: string): void;
  onDeleteDraft(id: string): void;
  onLoadFile(file: File): void;
  onTestPlay(): void;
  onMenu(): void;
  onToggleTier(dev: boolean): void;
  onRename(name: string): void;
}

const ENTITY_LABELS: Record<EditorEntityType, string> = {
  spawn: 'spawn',
  monster: 'monster',
  memory: 'memory',
  exit: 'exit',
  checkpoint: 'checkpoint',
};

/** Builds and owns the DOM chrome around the editor canvas. */
export class EditorUi {
  private readonly toolButtons = new Map<EditorTool, HTMLButtonElement>();
  private readonly tileButtons = new Map<number, HTMLButtonElement>();
  private readonly entityButtons = new Map<EditorEntityType, HTMLButtonElement>();
  private readonly layerSelect: HTMLSelectElement;
  private readonly nameInput: HTMLInputElement;
  private readonly gridButton: HTMLButtonElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly fileInput: HTMLInputElement;
  private readonly projectButton: HTMLButtonElement;
  private readonly tierInput: HTMLInputElement;
  private readonly modeButton: HTMLButtonElement;
  private readonly sizeSelect: HTMLSelectElement;
  private readonly customSizeEl: HTMLElement;
  private readonly widthInput: HTMLInputElement;
  private readonly heightInput: HTMLInputElement;
  private readonly skyboxInput: HTMLInputElement;
  private readonly draftsHost: HTMLElement;
  private readonly cursorEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly toastEl: HTMLElement;
  private mode: EditorMode = 'tiles';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    root: HTMLElement,
    manifest: AssetManifest,
    level: LevelData,
    private readonly callbacks: EditorUiCallbacks,
  ) {
    const tiles = manifest.tilesets.flatMap((tileset) => tileset.tiles);

    root.innerHTML = `
      <div class="ed-toolbar">
        <button id="ed-menu" class="ed-ghost">Menu</button>
        <input id="ed-name" class="ed-name" value="${escapeAttr(level.name)}" aria-label="Level name" />
        <div class="ed-group" role="group" aria-label="Tool">
          <button data-tool="paint">Paint</button>
          <button data-tool="erase">Erase</button>
          <button id="ed-mode" class="ed-toggle">Tiles</button>
        </div>
        <div class="ed-group" role="group" aria-label="History">
          <button id="ed-undo">Undo</button>
          <button id="ed-redo">Redo</button>
        </div>
        <button id="ed-grid" class="ed-toggle">Grid</button>
        <div class="ed-group" role="group" aria-label="File">
          <button id="ed-new">New</button>
          <button id="ed-save">Export</button>
          <label class="ed-load">Import<input id="ed-file" type="file" accept="application/json,.json" hidden /></label>
        </div>
        <div class="ed-group" role="group" aria-label="Storage">
          <label class="ed-tier" title="Dev Made levels join the campaign; community levels live in the selector">
            <input id="ed-tier" type="checkbox" checked /> Dev Made
          </label>
          <button id="ed-save-draft">Save draft</button>
          <button id="ed-save-project" class="ed-project">Save to project</button>
        </div>
        <button id="ed-test" class="ed-primary">Test play</button>
      </div>
      <div class="ed-body">
        <aside class="ed-palette">
          <h3>Tiles</h3>
          <div id="ed-tiles" class="ed-swatches"></div>
          <h3>Entities</h3>
          <div id="ed-entities" class="ed-swatches"></div>
          <h3>Level settings</h3>
          <select id="ed-size" class="ed-layer"></select>
          <div id="ed-custom-size" class="ed-custom-size">
            <input id="ed-width" class="ed-number" type="number" min="40" max="120" step="1" aria-label="Level width" />
            <span>×</span>
            <input id="ed-height" class="ed-number" type="number" min="18" max="60" step="1" aria-label="Level height" />
            <button id="ed-size-apply">Apply</button>
          </div>
          <div class="ed-skybox">
            <label>Skybox <input id="ed-skybox" type="color" value="#0a0b10" /></label>
            <button id="ed-skybox-default">Default</button>
          </div>
          <h3>Layer</h3>
          <select id="ed-layer" class="ed-layer"></select>
          <h3>My drafts</h3>
          <div id="ed-drafts" class="ed-drafts"></div>
        </aside>
        <div class="ed-statusbar">
          <span id="ed-cursor">tile —</span>
          <span id="ed-count">0 entities</span>
          <span class="ed-hint">Q tiles/entities · WASD / arrows pan · wheel zoom · Ctrl+Z undo · Ctrl+Y redo</span>
        </div>
      </div>
      <div id="ed-toast" class="ed-toast" role="status"></div>
    `;

    this.nameInput = this.get<HTMLInputElement>('ed-name');
    this.gridButton = this.get<HTMLButtonElement>('ed-grid');
    this.undoButton = this.get<HTMLButtonElement>('ed-undo');
    this.redoButton = this.get<HTMLButtonElement>('ed-redo');
    this.fileInput = this.get<HTMLInputElement>('ed-file');
    this.layerSelect = this.get<HTMLSelectElement>('ed-layer');
    this.projectButton = this.get<HTMLButtonElement>('ed-save-project');
    this.tierInput = this.get<HTMLInputElement>('ed-tier');
    this.draftsHost = this.get<HTMLElement>('ed-drafts');
    this.cursorEl = this.get<HTMLElement>('ed-cursor');
    this.countEl = this.get<HTMLElement>('ed-count');
    this.toastEl = this.get<HTMLElement>('ed-toast');
    this.modeButton = this.get<HTMLButtonElement>('ed-mode');
    this.sizeSelect = this.get<HTMLSelectElement>('ed-size');
    this.customSizeEl = this.get<HTMLElement>('ed-custom-size');
    this.widthInput = this.get<HTMLInputElement>('ed-width');
    this.heightInput = this.get<HTMLInputElement>('ed-height');
    this.skyboxInput = this.get<HTMLInputElement>('ed-skybox');

    const tilesHost = this.get<HTMLElement>('ed-tiles');
    for (const tile of tiles) {
      const button = document.createElement('button');
      button.className = 'ed-swatch';
      button.title = `${tile.name} (${tile.collision})`;
      button.innerHTML = `<i style="background:${tile.color}"></i><span>${tile.name}</span>`;
      button.addEventListener('click', () => this.callbacks.onTile(tile.id));
      tilesHost.append(button);
      this.tileButtons.set(tile.id, button);
    }

    const entityHost = this.get<HTMLElement>('ed-entities');
    for (const type of Object.keys(ENTITY_LABELS) as EditorEntityType[]) {
      const button = document.createElement('button');
      button.className = 'ed-swatch ed-entity';
      button.textContent = ENTITY_LABELS[type];
      button.addEventListener('click', () => this.callbacks.onEntity(type));
      entityHost.append(button);
      this.entityButtons.set(type, button);
    }

    level.layers.forEach((layer, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = layer.name;
      this.layerSelect.append(option);
    });

    for (const preset of LEVEL_SIZE_PRESETS) {
      const option = document.createElement('option');
      option.value = keyForSize(preset.width, preset.height);
      option.textContent = preset.label;
      this.sizeSelect.append(option);
    }
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom (dev)';
    this.sizeSelect.append(customOption);

    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
      const tool = button.dataset.tool as EditorTool;
      button.addEventListener('click', () => this.callbacks.onTool(tool));
      this.toolButtons.set(tool, button);
    }

    this.gridButton.addEventListener('click', () => this.callbacks.onToggleGrid());
    this.undoButton.addEventListener('click', () => this.callbacks.onUndo());
    this.redoButton.addEventListener('click', () => this.callbacks.onRedo());
    this.get('ed-menu').addEventListener('click', () => this.callbacks.onMenu());
    this.get('ed-new').addEventListener('click', () => this.callbacks.onNew());
    this.get('ed-save').addEventListener('click', () => this.callbacks.onSave());
    this.get('ed-save-draft').addEventListener('click', () => this.callbacks.onSaveDraft());
    this.projectButton.addEventListener('click', () => this.callbacks.onSaveToProject());
    this.tierInput.addEventListener('change', () =>
      this.callbacks.onToggleTier(this.tierInput.checked),
    );
    this.get('ed-test').addEventListener('click', () => this.callbacks.onTestPlay());
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];
      if (file) {
        this.callbacks.onLoadFile(file);
      }
      this.fileInput.value = '';
    });
    this.layerSelect.addEventListener('change', () =>
      this.callbacks.onLayer(Number(this.layerSelect.value)),
    );
    this.nameInput.addEventListener('change', () => this.callbacks.onRename(this.nameInput.value));

    this.modeButton.addEventListener('click', () => {
      this.callbacks.onMode(this.mode === 'tiles' ? 'entities' : 'tiles');
    });
    this.sizeSelect.addEventListener('change', () => {
      const preset = presetForKey(this.sizeSelect.value);
      if (preset) {
        this.callbacks.onResize(preset.width, preset.height);
      }
    });
    this.get('ed-size-apply').addEventListener('click', () => {
      this.callbacks.onResize(
        Number(this.widthInput.value),
        Number(this.heightInput.value),
      );
    });
    this.skyboxInput.addEventListener('change', () =>
      this.callbacks.onSkybox(this.skyboxInput.value),
    );
    this.get('ed-skybox-default').addEventListener('click', () =>
      this.callbacks.onSkybox(undefined),
    );

    this.setSize(level.width, level.height);
    this.setSkybox(level.skybox);
  }

  private get<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`editor UI element #${id} is missing`);
    }
    return element as T;
  }

  setDevMode(dev: boolean): void {
    this.projectButton.hidden = !dev;
    this.customSizeEl.hidden = !dev;
    const customOption = this.sizeSelect.querySelector<HTMLOptionElement>(
      'option[value="custom"]',
    );
    if (customOption) {
      customOption.hidden = !dev;
    }
  }

  setDevMade(value: boolean): void {
    this.tierInput.checked = value;
  }

  setName(name: string): void {
    if (this.nameInput.value !== name) {
      this.nameInput.value = name;
    }
  }

  setTool(tool: EditorTool): void {
    for (const [key, button] of this.toolButtons) {
      button.classList.toggle('active', key === tool);
    }
  }

  setMode(mode: EditorMode): void {
    this.mode = mode;
    this.modeButton.textContent = mode === 'tiles' ? 'Tiles' : 'Entities';
    this.modeButton.classList.toggle('active', mode === 'entities');
  }

  setSize(width: number, height: number): void {
    const key = keyForSize(width, height);
    this.sizeSelect.value = presetForKey(key) ? key : 'custom';
    this.widthInput.value = String(width);
    this.heightInput.value = String(height);
  }

  setSkybox(color: string | undefined): void {
    this.skyboxInput.value = color ?? '#0a0b10';
  }

  setTile(id: number): void {
    for (const [key, button] of this.tileButtons) {
      button.classList.toggle('active', key === id);
    }
  }

  setEntity(type: EditorEntityType): void {
    for (const [key, button] of this.entityButtons) {
      button.classList.toggle('active', key === type);
    }
  }

  setLayer(index: number): void {
    this.layerSelect.value = String(index);
  }

  setGrid(on: boolean): void {
    this.gridButton.classList.toggle('active', on);
  }

  setHistory(canUndo: boolean, canRedo: boolean): void {
    this.undoButton.disabled = !canUndo;
    this.redoButton.disabled = !canRedo;
  }

  setCursor(x: number | null, y: number | null): void {
    this.cursorEl.textContent = x === null || y === null ? 'tile —' : `tile ${x}, ${y}`;
  }

  setEntityCount(count: number): void {
    this.countEl.textContent = `${count} ${count === 1 ? 'entity' : 'entities'}`;
  }

  setDrafts(drafts: DraftSummary[]): void {
    if (drafts.length === 0) {
      this.draftsHost.innerHTML = '<p class="ed-empty">no drafts</p>';
      return;
    }
    this.draftsHost.innerHTML = drafts
      .map(
        (draft) => `
        <div class="ed-draft">
          <button class="ed-draft-open" data-open="${escapeAttr(draft.id)}">${escapeAttr(draft.name)}</button>
          <button class="ed-draft-del" data-del="${escapeAttr(draft.id)}" title="delete">×</button>
        </div>`,
      )
      .join('');
    this.draftsHost.querySelectorAll<HTMLElement>('[data-open]').forEach((element) => {
      element.addEventListener('click', () => {
        const id = element.dataset.open;
        if (id) {
          this.callbacks.onLoadDraft(id);
        }
      });
    });
    this.draftsHost.querySelectorAll<HTMLElement>('[data-del]').forEach((element) => {
      element.addEventListener('click', () => {
        const id = element.dataset.del;
        if (id) {
          this.callbacks.onDeleteDraft(id);
        }
      });
    });
  }

  toast(message: string, ms = 1800): void {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
      this.toastTimer = null;
    }, ms);
  }
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
