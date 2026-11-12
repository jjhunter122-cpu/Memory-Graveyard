import { parseLevel, type LevelData } from '../level/schema';
import { slug } from '../util/slug';
import type { StorageLike } from './storage';

export const LEVEL_INDEX_VERSION = 1;

/** Dev-made levels form the campaign; community levels live in the selector. */
export type LevelTier = 'dev' | 'community';

export interface LevelEntry {
  id: string;
  name: string;
  /** Path relative to the app base, e.g. `levels/test-course.json`. */
  file: string;
  tier: LevelTier;
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
  const levels: LevelEntry[] = obj.levels.map((rawEntry, index) => {
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
    const tierRaw = entry.tier;
    if (tierRaw !== undefined && tierRaw !== 'dev' && tierRaw !== 'community') {
      throw new LevelIndexError(`level ${id} has an invalid tier`);
    }
    const tier: LevelTier = tierRaw === 'community' ? 'community' : 'dev';
    return { id, name, file, tier };
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

// ---- sequences (shipped campaigns) -----------------------------------------

export const SEQUENCES_VERSION = 1;

export interface GameSequence {
  id: string;
  name: string;
  /** Ordered level ids. */
  levels: string[];
}

export interface SequenceFile {
  version: number;
  sequences: GameSequence[];
}

export class SequenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SequenceValidationError';
  }
}

export const EMPTY_SEQUENCES: SequenceFile = { version: SEQUENCES_VERSION, sequences: [] };

function sequenceRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SequenceValidationError(`${what} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function validateSequences(raw: unknown): SequenceFile {
  const obj = sequenceRecord(raw, 'sequences file');
  if (obj.version !== SEQUENCES_VERSION) {
    throw new SequenceValidationError(`unsupported sequences version ${String(obj.version)}`);
  }
  if (!Array.isArray(obj.sequences)) {
    throw new SequenceValidationError('sequences file needs a sequences array');
  }
  const seen = new Set<string>();
  const sequences: GameSequence[] = obj.sequences.map((rawSequence, index) => {
    const sequence = sequenceRecord(rawSequence, `sequence ${index}`);
    const { id, name, levels } = sequence;
    if (typeof id !== 'string' || id.length === 0) {
      throw new SequenceValidationError(`sequence ${index} needs a non-empty id`);
    }
    if (typeof name !== 'string' || name.length === 0) {
      throw new SequenceValidationError(`sequence ${id} needs a non-empty name`);
    }
    if (!Array.isArray(levels) || levels.some((level) => typeof level !== 'string')) {
      throw new SequenceValidationError(`sequence ${id} levels must be an array of strings`);
    }
    if (seen.has(id)) {
      throw new SequenceValidationError(`duplicate sequence id ${id}`);
    }
    seen.add(id);
    return { id, name, levels: levels as string[] };
  });
  return { version: SEQUENCES_VERSION, sequences };
}

/** Maps a sequence's level ids to index entries, dropping unknown ids. */
export function resolveCampaign(
  sequence: GameSequence | undefined,
  index: LevelIndex,
): LevelEntry[] {
  if (!sequence) {
    return [];
  }
  const byId = new Map(index.levels.map((level) => [level.id, level]));
  const entries: LevelEntry[] = [];
  for (const id of sequence.levels) {
    const entry = byId.get(id);
    if (entry) {
      entries.push(entry);
    }
  }
  return entries;
}

// ---- library ---------------------------------------------------------------

/** Reads shipped levels (index + HTTP), drafts (localStorage) and sequences. */
export class LevelLibrary {
  private index: LevelIndex;
  private sequences: SequenceFile;

  constructor(
    private readonly base: string,
    index: LevelIndex,
    private readonly drafts: DraftStore,
    sequences: SequenceFile = EMPTY_SEQUENCES,
  ) {
    this.index = index;
    this.sequences = sequences;
  }

  /** Re-fetches the index and sequences (after a dev save). */
  async reload(): Promise<void> {
    const [indexRaw, sequenceRaw] = await Promise.all([
      fetch(`${this.base}levels/index.json`).then((response) => response.json()),
      fetch(`${this.base}levels/sequences.json`)
        .then((response) => (response.ok ? response.json() : EMPTY_SEQUENCES))
        .catch(() => EMPTY_SEQUENCES),
    ]);
    this.index = validateLevelIndex(indexRaw);
    this.sequences = validateSequences(sequenceRaw);
  }

  setSequences(sequences: SequenceFile): void {
    this.sequences = sequences;
  }

  shipped(): LevelEntry[] {
    return this.index.levels;
  }

  devLevels(): LevelEntry[] {
    return this.index.levels.filter((level) => level.tier === 'dev');
  }

  communityLevels(): LevelEntry[] {
    return this.index.levels.filter((level) => level.tier === 'community');
  }

  draftsList(): DraftSummary[] {
    return this.drafts.list();
  }

  mainSequence(): GameSequence | undefined {
    return this.sequences.sequences.find((sequence) => sequence.id === 'main');
  }

  /** The ordered campaign of dev-made levels. */
  campaignEntries(): LevelEntry[] {
    return resolveCampaign(this.mainSequence(), this.index);
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
