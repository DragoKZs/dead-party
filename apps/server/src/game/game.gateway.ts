import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { getRoundType } from './special-rounds/round-manager';

import { applyRound } from './special-rounds/apply-round';

import { forceRound } from './special-rounds/force-round';

import { questions } from '../questions/questions';

import { startBombPassGame, passBomb, } from './mini-games/bomb-pass.game';

const rooms: any = {};

const emojiAvatars = [
  '😈',
  '👻',
  '🤖',
  '💀',
  '👽',
  '🔥',
  '🦊',
  '🐼',
  '🦁',
  '🐸',
];

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private getRoom(
    roomCode: string,
  ) {
    return rooms[roomCode];
  }

  private emitPlayers(
    roomCode: string,
  ) {
    const room =
      this.getRoom(roomCode);

    if (!room) return;

    const sorted = [
      ...room.players,
    ].sort((a, b) => {
      if (
        a.lives > 0 &&
        b.lives <= 0
      )
        return -1;

      if (
        a.lives <= 0 &&
        b.lives > 0
      )
        return 1;

      return (
        b.score - a.score
      );
    });

    this.server.to(roomCode).emit(
      'playersUpdated',
      {
        players: sorted,
      },
    );
  }

  private generateMaze(
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

  private startQuestion(
    roomCode: string,
  ) {
    const room =
      this.getRoom(roomCode);

    if (!room) return;

    if (room.closed)
      return;

    if (
      room.miniGameActive
    )
      return;

    clearInterval(
      room.timer,
    );

    room.questionActive =
      true;

    room.paused = false;

    const roundType =
      getRoundType(
        room,
      );

    applyRound(
      room,
      roundType,
    );


    const randomQuestion =
      questions[
      Math.floor(
        Math.random() *
        questions.length,
      )
      ];

    room.currentQuestion =
      randomQuestion;

    room.players.forEach(
      (player: any) => {
        player.hasAnswered =
          false;

        player.selectedAnswer =
          null;
      },
    );

    this.server.to(roomCode).emit(
      'questionStarted',
      {
        ...randomQuestion,

        isSpeedRound:
          room.isSpeedRound,

        isBlackoutRound:
          room.isBlackoutRound,

        isLastChanceRound:
          room.isLastChanceRound,

        isFinalRound:
          room.isFinalRound,
      },
    );

    this.server.to(roomCode).emit(
      'timerUpdate',
      {
        timeLeft:
          room.timeLeft,
      },
    );

    room.timer =
      setInterval(() => {
        if (
          room.paused
        )
          return;

        room.timeLeft--;

        this.server.to(
          roomCode,
        ).emit(
          'timerUpdate',
          {
            timeLeft:
              room.timeLeft,
          },
        );

        const everyoneAnswered =
          room.players.every(
            (p: any) =>
              p.hasAnswered,
          );

        if (
          everyoneAnswered
        ) {
          room.timeLeft = 0;
        }

        if (
          room.timeLeft <=
          0
        ) {
          clearInterval(
            room.timer,
          );

          room.questionActive =
            false;

          room.players.forEach(
            (
              player: any,
            ) => {
              const correct =
                player.selectedAnswer ===
                room
                  .currentQuestion
                  .correct;

              if (
                correct
              ) {

                if (
                  room.isLastChanceRound
                ) {
                  if (
                    player.lives <= 0
                  ) {
                    player.lives = 1;

                    player.eliminated =
                      false;
                  } else if (
                    player.lives < 3
                  ) {
                    player.lives++;
                  } else {
                    player.score += 50;
                  }
                } else {
                  player.score +=
                    room.isFinalRound
                      ? 300
                      : room.isSpeedRound
                        ? 200
                        : 100;
                }

                player.streak++;

                if (
                  player.streak >
                  player.bestStreak
                ) {
                  player.bestStreak =
                    player.streak;
                }
              } else {
                player.streak = 0;

                player.lives =
                  Math.max(
                    0,
                    player.lives - 1,
                  );

              }
            },
          );

          this.server.to(
            roomCode,
          ).emit(
            'questionEnded',
            {
              correct:
                room
                  .currentQuestion
                  .correct,
            },
          );

          this.emitPlayers(
            roomCode,
          );
        }
      }, 1000);
  }

  private startReactionGame(
    roomCode: string,
  ) {
    const room =
      this.getRoom(roomCode);

    if (!room) return;

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

    this.server.to(roomCode).emit(
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

      this.server.to(
        roomCode,
      ).emit(
        'reactionStarted',
      );
    }, delay);
  }

  private startMazeGame(
    roomCode: string,
    difficulty = 'normal',
  ) {
    const room =
      this.getRoom(roomCode);

    if (!room) return;

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

    this.server.to(roomCode).emit(
      'mazeStarted',
      {
        maze: room.maze,

        timer,

        difficulty,
      },
    );

    room.mazeTimer =
      setInterval(() => {
        room.mazeTimeLeft--;

        this.server.to(
          roomCode,
        ).emit(
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

          this.server.to(
            roomCode,
          ).emit(
            'mazeEnded',
          );

          this.emitPlayers(
            roomCode,
          );
        }
      }, 1000);
  }

  @SubscribeMessage(
    'createRoom',
  )
  createRoom(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    rooms[
      data.roomCode
    ] = {
      roomCode:
        data.roomCode,

      players: [],

      currentQuestion:
        null,

      timer: null,

      timeLeft: 0,

      paused: false,

      questionActive:
        false,

      closed: false,

      miniGameActive:
        false,

      currentMiniGame:
        null,

      reactionStarted:
        false,

      reactionWinner:
        null,

      maze: null,

      mazePlayers: {},

      mazeTimeLeft: 45,

      mazeTimer: null,

      isSpeedRound:
        false,

      isBlackoutRound:
        false,

      isLastChanceRound:
        false,

      isFinalRound:
        false,

      forceSpeedRound:
        false,

      forceBlackoutRound:
        false,

      forceLastChanceRound:
        false,

      forceFinalRound:
        false,

      bombHolder: null,

      previousBombHolder:
        null,

      bombPassCount: 0,

      explodeAt: 0,
    };

    client.join(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'joinRoom',
  )
  joinRoom(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) {
      client.emit(
        'roomError',
        {
          message:
            'Комната не существует',
        },
      );

      return;
    }

    const existing =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          data.telegramId,
      );

    if (existing) {
      existing.socketId =
        client.id;

      existing.disconnected =
        false;

      client.join(
        data.roomCode,
      );

      client.emit(
        'reconnected',
        existing,
      );

      this.emitPlayers(
        data.roomCode,
      );

      return;
    }

    const randomEmoji =
      emojiAvatars[
      Math.floor(
        Math.random() *
        emojiAvatars.length,
      )
      ];

    room.players.push({
      id: client.id,

      socketId:
        client.id,

      telegramId:
        data.telegramId,

      name:
        data.playerName,

      avatar:
        data.avatar ||
        randomEmoji,

      score: 0,

      lives: 3,

      streak: 0,

      bestStreak: 0,

      disconnected:
        false,

      eliminated:
        false,

      hasAnswered:
        false,

      selectedAnswer:
        null,
    });

    client.join(
      data.roomCode,
    );

    this.emitPlayers(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'joinScreen',
  )
  joinScreen(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'startGame',
  )
  startGame(
    @MessageBody()
    data: any,
  ) {
    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'nextQuestion',
  )
  nextQuestion(
    @MessageBody()
    data: any,
  ) {
    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'startReactionGame',
  )
  startReactionGameEvent(
    @MessageBody()
    data: any,
  ) {
    this.startReactionGame(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceSpeedRound',
  )
  forceSpeedRoundEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    forceRound(
      room,
      'speed',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceBlackoutRound',
  )
  forceBlackoutRoundEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    forceRound(
      room,
      'blackout',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceLastChanceRound',
  )
  forceLastChanceRoundEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    forceRound(
      room,
      'last-chance',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceFinalRound',
  )
  forceFinalRoundEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    forceRound(
      room,
      'final',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'reactionClick',
  )
  reactionClick(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

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
          p.socketId ===
          client.id,
      );

    if (!player) return;

    room.reactionWinner =
      player;

    player.score += 150;

    this.server.to(
      data.roomCode,
    ).emit(
      'reactionEnded',
      {
        winner: {
          name:
            player.name,

          avatar:
            player.avatar,
        },
      },
    );

    room.miniGameActive =
      false;

    room.currentMiniGame =
      null;

    this.emitPlayers(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'startBombPassGame',
  )
  startBombPassGameEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    const result =
      startBombPassGame(
        room,
        data.minPasses,
        data.maxPasses,
      );

    this.server.to(
      data.roomCode,
    ).emit(
      'bombPassStarted',
      {
        holder:
          result.holder,

        explodeAt:
          result.explodeAt,
      },
    );
  }

  @SubscribeMessage(
    'passBomb',
  )
  passBombEvent(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    const result =
      passBomb(
        room,
        data.fromId,
        data.toId,
      );

    if (!result)
      return;

    if (
      result.exploded
    ) {
      const player =
        room.players.find(
          (p: any) =>
            p.telegramId ===
            data.toId,
        );

      if (player) {
        player.lives =
          Math.max(
            0,
            player.lives - 1,
          );
      }

      this.server.to(
        data.roomCode,
      ).emit(
        'bombExploded',
        {
          player,
        },
      );

      room.miniGameActive =
        false;

      room.currentMiniGame =
        null;

      this.emitPlayers(
        data.roomCode,
      );

      return;
    }

    this.server.to(
      data.roomCode,
    ).emit(
      'bombPassed',
      {
        holder:
          result.holder,
      },
    );
  }


  @SubscribeMessage(
    'startMazeGame',
  )
  startMaze(
    @MessageBody()
    data: any,
  ) {
    this.startMazeGame(
      data.roomCode,
      data.difficulty ||
      'normal',
    );
  }

  @SubscribeMessage(
    'moveMazePlayer',
  )
  moveMazePlayer(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    if (
      !room.miniGameActive
    )
      return;

    const player =
      room.players.find(
        (p: any) =>
          p.socketId ===
          client.id,
      );

    if (!player) return;

    const mazePlayer =
      room.mazePlayers[
      player.telegramId
      ];

    let nx = mazePlayer.x;

    let ny = mazePlayer.y;

    if (
      data.direction ===
      'up'
    )
      ny--;

    if (
      data.direction ===
      'down'
    )
      ny++;

    if (
      data.direction ===
      'left'
    )
      nx--;

    if (
      data.direction ===
      'right'
    )
      nx++;

    const tile =
      room.maze[ny]?.[nx];

    if (
      tile === undefined
    )
      return;

    if (tile === 1)
      return;

    mazePlayer.x = nx;

    mazePlayer.y = ny;

    if (tile === 2) {
      mazePlayer.finished =
        true;

      if (
        player.lives < 3
      ) {
        player.lives++;
      } else {
        player.score += 50;
      }

      if (
        player.eliminated
      ) {
        player.eliminated =
          false;

        player.lives = 1;
      }

      this.server.to(
        player.socketId,
      ).emit(
        'achievement',
        {
          text: '🧩 ЛАБИРИНТ ПРОЙДЕН',
        },
      );

      this.server.to(
        data.roomCode,
      ).emit(
        'mazePlayerFinished',
        {
          player: {
            name:
              player.name,

            avatar:
              player.avatar,
          },
        },
      );
    }

    this.server.to(
      player.socketId,
    ).emit(
      'mazePosition',
      {
        x: mazePlayer.x,

        y: mazePlayer.y,
      },
    );

    this.emitPlayers(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'submitAnswer',
  )
  submitAnswer(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room) return;

    if (
      !room.questionActive
    )
      return;

    const player =
      room.players.find(
        (p: any) =>
          p.socketId ===
          client.id,
      );

    if (!player) return;

    if (
      player.hasAnswered
    )
      return;

    player.hasAnswered =
      true;

    player.selectedAnswer =
      data.answerIndex;

    client.emit(
      'answerLocked',
    );
  }

  handleDisconnect(
    client: Socket,
  ) {
    Object.values(
      rooms,
    ).forEach((room: any) => {
      const player =
        room.players.find(
          (p: any) =>
            p.socketId ===
            client.id,
        );

      if (player) {
        player.disconnected =
          true;

        this.emitPlayers(
          room.roomCode,
        );
      }
    });
  }
}