import { describe, expect, it } from 'vitest';
import { TrailFollower, TrailRecorder } from '../src/game/chase/trail';

describe('trail recorder', () => {
  it('starts at the spawn point and only records distance-spaced points', () => {
    const trail = new TrailRecorder(10);
    trail.reset({ x: 0, y: 0 });
    trail.record(4, 0);
    trail.record(11, 0);
    expect(trail.size).toBe(2);
    expect(trail.all[1]).toEqual({ x: 11, y: 0 });
  });

  it('keeps vertical movement', () => {
    const trail = new TrailRecorder(8);
    trail.reset({ x: 0, y: 0 });
    trail.record(0, 12);
    expect(trail.all[1]).toEqual({ x: 0, y: 12 });
  });
});

describe('trail follower', () => {
  it('walks a polyline at the requested speed', () => {
    const follower = new TrailFollower({ x: 0, y: 0 });
    follower.update(
      [
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ],
      10,
      1,
    );
    expect(follower.pos).toEqual({ x: 10, y: 0 });
  });

  it('does not run past the newest recorded point', () => {
    const follower = new TrailFollower({ x: 0, y: 0 });
    follower.update([{ x: 5, y: 0 }], 100, 1);
    expect(follower.pos).toEqual({ x: 5, y: 0 });
  });

  it('follows a vertical route', () => {
    const follower = new TrailFollower({ x: 0, y: 0 });
    follower.update(
      [
        { x: 0, y: 10 },
        { x: 0, y: 20 },
      ],
      14,
      1,
    );
    expect(follower.pos.x).toBe(0);
    expect(follower.pos.y).toBe(14);
  });
});
