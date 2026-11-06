export type AppMode = 'menu' | 'playing' | 'editing';

/** Drives which DOM overlay (and which Excalibur scene) is currently active. */
export function setMode(mode: AppMode): void {
  const body = document.body;
  body.classList.remove('mode-menu', 'mode-playing', 'mode-editing');
  body.classList.add(`mode-${mode}`);
}
