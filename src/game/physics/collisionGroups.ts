import { CollisionGroup } from 'excalibur';

/**
 * Bitmask collision groups for the Arcade solver.
 *
 * Solid tiles are immovable blocks; one-way planks can be jumped through from
 * below. The player temporarily ignores one-way planks while rising, which is
 * how drop-through/one-way platforms are implemented on top of Arcade physics.
 */
const CAT_SOLID = 0b0001;
const CAT_ONEWAY = 0b0010;
const CAT_PLAYER = 0b0100;
const CAT_TRIGGER = 0b1000;

export const SOLID_GROUP = new CollisionGroup('solid', CAT_SOLID, ~CAT_SOLID);
export const ONEWAY_GROUP = new CollisionGroup('oneway', CAT_ONEWAY, ~CAT_ONEWAY);
export const TRIGGER_GROUP = new CollisionGroup('trigger', CAT_TRIGGER, ~CAT_TRIGGER);

export const PLAYER_GROUP = new CollisionGroup(
  'player',
  CAT_PLAYER,
  CAT_SOLID | CAT_ONEWAY | CAT_TRIGGER,
);

export const PLAYER_IGNORE_ONEWAY_GROUP = new CollisionGroup(
  'player-passthrough',
  CAT_PLAYER,
  CAT_SOLID | CAT_TRIGGER,
);
