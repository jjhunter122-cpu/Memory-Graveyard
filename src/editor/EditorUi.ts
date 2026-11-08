import type { AssetManifest, TileDef } from '../game/level/manifest';
import type { LevelData } from '../game/level/schema';
import { LEVEL_SIZE_PRESETS, keyForSize, presetForKey } from '../game/level/sizes';
import { ANALOG_FX_OPTIONS, normalizeAnalogFxPreset } from '../game/analogFx';
import {
  CHARACTER_SCALE_OPTIONS,
  characterMetrics,
  normalizeCharacterScale,
} from '../game/characterScale';
import {
  CAMERA_ZOOM_OPTIONS,
  cameraCoverage,
  normalizeCameraZoom,
} from '../game/camera/cameraZoom';
import {
  CAMERA_FOLLOW_PRESETS,
  normalizeCameraFollow,
} from '../game/camera/cameraFollowSettings';
import type { GameTextures } from '../game/assets';
import {
  BACKGROUND_PRESETS,
  FOREGROUND_PRESETS,
  type SceneryPreset,
} from '../game/scenery';
import type { DraftSummary, LevelEntry } from '../game/storage/levels';
import type { EditorEntityType, EditorTab, EditorTool } from './types';

export interface EditorUiCallbacks {
  onTool(tool: EditorTool): void;
  onTab(tab: EditorTab): void;
  onTile(id: number): void;
  onEntity(type: EditorEntityType): void;
  onLayer(index: number): void;
  onResize(width: number, height: number): void;
  onSkybox(color: string | undefined): void;
  onBackground(id: string | undefined): void;
  onForeground(id: string | undefined): void;
  onAnalogFx(id: string | undefined): void;
  onCharacterScale(scale: number): void;
  onCameraZoom(zoom: number): void;
  onCameraFollow(id: string): void;
  onToggleGrid(): void;
  onUndo(): void;
  onRedo(): void;
  onNew(): void;
  onSave(): void;
  onSaveDraft(): void;
  onSaveToProject(): void;
  onNewLevel(): void;
  onLoadShipped(id: string): void;
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
  monster: 'monster (ghost)',
  skeleton: 'skeleton',
  memory: 'memory',
  exit: 'exit',
  checkpoint: 'checkpoint',
};

const ENTITY_COLORS: Record<EditorEntityType, string> = {
  spawn: '#7cff9e',
  monster: '#ff6b7a',
  skeleton: '#e2c79b',
  memory: '#7ce7ff',
  exit: '#b6ff7c',
  checkpoint: '#c79bff',
};

const TILESET_LABELS: Record<string, string> = {
  placeholder: 'OG',
  'pixel-platformer-world': 'Pixel Platformer World',
};

interface TileGroup {
  id: string;
  label: string;
  tiles: TileDef[];
}

interface CharacterPreviewConfig {
  sheet: 'hero' | 'ghost' | 'skeleton';
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  displayWidth: number;
  displayHeight: number;
}

const CHARACTER_PREVIEWS: Partial<Record<EditorEntityType, CharacterPreviewConfig>> = {
  spawn: { sheet: 'hero', frameWidth: 90, frameHeight: 50, frameCount: 4, displayWidth: 54, displayHeight: 30 },
  monster: { sheet: 'ghost', frameWidth: 32, frameHeight: 32, frameCount: 6, displayWidth: 40, displayHeight: 40 },
  skeleton: { sheet: 'skeleton', frameWidth: 44, frameHeight: 52, frameCount: 8, displayWidth: 40, displayHeight: 48 },
};

interface EntityPreview {
  canvas: HTMLCanvasElement;
  sheet?: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  displayWidth: number;
  displayHeight: number;
  color: string;
  shape: 'circle' | 'square';
}

/** Builds and owns the DOM chrome around the editor canvas. */
export class EditorUi {
  private readonly toolButtons = new Map<EditorTool, HTMLButtonElement>();
  private readonly tileButtons = new Map<number, HTMLButtonElement>();
  private readonly entityButtons = new Map<EditorEntityType, HTMLButtonElement>();
  private readonly tabButtons = new Map<EditorTab, HTMLButtonElement>();
  private readonly tabPanels = new Map<EditorTab, HTMLElement>();
  private readonly layerSelect: HTMLSelectElement;
  private readonly nameInput: HTMLInputElement;
  private readonly gridButton: HTMLButtonElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly fileInput: HTMLInputElement;
  private readonly projectButton: HTMLButtonElement;
  private readonly tierInput: HTMLInputElement;
  private readonly toolIndicator: HTMLElement;
  private readonly sizeSelect: HTMLSelectElement;
  private readonly customSizeEl: HTMLElement;
  private readonly widthInput: HTMLInputElement;
  private readonly heightInput: HTMLInputElement;
  private readonly skyboxInput: HTMLInputElement;
  private readonly backgroundSelect: HTMLSelectElement;
  private readonly foregroundSelect: HTMLSelectElement;
  private readonly analogSelect: HTMLSelectElement;
  private readonly characterScaleSelect: HTMLSelectElement;
  private readonly scaleCompareCanvas: HTMLCanvasElement;
  private readonly scaleNote: HTMLElement;
  private readonly cameraZoomSelect: HTMLSelectElement;
  private readonly cameraZoomNote: HTMLElement;
  private readonly cameraFollowSelect: HTMLSelectElement;
  private readonly tilesetSelect: HTMLSelectElement;
  private readonly tilesHost: HTMLElement;
  private readonly selectedTileLabel: HTMLElement;
  private readonly shippedHost: HTMLElement;
  private readonly draftsHost: HTMLElement;
  private readonly cursorEl: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly tileGroups: TileGroup[] = [];
  private readonly previewEntries: EntityPreview[] = [];
  private currentGroupId = '';
  private selectedTileId: number | null = null;
  private levelTileSize = 32;
  private previewFrame = 0;
  private previewTimer: ReturnType<typeof setInterval> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    root: HTMLElement,
    manifest: AssetManifest,
    level: LevelData,
    private readonly callbacks: EditorUiCallbacks,
    private readonly textures: GameTextures,
  ) {
    this.tileGroups = manifest.tilesets.map((tileset) => ({
      id: tileset.name,
      label: TILESET_LABELS[tileset.name] ?? tileset.name,
      tiles: tileset.tiles,
    }));

    root.innerHTML = `
      <div class="ed-toolbar">
        <button id="ed-menu" class="ed-ghost">Menu</button>
        <input id="ed-name" class="ed-name" value="${escapeAttr(level.name)}" aria-label="Level name" />
        <div class="ed-group" role="group" aria-label="Tool">
          <button data-tool="paint">Paint</button>
          <button data-tool="erase">Erase</button>
          <span id="ed-tool-indicator" class="ed-tool-indicator">B · PAINT</span>
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
          <div class="ed-tabs" role="tablist" aria-label="Editor panels">
            <button data-tab="tiles" class="active">Tiles</button>
            <button data-tab="visual">Visual</button>
            <button data-tab="entities">Entities</button>
          </div>
          <div class="ed-layer-row">
            <label>Layer <select id="ed-layer" class="ed-layer"></select></label>
          </div>
          <div class="ed-tab-panel" data-panel="tiles">
            <label class="ed-tileset-select">Tile set <select id="ed-tileset" class="ed-layer"></select></label>
            <div id="ed-tiles" class="ed-tile-grid"></div>
            <p id="ed-selected-tile" class="ed-selected-tile">Selected: —</p>
          </div>
          <div class="ed-tab-panel" data-panel="visual" hidden>
            <h3>Level size</h3>
            <select id="ed-size" class="ed-layer"></select>
            <div id="ed-custom-size" class="ed-custom-size">
              <input id="ed-width" class="ed-number" type="number" min="40" max="120" step="1" aria-label="Level width" />
              <span>×</span>
              <input id="ed-height" class="ed-number" type="number" min="18" max="60" step="1" aria-label="Level height" />
              <button id="ed-size-apply">Apply</button>
            </div>
            <h3>Sky and scenery</h3>
            <div class="ed-skybox">
              <label>Skybox <input id="ed-skybox" type="color" value="#0a0b10" /></label>
              <button id="ed-skybox-default">Default</button>
            </div>
            <div class="ed-scenery">
              <label>Background <select id="ed-background" class="ed-layer"></select></label>
              <label>Foreground <select id="ed-foreground" class="ed-layer"></select></label>
            </div>
            <h3>Analog FX</h3>
            <div class="ed-scenery">
              <label>Preset <select id="ed-analog" class="ed-layer"></select></label>
            </div>
            <h3>Camera</h3>
            <div class="ed-scenery">
              <label>Follow <select id="ed-camera-follow" class="ed-layer"></select></label>
              <label>Distance <select id="ed-camera-zoom" class="ed-layer"></select></label>
            </div>
            <p id="ed-camera-zoom-note" class="ed-selected-tile"></p>
            <h3>Character scale</h3>
            <div class="ed-scenery">
              <label>Height <select id="ed-character-scale" class="ed-layer"></select></label>
            </div>
            <canvas id="ed-scale-compare" class="ed-scale-compare" width="220" height="336"></canvas>
            <p id="ed-scale-note" class="ed-selected-tile"></p>
          </div>
          <div class="ed-tab-panel" data-panel="entities" hidden>
            <div id="ed-entities" class="ed-entity-grid"></div>
          </div>
          <h3>Levels</h3>
          <button id="ed-new-level" class="ed-new-level">New level</button>
          <div id="ed-shipped" class="ed-level-list"></div>
          <h3>My drafts</h3>
          <div id="ed-drafts" class="ed-drafts"></div>
        </aside>
        <div class="ed-statusbar">
          <span id="ed-cursor">tile —</span>
          <span id="ed-count">0 entities</span>
          <span class="ed-hint">Q tiles/entities · B paint/erase · G grid · V save draft · WASD / arrows pan · wheel zoom · Ctrl+Z undo · Ctrl+Y redo</span>
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
    this.shippedHost = this.get<HTMLElement>('ed-shipped');
    this.draftsHost = this.get<HTMLElement>('ed-drafts');
    this.cursorEl = this.get<HTMLElement>('ed-cursor');
    this.countEl = this.get<HTMLElement>('ed-count');
    this.toastEl = this.get<HTMLElement>('ed-toast');
    this.toolIndicator = this.get<HTMLElement>('ed-tool-indicator');
    this.sizeSelect = this.get<HTMLSelectElement>('ed-size');
    this.customSizeEl = this.get<HTMLElement>('ed-custom-size');
    this.widthInput = this.get<HTMLInputElement>('ed-width');
    this.heightInput = this.get<HTMLInputElement>('ed-height');
    this.skyboxInput = this.get<HTMLInputElement>('ed-skybox');
    this.backgroundSelect = this.get<HTMLSelectElement>('ed-background');
    this.foregroundSelect = this.get<HTMLSelectElement>('ed-foreground');
    this.analogSelect = this.get<HTMLSelectElement>('ed-analog');
    this.characterScaleSelect = this.get<HTMLSelectElement>('ed-character-scale');
    this.scaleCompareCanvas = this.get<HTMLCanvasElement>('ed-scale-compare');
    this.scaleNote = this.get<HTMLElement>('ed-scale-note');
    this.cameraZoomSelect = this.get<HTMLSelectElement>('ed-camera-zoom');
    this.cameraZoomNote = this.get<HTMLElement>('ed-camera-zoom-note');
    this.cameraFollowSelect = this.get<HTMLSelectElement>('ed-camera-follow');
    this.tilesetSelect = this.get<HTMLSelectElement>('ed-tileset');
    this.tilesHost = this.get<HTMLElement>('ed-tiles');
    this.selectedTileLabel = this.get<HTMLElement>('ed-selected-tile');

    this.fillScenerySelect(this.backgroundSelect, BACKGROUND_PRESETS);
    this.fillScenerySelect(this.foregroundSelect, FOREGROUND_PRESETS);
    for (const option of ANALOG_FX_OPTIONS) {
      const element = document.createElement('option');
      element.value = option.id;
      element.textContent = option.label;
      this.analogSelect.append(element);
    }
    for (const option of CHARACTER_SCALE_OPTIONS) {
      const element = document.createElement('option');
      element.value = String(option.value);
      element.textContent = option.label;
      this.characterScaleSelect.append(element);
    }
    for (const option of CAMERA_ZOOM_OPTIONS) {
      const element = document.createElement('option');
      element.value = String(option.value);
      element.textContent = option.label;
      this.cameraZoomSelect.append(element);
    }
    for (const preset of CAMERA_FOLLOW_PRESETS) {
      const element = document.createElement('option');
      element.value = preset.id;
      element.textContent = preset.label;
      this.cameraFollowSelect.append(element);
    }

    for (const group of this.tileGroups) {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.label;
      this.tilesetSelect.append(option);
    }
    if (this.tileGroups[0]) {
      this.renderTileGroup(this.tileGroups[0].id);
    }

    const entityHost = this.get<HTMLElement>('ed-entities');
    for (const type of Object.keys(ENTITY_LABELS) as EditorEntityType[]) {
      const button = document.createElement('button');
      button.className = 'ed-swatch ed-entity-card';
      const canvas = document.createElement('canvas');
      canvas.width = 56;
      canvas.height = 48;
      canvas.className = 'ed-entity-preview';
      const label = document.createElement('span');
      label.textContent = ENTITY_LABELS[type];
      button.append(canvas, label);
      button.addEventListener('click', () => this.callbacks.onEntity(type));
      entityHost.append(button);
      this.entityButtons.set(type, button);
      this.previewEntries.push(this.createPreview(type, canvas));
    }

    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      const tab = button.dataset.tab as EditorTab;
      this.tabButtons.set(tab, button);
      button.addEventListener('click', () => this.callbacks.onTab(tab));
    });
    root.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
      const tab = panel.dataset.panel as EditorTab;
      this.tabPanels.set(tab, panel);
    });

    this.setLayers(level.layers, 0);

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
    this.get('ed-new-level').addEventListener('click', () => this.callbacks.onNewLevel());
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

    this.tilesetSelect.addEventListener('change', () => this.selectTileGroup(this.tilesetSelect.value));
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
    this.backgroundSelect.addEventListener('change', () =>
      this.callbacks.onBackground(this.backgroundSelect.value || undefined),
    );
    this.foregroundSelect.addEventListener('change', () =>
      this.callbacks.onForeground(this.foregroundSelect.value || undefined),
    );
    this.analogSelect.addEventListener('change', () =>
      this.callbacks.onAnalogFx(this.analogSelect.value || undefined),
    );
    this.characterScaleSelect.addEventListener('change', () =>
      this.callbacks.onCharacterScale(Number(this.characterScaleSelect.value)),
    );
    this.cameraZoomSelect.addEventListener('change', () =>
      this.callbacks.onCameraZoom(Number(this.cameraZoomSelect.value)),
    );
    this.cameraFollowSelect.addEventListener('change', () =>
      this.callbacks.onCameraFollow(this.cameraFollowSelect.value),
    );

    this.setSize(level.width, level.height);
    this.setSkybox(level.skybox);
    this.setBackground(level.background);
    this.setForeground(level.foreground);
    this.setAnalogFx(level.analogFx);
    this.setCharacterScale(level.characterScale, level.tileSize);
    this.setCameraZoom(level.cameraZoom, level.tileSize);
    this.setCameraFollow(level.cameraFollow);
    this.setTab('tiles');
  }

  private renderTileGroup(groupId: string): void {
    const group = this.tileGroups.find((candidate) => candidate.id === groupId) ?? this.tileGroups[0];
    if (!group) {
      return;
    }
    this.currentGroupId = group.id;
    this.tilesetSelect.value = group.id;
    this.tilesHost.innerHTML = '';
    this.tileButtons.clear();

    for (const tile of group.tiles) {
      const button = document.createElement('button');
      button.className = 'ed-swatch ed-tile';
      button.title = `${tile.name} (${tile.collision})`;
      button.innerHTML = `<i style="background-color:${tile.color};${this.tileImageStyle(tile)}"></i><span>${escapeAttr(tile.name)}</span>`;
      button.addEventListener('click', () => this.callbacks.onTile(tile.id));
      this.tilesHost.append(button);
      this.tileButtons.set(tile.id, button);
    }

    this.updateSelectedTileLabel();
    this.highlightSelectedTile();
  }

  private selectTileGroup(groupId: string): void {
    this.renderTileGroup(groupId);
    const group = this.tileGroups.find((candidate) => candidate.id === groupId);
    if (
      group &&
      this.selectedTileId !== null &&
      !group.tiles.some((tile) => tile.id === this.selectedTileId)
    ) {
      const first = group.tiles[0];
      if (first) {
        this.callbacks.onTile(first.id);
      }
    }
  }

  private tileImageStyle(tile: TileDef): string {
    if (!tile.image) {
      return '';
    }
    if (tile.decor || tile.half) {
      return `background-image:url('${import.meta.env.BASE_URL}assets/${tile.image}');background-size:contain;background-repeat:no-repeat;background-position:center bottom;image-rendering:pixelated;`;
    }
    return `background-image:url('${import.meta.env.BASE_URL}assets/${tile.image}');background-size:cover;background-position:center;image-rendering:pixelated;`;
  }

  private highlightSelectedTile(): void {
    for (const [key, button] of this.tileButtons) {
      button.classList.toggle('active', key === this.selectedTileId);
    }
    this.updateSelectedTileLabel();
  }

  private updateSelectedTileLabel(): void {
    if (this.selectedTileId === null) {
      this.selectedTileLabel.textContent = 'Selected: —';
      return;
    }
    const tile = this.tileGroups
      .flatMap((group) => group.tiles)
      .find((candidate) => candidate.id === this.selectedTileId);
    this.selectedTileLabel.textContent = tile ? `Selected: ${tile.name}` : 'Selected: —';
  }

  private createPreview(type: EditorEntityType, canvas: HTMLCanvasElement): EntityPreview {
    const config = CHARACTER_PREVIEWS[type];
    const sheet = config ? this.sheetFor(config.sheet) : undefined;
    return {
      canvas,
      sheet,
      frameWidth: config?.frameWidth ?? 0,
      frameHeight: config?.frameHeight ?? 0,
      frameCount: config?.frameCount ?? 1,
      displayWidth: config?.displayWidth ?? 0,
      displayHeight: config?.displayHeight ?? 0,
      color: ENTITY_COLORS[type],
      shape: type === 'exit' ? 'square' : 'circle',
    };
  }

  private sheetFor(kind: 'hero' | 'ghost' | 'skeleton'): HTMLImageElement | undefined {
    const source =
      kind === 'hero'
        ? this.textures.heroSheet
        : kind === 'ghost'
          ? this.textures.ghostSheet
          : this.textures.skeletonSheet;
    return source?.data;
  }

  private startEntityPreviews(): void {
    if (this.previewTimer !== null) {
      return;
    }
    this.drawEntityPreviews();
    this.previewTimer = setInterval(() => {
      this.previewFrame += 1;
      this.drawEntityPreviews();
    }, 110);
  }

  private stopEntityPreviews(): void {
    if (this.previewTimer !== null) {
      clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
  }

  private drawEntityPreviews(): void {
    for (const entry of this.previewEntries) {
      this.drawPreview(entry);
    }
  }

  private drawPreview(entry: EntityPreview): void {
    const context = entry.canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
    context.imageSmoothingEnabled = false;

    if (entry.sheet && entry.frameWidth > 0 && entry.frameHeight > 0 && entry.frameCount > 1) {
      const index = this.previewFrame % entry.frameCount;
      const sourceX = index * entry.frameWidth;
      const dx = Math.round((entry.canvas.width - entry.displayWidth) / 2);
      const dy = Math.round((entry.canvas.height - entry.displayHeight) / 2);
      context.drawImage(
        entry.sheet,
        sourceX,
        0,
        entry.frameWidth,
        entry.frameHeight,
        dx,
        dy,
        entry.displayWidth,
        entry.displayHeight,
      );
      return;
    }

    context.fillStyle = entry.color;
    const size = 16;
    const x = (entry.canvas.width - size) / 2;
    const y = (entry.canvas.height - size) / 2;
    if (entry.shape === 'square') {
      context.fillRect(x, y, size, size);
    } else {
      context.beginPath();
      context.arc(entry.canvas.width / 2, entry.canvas.height / 2, size / 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  dispose(): void {
    this.stopEntityPreviews();
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private fillScenerySelect(select: HTMLSelectElement, presets: readonly SceneryPreset[]): void {
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'None';
    select.append(none);
    for (const preset of presets) {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      select.append(option);
    }
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
    this.toolIndicator.textContent = `B · ${tool.toUpperCase()}`;
  }

  setTab(tab: EditorTab): void {
    for (const [key, button] of this.tabButtons) {
      button.classList.toggle('active', key === tab);
    }
    for (const [key, panel] of this.tabPanels) {
      panel.hidden = key !== tab;
    }
    if (tab === 'entities') {
      this.startEntityPreviews();
    } else {
      this.stopEntityPreviews();
    }
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

  setBackground(id: string | undefined): void {
    this.backgroundSelect.value = id ?? '';
  }

  setForeground(id: string | undefined): void {
    this.foregroundSelect.value = id ?? '';
  }

  setAnalogFx(id: string | undefined): void {
    this.analogSelect.value = normalizeAnalogFxPreset(id) ?? '';
  }

  setCharacterScale(scale: number | undefined, tileSize: number): void {
    this.levelTileSize = tileSize;
    this.characterScaleSelect.value = String(normalizeCharacterScale(scale));
    this.scaleNote.textContent = `Compared against a ${tileSize}px tile. Applies to both the player and the monster.`;
    this.drawScaleComparison();
    this.setCameraZoom(this.currentCameraZoom(), tileSize);
  }

  setCameraZoom(zoom: number | undefined, tileSize: number): void {
    const normalized = normalizeCameraZoom(zoom);
    this.cameraZoomSelect.value = String(normalized);
    const coverage = cameraCoverage(normalized, tileSize);
    this.cameraZoomNote.textContent = `Shows about ${coverage.width.toFixed(0)} × ${coverage.height.toFixed(1)} tiles at ${tileSize}px.`;
  }

  setCameraFollow(id: string | undefined): void {
    this.cameraFollowSelect.value = normalizeCameraFollow(id);
  }

  private currentCameraZoom(): number {
    return Number(this.cameraZoomSelect.value) || normalizeCameraZoom(undefined);
  }

  /** Renders all four character heights side by side for quick comparison. */
  private drawScaleComparison(): void {
    const canvas = this.scaleCompareCanvas;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    const hero = this.textures.heroSheet?.data;
    const ghost = this.textures.ghostSheet?.data;
    const rowHeight = 84;
    const rowTop = 8;

    for (let index = 0; index < CHARACTER_SCALE_OPTIONS.length; index += 1) {
      const option = CHARACTER_SCALE_OPTIONS[index];
      if (!option) {
        continue;
      }
      const metrics = characterMetrics(option.value, this.levelTileSize);
      const baseline = rowTop + index * rowHeight + 58;
      const heroWidth = Math.max(metrics.heroDisplayWidth, 54);
      const ghostWidth = Math.max(metrics.ghostDisplaySize, 40);

      context.fillStyle = 'rgba(124, 231, 255, 0.85)';
      context.font = '11px Consolas, monospace';
      context.fillText(option.label, 6, baseline - 46);

      context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(6, baseline + 0.5);
      context.lineTo(canvas.width - 6, baseline + 0.5);
      context.stroke();

      if (hero) {
        context.drawImage(
          hero,
          0,
          0,
          90,
          50,
          28,
          baseline - metrics.heroDisplayHeight,
          metrics.heroDisplayWidth,
          metrics.heroDisplayHeight,
        );
      } else {
        context.fillStyle = '#e9e4d4';
        context.fillRect(28, baseline - metrics.heroDisplayHeight, 12, metrics.heroDisplayHeight);
      }

      const ghostX = 28 + heroWidth + 6;
      if (ghost) {
        context.drawImage(
          ghost,
          0,
          0,
          32,
          32,
          ghostX,
          baseline - metrics.ghostDisplaySize,
          ghostWidth,
          ghostWidth,
        );
      } else {
        context.fillStyle = '#ff6b7a';
        context.fillRect(ghostX, baseline - metrics.ghostDisplaySize, 16, metrics.ghostDisplaySize);
      }
    }
  }

  setTile(id: number): void {
    this.selectedTileId = id;
    const group = this.tileGroups.find((candidate) =>
      candidate.tiles.some((tile) => tile.id === id),
    );
    if (group && group.id !== this.currentGroupId) {
      this.renderTileGroup(group.id);
    } else {
      this.highlightSelectedTile();
    }
  }

  setEntity(type: EditorEntityType): void {
    for (const [key, button] of this.entityButtons) {
      button.classList.toggle('active', key === type);
    }
  }

  setLayers(layers: readonly { name: string }[], active: number): void {
    this.layerSelect.innerHTML = '';
    layers.forEach((layer, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = layer.name;
      this.layerSelect.append(option);
    });
    this.layerSelect.value = String(active);
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

  setLevels(
    shipped: LevelEntry[],
    drafts: DraftSummary[],
    currentName: string,
  ): void {
    this.shippedHost.innerHTML =
      shipped.length === 0
        ? '<p class="ed-empty">no shipped levels</p>'
        : shipped
            .map(
              (entry) => `
              <button class="ed-level-item${entry.name === currentName ? ' active' : ''}" data-shipped="${escapeAttr(entry.id)}">
                <span>${escapeAttr(entry.name)}</span><em>${entry.tier}</em>
              </button>`,
            )
            .join('');
    this.shippedHost
      .querySelectorAll<HTMLElement>('[data-shipped]')
      .forEach((element) => {
        element.addEventListener('click', () => {
          const id = element.dataset.shipped;
          if (id) {
            this.callbacks.onLoadShipped(id);
          }
        });
      });

    this.draftsHost.innerHTML =
      drafts.length === 0
        ? '<p class="ed-empty">no drafts</p>'
        : drafts
            .map(
              (draft) => `
        <div class="ed-draft${draft.name === currentName ? ' active' : ''}">
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
