'use client';

import { useState } from 'react';

import { io } from 'socket.io-client';

import QRCode from 'react-qr-code';

const socket = io(
  'https://dead-party-server.onrender.com',
);

export default function HostPage() {
  const [roomCode, setRoomCode] =
    useState('123');

  const [created, setCreated] =
    useState(false);

  const createRoom = () => {
    socket.emit('createRoom', {
      roomCode,
    });

    setCreated(true);
  };

  const startGame = () => {
    socket.emit('startGame', {
      roomCode,
    });
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
    socket.emit('pauseGame', {
      roomCode,
    });
  };

  const resumeGame = () => {
    socket.emit(
      'resumeGame',
      {
        roomCode,
      },
    );
  };

  const forceSpeedRound =
    () => {
      socket.emit(
        'forceSpeedRound',
        {
          roomCode,
        },
      );
    };

  const forceBlackoutRound =
    () => {
      socket.emit(
        'forceBlackoutRound',
        {
          roomCode,
        },
      );
    };

  const forceLastChanceRound =
    () => {
      socket.emit(
        'forceLastChanceRound',
        {
          roomCode,
        },
      );
    };

  if (!created) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-10 text-7xl font-black text-red-600">
          HOST PANEL
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
            onClick={createRoom}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            CREATE ROOM
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mb-10">
        <div className="text-3xl text-gray-400">
          ROOM
        </div>

        <div className="text-8xl font-black text-red-600">
          {roomCode}
        </div>

        <div className="mt-8 w-fit rounded-3xl bg-white p-6">
          <QRCode
            value={`http://https://player-gilt-xi.vercel.app?room=${roomCode}`}
            size={220}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={startGame}
          className="rounded-3xl bg-green-600 p-10 text-4xl font-black"
        >
          START GAME
        </button>

        <button
          onClick={nextQuestion}
          className="rounded-3xl bg-blue-600 p-10 text-4xl font-black"
        >
          NEXT QUESTION
        </button>

        <button
          onClick={pauseGame}
          className="rounded-3xl bg-yellow-500 p-10 text-4xl font-black text-black"
        >
          PAUSE
        </button>

        <button
          onClick={resumeGame}
          className="rounded-3xl bg-orange-500 p-10 text-4xl font-black"
        >
          RESUME
        </button>

        <button
          onClick={
            forceSpeedRound
          }
          className="rounded-3xl bg-red-600 p-10 text-3xl font-black"
        >
          ⚡ FORCE SPEED
        </button>

        <button
          onClick={
            forceBlackoutRound
          }
          className="rounded-3xl bg-gray-700 p-10 text-3xl font-black"
        >
          🌑 FORCE BLACKOUT
        </button>

        <button
          onClick={
            forceLastChanceRound
          }
          className="col-span-2 rounded-3xl bg-red-950 p-10 text-4xl font-black"
        >
          ☠ FORCE LAST
          CHANCE
        </button>
      </div>
    </main>
  );
}