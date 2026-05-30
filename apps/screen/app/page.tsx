'use client';

import {
  useEffect,
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
);

export default function ScreenPage() {
  const [roomCode, setRoomCode] =
    useState('');

  const [joined, setJoined] =
    useState(false);

  const [question, setQuestion] =
    useState<any>(null);

  const [players, setPlayers] =
    useState<any[]>([]);

  const [timeLeft, setTimeLeft] =
    useState(0);

  useEffect(() => {
    socket.on(
      'playersUpdated',
      (data) => {
        setPlayers(
          data.players,
        );
      },
    );

    socket.on(
      'questionStarted',
      (data) => {
        setQuestion(data);
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

    return () => {
      socket.off(
        'playersUpdated',
      );

      socket.off(
        'questionStarted',
      );

      socket.off(
        'timerUpdate',
      );
    };
  }, []);

  const joinScreen = () => {
    socket.emit(
      'joinScreen',
      {
        roomCode,
      },
    );

    setJoined(true);
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-10 text-7xl font-black text-red-600">
          SCREEN
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value,
              )
            }
            className="rounded-2xl bg-gray-900 p-5 text-3xl outline-none"
          />

          <button
            onClick={joinScreen}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            CONNECT
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div className="text-5xl font-black text-red-600">
          {roomCode}
        </div>

        <div className="text-7xl font-black text-yellow-400">
          {timeLeft}
        </div>
      </div>

      {question && (
        <div>
          <div className="mb-10 rounded-3xl bg-gray-900 p-10 text-center text-5xl font-black">
            {question.text}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {question.answers.map(
              (
                answer: string,
                index: number,
              ) => (
                <div
                  key={index}
                  className="rounded-3xl bg-red-600 p-10 text-center text-4xl font-black"
                >
                  {answer}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-6 text-5xl font-black">
          LEADERBOARD
        </h2>

        <div className="flex flex-col gap-4">
          {players.map(
            (
              player,
              index,
            ) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-3xl bg-gray-900 p-6 text-3xl font-black"
              >
                <div>
                  #{index + 1}{' '}
                  {player.name}
                </div>

                <div>
                  ❤️{' '}
                  {player.lives}{' '}
                  | 🏆{' '}
                  {player.score}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}