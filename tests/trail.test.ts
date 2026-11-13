import { describe, expect, it } from 'vitest';
import {
  TrailFollower,
  TrailRecorder,
  trailYAt,
} from '../src/game/chase/trail';

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

  it('prunes old points while keeping a segment around x', () => {
    const trail = new TrailRecorder(1);
    trail.reset({ x: 0, y: 0 });
    for (let x = 1; x <= 10; x += 1) {
      trail.record(x, x * 10);
    }
    trail.pruneBefore(5);
    expect(trail.all[0]!.x).toBeLessThanOrEqual(5);
    expect(trail.all[1]!.x).toBeGreaterThanOrEqual(5);
    expect(trail.size).toBeLessThan(11);
  });
});

describe('trail y sampling', () => {
  const points = [
    { x: 10, y: 5 },
    { x: 20, y: 15 },
  ];

  it('clamps before the first point', () => {
    expect(trailYAt(points, 0)).toBe(5);
  });

  it('interpolates between points', () => {
    expect(trailYAt(points, 15)).toBe(10);
  });

  it('clamps after the last point', () => {
    expect(trailYAt(points, 30)).toBe(15);
  });

  it('returns null with no path', () => {
    expect(trailYAt([], 10)).toBeNull();
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
