import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { questions } from '../questions/questions';

import { MazeGame } from './mini-games/maze.game';

import { ReactionGame } from './mini-games/reaction.game';

import { BombPassGame } from './mini-games/bomb-pass.game';

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

  private mazeGame =
    new MazeGame();

  private reactionGame =
    new ReactionGame();

  private bombPassGame =
    new BombPassGame();

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

    room.isSpeedRound =
      room.forceSpeedRound;

    room.isBlackoutRound =
      room.forceBlackoutRound;

    room.isLastChanceRound =
      room.forceLastChanceRound;

    room.isFinalRound =
      room.forceFinalRound;

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      false;

    room.forceFinalRound =
      false;

    room.timeLeft =
      room.isFinalRound
        ? 8
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
            (
              p: any,
            ) =>
              p.hasAnswered ||
              p.lives <=
                0,
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
                player.score +=
                  room.isFinalRound
                    ? 300
                    : room.isSpeedRound
                    ? 200
                    : 100;

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

                if (
                  player.lives >
                  0
                ) {
                  player.lives--;
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
  ) {
    rooms[data.roomCode] = {
      code:
        data.roomCode,

      players: [],

      started: false,

      paused: false,

      closed: false,

      miniGameActive:
        false,
    };
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

    if (!room)
      return;

    if (room.closed)
      return;

    client.join(
      data.roomCode,
    );

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

      this.emitPlayers(
        data.roomCode,
      );

      client.emit(
        'reconnected',
        existing,
      );

      return;
    }

    room.players.push({
      telegramId:
        data.telegramId,

      socketId:
        client.id,

      name:
        data.name,

      avatar:
        data.avatar ||
        emojiAvatars[
          Math.floor(
            Math.random() *
              emojiAvatars.length,
          )
        ],

      score: 0,

      lives: 3,

      streak: 0,

      bestStreak: 0,
    });

    this.emitPlayers(
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
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.started = true;

    this.server.to(
      data.roomCode,
    ).emit(
      'gameStarted',
    );

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
    'submitAnswer',
  )
  submitAnswer(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    const player =
      room.players.find(
        (p: any) =>
          p.telegramId ===
          data.playerId,
      );

    if (!player)
      return;

    player.hasAnswered =
      true;

    player.selectedAnswer =
      data.answer;
  }

  @SubscribeMessage(
    'pauseGame',
  )
  pauseGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.paused = true;

    this.server.to(
      data.roomCode,
    ).emit(
      'gamePaused',
    );
  }

  @SubscribeMessage(
    'resumeGame',
  )
  resumeGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.paused = false;

    this.server.to(
      data.roomCode,
    ).emit(
      'gameResumed',
    );
  }

  @SubscribeMessage(
    'forceSpeedRound',
  )
  forceSpeedRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.forceSpeedRound =
      true;
  }

  @SubscribeMessage(
    'forceBlackoutRound',
  )
  forceBlackoutRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.forceBlackoutRound =
      true;
  }

  @SubscribeMessage(
    'forceLastChanceRound',
  )
  forceLastChanceRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.forceLastChanceRound =
      true;
  }

  @SubscribeMessage(
    'forceFinalRound',
  )
  forceFinalRound(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.forceFinalRound =
      true;
  }

  @SubscribeMessage(
    'startReactionGame',
  )
  handleStartReactionGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    this.reactionGame.startReactionGame(
      room,

      data.roomCode,

      this.server,
    );
  }

  @SubscribeMessage(
    'reactionTap',
  )
  handleReactionTap(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    this.reactionGame.handleReactionTap(
      room,

      data.roomCode,

      data.playerId,

      this.server,

      this.emitPlayers.bind(
        this,
      ),
    );
  }

  @SubscribeMessage(
    'startMazeGame',
  )
  handleStartMazeGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    this.mazeGame.startMazeGame(
      room,

      data.roomCode,

      this.server,

      this.emitPlayers.bind(
        this,
      ),

      data.difficulty ||
        'normal',
    );
  }

  @SubscribeMessage(
    'startBombPass',
  )
  handleStartBombPass(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    this.bombPassGame.startBombPass(
      room,

      data.roomCode,

      this.server,

      this.emitPlayers.bind(
        this,
      ),

      data.min,

      data.max,
    );
  }

  @SubscribeMessage(
    'transferBomb',
  )
  handleTransferBomb(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    this.bombPassGame.transferBomb(
      room,

      data.roomCode,

      this.server,

      data.fromId,

      data.toId,
    );
  }

  @SubscribeMessage(
    'finishGame',
  )
  finishGame(
    @MessageBody()
    data: any,
  ) {
    const room =
      this.getRoom(
        data.roomCode,
      );

    if (!room)
      return;

    room.closed = true;

    clearInterval(
      room.timer,
    );

    clearInterval(
      room.mazeTimer,
    );

    if (
      room.bombPass
        ?.timeout
    ) {
      clearTimeout(
        room.bombPass
          .timeout,
      );
    }

    this.server.to(
      data.roomCode,
    ).emit(
      'gameFinished',
    );

    delete rooms[
      data.roomCode
    ];
  }
}