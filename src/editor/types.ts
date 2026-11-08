/** Editor-specific types. */

export type EditorTool = 'paint' | 'erase';
export type EditorMode = 'tiles' | 'entities';
export type EditorTab = 'tiles' | 'visual' | 'entities';

export type EditorEntityType =
  | 'spawn'
  | 'monster'
  | 'skeleton'
  | 'memory'
  | 'exit'
  | 'checkpoint';

export const EDITOR_ENTITY_TYPES: readonly EditorEntityType[] = [
  'spawn',
  'monster',
  'skeleton',
  'memory',
  'exit',
  'checkpoint',
];
