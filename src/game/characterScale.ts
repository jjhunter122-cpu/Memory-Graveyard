import { MONSTER, PLAYER } from './config';

export type CharacterScale = 1 | 1.5 | 1.75 | 2;

export interface CharacterScaleOption {
  value: CharacterScale;
  label: string;
}

export const CHARACTER_SCALE_OPTIONS: readonly CharacterScaleOption[] = [
  { value: 1, label: 'Current / base' },
  { value: 1.5, label: '1.5 tiles' },
  { value: 1.75, label: '1.75 tiles' },
  { value: 2, label: '2 tiles' },
];

export function isCharacterScale(value: unknown): value is CharacterScale {
  return value === 1 || value === 1.5 || value === 1.75 || value === 2;
}

export function normalizeCharacterScale(value: unknown): CharacterScale {
  return isCharacterScale(value) ? value : 1;
}

export interface CharacterMetrics {
  playerWidth: number;
  playerHeight: number;
  monsterWidth: number;
  monsterHeight: number;
  heroDisplayWidth: number;
  heroDisplayHeight: number;
  ghostDisplaySize: number;
  skeletonDisplayWidth: number;
  skeletonDisplayHeight: number;
  catchRadius: number;
}

/**
 * Current preserves the existing player/monster proportions for comparison.
 * The scaled options set both characters to the same height in level tiles.
 */
export function characterMetrics(scale: CharacterScale, tileSize: number): CharacterMetrics {
  if (scale === 1) {
    return {
      playerWidth: PLAYER.width,
      playerHeight: PLAYER.height,
      monsterWidth: MONSTER.width,
      monsterHeight: MONSTER.height,
      heroDisplayWidth: 54,
      heroDisplayHeight: 30,
      ghostDisplaySize: 40,
      skeletonDisplayWidth: 40,
      skeletonDisplayHeight: 48,
      catchRadius: MONSTER.catchRadius,
    };
  }

  const target = Math.max(1, Math.round(tileSize * scale));
  const playerWidth = Math.min(
    32,
    Math.max(PLAYER.width, Math.round(PLAYER.width * (target / PLAYER.height) * 0.7)),
  );
  const monsterWidth = Math.min(
    40,
    Math.max(MONSTER.width, Math.round(MONSTER.width * (target / MONSTER.height))),
  );

  return {
    playerWidth,
    playerHeight: target,
    monsterWidth,
    monsterHeight: target,
    heroDisplayWidth: Math.round((90 / 50) * target),
    heroDisplayHeight: target,
    ghostDisplaySize: target,
    skeletonDisplayWidth: Math.round((44 / 52) * target),
    skeletonDisplayHeight: target,
    catchRadius: Math.round(MONSTER.catchRadius * (target / MONSTER.height)),
  };
}
