'use client';

import {
  useEffect,
  useMemo,
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

  const [players, setPlayers] =
    useState<any[]>([]);

  const [
    gameStarted,
    setGameStarted,
  ] = useState(false);

  const [
    currentMode,
    setCurrentMode,
  ] = useState('');

  const [
    gamePaused,
    setGamePaused,
  ] = useState(false);

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
        setGameStarted(
          true,
        );

        if (
          data.isFinalRound
        ) {
          setCurrentMode(
            '🔥 ФИНАЛ',
          );
        } else if (
          data.isSpeedRound
        ) {
          setCurrentMode(
            '⚡ БЛИЦ',
          );
        } else if (
          data.isBlackoutRound
        ) {
          setCurrentMode(
            '🌑 ТЕМНОТА',
          );
        } else if (
          data.isLastChanceRound
        ) {
          setCurrentMode(
            '☠ ПОСЛЕДНИЙ ШАНС',
          );
        } else {
          setCurrentMode(
            '🎮 ОБЫЧНЫЙ РАУНД',
          );
        }
      },
    );

    socket.on(
      'gameState',
      (data) => {
        setGamePaused(
          data.paused,
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
        'gameState',
      );
    };
  }, []);

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

  const blackoutRound =
    () => {
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

  const forceFinalRound =
    () => {
      socket.emit(
        'forceFinalRound',
        {
          roomCode,
        },
      );
    };

  const restartGame = () => {
    window.location.reload();
  };

  const alivePlayers =
    useMemo(() => {
      return players.filter(
        (p) =>
          p.lives > 0,
      );
    }, [players]);

  const disconnectedPlayers =
    useMemo(() => {
      return players.filter(
        (p) =>
          p.disconnected,
      );
    }, [players]);

  if (!created) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
        <h1 className="mb-10 text-7xl font-black text-red-600">
          HOST
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
            placeholder="КОД КОМНАТЫ"
            className="rounded-2xl bg-gray-900 p-5 text-3xl outline-none"
          />

          <button
            onClick={createRoom}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            СОЗДАТЬ
            КОМНАТУ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-6xl font-black text-red-600">
            HOST
          </div>

          <div className="mt-2 text-3xl font-black">
            КОМНАТА:{' '}
            {
              roomCode
            }
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4">
          <QRCode
            value={`https://player-gilt-xi.vercel.app?room=${roomCode}`}
            size={180}
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-3xl border border-red-600 bg-red-600/10 p-6 text-center">
          <div className="text-5xl font-black">
            {
              players.length
            }
          </div>

          <div className="mt-2 text-xl font-bold">
            ИГРОКОВ
          </div>
        </div>

        <div className="rounded-3xl border border-green-600 bg-green-600/10 p-6 text-center">
          <div className="text-5xl font-black">
            {
              alivePlayers.length
            }
          </div>

          <div className="mt-2 text-xl font-bold">
            В ЖИВЫХ
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-500 bg-yellow-500/10 p-6 text-center">
          <div className="text-5xl font-black">
            {
              disconnectedPlayers.length
            }
          </div>

          <div className="mt-2 text-xl font-bold">
            OFFLINE
          </div>
        </div>

        <div className="rounded-3xl border border-purple-600 bg-purple-600/10 p-6 text-center">
          <div className="text-2xl font-black">
            {currentMode ||
              'ОЖИДАНИЕ'}
          </div>

          <div className="mt-2 text-xl font-bold">
            РЕЖИМ
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <button
          onClick={startGame}
          className="rounded-3xl bg-green-600 p-6 text-3xl font-black"
        >
          ▶ НАЧАТЬ ИГРУ
        </button>

        <button
          onClick={
            nextQuestion
          }
          className="rounded-3xl bg-blue-600 p-6 text-3xl font-black"
        >
          ⏭ СЛЕДУЮЩИЙ
          ВОПРОС
        </button>

        {!gamePaused ? (
          <button
            onClick={
              pauseGame
            }
            className="rounded-3xl bg-yellow-500 p-6 text-3xl font-black text-black"
          >
            ⏸ ПАУЗА
          </button>
        ) : (
          <button
            onClick={
              resumeGame
            }
            className="rounded-3xl bg-purple-600 p-6 text-3xl font-black"
          >
            ▶ ПРОДОЛЖИТЬ
          </button>
        )}

        <button
          onClick={
            restartGame
          }
          className="rounded-3xl bg-gray-700 p-6 text-3xl font-black"
        >
          🔄 РЕСТАРТ
        </button>
      </div>

      <div className="mb-8">
        <div className="mb-4 text-4xl font-black">
          ⚡ СПЕЦ.
          РАУНДЫ
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={
              speedRound
            }
            className="rounded-3xl bg-orange-500 p-6 text-3xl font-black"
          >
            ⚡ БЛИЦ
          </button>

          <button
            onClick={
              blackoutRound
            }
            className="rounded-3xl bg-white p-6 text-3xl font-black text-black"
          >
            🌑 ТЕМНОТА
          </button>

          <button
            onClick={
              lastChanceRound
            }
            className="rounded-3xl bg-red-800 p-6 text-3xl font-black"
          >
            ☠ ПОСЛЕДНИЙ
            ШАНС
          </button>

          <button
            onClick={
              forceFinalRound
            }
            className="rounded-3xl bg-red-600 p-6 text-3xl font-black shadow-[0_0_40px_rgba(255,0,0,0.7)]"
          >
            🔥 ФИНАЛ
          </button>
        </div>
      </div>

      <div>
        <div className="mb-4 text-4xl font-black">
          👥 ИГРОКИ
        </div>

        <div className="flex flex-col gap-4">
          {players.map(
            (
              player,
              index,
            ) => (
              <div
                key={
                  player.id
                }
                className={`flex items-center justify-between rounded-3xl border p-5 text-2xl font-black
                ${
                  player.disconnected
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : player.lives <=
                      0
                    ? 'border-gray-700 bg-gray-900 opacity-40'
                    : index ===
                      0
                    ? 'border-yellow-400 bg-yellow-500/10'
                    : 'border-gray-700 bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">
                    {player.avatar?.startsWith(
                      'http',
                    ) ? (
                      <img
                        src={
                          player.avatar
                        }
                        alt="avatar"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      player.avatar
                    )}
                  </div>

                  <div>
                    <div>
                      {
                        player.name
                      }
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      {player.disconnected
                        ? '📡 OFFLINE'
                        : '🟢 ONLINE'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-8">
                  <div>
                    ❤️{' '}
                    {
                      player.lives
                    }
                  </div>

                  <div>
                    🏆{' '}
                    {
                      player.score
                    }
                  </div>

                  <div>
                    🔥{' '}
                    {
                      player.bestStreak
                    }
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
