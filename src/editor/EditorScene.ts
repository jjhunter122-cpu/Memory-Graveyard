import {
  Actor,
  Color,
  CollisionType,
  Keys,
  Scene,
  type Engine,
  type Subscription,
} from 'excalibur';
import { VIEW } from '../game/config';
import { tileIndex, type AssetManifest, type TileDef } from '../game/level/manifest';
import {
  EMPTY_TILE,
  parseLevel,
  serializeLevel,
  type LevelData,
} from '../game/level/schema';
import { History } from './history';
import {
  addEntity,
  clearLevel,
  removeEntitiesAt,
  renameLevel,
  setTile,
  tileAt,
} from './ops';
import { EditorUi, type EditorUiCallbacks } from './EditorUi';
import type { EditorEntityType, EditorTool } from './types';
import { DraftStore } from '../game/storage/levels';
import { setMode } from '../game/ui/mode';
import { slug } from '../game/util/slug';

export interface EditorSceneOptions {
  onTestPlay: (level: LevelData) => void;
  onMenu: () => void;
  drafts: DraftStore;
}

const PAN_SPEED = 420;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;

const ENTITY_STYLE: Record<EditorEntityType, { color: string; radius: number }> = {
  spawn: { color: '#7cff9e', radius: 9 },
  memory: { color: '#7ce7ff', radius: 9 },
  exit: { color: '#b6ff7c', radius: 11 },
  checkpoint: { color: '#c79bff', radius: 8 },
};

export class EditorScene extends Scene {
  private level: LevelData;
  private readonly tiles: Map<number, TileDef>;
  private readonly tileSize: number;
  private readonly history: History<LevelData>;

  private tool: EditorTool = 'paint';
  private selectedTile: number;
  private selectedEntity: EditorEntityType = 'memory';
  private activeLayer = 0;
  private showGrid = true;

  private ui: EditorUi | null = null;
  private readonly gridActors: Actor[] = [];
  private readonly tileActors = new Map<string, Actor>();
  private entityActors: Actor[] = [];
  private cursor: Actor | null = null;

  private painting = false;
  private lastPaintedIndex = -1;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: Subscription[] = [];
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl) {
      return;
    }
    if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
      event.preventDefault();
      this.redo();
    }
  };

  constructor(
    level: LevelData,
    private readonly manifest: AssetManifest,
    private readonly options: EditorSceneOptions,
  ) {
    super();
    this.level = level;
    this.tiles = tileIndex(manifest);
    this.tileSize = level.tileSize;
    this.history = new History(level);
    this.selectedTile = firstTileId(this.tiles) ?? 1;
  }

  override onInitialize(_engine: Engine): void {
    this.buildGrid();
    this.cursor = new Actor({
      width: this.tileSize,
      height: this.tileSize,
      color: new Color(255, 255, 255, 0.16),
      collisionType: CollisionType.PreventCollision,
      z: 10,
    });
    this.add(this.cursor);

    const root = document.getElementById('editor-ui');
    if (root) {
      this.ui = new EditorUi(root, this.manifest, this.level, this.callbacks());
      this.ui.setTool(this.tool);
      this.ui.setTile(this.selectedTile);
      this.ui.setEntity(this.selectedEntity);
      this.ui.setLayer(this.activeLayer);
      this.ui.setGrid(this.showGrid);
      this.ui.setDevMode(import.meta.env.DEV);
      this.ui.setDrafts(this.options.drafts.list());
    }

    this.refreshAll();
    this.centerCamera();
  }

  override onActivate(context: { engine: Engine }): void {
    setMode('editing');
    window.addEventListener('keydown', this.onKeyDown);
    const { engine } = context;
    this.subscriptions = [
      engine.input.pointers.on('down', (event) => this.onPointerDown(event.nativeEvent)),
      engine.input.pointers.on('up', () => {
        this.painting = false;
      }),
      engine.input.pointers.on('wheel', (event) => {
        this.zoomBy(event.deltaY > 0 ? 0.9 : 1.1);
      }),
    ];
    this.ui?.setHistory(this.history.canUndo, this.history.canRedo);
  }

  override onDeactivate(): void {
    this.flushAutosave();
    window.removeEventListener('keydown', this.onKeyDown);
    for (const subscription of this.subscriptions) {
      subscription.close();
    }
    this.subscriptions = [];
    this.painting = false;
  }

  override onPreUpdate(engine: Engine, elapsed: number): void {
    this.panCamera(engine, elapsed / 1000);
    this.updateCursor(engine);
    if (this.painting && (this.tool === 'paint' || this.tool === 'erase')) {
      this.paintAtPointer(engine);
    }
  }

  // ---- camera ---------------------------------------------------------------

  private centerCamera(): void {
    const camera = this.camera;
    camera.zoom = Math.min(1, (VIEW.width - 120) / (this.level.width * this.tileSize));
    camera.pos.setTo(
      (this.level.width * this.tileSize) / 2,
      (this.level.height * this.tileSize) / 2,
    );
  }

  private panCamera(engine: Engine, dt: number): void {
    const keyboard = engine.input.keyboard;
    const dx =
      (keyboard.isHeld(Keys.Right) || keyboard.isHeld(Keys.D) ? 1 : 0) -
      (keyboard.isHeld(Keys.Left) || keyboard.isHeld(Keys.A) ? 1 : 0);
    const dy =
      (keyboard.isHeld(Keys.Down) || keyboard.isHeld(Keys.S) ? 1 : 0) -
      (keyboard.isHeld(Keys.Up) || keyboard.isHeld(Keys.W) ? 1 : 0);
    if (dx === 0 && dy === 0) {
      return;
    }
    const step = (PAN_SPEED * dt) / this.camera.zoom;
    const camera = this.camera;
    camera.pos.setTo(
      clamp(camera.pos.x + dx * step, 0, this.level.width * this.tileSize),
      clamp(camera.pos.y + dy * step, 0, this.level.height * this.tileSize),
    );
  }

  private zoomBy(factor: number): void {
    this.camera.zoom = clamp(this.camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  }

  // ---- pointer --------------------------------------------------------------

  private onPointerDown(native: Event): void {
    if (native instanceof MouseEvent && native.button === 2) {
      return;
    }
    if (this.tool === 'entity') {
      const tile = this.tileUnderPointer();
      if (tile) {
        this.placeEntity(tile.x, tile.y);
      }
      return;
    }
    this.painting = true;
    this.lastPaintedIndex = -1;
    this.paintAtPointerCurrent();
  }

  private paintAtPointer(engine: Engine): void {
    void engine;
    this.paintAtPointerCurrent();
  }

  private paintAtPointerCurrent(): void {
    const tile = this.tileUnderPointer();
    if (!tile) {
      return;
    }
    const index = tile.y * this.level.width + tile.x;
    if (index === this.lastPaintedIndex) {
      return;
    }
    this.lastPaintedIndex = index;

    if (this.tool === 'erase') {
      this.eraseAt(tile.x, tile.y);
    } else {
      const next = setTile(this.level, this.activeLayer, tile.x, tile.y, this.selectedTile);
      if (next !== this.level) {
        this.commit(next);
        this.refreshTile(this.activeLayer, tile.x, tile.y);
      }
    }
  }

  private updateCursor(engine: Engine): void {
    if (!this.cursor) {
      return;
    }
    const tile = this.tileUnderPointer();
    const world = engine.input.pointers.primary?.lastWorldPos ?? null;
    if (!tile || !world) {
      this.cursor.graphics.visible = false;
      this.ui?.setCursor(null, null);
      return;
    }
    this.cursor.graphics.visible = this.showGrid;
    this.cursor.pos.setTo(
      tile.x * this.tileSize + this.tileSize / 2,
      tile.y * this.tileSize + this.tileSize / 2,
    );
    this.ui?.setCursor(tile.x, tile.y);
  }

  private tileUnderPointer(): { x: number; y: number } | null {
    const world = this.engine.input.pointers.primary?.lastWorldPos;
    if (!world) {
      return null;
    }
    const x = Math.floor(world.x / this.tileSize);
    const y = Math.floor(world.y / this.tileSize);
    if (x < 0 || y < 0 || x >= this.level.width || y >= this.level.height) {
      return null;
    }
    return { x, y };
  }

  // ---- editing --------------------------------------------------------------

  private eraseAt(x: number, y: number): void {
    let next = setTile(this.level, this.activeLayer, x, y, EMPTY_TILE);
    next = removeEntitiesAt(next, x, y);
    if (next !== this.level) {
      this.commit(next);
      this.refreshTile(this.activeLayer, x, y);
      this.rebuildEntities();
    }
  }

  private placeEntity(x: number, y: number): void {
    const next = addEntity(this.level, this.selectedEntity, x, y);
    if (next !== this.level) {
      this.commit(next);
      this.rebuildEntities();
      this.refreshTile(this.activeLayer, x, y);
    }
  }

  private commit(next: LevelData): void {
    this.history.commit(next);
    this.level = next;
    this.ui?.setHistory(this.history.canUndo, this.history.canRedo);
    this.scheduleAutosave();
  }

  // ---- drafts & project save ------------------------------------------------

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== null) {
      clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null;
      this.options.drafts.save(this.level);
      this.ui?.setDrafts(this.options.drafts.list());
    }, 500);
  }

  private flushAutosave(): void {
    if (this.autosaveTimer !== null) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
      this.options.drafts.save(this.level);
    }
  }

  private saveDraft(): void {
    this.options.drafts.save(this.level);
    this.ui?.setDrafts(this.options.drafts.list());
    this.ui?.toast('saved draft');
  }

  private deleteDraft(id: string): void {
    this.options.drafts.remove(id);
    this.ui?.setDrafts(this.options.drafts.list());
    this.ui?.toast('draft deleted');
  }

  private loadDraft(id: string): void {
    const level = this.options.drafts.get(id);
    if (!level) {
      this.ui?.toast('draft not found');
      return;
    }
    this.level = level;
    this.history.reset(level);
    this.activeLayer = 0;
    this.ui?.setName(level.name);
    this.ui?.setLayer(0);
    this.ui?.setHistory(false, false);
    this.refreshAll();
    this.centerCamera();
    this.ui?.toast(`loaded draft ${level.name}`);
  }

  private async saveToProject(): Promise<void> {
    const id = slug(this.level.name);
    try {
      const response = await fetch('/__levels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: this.level.name, level: this.level }),
      });
      if (!response.ok) {
        throw new Error(`server returned ${response.status}`);
      }
      const result = (await response.json()) as { file?: string };
      this.ui?.toast(`saved to ${result.file ?? `public/levels/${id}.json`}`, 2600);
    } catch (error) {
      this.ui?.toast(`project save failed: ${(error as Error).message}`, 4000);
    }
  }

  private undo(): void {
    this.level = this.history.undo();
    this.refreshAll();
    this.ui?.setHistory(this.history.canUndo, this.history.canRedo);
  }

  private redo(): void {
    this.level = this.history.redo();
    this.refreshAll();
    this.ui?.setHistory(this.history.canUndo, this.history.canRedo);
  }

  // ---- rendering ------------------------------------------------------------

  private buildGrid(): void {
    const color = new Color(255, 255, 255, 0.12);
    const widthPx = this.level.width * this.tileSize;
    const heightPx = this.level.height * this.tileSize;
    for (let x = 0; x <= this.level.width; x += 1) {
      this.gridActors.push(
        new Actor({
          x: x * this.tileSize,
          y: heightPx / 2,
          width: 1,
          height: heightPx,
          color,
          collisionType: CollisionType.PreventCollision,
          z: 5,
        }),
      );
    }
    for (let y = 0; y <= this.level.height; y += 1) {
      this.gridActors.push(
        new Actor({
          x: widthPx / 2,
          y: y * this.tileSize,
          width: widthPx,
          height: 1,
          color,
          collisionType: CollisionType.PreventCollision,
          z: 5,
        }),
      );
    }
    for (const actor of this.gridActors) {
      actor.graphics.visible = this.showGrid;
      this.add(actor);
    }
  }

  private refreshAll(): void {
    for (const actor of this.tileActors.values()) {
      actor.kill();
    }
    this.tileActors.clear();
    for (const actor of this.entityActors) {
      actor.kill();
    }
    this.entityActors = [];

    this.level.layers.forEach((layer, layerIndex) => {
      for (let y = 0; y < this.level.height; y += 1) {
        for (let x = 0; x < this.level.width; x += 1) {
          if ((layer.data[y * this.level.width + x] ?? EMPTY_TILE) !== EMPTY_TILE) {
            this.refreshTile(layerIndex, x, y);
          }
        }
      }
    });
    this.rebuildEntities();

    this.ui?.setName(this.level.name);
    this.ui?.setEntityCount(this.level.entities.length);
  }

  private refreshTile(layerIndex: number, x: number, y: number): void {
    const key = `${layerIndex}:${y * this.level.width + x}`;
    const existing = this.tileActors.get(key);
    if (existing) {
      existing.kill();
      this.tileActors.delete(key);
    }
    const id = tileAt(this.level, layerIndex, x, y);
    if (id === EMPTY_TILE) {
      return;
    }
    const def = this.tiles.get(id);
    if (!def) {
      return;
    }
    const actor = new Actor({
      x: x * this.tileSize + this.tileSize / 2,
      y: y * this.tileSize + this.tileSize / 2,
      width: this.tileSize - 1,
      height: this.tileSize - 1,
      color: Color.fromHex(def.color),
      collisionType: CollisionType.PreventCollision,
      z: 1,
    });
    if (layerIndex !== this.activeLayer) {
      actor.graphics.opacity = 0.45;
    }
    this.add(actor);
    this.tileActors.set(key, actor);
  }

  private rebuildEntities(): void {
    for (const actor of this.entityActors) {
      actor.kill();
    }
    this.entityActors = [];
    for (const entity of this.level.entities) {
      const style = ENTITY_STYLE[(entity.type as EditorEntityType)] ?? {
        color: '#ffffff',
        radius: 8,
      };
      const actor = new Actor({
        x: entity.x * this.tileSize + this.tileSize / 2,
        y: entity.y * this.tileSize + this.tileSize / 2,
        radius: style.radius,
        color: Color.fromHex(style.color),
        collisionType: CollisionType.PreventCollision,
        z: 6,
      });
      this.add(actor);
      this.entityActors.push(actor);
    }
    this.ui?.setEntityCount(this.level.entities.length);
  }

  // ---- UI callbacks ---------------------------------------------------------

  private callbacks(): EditorUiCallbacks {
    return {
      onTool: (tool) => {
        this.tool = tool;
        this.ui?.setTool(tool);
      },
      onTile: (id) => {
        this.selectedTile = id;
        this.ui?.setTile(id);
      },
      onEntity: (type) => {
        this.selectedEntity = type;
        this.ui?.setEntity(type);
      },
      onLayer: (index) => {
        this.activeLayer = index;
        this.refreshAll();
      },
      onToggleGrid: () => {
        this.showGrid = !this.showGrid;
        for (const actor of this.gridActors) {
          actor.graphics.visible = this.showGrid;
        }
        if (this.cursor) {
          this.cursor.graphics.visible = this.showGrid;
        }
        this.ui?.setGrid(this.showGrid);
      },
      onUndo: () => this.undo(),
      onRedo: () => this.redo(),
      onNew: () => {
        this.commit(clearLevel(this.level));
        this.refreshAll();
        this.ui?.toast('cleared the level');
      },
      onSave: () => this.save(),
      onSaveDraft: () => this.saveDraft(),
      onSaveToProject: () => void this.saveToProject(),
      onLoadDraft: (id) => this.loadDraft(id),
      onDeleteDraft: (id) => this.deleteDraft(id),
      onLoadFile: (file) => void this.load(file),
      onTestPlay: () => this.options.onTestPlay(this.level),
      onMenu: () => this.options.onMenu(),
      onRename: (name) => {
        this.commit(renameLevel(this.level, name));
        this.ui?.setName(this.level.name);
      },
    };
  }

  private save(): void {
    const blob = new Blob([serializeLevel(this.level)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug(this.level.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.ui?.toast(`saved ${link.download}`);
  }

  private async load(file: File): Promise<void> {
    try {
      const text = await file.text();
      const loaded = parseLevel(text);
      this.level = loaded;
      this.history.reset(loaded);
      this.activeLayer = 0;
      this.ui?.setName(loaded.name);
      this.ui?.setLayer(0);
      this.ui?.setHistory(false, false);
      this.refreshAll();
      this.centerCamera();
      this.ui?.toast(`loaded ${loaded.name}`);
    } catch (error) {
      this.ui?.toast(`load failed: ${(error as Error).message}`, 4000);
    }
  }
}

function firstTileId(tiles: Map<number, TileDef>): number | undefined {
  let best: number | undefined;
  for (const id of tiles.keys()) {
    if (best === undefined || id < best) {
      best = id;
    }
  }
  return best;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
