export function startBombPassGame(
  room: any,
  minPasses: number,
  maxPasses: number,
) {
  room.questionActive =
    false;

  room.miniGameActive =
    true;

  room.currentMiniGame =
    'bomb-pass';

  room.bombPassCount =
    0;

  room.previousBombHolder =
    null;

  room.explodeAt =
    Math.floor(
      Math.random() *
        (
          maxPasses -
          minPasses +
          1
        ),
    ) + minPasses;

  const randomPlayer =
    room.players[
      Math.floor(
        Math.random() *
          room.players
            .length,
      )
    ];

  room.bombHolder =
    randomPlayer.telegramId;

  return {
    holder:
      randomPlayer,

    explodeAt:
      room.explodeAt,
  };
}

export function passBomb(
  room: any,
  fromId: string,
  toId: string,
) {
  if (
    room.bombHolder !==
    fromId
  ) {
    return null;
  }

  room.previousBombHolder =
    fromId;

  room.bombHolder =
    toId;

  room.bombPassCount++;

  const exploded =
    room.bombPassCount >=
    room.explodeAt;

  return {
    exploded,

    holder:
      room.players.find(
        (p: any) =>
          p.telegramId ===
          toId,
      ),
  };
}