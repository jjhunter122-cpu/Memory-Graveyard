import { describe, expect, it } from 'vitest';
import { AMBIENCE_TRACKS, findAmbienceTrack } from '../src/game/audio/ambienceTracks';

describe('ambience tracks', () => {
  it('registers the Spooky Forest loop', () => {
    const track = findAmbienceTrack('spooky-forest');
    expect(track?.label).toBe('Spooky Forest');
    expect(track?.path).toBe('assets/audio/ambience/spooky-forest.mp3');
  });

  it('ignores unknown or missing ids', () => {
    expect(findAmbienceTrack(undefined)).toBeUndefined();
    expect(findAmbienceTrack('none')).toBeUndefined();
  });

  it('keeps ids unique', () => {
    const ids = AMBIENCE_TRACKS.map((track) => track.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
