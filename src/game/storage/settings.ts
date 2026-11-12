import type { StorageLike } from './storage';

export interface Settings {
  showHud: boolean;
  lastLevelId: string | null;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export const SETTINGS_KEY = 'memory-graveyard:settings:v1';

/** Music starts 10% softer than the previous 0.35 title volume. */
export const DEFAULT_MUSIC_VOLUME = 0.32;

const DEFAULTS: Settings = {
  showHud: true,
  lastLevelId: null,
  masterVolume: 1,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  sfxVolume: 1,
};

function readVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

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
        masterVolume: readVolume(parsed.masterVolume, DEFAULTS.masterVolume),
        musicVolume: readVolume(parsed.musicVolume, DEFAULTS.musicVolume),
        sfxVolume: readVolume(parsed.sfxVolume, DEFAULTS.sfxVolume),
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
