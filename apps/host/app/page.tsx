'use client';

import {
  useState,
} from 'react';

import QRCode from 'react-qr-code';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    reconnection: true,
  },
);

export default function HostPage() {
  const [roomCode, setRoomCode] =
    useState('');

  const [created, setCreated] =
    useState(false);

  const createRoom = () => {
    if (!roomCode.trim())
      return;

    socket.emit(
      'createRoom',
      {
        roomCode,
      },
    );

    setCreated(true);
  };

  const startGame = () => {
    socket.emit(
      'startGame',
      {
        roomCode,
      },
    );
  };

  const nextQuestion = () => {
    socket.emit(
      'nextQuestion',
      {
        roomCode,
      },
    );
  };

  const pauseGame = () => {
    socket.emit(
      'pauseGame',
      {
        roomCode,
      },
    );
  };

  const resumeGame = () => {
    socket.emit(
      'resumeGame',
      {
        roomCode,
      },
    );
  };

  const speedRound = () => {
    socket.emit(
      'forceSpeedRound',
      {
        roomCode,
      },
    );
  };

  const blackoutRound = () => {
    socket.emit(
      'forceBlackoutRound',
      {
        roomCode,
      },
    );
  };

  const lastChanceRound =
    () => {
      socket.emit(
        'forceLastChanceRound',
        {
          roomCode,
        },
      );
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
      <h1 className="mb-10 text-7xl font-black text-red-600">
        HOST
      </h1>

      {!created ? (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value,
              )
            }
            placeholder="ROOM CODE"
            className="rounded-2xl bg-gray-900 p-5 text-3xl outline-none"
          />

          <button
            onClick={createRoom}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            CREATE ROOM
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center text-5xl font-black">
            ROOM:{' '}
            {roomCode}
          </div>

          <div className="rounded-3xl bg-white p-4">
            <QRCode
              value={`https://https://player-gilt-xi.vercel.app?room=${roomCode}`}
              size={220}
            />
          </div>

          <button
            onClick={startGame}
            className="w-full rounded-2xl bg-green-600 p-5 text-3xl font-black"
          >
            START GAME
          </button>

          <button
            onClick={nextQuestion}
            className="w-full rounded-2xl bg-blue-600 p-5 text-3xl font-black"
          >
            NEXT QUESTION
          </button>

          <button
            onClick={pauseGame}
            className="w-full rounded-2xl bg-yellow-500 p-5 text-3xl font-black text-black"
          >
            PAUSE
          </button>

          <button
            onClick={
              resumeGame
            }
            className="w-full rounded-2xl bg-purple-600 p-5 text-3xl font-black"
          >
            RESUME
          </button>

          <button
            onClick={speedRound}
            className="w-full rounded-2xl bg-orange-500 p-5 text-3xl font-black"
          >
            ⚡ SPEED ROUND
          </button>

          <button
            onClick={
              blackoutRound
            }
            className="w-full rounded-2xl bg-white p-5 text-3xl font-black text-black"
          >
            🌑 BLACKOUT
          </button>

          <button
            onClick={
              lastChanceRound
            }
            className="w-full rounded-2xl bg-red-800 p-5 text-3xl font-black"
          >
            ☠ LAST CHANCE
          </button>
        </div>
      )}
    </main>
  );
}