export class ReactionGame {
  startReactionGame(
    room: any,

    roomCode: string,

    server: any,
  ) {
    if (
      room.miniGameActive
    )
      return;

    room.questionActive =
      false;

    room.miniGameActive =
      true;

    room.currentMiniGame =
      'reaction';

    room.reactionWinner =
      null;

    room.reactionStarted =
      false;

    server
      .to(roomCode)
      .emit(
        'reactionWaiting',
      );

    const delay =
      Math.floor(
        Math.random() *
          4000,
      ) + 2000;

    setTimeout(() => {
      room.reactionStarted =
        true;

      server
        .to(roomCode)
        .emit(
          'reactionStarted',
        );
    }, delay);
  }

  handleReactionTap(
    room: any,

    roomCode: string,

    playerId: string,

    server: any,

    emitPlayers: (
      roomCode: string,
    ) => void,
  ) {
    if (
      !room.miniGameActive
    )
      return;

    if (
      room.currentMiniGame !==
      'reaction'
    )
      return;

    if (
      !room.reactionStarted
    )
      return;

    if (
      room.reactionWinner
    )
      return;

    const player =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          playerId,
      );

    if (!player)
      return;

    room.reactionWinner =
      player.telegramId;

    player.score += 150;

    room.miniGameActive =
      false;

    room.currentMiniGame =
      null;

    server
      .to(roomCode)
      .emit(
        'reactionWinner',
        {
          player: {
            name:
              player.name,

            avatar:
              player.avatar,
          },
        },
      );

    emitPlayers(
      roomCode,
    );
  }
}