import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { questions } from '../questions/questions';

import { categoryStyles } from '../questions/categories';

const rooms: any = {};

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },

  transports: ['websocket'],
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  setPhase(
    roomCode: string,
    phase: string,
  ) {
    const room = rooms[roomCode];

    room.phase = phase;

    this.server.to(roomCode).emit(
      'phaseChanged',
      {
        phase,
      },
    );
  }

  finishQuestion(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

    clearInterval(room.timer);

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
          room.isLastChanceRound
        ) {
          if (isCorrect) {
            if (
              player.lives <= 0
            ) {
              player.lives = 1;
            } else if (
              player.lives >= 3
            ) {
              player.score += 100;
            } else {
              player.lives += 1;

              if (
                player.lives > 3
              ) {
                player.lives = 3;
              }
            }
          }

          return;
        }

        if (isCorrect) {
          player.score +=
            room.isSpeedRound
              ? 200
              : 100;
        } else {
          player.lives -= 1;

          if (
            player.lives < 0
          ) {
            player.lives = 0;
          }
        }
      },
    );

    this.setPhase(
      roomCode,
      'REVEAL',
    );

    this.server.to(roomCode).emit(
      'questionEnded',
      {
        correct:
          room.currentQuestion
            .correct,
      },
    );

    setTimeout(() => {
      this.setPhase(
        roomCode,
        'LEADERBOARD',
      );

      this.server.to(
        roomCode,
      ).emit(
        'playersUpdated',
        {
          players:
            room.players,
        },
      );
    }, 3000);
  }

  checkAllAnswered(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

    const allAnswered =
      room.players.every(
        (p: any) =>
          p.hasAnswered,
      );

    if (
      allAnswered &&
      room.players.length > 0
    ) {
      room.timeLeft = 0;

      this.server.to(
        roomCode,
      ).emit('timerUpdate', {
        timeLeft: 0,
      });

      this.finishQuestion(
        roomCode,
      );
    }
  }

  createTimer(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

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

      if (
        room.timeLeft <= 0
      ) {
        this.finishQuestion(
          roomCode,
        );
      }
    }, 1000);
  }

  startQuestion(
    roomCode: string,
  ) {
    const room = rooms[roomCode];

    clearInterval(room.timer);

    room.questionActive = true;

    room.paused = false;

    room.roundCount++;

    room.isSpeedRound =
      room.forceSpeedRound ||
      Math.random() < 0.25;

    room.isBlackoutRound =
      room.forceBlackoutRound ||
      Math.random() < 0.2;

    room.isLastChanceRound =
      room.forceLastChanceRound ||
      room.roundCount % 5 ===
        0;

    room.forceSpeedRound =
      false;

    room.forceBlackoutRound =
      false;

    room.forceLastChanceRound =
      false;

    room.timeLeft =
      room.isSpeedRound
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

    this.setPhase(
      roomCode,
      'ROUND_INTRO',
    );

    this.server.to(roomCode).emit(
      'roundIntro',
      {
        category:
          randomQuestion.category,

        style:
          categoryStyles[
            randomQuestion.category
          ],

        isSpeedRound:
          room.isSpeedRound,

        isBlackoutRound:
          room.isBlackoutRound,

        isLastChanceRound:
          room.isLastChanceRound,
      },
    );

    setTimeout(() => {
      this.setPhase(
        roomCode,
        'QUESTION',
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
        },
      );

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

      this.createTimer(
        roomCode,
      );
    }, 2500);
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

    if (rooms[roomCode]) {
      client.emit(
        'roomError',
        {
          message:
            'Room already exists',
        },
      );

      return;
    }

    rooms[roomCode] = {
      players: [],

      timer: null,

      timeLeft: 0,

      paused: false,

      questionActive: false,

      currentQuestion: null,

      phase: 'LOBBY',

      isSpeedRound: false,

      isBlackoutRound: false,

      isLastChanceRound: false,

      roundCount: 0,

      forceSpeedRound: false,

      forceBlackoutRound: false,

      forceLastChanceRound: false,
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
    } = data;

    const room =
      rooms[roomCode];

    if (!room) {
      client.emit(
        'roomError',
        {
          message:
            'Room does not exist',
        },
      );

      return;
    }

    client.join(roomCode);

    room.players.push({
      id: client.id,

      name: playerName,

      score: 0,

      lives: 3,

      hasAnswered: false,

      selectedAnswer: null,

      lastResult: null,
    });

    this.server.to(roomCode).emit(
      'playersUpdated',
      {
        players:
          room.players,
      },
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
    const room =
      rooms[data.roomCode];

    if (!room) return;

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
    const room =
      rooms[data.roomCode];

    if (!room) return;

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

    room.forceSpeedRound =
      true;
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

    room.forceBlackoutRound =
      true;
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

    room.forceLastChanceRound =
      true;
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
          p.id ===
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

    this.checkAllAnswered(
      data.roomCode,
    );
  }
}