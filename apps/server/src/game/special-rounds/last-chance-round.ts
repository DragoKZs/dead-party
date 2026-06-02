export function applyLastChanceRound(
  room: any,
) {
  room.isSpeedRound =
    false;

  room.isBlackoutRound =
    false;

  room.isLastChanceRound =
    true;

  room.isFinalRound =
    false;

  room.timeLeft = 30;
}