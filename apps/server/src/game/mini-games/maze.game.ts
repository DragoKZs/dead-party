export class MazeGame {
  generateMaze(
    size: number,
  ) {
    const maze =
      Array.from(
        {
          length: size,
        },
        () =>
          Array(size).fill(1),
      );

    const directions = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ];

    const shuffle = (
      arr: any[],
    ) => {
      for (
        let i =
          arr.length - 1;
        i > 0;
        i--
      ) {
        const j =
          Math.floor(
            Math.random() *
              (i + 1),
          );

        [arr[i], arr[j]] =
          [
            arr[j],
            arr[i],
          ];
      }

      return arr;
    };

    const carve = (
      x: number,
      y: number,
    ) => {
      maze[y][x] = 0;

      shuffle([
        ...directions,
      ]).forEach(
        ([dx, dy]) => {
          const nx =
            x + dx;

          const ny =
            y + dy;

          if (
            ny > 0 &&
            ny <
              size - 1 &&
            nx > 0 &&
            nx <
              size - 1 &&
            maze[ny][nx] ===
              1
          ) {
            maze[
              y + dy / 2
            ][
              x + dx / 2
            ] = 0;

            carve(
              nx,
              ny,
            );
          }
        },
      );
    };

    carve(1, 1);

    maze[1][1] = 0;

    maze[size - 2][
      size - 2
    ] = 2;

    return maze;
  }

  startMazeGame(
    room: any,

    roomCode: string,

    server: any,

    emitPlayers: (
      roomCode: string,
    ) => void,

    difficulty = 'normal',
  ) {
    if (
      room.miniGameActive
    )
      return;

    let size = 11;

    let timer = 45;

    if (
      difficulty ===
      'easy'
    ) {
      size = 9;

      timer = 60;
    }

    if (
      difficulty ===
      'hard'
    ) {
      size = 15;

      timer = 45;
    }

    room.questionActive =
      false;

    room.miniGameActive =
      true;

    room.currentMiniGame =
      'maze';

    room.maze =
      this.generateMaze(
        size,
      );

    room.mazePlayers =
      {};

    room.mazeTimeLeft =
      timer;

    room.players.forEach(
      (player: any) => {
        room.mazePlayers[
          player.telegramId
        ] = {
          x: 1,
          y: 1,
          finished: false,
        };
      },
    );

    server
      .to(roomCode)
      .emit(
        'mazeStarted',
        {
          maze:
            room.maze,

          timer,

          difficulty,
        },
      );

    room.mazeTimer =
      setInterval(() => {
        room.mazeTimeLeft--;

        server
          .to(roomCode)
          .emit(
            'mazeTimer',
            {
              timeLeft:
                room.mazeTimeLeft,
            },
          );

        if (
          room.mazeTimeLeft <=
          0
        ) {
          clearInterval(
            room.mazeTimer,
          );

          room.players.forEach(
            (
              player: any,
            ) => {
              const mazePlayer =
                room
                  .mazePlayers[
                  player
                    .telegramId
                ];

              if (
                !mazePlayer.finished
              ) {
                if (
                  player.lives >
                  0
                ) {
                  player.lives--;
                }
              }
            },
          );

          room.miniGameActive =
            false;

          room.currentMiniGame =
            null;

          server
            .to(roomCode)
            .emit(
              'mazeEnded',
            );

          emitPlayers(
            roomCode,
          );
        }
      }, 1000);
  }
}