'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    reconnection: true,
  },
);

export default function ScreenPage() {
  const [roomCode, setRoomCode] =
    useState('');

  const [joined, setJoined] =
    useState(false);

  const [players, setPlayers] =
    useState<any[]>([]);

  const [
    mazeActive,
    setMazeActive,
  ] = useState(false);

  const [mazeTimer, setMazeTimer] =
    useState(45);

  const [
    mazeDifficulty,
    setMazeDifficulty,
  ] = useState('');

  const [
    mazeFinishedPlayers,
    setMazeFinishedPlayers,
  ] = useState<any[]>([]);

  const [
    mazeStats,
    setMazeStats,
  ] = useState({
    finished: 0,
    failed: 0,
    total: 0,
  });

  const [
    question,
    setQuestion,
  ] = useState<any>(null);

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
        setMazeActive(
          false,
        );

        setQuestion(data);

        setQuestionEnded(false);

        setCorrectAnswer(
          null,
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
      'mazeStarted',
      (data) => {
        setQuestion(null);

        setMazeActive(
          true,
        );

        setMazeTimer(
          data.timer,
        );

        setMazeDifficulty(
          data.difficulty,
        );

        setMazeFinishedPlayers(
          [],
        );

        setMazeStats({
          finished: 0,
          failed: 0,
          total: 0,
        });
      },
    );

    socket.on(
      'mazeTimer',
      (data) => {
        setMazeTimer(
          data.timeLeft,
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
      'mazePlayerFinished',
      (data) => {
        setMazeFinishedPlayers(
          (prev) => [
            ...prev,
            data.player,
          ],
        );
      },
    );

    socket.on(
      'mazeEnded',
      () => {
        setMazeActive(
          false,
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

      socket.off(
        'questionEnded',
      );

      socket.off(
        'mazeStarted',
      );

      socket.off(
        'mazeTimer',
      );

      socket.off(
        'mazeStats',
      );

      socket.off(
        'mazePlayerFinished',
      );

      socket.off(
        'mazeEnded',
      );
    };
  }, []);

  const topPlayers =
    useMemo(() => {
      return [
        ...players,
      ]
        .sort(
          (
            a,
            b,
          ) =>
            b.score -
            a.score,
        )
        .slice(0, 10);
    }, [players]);

  const joinScreen =
    () => {
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
        <div className="mb-10 text-7xl font-black text-red-600">
          SCREEN
        </div>

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
            onClick={
              joinScreen
            }
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            ПОДКЛЮЧИТЬ
          </button>
        </div>
      </main>
    );
  }

  if (mazeActive) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-black p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.15),transparent_70%)]" />

        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-8xl font-black text-cyan-400">
                🧩 MAZE RUN
              </div>

              <div className="mt-3 text-3xl font-black text-gray-400">
                СЛОЖНОСТЬ:{' '}
                {mazeDifficulty.toUpperCase()}
              </div>
            </div>

            <div
              className={`text-9xl font-black
              ${
                mazeTimer <= 10
                  ? 'animate-pulse text-red-500'
                  : 'text-yellow-400'
              }`}
            >
              {mazeTimer}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-6">
            <div className="rounded-3xl border border-green-500 bg-green-500/10 p-8 text-center">
              <div className="text-7xl font-black text-green-400">
                {
                  mazeStats.finished
                }
              </div>

              <div className="mt-4 text-3xl font-black">
                ДОШЛИ
              </div>
            </div>

            <div className="rounded-3xl border border-red-500 bg-red-500/10 p-8 text-center">
              <div className="text-7xl font-black text-red-400">
                {
                  mazeStats.failed
                }
              </div>

              <div className="mt-4 text-3xl font-black">
                ПРОИГРАЛИ
              </div>
            </div>

            <div className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-8 text-center">
              <div className="text-7xl font-black text-yellow-400">
                {
                  mazeStats.total
                }
              </div>

              <div className="mt-4 text-3xl font-black">
                ВСЕГО
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-8">
              <div className="mb-6 text-5xl font-black text-cyan-400">
                ❤️ СПАСЛИСЬ
              </div>

              <div className="flex flex-col gap-4">
                {mazeFinishedPlayers.length ===
                0 ? (
                  <div className="text-3xl text-gray-500">
                    Пока никто не
                    дошел...
                  </div>
                ) : (
                  mazeFinishedPlayers.map(
                    (
                      player,
                      index,
                    ) => (
                      <div
                        key={`${player.name}-${index}`}
                        className="flex items-center justify-between rounded-2xl bg-black p-5"
                      >
                        <div className="flex items-center gap-4">
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
                            <div className="text-5xl">
                              {
                                player.avatar
                              }
                            </div>
                          )}

                          <div className="text-3xl font-black">
                            {
                              player.name
                            }
                          </div>
                        </div>

                        <div className="text-5xl">
                          ❤️
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-8">
              <div className="mb-6 text-5xl font-black text-yellow-400">
                🏆 ЛИДЕРЫ
              </div>

              <div className="flex flex-col gap-4">
                {topPlayers.map(
                  (
                    player,
                    index,
                  ) => (
                    <div
                      key={
                        player.id
                      }
                      className={`flex items-center justify-between rounded-2xl p-5
                      ${
                        index ===
                        0
                          ? 'border border-yellow-400 bg-yellow-500/10'
                          : 'bg-black'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-black">
                          #
                          {index +
                            1}
                        </div>

                        {player.avatar?.startsWith(
                          'http',
                        ) ? (
                          <img
                            src={
                              player.avatar
                            }
                            alt="avatar"
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-4xl">
                            {
                              player.avatar
                            }
                          </div>
                        )}

                        <div className="text-2xl font-black">
                          {
                            player.name
                          }
                        </div>
                      </div>

                      <div className="text-3xl font-black text-yellow-400">
                        🏆{' '}
                        {
                          player.score
                        }
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <div className="animate-pulse text-4xl font-black text-red-500">
              ДОБЕРИТЕСЬ ДО
              СЕРДЦА ❤️
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div className="text-6xl font-black text-red-600">
          {roomCode}
        </div>

        <div className="text-8xl font-black text-yellow-400">
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
                  className={`rounded-3xl p-10 text-center text-4xl font-black
                  ${
                    questionEnded &&
                    correctAnswer ===
                      index
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}
                >
                  {answer}
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </main>
  );
}