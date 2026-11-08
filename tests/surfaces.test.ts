import { describe, expect, it } from 'vitest';
import { tileSurfaceTop } from '../src/game/level/surfaces';

describe('tile collision surfaces', () => {
  it('uses the cell top for full and top-half tiles', () => {
    expect(tileSurfaceTop(32, 17)).toBe(544);
    expect(tileSurfaceTop(32, 17, 'top')).toBe(544);
  });

  it('uses the cell midpoint for bottom-half tiles', () => {
    expect(tileSurfaceTop(32, 17, 'bottom')).toBe(560);
    expect(tileSurfaceTop(32, 18, 'bottom')).toBe(592);
  });
});
