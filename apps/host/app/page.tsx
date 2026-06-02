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
    currentMode,
    setCurrentMode,
  ] = useState('ОЖИДАНИЕ');

  const [
    gamePaused,
    setGamePaused,
  ] = useState(false);

  const [
    miniGameActive,
    setMiniGameActive,
  ] = useState(false);

  const [
    currentMiniGame,
    setCurrentMiniGame,
  ] = useState('');

  const [
    mazeStats,
    setMazeStats,
  ] = useState({
    finished: 0,
    failed: 0,
    total: 0,
  });

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
        setMiniGameActive(
          false,
        );

        setCurrentMiniGame(
          '',
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
            '🎮 ВОПРОС',
          );
        }
      },
    );

    socket.on(
      'reactionWaiting',
      () => {
        setMiniGameActive(
          true,
        );

        setCurrentMiniGame(
          '⚡ REACTION GAME',
        );
      },
    );

    socket.on(
      'reactionEnded',
      () => {
        setMiniGameActive(
          false,
        );

        setCurrentMiniGame(
          '',
        );
      },
    );

    socket.on(
      'mazeStarted',
      () => {
        setMiniGameActive(
          true,
        );

        setCurrentMiniGame(
          '🧩 MAZE RUN',
        );
      },
    );

    socket.on(
      'mazeStats',
      (data) => {
        setMazeStats(
          data,
        );
      },
    );

    socket.on(
      'mazeEnded',
      () => {
        setMiniGameActive(
          false,
        );

        setCurrentMiniGame(
          '',
        );
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
        'reactionWaiting',
      );

      socket.off(
        'reactionEnded',
      );

      socket.off(
        'mazeStarted',
      );

      socket.off(
        'mazeStats',
      );

      socket.off(
        'mazeEnded',
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
    if (
      miniGameActive
    )
      return;

    socket.emit(
      'startGame',
      {
        roomCode,
      },
    );
  };

  const nextQuestion = () => {
    if (
      miniGameActive
    )
      return;

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

  const reactionGame =
    () => {
      if (
        miniGameActive
      )
        return;

      socket.emit(
        'startReactionGame',
        {
          roomCode,
        },
      );
    };

  const mazeRun = () => {
    if (
      miniGameActive
    )
      return;

    socket.emit(
      'startMazeGame',
      {
        roomCode,
      },
    );
  };

  const speedRound =
    () => {
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

  const finalRound =
    () => {
      socket.emit(
        'forceFinalRound',
        {
          roomCode,
        },
      );
    };

  const finishGame =
    () => {
      socket.emit(
        'finishGame',
        {
          roomCode,
        },
      );
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

        <div
          className={`rounded-3xl p-6 text-center
          ${miniGameActive
              ? 'border border-purple-500 bg-purple-500/10'
              : 'border border-blue-500 bg-blue-500/10'
            }`}
        >
          <div className="text-2xl font-black">
            {miniGameActive
              ? currentMiniGame
              : currentMode}
          </div>

          <div className="mt-2 text-xl font-bold">
            РЕЖИМ
          </div>
        </div>
      </div>

      {miniGameActive &&
        currentMiniGame ===
        '🧩 MAZE RUN' && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-green-500 bg-green-500/10 p-6 text-center">
              <div className="text-5xl font-black">
                {
                  mazeStats.finished
                }
              </div>

              <div className="mt-2 text-xl font-bold">
                ДОШЛИ
              </div>
            </div>

            <div className="rounded-3xl border border-red-500 bg-red-500/10 p-6 text-center">
              <div className="text-5xl font-black">
                {
                  mazeStats.failed
                }
              </div>

              <div className="mt-2 text-xl font-bold">
                ПРОИГРАЛИ
              </div>
            </div>

            <div className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-6 text-center">
              <div className="text-5xl font-black">
                {
                  mazeStats.total
                }
              </div>

              <div className="mt-2 text-xl font-bold">
                ВСЕГО
              </div>
            </div>
          </div>
        )}

      <div className="mb-8 grid grid-cols-2 gap-4">
        <button
          disabled={
            miniGameActive
          }
          onClick={startGame}
          className={`rounded-3xl p-6 text-3xl font-black
          ${miniGameActive
              ? 'bg-gray-700 opacity-40'
              : 'bg-green-600'
            }`}
        >
          ▶ НАЧАТЬ ИГРУ
        </button>

        <button
          disabled={
            miniGameActive
          }
          onClick={
            nextQuestion
          }
          className={`rounded-3xl p-6 text-3xl font-black
          ${miniGameActive
              ? 'bg-gray-700 opacity-40'
              : 'bg-blue-600'
            }`}
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
            finishGame
          }
          className="rounded-3xl bg-red-700 p-6 text-3xl font-black"
        >
          🛑 ЗАВЕРШИТЬ
          ИГРУ
        </button>
      </div>

      <div className="mb-8">
        <div className="mb-4 text-4xl font-black">
          🎮 МИНИ-ИГРЫ
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={
              miniGameActive
            }
            onClick={
              reactionGame
            }
            className={`rounded-3xl p-6 text-3xl font-black
            ${miniGameActive
                ? 'bg-gray-700 opacity-40'
                : 'bg-orange-500'
              }`}
          >
            ⚡ REACTION
            GAME
          </button>


          <button
            disabled={
              miniGameActive
            }
            onClick={() => {
              socket.emit(
                'startSurvivalRun',
                {
                  roomCode,
                },
              );
            }}
            className={`rounded-3xl p-6 text-3xl font-black
            ${miniGameActive
                ? 'bg-gray-700 opacity-40'
                : 'bg-yellow-600'
              }`}
          >
            🏃 SURVIVAL
          </button>

          <button
            disabled={
              miniGameActive
            }
            onClick={
              mazeRun
            }
            className={`rounded-3xl p-6 text-3xl font-black
            ${miniGameActive
                ? 'bg-gray-700 opacity-40'
                : 'bg-cyan-600'
              }`}
          >
            🧩 MAZE RUN
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4 text-4xl font-black">

          <button
            disabled={
              miniGameActive
            }
            onClick={() => {
              const min =
                Number(
                  prompt(
                    'Минимум передач',
                    '10',
                  ),
                );

              const max =
                Number(
                  prompt(
                    'Максимум передач',
                    '15',
                  ),
                );

              if (
                !min ||
                !max
              )
                return;

              socket.emit(
                'startBombPassGame',
                {
                  roomCode,
                  minPasses:
                    min,
                  maxPasses:
                    max,
                },
              );
            }}
            className={`rounded-3xl p-6 text-3xl font-black
                ${miniGameActive
                ? 'bg-gray-700 opacity-40'
                : 'bg-red-700'
              }`}
          >
            💣 BOMB PASS
          </button>

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
              finalRound
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
                ${player.disconnected
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