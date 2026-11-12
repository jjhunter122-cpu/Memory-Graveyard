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
      showHud: true,
      lastLevelId: null,
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

  it('updates and persists a single field', () => {
    const settings = new SettingsStore(new FakeStorage());
    settings.update({ showHud: false });
    expect(settings.load().showHud).toBe(false);
    expect(settings.load().lastLevelId).toBeNull();
  });

  it('remembers the last level', () => {
    const settings = new SettingsStore(new FakeStorage());
    settings.update({ lastLevelId: 'test-course' });
    expect(settings.load().lastLevelId).toBe('test-course');
  });

  it('falls back to defaults on corrupt data', () => {
    const storage = new FakeStorage();
    storage.setItem('memory-graveyard:settings:v1', 'nonsense');
    expect(new SettingsStore(storage).load().showHud).toBe(true);
  });

  it('works without storage', () => {
    const settings = new SettingsStore(null);
    expect(settings.update({ showHud: false }).showHud).toBe(false);
    expect(settings.load().showHud).toBe(true);
  });
});
