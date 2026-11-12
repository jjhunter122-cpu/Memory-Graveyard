import { describe, expect, it } from 'vitest';
import { SettingsStore } from '../src/game/storage/settings';
import type { StorageLike } from '../src/game/storage/storage';

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

describe('SettingsStore', () => {
  it('returns defaults when empty', () => {
    const settings = new SettingsStore(new FakeStorage());
    expect(settings.load()).toEqual({
      highScore: 0,
      masterVolume: 1,
      musicVolume: 0.32,
      sfxVolume: 1,
    });
  });

  it('clamps stored volumes to 0–1', () => {
    const storage = new FakeStorage();
    storage.setItem(
      'memory-graveyard:settings:v1',
      JSON.stringify({ masterVolume: 3, musicVolume: -1, sfxVolume: 0.4 }),
    );
    const settings = new SettingsStore(storage).load();
    expect(settings.masterVolume).toBe(1);
    expect(settings.musicVolume).toBe(0);
    expect(settings.sfxVolume).toBe(0.4);
  });

  it('keeps the high score a non-negative integer', () => {
    const storage = new FakeStorage();
    storage.setItem(
      'memory-graveyard:settings:v1',
      JSON.stringify({ highScore: 1234.9 }),
    );
    expect(new SettingsStore(storage).load().highScore).toBe(1234);

    storage.setItem(
      'memory-graveyard:settings:v1',
      JSON.stringify({ highScore: -50 }),
    );
    expect(new SettingsStore(storage).load().highScore).toBe(0);
  });

  it('updates and persists a single field', () => {
    const settings = new SettingsStore(new FakeStorage());
    settings.update({ musicVolume: 0.5 });
    expect(settings.load().musicVolume).toBe(0.5);
    expect(settings.load().highScore).toBe(0);
  });

  it('ignores retired fields from older saves', () => {
    const storage = new FakeStorage();
    storage.setItem(
      'memory-graveyard:settings:v1',
      JSON.stringify({ showHud: false, lastLevelId: 'test-course', highScore: 9 }),
    );
    const loaded = new SettingsStore(storage).load();
    expect(loaded).toEqual({
      highScore: 9,
      masterVolume: 1,
      musicVolume: 0.32,
      sfxVolume: 1,
    });
  });

  it('falls back to defaults on corrupt data', () => {
    const storage = new FakeStorage();
    storage.setItem('memory-graveyard:settings:v1', 'nonsense');
    expect(new SettingsStore(storage).load().highScore).toBe(0);
  });

  it('works without storage', () => {
    const settings = new SettingsStore(null);
    expect(settings.update({ musicVolume: 0.4 }).musicVolume).toBe(0.4);
    expect(settings.load().musicVolume).toBe(0.32);
  });
});
