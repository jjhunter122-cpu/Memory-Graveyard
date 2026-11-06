import type { StorageLike } from './storage';

export interface Settings {
  showHud: boolean;
  lastLevelId: string | null;
}

export const SETTINGS_KEY = 'memory-graveyard:settings:v1';

const DEFAULTS: Settings = { showHud: true, lastLevelId: null };

export class SettingsStore {
  constructor(private readonly storage: StorageLike | null) {}

  load(): Settings {
    if (!this.storage) {
      return { ...DEFAULTS };
    }
    try {
      const raw = this.storage.getItem(SETTINGS_KEY);
      if (!raw) {
        return { ...DEFAULTS };
      }
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        showHud: typeof parsed.showHud === 'boolean' ? parsed.showHud : DEFAULTS.showHud,
        lastLevelId:
          typeof parsed.lastLevelId === 'string' ? parsed.lastLevelId : DEFAULTS.lastLevelId,
      };
    } catch {
      return { ...DEFAULTS };
    }
  }

  save(settings: Settings): void {
    this.storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  update(patch: Partial<Settings>): Settings {
    const next = { ...this.load(), ...patch };
    this.save(next);
    return next;
  }
}
