export function applyBlackoutRound(
  room: any,
) {
  room.isSpeedRound =
    false;

  room.isBlackoutRound =
    true;

  room.isLastChanceRound =
    false;

  room.isFinalRound =
    false;

  room.timeLeft = 10;
}