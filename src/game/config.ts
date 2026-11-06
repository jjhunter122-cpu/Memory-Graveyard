/** All gameplay tunables for Memory Graveyard live here. */

export const VIEW = {
  width: 960,
  height: 540,
} as const;

export const PLAYER = {
  speed: 235,
  radius: 15,
  color: '#e9e4d4',
  aura: '#8f7bff',
} as const;

export const MEMORY = {
  radius: 11,
  reach: 6,
  bob: 4,
  bobSpeed: 2.4,
  color: '#7ce7ff',
} as const;

export const GRAVE = {
  color: '#2a2f45',
  cap: '#3b4162',
} as const;

export const COLORS = {
  sky: '#0a0b10',
  fog: '#12121c',
  moon: '#d9d6ff',
  text: '#eae6ff',
  accent: '#7ce7ff',
} as const;
