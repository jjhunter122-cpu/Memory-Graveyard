import { describe, expect, it } from 'vitest';
import {
  validateLevelIndex,
  LevelIndexError,
} from '../src/game/storage/levels';

describe('level index', () => {
  it('accepts a well-formed index', () => {
    const index = validateLevelIndex({
      version: 1,
      levels: [{ id: 'a', name: 'A', file: 'levels/a.json' }],
    });
    expect(index.levels).toHaveLength(1);
    expect(index.levels[0]?.id).toBe('a');
  });

  it('rejects an unknown version', () => {
    expect(() => validateLevelIndex({ version: 2, levels: [] })).toThrow(LevelIndexError);
  });

  it('rejects a missing levels array', () => {
    expect(() => validateLevelIndex({ version: 1 })).toThrow(LevelIndexError);
  });

  it('rejects duplicate ids', () => {
    const bad = {
      version: 1,
      levels: [
        { id: 'a', name: 'A', file: 'levels/a.json' },
        { id: 'a', name: 'B', file: 'levels/b.json' },
      ],
    };
    expect(() => validateLevelIndex(bad)).toThrow(/duplicate/);
  });

  it('rejects entries missing fields', () => {
    const bad = { version: 1, levels: [{ id: 'a', name: 'A' }] };
    expect(() => validateLevelIndex(bad)).toThrow(LevelIndexError);
  });
});
