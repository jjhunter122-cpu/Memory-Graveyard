import { describe, expect, it } from 'vitest';
import { DraftStore } from '../src/game/storage/levels';
import type { StorageLike } from '../src/game/storage/storage';
import { createLevel } from '../src/game/level/schema';

class FakeStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

function store(): { storage: FakeStorage; drafts: DraftStore } {
  const storage = new FakeStorage();
  return { storage, drafts: new DraftStore(storage) };
}

describe('DraftStore', () => {
  it('starts empty', () => {
    const { drafts } = store();
    expect(drafts.list()).toEqual([]);
    expect(drafts.get('anything')).toBeNull();
  });

  it('saves, lists and reads a draft', () => {
    const { drafts } = store();
    drafts.save(createLevel('My Level', 4, 4, 32));
    const list = drafts.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('my-level');
    expect(drafts.get('my-level')?.name).toBe('My Level');
  });

  it('upserts a draft with the same name', () => {
    const { drafts } = store();
    drafts.save(createLevel('Same', 4, 4, 32));
    drafts.save(createLevel('Same', 8, 8, 32));
    expect(drafts.list()).toHaveLength(1);
    expect(drafts.get('same')?.width).toBe(8);
  });

  it('removes a draft', () => {
    const { drafts } = store();
    drafts.save(createLevel('Gone', 4, 4, 32));
    drafts.remove('gone');
    expect(drafts.list()).toHaveLength(0);
  });

  it('duplicates a draft with a unique id', () => {
    const { drafts } = store();
    drafts.save(createLevel('Original', 4, 4, 32));
    const copy = drafts.duplicate('original');
    expect(copy).not.toBeNull();
    expect(copy?.id).toBe('original-copy');
    expect(drafts.list()).toHaveLength(2);
  });

  it('persists across store instances sharing storage', () => {
    const { storage, drafts } = store();
    drafts.save(createLevel('Persisted', 4, 4, 32));
    expect(new DraftStore(storage).list()).toHaveLength(1);
  });

  it('tolerates corrupted storage', () => {
    const storage = new FakeStorage();
    storage.setItem('memory-graveyard:drafts:v1', '{ not json');
    const drafts = new DraftStore(storage);
    expect(drafts.list()).toEqual([]);
    drafts.save(createLevel('Recovers', 4, 4, 32));
    expect(drafts.list()).toHaveLength(1);
  });

  it('does nothing without storage', () => {
    const drafts = new DraftStore(null);
    drafts.save(createLevel('No Storage', 4, 4, 32));
    expect(drafts.list()).toEqual([]);
  });
});
