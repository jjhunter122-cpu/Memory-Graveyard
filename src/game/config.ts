/** All gameplay tunables for Memory Graveyard live here. */

export const VIEW = {
  width: 960,
  height: 540,
} as const;

/** Logical tile size in pixels. Levels are authored on this grid. */
export const TILE = 32;

export const PHYSICS = {
  gravityY: 1500,
  /**
   * Fixed simulation rate. `0` disables the fixed step and uses the engine's
   * natural variable timestep (smoother on high-refresh displays; the player
   * controller is dt-correct either way).
   */
  fixedFps: 0,
} as const;

export const GRAVITY = PHYSICS.gravityY;

export const PLAYER = {
  width: 22,
  height: 30,
  runSpeed: 225,
  groundAccel: 2600,
  airAccel: 1600,
  groundFriction: 3000,
  airFriction: 300,
  jumpSpeed: 470,
  maxFallSpeed: 980,
  jumpCutMultiplier: 0.45,
  coyoteTime: 0.04,
  jumpBufferTime: 0.12,
  apexVelocity: 130,
  apexGravityScale: 0.62,
  dropThroughTime: 0.18,
  color: '#e9e4d4',
} as const;

export const MEMORY = {
  radius: 9,
  bob: 4,
  bobSpeed: 2.2,
  color: '#7ce7ff',
} as const;

export const COLORS = {
  background: '#0a0b10',
  fog: '#12121c',
  solid: '#2a2f45',
  solidTop: '#3b4162',
  oneWay: '#4a3c28',
  oneWayTop: '#8a754e',
  exit: '#b6ff7c',
  text: '#eae6ff',
} as const;

export const LEVEL = {
  /** Falling past this distance below the level respawns the player. */
  killMargin: 220,
} as const;
