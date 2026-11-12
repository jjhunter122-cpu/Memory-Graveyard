/**
 * Ambience track metadata. Kept free of Excalibur imports so the run scenes can
 * list tracks without loading the audio engine.
 */
export interface AmbienceTrack {
  id: string;
  label: string;
  path: string;
}

export const AMBIENCE_TRACKS: readonly AmbienceTrack[] = [
  {
    id: 'spooky-forest',
    label: 'Spooky Forest',
    path: 'assets/audio/ambience/spooky-forest.mp3',
  },
];

export function findAmbienceTrack(id: string | undefined): AmbienceTrack | undefined {
  return AMBIENCE_TRACKS.find((track) => track.id === id);
}
