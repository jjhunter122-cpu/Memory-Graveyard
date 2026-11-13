import { describe, expect, it } from 'vitest';
import { History } from '../src/editor/history';

describe('History', () => {
  it('starts with the initial state and nothing to undo/redo', () => {
    const history = new History('a');
    expect(history.current).toBe('a');
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it('undoes and redoes committed states', () => {
    const history = new History('a');
    history.commit('b');
    history.commit('c');
    expect(history.current).toBe('c');

    expect(history.undo()).toBe('b');
    expect(history.undo()).toBe('a');
    expect(history.undo()).toBe('a');
    expect(history.canUndo).toBe(false);

    expect(history.redo()).toBe('b');
    expect(history.redo()).toBe('c');
    expect(history.redo()).toBe('c');
    expect(history.canRedo).toBe(false);
  });

  it('drops the redo stack once a new state is committed', () => {
    const history = new History('a');
    history.commit('b');
    history.undo();
    expect(history.canRedo).toBe(true);
    history.commit('c');
    expect(history.canRedo).toBe(false);
    expect(history.current).toBe('c');
  });

  it('ignores commits that do not change the state', () => {
    const history = new History('a');
    history.commit('a');
    expect(history.canUndo).toBe(false);
  });

  it('respects the snapshot limit', () => {
    const history = new History(0, 3);
    history.commit(1);
    history.commit(2);
    history.commit(3);
    history.commit(4);
    let steps = 0;
    while (history.canUndo) {
      history.undo();
      steps += 1;
    }
    expect(steps).toBe(3);
    expect(history.current).toBe(1);
  });

  it('resets history around a new state', () => {
    const history = new History('a');
    history.commit('b');
    history.reset('z');
    expect(history.current).toBe('z');
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });
});
