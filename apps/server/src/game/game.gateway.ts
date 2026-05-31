import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { questions } from '../questions/questions';

const emojiAvatars = [
  '😈',
  '👻',
  '🤖',
  '💀',
  '👽',
  '🔥',
  '🦊',
  '🐸',
  '🦁',
  '🐼',
];

const rooms: any = {};

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private addKillFeed(
    roomCode: string,
    text: string,
  ) {
    const room = rooms[roomCode];

    if (!room) return;

    room.killFeed.unshift({
      id: Date.now(),
      text,
    });

    room.killFeed =
      room.killFeed.slice(
        0,
        5,
      );

    this.server.to(roomCode).emit(
      'killFeedUpdated',
      room.killFeed,
    );
  }

  private getAlivePlayers(
    room: any,
  ) {
    return room.players.filter(
      (p: any) =>
        p.lives > 0,
    );
  }

  private updateLeaderboard(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

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

  startQuestion(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

    if (!room) return;

    clearInterval(room.timer);

    room.questionActive = true;

    room.paused = false;

    const alivePlayers =
      this.getAlivePlayers(
        room,
      );

    room.isFinalRound =
      alivePlayers.length <= 3;

    room.isSpeedRound =
      !room.isFinalRound &&
      (room.forceSpeedRound ||
        Math.random() <
        0.25);

    room.isBlackoutRound =
      !room.isFinalRound &&
      (room.forceBlackoutRound ||
        Math.random() <
        0.2);

    room.isLastChanceRound =
      !room.isFinalRound &&
      (room.forceLastChanceRound ||
        Math.random() <
        0.15);

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      false;

    room.timeLeft =
      room.isFinalRound
        ? 5
        : room.isSpeedRound
          ? 5
          : 10;

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
        player.hasAnswered = false;

        player.selectedAnswer =
          null;

        player.lastResult =
          null;
      },
    );

    this.server.to(roomCode).emit(
      'questionStarted',
      {
        ...room.currentQuestion,

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

    if (
      room.isFinalRound
    ) {
      this.addKillFeed(
        roomCode,
        '🔥 НАЧАЛСЯ ФИНАЛ',
      );
    }

    this.server.to(roomCode).emit(
      'timerUpdate',
      {
        timeLeft:
          room.timeLeft,
      },
    );

    this.server.to(roomCode).emit(
      'gameState',
      {
        paused: false,
      },
    );

    room.timer = setInterval(() => {
      if (room.paused)
        return;

      room.timeLeft--;

      this.server.to(
        roomCode,
      ).emit('timerUpdate', {
        timeLeft:
          room.timeLeft,
      });

      const allAnswered =
        room.players.every(
          (p: any) =>
            p.hasAnswered ||
            p.lives <= 0,
        );

      if (
        allAnswered &&
        room.players.length > 0
      ) {
        room.timeLeft = 0;
      }

      if (
        room.timeLeft <= 0
      ) {
        clearInterval(
          room.timer,
        );

        room.questionActive = false;

        room.players.forEach(
          (player: any) => {
            const isCorrect =
              player.selectedAnswer ===
              room.currentQuestion
                .correct;

            player.lastResult =
              isCorrect;

            if (
              isCorrect
            ) {
              player.correctAnswers++;

              player.streak++;

              if (
                player.streak >
                player.bestStreak
              ) {
                player.bestStreak =
                  player.streak;
              }

              if (
                player.streak >=
                3
              ) {
                this.server
                  .to(player.socketId)
                  .emit(
                    'streak',
                    {
                      streak:
                        player.streak,
                    },
                  );

                this.addKillFeed(
                  roomCode,
                  `🔥 ${player.name} НА СЕРИИ x${player.streak}`,
                );
              }
            } else {
              player.streak = 0;
            }

            if (
              room.isLastChanceRound
            ) {
              if (
                isCorrect
              ) {
                if (
                  player.lives <=
                  0
                ) {
                  player.lives = 1;

                  this.addKillFeed(
                    roomCode,
                    `💀 ${player.name} ВЕРНУЛСЯ В ИГРУ`,
                  );
                } else if (
                  player.lives >=
                  3
                ) {
                  player.score += 100;
                } else {
                  player.lives += 1;
                }
              }

              return;
            }

            if (
              isCorrect
            ) {
              player.score +=
                room.isFinalRound
                  ? 300
                  : room.isSpeedRound
                    ? 200
                    : 100;
            } else {
              if (
                player.lives > 0
              ) {
                player.lives--;

                if (
                  player.lives <=
                  0
                ) {
                  this.addKillFeed(
                    roomCode,
                    `☠ ${player.name} ВЫБЫЛ`,
                  );
                }
              }
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

        this.updateLeaderboard(
          roomCode,
        );

        const aliveAfter =
          this.getAlivePlayers(
            room,
          );

        if (
          aliveAfter.length <=
          1 &&
          room.isFinalRound
        ) {
          const winner =
            aliveAfter[0];

          this.server.to(
            roomCode,
          ).emit(
            'gameFinished',
            {
              winner,
              players:
                room.players,
            },
          );

          this.addKillFeed(
            roomCode,
            `👑 ПОБЕДИТЕЛЬ — ${winner?.name || 'НЕТ ПОБЕДИТЕЛЯ'}`,
          );
        }
      }
    }, 1000);
  }

  @SubscribeMessage(
    'createRoom',
  )
  handleCreateRoom(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const { roomCode } =
      data;

    rooms[roomCode] = {
      players: [],

      timer: null,

      timeLeft: 0,

      paused: false,

      questionActive: false,

      currentQuestion: null,

      isSpeedRound: false,

      isBlackoutRound: false,

      isLastChanceRound: false,

      isFinalRound: false,

      forceSpeedRound: false,

      forceBlackoutRound: false,

      forceLastChanceRound: false,

      killFeed: [],
    };

    client.join(roomCode);

    client.emit(
      'roomCreated',
      {
        roomCode,
      },
    );
  }

  @SubscribeMessage(
    'joinRoom',
  )
  handleJoinRoom(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const {
      roomCode,
      playerName,
      telegramId,
      avatar,
    } = data;

    const room =
      rooms[roomCode];

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

    const existingPlayer =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          telegramId,
      );

    if (
      existingPlayer
    ) {
      existingPlayer.socketId =
        client.id;

      existingPlayer.disconnected =
        false;

      client.join(roomCode);

      client.emit(
        'reconnected',
        existingPlayer,
      );

      this.addKillFeed(
        roomCode,
        `🔄 ${existingPlayer.name} ВЕРНУЛСЯ`,
      );

      this.updateLeaderboard(
        roomCode,
      );

      return;
    }

    client.join(roomCode);

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

      telegramId,

      name: playerName,

      avatar:
        avatar ||
        randomEmoji,

      score: 0,

      lives: 3,

      streak: 0,

      bestStreak: 0,

      correctAnswers: 0,

      disconnected: false,

      hasAnswered: false,

      selectedAnswer:
        null,

      lastResult: null,
    });

    this.addKillFeed(
      roomCode,
      `🎮 ${playerName} ПОДКЛЮЧИЛСЯ`,
    );

    this.updateLeaderboard(
      roomCode,
    );
  }

  @SubscribeMessage(
    'joinScreen',
  )
  handleJoinScreen(
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
  handleStartGame(
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
  handleNextQuestion(
    @MessageBody()
    data: any,
  ) {
    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'pauseGame',
  )
  handlePauseGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    room.paused = true;

    this.server.to(
      data.roomCode,
    ).emit('gameState', {
      paused: true,
    });
  }

  @SubscribeMessage(
    'resumeGame',
  )
  handleResumeGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    room.paused = false;

    this.server.to(
      data.roomCode,
    ).emit('gameState', {
      paused: false,
    });
  }

  @SubscribeMessage(
    'forceSpeedRound',
  )
  handleForceSpeedRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    clearInterval(
      room.timer,
    );

    room.forceSpeedRound =
      true;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      false;

    room.isFinalRound =
      false;

    this.addKillFeed(
      data.roomCode,
      '⚡ ХОСТ ЗАПУСТИЛ БЛИЦ',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceBlackoutRound',
  )
  handleForceBlackoutRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    clearInterval(
      room.timer,
    );

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      true;

    room.forceLastChanceRound =
      false;

    room.isFinalRound =
      false;

    this.addKillFeed(
      data.roomCode,
      '🌑 ХОСТ ЗАПУСТИЛ ТЕМНОТУ',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceLastChanceRound',
  )
  handleForceLastChanceRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    clearInterval(
      room.timer,
    );

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      true;

    room.isFinalRound =
      false;

    this.addKillFeed(
      data.roomCode,
      '☠ ХОСТ ЗАПУСТИЛ ПОСЛЕДНИЙ ШАНС',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'forceFinalRound',
  )
  handleForceFinalRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    clearInterval(
      room.timer,
    );

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      false;

    room.isFinalRound =
      true;

    this.addKillFeed(
      data.roomCode,
      '🔥 ХОСТ ЗАПУСТИЛ ФИНАЛ',
    );

    this.startQuestion(
      data.roomCode,
    );
  }

  @SubscribeMessage(
    'submitAnswer',
  )
  handleSubmitAnswer(
    @MessageBody()
    data: any,
    @ConnectedSocket()
    client: Socket,
  ) {
    const room =
      rooms[data.roomCode];

    if (!room) return;

    if (
      !room.questionActive
    )
      return;

    if (room.paused)
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

        this.addKillFeed(
          room.roomCode,
          `📡 ${player.name} ОТКЛЮЧИЛСЯ`,
        );
      }
    });
  }
}