export class BombPassGame {
  getRandomBombTargets(
    room: any,

    currentId: string,

    lastHolderId?: string,
  ) {
    const alivePlayers =
      room.players.filter(
        (p: any) =>
          p.lives > 0 &&
          p.telegramId !==
            currentId &&
          p.telegramId !==
            lastHolderId,
      );

    const shuffled =
      [...alivePlayers].sort(
        () =>
          Math.random() -
          0.5,
      );

    return shuffled
      .slice(0, 6)
      .map((p: any) => ({
        telegramId:
          p.telegramId,

        name: p.name,

        avatar:
          p.avatar,
      }));
  }

  explodeBomb(
    room: any,

    roomCode: string,

    server: any,

    emitPlayers: (
      roomCode: string,
    ) => void,
  ) {
    if (
      !room ||
      !room.bombPass
    )
      return;

    const holder =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          room.bombPass
            .holderId,
      );

    if (!holder)
      return;

    if (
      holder.lives > 0
    ) {
      holder.lives--;
    }

    if (
      holder.lives <= 0
    ) {
      holder.eliminated =
        true;
    }

    room.miniGameActive =
      false;

    room.currentMiniGame =
      null;

    server
      .to(roomCode)
      .emit(
        'bombExploded',
        {
          player: {
            name:
              holder.name,

            avatar:
              holder.avatar,
          },

          lives:
            holder.lives,
        },
      );

    emitPlayers(
      roomCode,
    );

    clearTimeout(
      room.bombPass
        .timeout,
    );

    room.bombPass =
      null;
  }

  startBombPass(
    room: any,

    roomCode: string,

    server: any,

    emitPlayers: (
      roomCode: string,
    ) => void,

    min: number,

    max: number,
  ) {
    if (
      room.miniGameActive
    )
      return;

    const alivePlayers =
      room.players.filter(
        (p: any) =>
          p.lives > 0,
      );

    if (
      alivePlayers.length <
      2
    )
      return;

    room.questionActive =
      false;

    room.miniGameActive =
      true;

    room.currentMiniGame =
      'bomb';

    const randomPlayer =
      alivePlayers[
        Math.floor(
          Math.random() *
            alivePlayers.length,
        )
      ];

    const seconds =
      Math.floor(
        Math.random() *
          (max -
            min +
            1),
      ) + min;

    room.bombPass = {
      active: true,

      holderId:
        randomPlayer.telegramId,

      lastHolderId:
        null,

      explodeAt:
        Date.now() +
        seconds *
          1000,

      timeout:
        setTimeout(() => {
          this.explodeBomb(
            room,

            roomCode,

            server,

            emitPlayers,
          );
        }, seconds * 1000),
    };

    server
      .to(roomCode)
      .emit(
        'bombPassStarted',
        {
          holder:
            randomPlayer.name,
        },
      );

    const targets =
      this.getRandomBombTargets(
        room,

        randomPlayer.telegramId,
      );

    server
      .to(
        randomPlayer.socketId,
      )
      .emit(
        'bombAssigned',
        {
          targets,
        },
      );
  }

  transferBomb(
    room: any,

    roomCode: string,

    server: any,

    fromId: string,

    toId: string,
  ) {
    if (
      !room ||
      !room.bombPass
    )
      return;

    if (
      !room.bombPass
        .active
    )
      return;

    if (
      room.bombPass
        .holderId !==
      fromId
    )
      return;

    const target =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          toId,
      );

    if (
      !target ||
      target.lives <= 0
    )
      return;

    room.bombPass
      .lastHolderId =
      fromId;

    room.bombPass
      .holderId =
      toId;

    server
      .to(roomCode)
      .emit(
        'bombTransferred',
        {
          to: target.name,
        },
      );

    const nextTargets =
      this.getRandomBombTargets(
        room,

        target.telegramId,

        fromId,
      );

    server
      .to(
        target.socketId,
      )
      .emit(
        'bombAssigned',
        {
          targets:
            nextTargets,
        },
      );
  }
}