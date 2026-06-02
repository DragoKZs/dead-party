export type RoundType =
  | 'normal'
  | 'speed'
  | 'blackout'
  | 'last-chance'
  | 'final';

export function getRoundType(
  room: any,
): RoundType {
  const alivePlayers =
    room.players.filter(
      (p: any) =>
        p.lives > 0,
    );

  // 🔥 FINAL

  if (
    room.forceFinalRound
  ) {
    room.forceFinalRound =
      false;

    return 'final';
  }

  if (
    alivePlayers.length <= 3 &&
    alivePlayers.length > 1
  ) {
    return 'final';
  }

  // ⚡ SPEED

  if (
    room.forceSpeedRound
  ) {
    room.forceSpeedRound =
      false;

    return 'speed';
  }

  // 🌑 BLACKOUT

  if (
    room.forceBlackoutRound
  ) {
    room.forceBlackoutRound =
      false;

    return 'blackout';
  }

  // ☠ LAST CHANCE

  if (
    room.forceLastChanceRound
  ) {
    room.forceLastChanceRound =
      false;

    return 'last-chance';
  }

  // 🎲 RANDOM

  const random =
    Math.random();

  if (random < 0.15)
    return 'speed';

  if (random < 0.25)
    return 'blackout';

  if (random < 0.32)
    return 'last-chance';

  return 'normal';
}