import { parseLevel, type LevelData } from '../level/schema';
import { slug } from '../util/slug';
import type { StorageLike } from './storage';

export const LEVEL_INDEX_VERSION = 1;

export interface LevelEntry {
  id: string;
  name: string;
  /** Path relative to the app base, e.g. `levels/test-course.json`. */
  file: string;
}

export interface LevelIndex {
  version: number;
  levels: LevelEntry[];
}

export class LevelIndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelIndexError';
  }
}

export function validateLevelIndex(raw: unknown): LevelIndex {
  if (typeof raw !== 'object' || raw === null) {
    throw new LevelIndexError('level index must be an object');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.version !== LEVEL_INDEX_VERSION) {
    throw new LevelIndexError(`unsupported level index version ${String(obj.version)}`);
  }
  if (!Array.isArray(obj.levels)) {
    throw new LevelIndexError('level index must have a levels array');
  }
  const seen = new Set<string>();
  const levels = obj.levels.map((rawEntry, index) => {
    if (typeof rawEntry !== 'object' || rawEntry === null) {
      throw new LevelIndexError(`level ${index} must be an object`);
    }
    const entry = rawEntry as Record<string, unknown>;
    const { id, name, file } = entry;
    if (typeof id !== 'string' || id.length === 0) {
      throw new LevelIndexError(`level ${index} needs a non-empty id`);
    }
    if (typeof name !== 'string' || name.length === 0) {
      throw new LevelIndexError(`level ${index} needs a non-empty name`);
    }
    if (typeof file !== 'string' || file.length === 0) {
      throw new LevelIndexError(`level ${index} needs a non-empty file`);
    }
    if (seen.has(id)) {
      throw new LevelIndexError(`duplicate level id ${id}`);
    }
    seen.add(id);
    return { id, name, file };
  });
  return { version: LEVEL_INDEX_VERSION, levels };
}

// ---- drafts (in-browser localStorage) --------------------------------------

export const DRAFTS_KEY = 'memory-graveyard:drafts:v1';

export interface DraftSummary {
  id: string;
  name: string;
  updatedAt: number;
}

interface DraftRecord {
  id: string;
  name: string;
  updatedAt: number;
  level: LevelData;
}

interface DraftFile {
  version: number;
  drafts: DraftRecord[];
}

export class DraftStore {
  constructor(private readonly storage: StorageLike | null) {}

  private read(): DraftRecord[] {
    if (!this.storage) {
      return [];
    }
    try {
      const raw = this.storage.getItem(DRAFTS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as DraftFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) {
        return [];
      }
      return parsed.drafts;
    } catch {
      return [];
    }
  }

  private write(records: DraftRecord[]): void {
    if (!this.storage) {
      return;
    }
    const file: DraftFile = { version: 1, drafts: records };
    this.storage.setItem(DRAFTS_KEY, JSON.stringify(file));
  }

  list(): DraftSummary[] {
    return this.read()
      .map((record) => ({ id: record.id, name: record.name, updatedAt: record.updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  has(id: string): boolean {
    return this.read().some((record) => record.id === id);
  }

  get(id: string): LevelData | null {
    return this.read().find((record) => record.id === id)?.level ?? null;
  }

  /** Saves (upserting by name slug) and returns the stored summary. */
  save(level: LevelData): DraftSummary {
    const id = slug(level.name);
    const updatedAt = Date.now();
    const records = this.read().filter((record) => record.id !== id);
    records.push({ id, name: level.name, updatedAt, level });
    this.write(records);
    return { id, name: level.name, updatedAt };
  }

  remove(id: string): void {
    this.write(this.read().filter((record) => record.id !== id));
  }

  duplicate(id: string): DraftSummary | null {
    const records = this.read();
    const source = records.find((record) => record.id === id);
    if (!source) {
      return null;
    }
    const taken = new Set(records.map((record) => record.id));
    let name = `${source.name} copy`;
    let newId = slug(name);
    let counter = 2;
    while (taken.has(newId)) {
      name = `${source.name} copy ${counter}`;
      newId = slug(name);
      counter += 1;
    }
    const updatedAt = Date.now();
    const level: LevelData = { ...source.level, name };
    records.push({ id: newId, name, updatedAt, level });
    this.write(records);
    return { id: newId, name, updatedAt };
  }
}

// ---- library ---------------------------------------------------------------

/** Reads shipped levels (from the index + HTTP) and drafts (localStorage). */
export class LevelLibrary {
  constructor(
    private readonly base: string,
    private readonly index: LevelIndex,
    private readonly drafts: DraftStore,
  ) {}

  shipped(): LevelEntry[] {
    return this.index.levels;
  }

  draftsList(): DraftSummary[] {
    return this.drafts.list();
  }

  async loadShipped(id: string): Promise<LevelData> {
    const entry = this.index.levels.find((level) => level.id === id);
    if (!entry) {
      throw new Error(`unknown level "${id}"`);
    }
    const response = await fetch(`${this.base}${entry.file}`);
    if (!response.ok) {
      throw new Error(`failed to load ${entry.file} (${response.status})`);
    }
    return parseLevel(await response.text());
  }

  loadDraft(id: string): LevelData {
    const level = this.drafts.get(id);
    if (!level) {
      throw new Error(`unknown draft "${id}"`);
    }
    return level;
  }
}
