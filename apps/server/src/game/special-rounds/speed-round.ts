export function applySpeedRound(
  room: any,
) {
  room.isSpeedRound =
    true;

  room.isBlackoutRound =
    false;

  room.isLastChanceRound =
    false;

  room.isFinalRound =
    false;

  room.timeLeft = 5;
}