import type { AssetManifest } from '../game/level/manifest';
import type { LevelData } from '../game/level/schema';
import type { EditorEntityType, EditorTool } from './types';

export interface EditorUiCallbacks {
  onTool(tool: EditorTool): void;
  onTile(id: number): void;
  onEntity(type: EditorEntityType): void;
  onLayer(index: number): void;
  onToggleGrid(): void;
  onUndo(): void;
  onRedo(): void;
  onNew(): void;
  onSave(): void;
  onLoadFile(file: File): void;
  onTestPlay(): void;
  onRename(name: string): void;
}

const ENTITY_LABELS: Record<EditorEntityType, string> = {
  spawn: 'spawn',
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
  private readonly cursorEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly toastEl: HTMLElement;
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
        <input id="ed-name" class="ed-name" value="${escapeAttr(level.name)}" aria-label="Level name" />
        <div class="ed-group" role="group" aria-label="Tool">
          <button data-tool="paint">Paint</button>
          <button data-tool="erase">Erase</button>
          <button data-tool="entity">Entity</button>
        </div>
        <div class="ed-group" role="group" aria-label="History">
          <button id="ed-undo">Undo</button>
          <button id="ed-redo">Redo</button>
        </div>
        <button id="ed-grid" class="ed-toggle">Grid</button>
        <div class="ed-group" role="group" aria-label="File">
          <button id="ed-new">New</button>
          <button id="ed-save">Save</button>
          <label class="ed-load">Load<input id="ed-file" type="file" accept="application/json,.json" hidden /></label>
        </div>
        <button id="ed-test" class="ed-primary">Test play</button>
      </div>
      <div class="ed-body">
        <aside class="ed-palette">
          <h3>Tiles</h3>
          <div id="ed-tiles" class="ed-swatches"></div>
          <h3>Entities</h3>
          <div id="ed-entities" class="ed-swatches"></div>
          <h3>Layer</h3>
          <select id="ed-layer" class="ed-layer"></select>
        </aside>
        <div class="ed-statusbar">
          <span id="ed-cursor">tile —</span>
          <span id="ed-count">0 entities</span>
          <span class="ed-hint">WASD / arrows pan · wheel zoom · left drag paints · Ctrl+Z undo · Ctrl+Y redo</span>
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
    this.cursorEl = this.get<HTMLElement>('ed-cursor');
    this.countEl = this.get<HTMLElement>('ed-count');
    this.toastEl = this.get<HTMLElement>('ed-toast');

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
      button.dataset.entity = type;
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

    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
      const tool = button.dataset.tool as EditorTool;
      button.addEventListener('click', () => this.callbacks.onTool(tool));
      this.toolButtons.set(tool, button);
    }

    this.gridButton.addEventListener('click', () => this.callbacks.onToggleGrid());
    this.undoButton.addEventListener('click', () => this.callbacks.onUndo());
    this.redoButton.addEventListener('click', () => this.callbacks.onRedo());
    this.get<HTMLButtonElement>('ed-new').addEventListener('click', () => this.callbacks.onNew());
    this.get<HTMLButtonElement>('ed-save').addEventListener('click', () => this.callbacks.onSave());
    this.get<HTMLButtonElement>('ed-test').addEventListener('click', () => this.callbacks.onTestPlay());
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
  }

  private get<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`editor UI element #${id} is missing`);
    }
    return element as T;
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
