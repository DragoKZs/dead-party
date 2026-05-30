'use client';

import {
  useEffect,
  useState,
} from 'react';

import { io } from 'socket.io-client';

import {
  init,
  miniApp,
  retrieveLaunchParams,
} from '@tma.js/sdk';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    reconnection: true,
    reconnectionAttempts:
      Infinity,
    reconnectionDelay: 1000,
  },
);

export default function Home() {
  const [connected, setConnected] =
    useState(false);

  const [
    telegramUser,
    setTelegramUser,
  ] = useState<any>(null);

  const [playerName, setPlayerName] =
    useState('');

  const [roomCode, setRoomCode] =
    useState('');

  const [joined, setJoined] =
    useState(false);

  const [question, setQuestion] =
    useState<any>(null);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [
    questionEnded,
    setQuestionEnded,
  ] = useState(false);

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState<number | null>(
    null,
  );

  const [paused, setPaused] =
    useState(false);

  const [
    lockedAnswer,
    setLockedAnswer,
  ] = useState(false);

  const [
    isSpeedRound,
    setIsSpeedRound,
  ] = useState(false);

  const [
    isBlackoutRound,
    setIsBlackoutRound,
  ] = useState(false);

  const [
    isLastChanceRound,
    setIsLastChanceRound,
  ] = useState(false);

  useEffect(() => {
    socket.on(
      'connect',
      () => {
        setConnected(true);
      },
    );

    socket.on(
      'disconnect',
      () => {
        setConnected(false);
      },
    );

    return () => {
      socket.off('connect');

      socket.off(
        'disconnect',
      );
    };
  }, []);

  useEffect(() => {
    try {
      init();

      miniApp.mount();

      const lp =
        retrieveLaunchParams();

      const user =
        lp.tgWebAppData
          ?.user;

      if (user) {
        setTelegramUser(
          user,
        );

        const fullName = [
          user.first_name,
          user.last_name,
        ]
          .filter(Boolean)
          .join(' ');

        setPlayerName(
          fullName,
        );
      }
    } catch {
      console.log(
        'Telegram SDK unavailable',
      );
    }
  }, []);

  useEffect(() => {
    if (
      typeof window ===
      'undefined'
    )
      return;

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const room =
      params.get('room');

    if (room) {
      setRoomCode(room);
    }
  }, []);

  useEffect(() => {
    socket.on(
      'questionStarted',
      (data) => {
        setQuestion(data);

        setQuestionEnded(false);

        setCorrectAnswer(null);

        setLockedAnswer(false);

        setIsSpeedRound(
          data.isSpeedRound,
        );

        setIsBlackoutRound(
          data.isBlackoutRound,
        );

        setIsLastChanceRound(
          data.isLastChanceRound,
        );
      },
    );

    socket.on(
      'timerUpdate',
      (data) => {
        setTimeLeft(
          data.timeLeft,
        );
      },
    );

    socket.on(
      'questionEnded',
      (data) => {
        setQuestionEnded(true);

        setCorrectAnswer(
          data.correct,
        );
      },
    );

    socket.on(
      'gameState',
      (data) => {
        setPaused(data.paused);
      },
    );

    socket.on(
      'answerLocked',
      () => {
        setLockedAnswer(true);
      },
    );

    socket.on(
      'roomError',
      (data) => {
        alert(data.message);

        setJoined(false);
      },
    );

    return () => {
      socket.off(
        'questionStarted',
      );

      socket.off(
        'timerUpdate',
      );

      socket.off(
        'questionEnded',
      );

      socket.off('gameState');

      socket.off(
        'answerLocked',
      );

      socket.off('roomError');
    };
  }, []);

  const joinRoom = () => {
    if (
      !playerName.trim() ||
      !roomCode.trim()
    )
      return;

    socket.emit('joinRoom', {
      roomCode,
      playerName,
    });

    setJoined(true);
  };

  const submitAnswer = (
    answerIndex: number,
  ) => {
    if (questionEnded) return;

    if (paused) return;

    if (lockedAnswer) return;

    socket.emit(
      'submitAnswer',
      {
        roomCode,
        answerIndex,
      },
    );
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
        <h1 className="mb-12 text-center text-6xl font-black text-red-600">
          DEAD PARTY
        </h1>

        <div className="mb-4 text-sm text-gray-500">
          {connected
            ? '🟢 Connected'
            : '🔴 Connecting...'}
        </div>

        {telegramUser && (
          <div className="mb-4 rounded-2xl bg-blue-600 p-3 text-center font-bold">
            Telegram:{' '}
            {telegramUser.username ||
              telegramUser.first_name}
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-4">
          <input
            type="text"
            placeholder="YOUR NAME"
            value={playerName}
            onChange={(e) =>
              setPlayerName(
                e.target.value,
              )
            }
            className="w-full rounded-2xl bg-gray-900 p-5 text-xl outline-none"
          />

          <input
            type="text"
            placeholder="ROOM CODE"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value,
              )
            }
            className="w-full rounded-2xl bg-gray-900 p-5 text-xl outline-none"
          />

          <button
            onClick={joinRoom}
            className="rounded-2xl bg-red-600 p-5 text-2xl font-black"
          >
            JOIN ROOM
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col p-4 text-white
      ${
        isLastChanceRound
          ? 'bg-red-950'
          : isSpeedRound
          ? 'bg-red-950'
          : 'bg-black'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-black">
          {playerName}
        </div>

        <div className="text-5xl font-black text-yellow-400">
          ⏳ {timeLeft}
        </div>
      </div>

      {paused && (
        <div className="mb-4 rounded-2xl bg-yellow-500 p-4 text-center text-2xl font-black text-black">
          GAME PAUSED
        </div>
      )}

      {question && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-3xl bg-gray-900 p-6 text-center text-3xl font-black">
            {question.text}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4">
            {question.answers.map(
              (
                answer: string,
                index: number,
              ) => (
                <button
                  key={index}
                  disabled={
                    paused ||
                    lockedAnswer
                  }
                  onClick={() =>
                    submitAnswer(
                      index,
                    )
                  }
                  className={`min-h-[90px] rounded-3xl p-6 text-2xl font-black
                  ${
                    questionEnded &&
                    correctAnswer ===
                      index
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }

                  ${
                    isBlackoutRound &&
                    timeLeft <= 7
                      ? 'opacity-10 blur-sm'
                      : ''
                  }`}
                >
                  {answer}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </main>
  );
}