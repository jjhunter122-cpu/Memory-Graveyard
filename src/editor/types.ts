/** Editor-specific types. */

export type EditorTool = 'paint' | 'erase' | 'entity';

export type EditorEntityType = 'spawn' | 'memory' | 'exit' | 'checkpoint';

export const EDITOR_ENTITY_TYPES: readonly EditorEntityType[] = [
  'spawn',
  'memory',
  'exit',
  'checkpoint',
];
