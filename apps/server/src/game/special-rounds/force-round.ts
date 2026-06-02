export function forceRound(
  room: any,
  roundType:
    | 'speed'
    | 'blackout'
    | 'last-chance'
    | 'final',
) {
  room.forceSpeedRound =
    false;

  room.forceBlackoutRound =
    false;

  room.forceLastChanceRound =
    false;

  room.forceFinalRound =
    false;

  switch (
    roundType
  ) {
    case 'speed':
      room.forceSpeedRound =
        true;
      break;

    case 'blackout':
      room.forceBlackoutRound =
        true;
      break;

    case 'last-chance':
      room.forceLastChanceRound =
        true;
      break;

    case 'final':
      room.forceFinalRound =
        true;
      break;
  }
}