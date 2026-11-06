import { describe, expect, it } from 'vitest';
import {
  DraftStore,
  EMPTY_SEQUENCES,
  LevelLibrary,
  resolveCampaign,
  SequenceValidationError,
  validateLevelIndex,
  validateSequences,
} from '../src/game/storage/levels';

const index = validateLevelIndex({
  version: 1,
  levels: [
    { id: 'a', name: 'A', file: 'levels/a.json', tier: 'dev' },
    { id: 'b', name: 'B', file: 'levels/b.json' },
    { id: 'c', name: 'C', file: 'levels/c.json', tier: 'community' },
  ],
});

describe('level tiers', () => {
  it('defaults a missing tier to dev', () => {
    expect(index.levels.find((level) => level.id === 'b')?.tier).toBe('dev');
  });

  it('reads an explicit community tier', () => {
    expect(index.levels.find((level) => level.id === 'c')?.tier).toBe('community');
  });

  it('rejects an invalid tier', () => {
    expect(() =>
      validateLevelIndex({
        version: 1,
        levels: [{ id: 'x', name: 'X', file: 'x.json', tier: 'bogus' }],
      }),
    ).toThrow(/tier/);
  });
});

describe('sequences', () => {
  it('accepts a well-formed sequences file', () => {
    const file = validateSequences({
      version: 1,
      sequences: [{ id: 'main', name: 'Main', levels: ['a', 'b'] }],
    });
    expect(file.sequences[0]?.levels).toEqual(['a', 'b']);
  });

  it('rejects an unknown version', () => {
    expect(() => validateSequences({ version: 2, sequences: [] })).toThrow(
      SequenceValidationError,
    );
  });

  it('rejects duplicate sequence ids', () => {
    const bad = {
      version: 1,
      sequences: [
        { id: 'main', name: 'Main', levels: [] },
        { id: 'main', name: 'Other', levels: [] },
      ],
    };
    expect(() => validateSequences(bad)).toThrow(/duplicate/);
  });

  it('rejects non-string level ids', () => {
    const bad = { version: 1, sequences: [{ id: 'main', name: 'Main', levels: [1] }] };
    expect(() => validateSequences(bad)).toThrow(SequenceValidationError);
  });
});

describe('resolveCampaign', () => {
  it('maps ids to entries, dropping unknown ids', () => {
    const entries = resolveCampaign(
      { id: 'main', name: 'Main', levels: ['c', 'a', 'missing'] },
      index,
    );
    expect(entries.map((entry) => entry.id)).toEqual(['c', 'a']);
  });

  it('returns nothing without a sequence', () => {
    expect(resolveCampaign(undefined, index)).toEqual([]);
  });
});

describe('LevelLibrary tiers and campaign', () => {
  const library = new LevelLibrary(
    '',
    index,
    new DraftStore(null),
    validateSequences({
      version: 1,
      sequences: [{ id: 'main', name: 'Main', levels: ['a', 'c'] }],
    }),
  );

  it('splits dev and community levels', () => {
    expect(library.devLevels().map((level) => level.id)).toEqual(['a', 'b']);
    expect(library.communityLevels().map((level) => level.id)).toEqual(['c']);
  });

  it('resolves the main campaign in order', () => {
    expect(library.campaignEntries().map((level) => level.id)).toEqual(['a', 'c']);
  });

  it('has no campaign without sequences', () => {
    const bare = new LevelLibrary('', index, new DraftStore(null), EMPTY_SEQUENCES);
    expect(bare.campaignEntries()).toEqual([]);
  });
});
