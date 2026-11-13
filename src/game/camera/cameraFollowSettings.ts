/**
 * Camera-follow presets. These are plain data so scenes can list them without
 * importing Excalibur.
 */

export type CameraFollowId = 'current' | 'soft' | 'momentum' | 'impact';

export interface CameraFollowSettings {
  id: CameraFollowId;
  label: string;
  /** Horizontal deadzone in world pixels. */
  deadzoneX: number;
  /** Vertical deadzone in world pixels. */
  deadzoneY: number;
  /** Horizontal follow smoothing per second. */
  lerpX: number;
  /** Vertical follow smoothing per second. */
  lerpY: number;
  /** Downward camera lead per unit of fall speed. 0 disables fall lead. */
  fallLead: number;
  /** Maximum downward lead in pixels. */
  maxFallLead: number;
  /** Upward lead while rising, in pixels. */
  jumpLead: number;
  /** Smoothing for the vertical lead itself. */
  leadLerp: number;
  /** Extra downward nudge on landing, in pixels. 0 disables it. */
  landingDip: number;
  /** How fast the landing dip decays, in pixels per second. */
  dipDecay: number;
}

export const CAMERA_FOLLOW_PRESETS: readonly CameraFollowSettings[] = [
  {
    id: 'current',
    label: 'Current',
    deadzoneX: 24,
    deadzoneY: 18,
    lerpX: 5,
    lerpY: 5,
    fallLead: 0,
    maxFallLead: 0,
    jumpLead: 0,
    leadLerp: 0,
    landingDip: 0,
    dipDecay: 0,
  },
  {
    id: 'soft',
    label: 'Soft follow',
    deadzoneX: 10,
    deadzoneY: 4,
    lerpX: 4,
    lerpY: 4.5,
    fallLead: 0,
    maxFallLead: 0,
    jumpLead: 0,
    leadLerp: 0,
    landingDip: 0,
    dipDecay: 0,
  },
  {
    id: 'momentum',
    label: 'Soft + fall momentum',
    deadzoneX: 10,
    deadzoneY: 4,
    lerpX: 4,
    lerpY: 4.5,
    fallLead: 0.035,
    maxFallLead: 28,
    jumpLead: 10,
    leadLerp: 6,
    landingDip: 0,
    dipDecay: 0,
  },
  {
    id: 'impact',
    label: 'Soft + fall momentum + landing dip',
    deadzoneX: 10,
    deadzoneY: 4,
    lerpX: 4,
    lerpY: 4.5,
    fallLead: 0.035,
    maxFallLead: 28,
    jumpLead: 10,
    leadLerp: 6,
    landingDip: 8,
    dipDecay: 48,
  },
];

export const DEFAULT_CAMERA_FOLLOW: CameraFollowId = 'current';

export function isCameraFollowId(value: unknown): value is CameraFollowId {
  return CAMERA_FOLLOW_PRESETS.some((preset) => preset.id === value);
}

export function normalizeCameraFollow(value: unknown): CameraFollowId {
  return isCameraFollowId(value) ? value : DEFAULT_CAMERA_FOLLOW;
}

export function findCameraFollowPreset(value: unknown): CameraFollowSettings {
  const id = normalizeCameraFollow(value);
  return (
    CAMERA_FOLLOW_PRESETS.find((preset) => preset.id === id) ??
    CAMERA_FOLLOW_PRESETS[0]!
  );
}

/** Downward offset added to the camera target while falling. */
export function cameraFallLead(settings: CameraFollowSettings, vy: number): number {
  if (settings.fallLead <= 0) {
    return 0;
  }
  const lead = vy * settings.fallLead;
  return Math.max(-settings.jumpLead, Math.min(settings.maxFallLead, lead));
}
