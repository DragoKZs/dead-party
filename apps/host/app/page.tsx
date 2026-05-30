'use client';

import {
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    reconnection: true,
  }
);

export default function HostPage() {
  const [roomCode, setRoomCode] =
    useState('');

  const [created, setCreated] =
    useState(false);

  const createRoom = () => {
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
        <div className="flex flex-col gap-4">
          <div className="text-center text-5xl font-black">
            ROOM:{' '}
            {roomCode}
          </div>

          <button
            onClick={startGame}
            className="rounded-2xl bg-green-600 p-5 text-3xl font-black"
          >
            START GAME
          </button>

          <button
            onClick={
              nextQuestion
            }
            className="rounded-2xl bg-blue-600 p-5 text-3xl font-black"
          >
            NEXT QUESTION
          </button>
        </div>
      )}
    </main>
  );
}