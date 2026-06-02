import { applySpeedRound } from './speed-round';

import { applyBlackoutRound } from './blackout-round';

import { applyLastChanceRound } from './last-chance-round';

import { applyFinalRound } from './final-round';

export function applyRound(
  room: any,
  roundType: string,
) {
  switch (
    roundType
  ) {
    case 'speed':
      applySpeedRound(
        room,
      );
      break;

    case 'blackout':
      applyBlackoutRound(
        room,
      );
      break;

    case 'last-chance':
      applyLastChanceRound(
        room,
      );
      break;

    case 'final':
      applyFinalRound(
        room,
      );
      break;

    default:
      room.isSpeedRound =
        false;

      room.isBlackoutRound =
        false;

      room.isLastChanceRound =
        false;

      room.isFinalRound =
        false;

      room.timeLeft =
        10;
  }
}