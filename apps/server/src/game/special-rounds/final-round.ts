export function applyFinalRound(
  room: any,
) {
  room.isSpeedRound =
    false;

  room.isBlackoutRound =
    false;

  room.isLastChanceRound =
    false;

  room.isFinalRound =
    true;

  room.timeLeft = 5;
}