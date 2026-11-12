/**
 * Pure trail-following helpers for the pursuer.
 *
 * The player's position is sampled into a distance-spaced polyline. The
 * monster walks that polyline, which means it can follow any jump, drop or
 * vertical shaft the player already proved traversable.
 */

export interface TrailPoint {
  x: number;
  y: number;
}

/** Interpolates the recorded path's y at a given x. */
export function trailYAt(
  points: readonly TrailPoint[],
  x: number,
): number | null {
  if (points.length === 0) {
    return null;
  }
  const first = points[0]!;
  if (x <= first.x) {
    return first.y;
  }
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const next = points[index]!;
    if (x <= next.x) {
      const span = next.x - previous.x;
      if (span <= 0) {
        return next.y;
      }
      const t = (x - previous.x) / span;
      return previous.y + (next.y - previous.y) * t;
    }
  }
  return points[points.length - 1]!.y;
}

export class TrailRecorder {
  private readonly points: TrailPoint[] = [];

  constructor(private readonly spacing: number) {}

  reset(start: TrailPoint): void {
    this.points.length = 0;
    this.points.push({ x: start.x, y: start.y });
  }

  /** Appends a point once the player has moved far enough from the last one. */
  record(x: number, y: number): void {
    const last = this.points[this.points.length - 1];
    if (!last) {
      this.points.push({ x, y });
      return;
    }
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy >= this.spacing * this.spacing) {
      this.points.push({ x, y });
    }
  }

  /** Drops old points while keeping a segment around the given x. */
  pruneBefore(x: number): void {
    let remove = 0;
    while (
      remove < this.points.length - 2 &&
      (this.points[remove + 1]?.x ?? 0) < x
    ) {
      remove += 1;
    }
    if (remove > 0) {
      this.points.splice(0, remove);
    }
  }

  clear(): void {
    this.points.length = 0;
  }

  get all(): readonly TrailPoint[] {
    return this.points;
  }

  get size(): number {
    return this.points.length;
  }
}

export class TrailFollower {
  readonly pos: TrailPoint;
  private index = 0;

  constructor(start: TrailPoint) {
    this.pos = { x: start.x, y: start.y };
  }

  reset(start: TrailPoint): void {
    this.pos.x = start.x;
    this.pos.y = start.y;
    this.index = 0;
  }

  /**
   * Walks up to `speed * dt` pixels along the recorded path. The follower never
   * runs past the newest recorded point.
   */
  update(points: readonly TrailPoint[], speed: number, dt: number): void {
    let remaining = speed * dt;
    while (remaining > 0 && this.index < points.length) {
      const target = points[this.index];
      if (!target) {
        break;
      }
      const dx = target.x - this.pos.x;
      const dy = target.y - this.pos.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= remaining) {
        this.pos.x = target.x;
        this.pos.y = target.y;
        remaining -= distance;
        this.index += 1;
      } else {
        const ratio = remaining / distance;
        this.pos.x += dx * ratio;
        this.pos.y += dy * ratio;
        remaining = 0;
      }
    }
  }
}
