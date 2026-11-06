/** A minimal subset of the Storage API, so tests can inject a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Returns localStorage if it is usable, else null (private mode, SSR, ...). */
export function safeLocalStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage;
    const probe = '__mg_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
