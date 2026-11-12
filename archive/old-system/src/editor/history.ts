/**
 * A tiny snapshot-based undo/redo stack.
 *
 * Level documents are small (a few hundred tile ids), so storing whole snapshots
 * is simpler and safer than diffing. Levels are treated as immutable by the
 * editor operations, so each snapshot is independent.
 */
export class History<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];

  constructor(
    initial: T,
    private readonly limit = 200,
  ) {
    this.present = initial;
  }

  get current(): T {
    return this.present;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Records a new state, discarding any redo history. No-op if unchanged. */
  commit(next: T): void {
    if (next === this.present) {
      return;
    }
    this.past.push(this.present);
    if (this.past.length > this.limit) {
      this.past.shift();
    }
    this.present = next;
    this.future = [];
  }

  undo(): T {
    const previous = this.past.pop();
    if (previous === undefined) {
      return this.present;
    }
    this.future.push(this.present);
    this.present = previous;
    return this.present;
  }

  redo(): T {
    const next = this.future.pop();
    if (next === undefined) {
      return this.present;
    }
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }

  reset(state: T): void {
    this.past = [];
    this.present = state;
    this.future = [];
  }
}
