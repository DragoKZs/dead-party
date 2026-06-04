'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { io } from 'socket.io-client';

import {
  motion,
} from 'framer-motion';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    reconnection: true,
  },
);

type ScreenMode =
  | 'idle'
  | 'quiz'
  | 'reaction-wait'
  | 'reaction-active'
  | 'reaction-finished'
  | 'maze'
  | 'bomb-pass'
  | 'survival-run'
  | 'final'
  | 'final-results';

export default function ScreenPage() {
  const [mode, setMode] =
    useState<ScreenMode>(
      'idle',
    );

  const [
    roundBanner,
    setRoundBanner,
  ] = useState<
    string | null
  >(null);

  const [roomCode, setRoomCode] =
    useState('');

  const [joined, setJoined] =
    useState(false);

  const [players, setPlayers] =
    useState<any[]>([]);

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

  const [
    reactionWinner,
    setReactionWinner,
  ] = useState<any>(null);

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
    bombHolder,
    setBombHolder,
  ] = useState<any>(
    null,
  );

  const [
    explodedPlayer,
    setExplodedPlayer,
  ] = useState<any>(
    null,
  );

  const [
    survivalQuestion,
    setSurvivalQuestion,
  ] = useState<any>(
    null,
  );

  const [
    survivalPlayers,
    setSurvivalPlayers,
  ] = useState<any[]>(
    [],
  );

  const [
    survivalRound,
    setSurvivalRound,
  ] = useState(1);

  const [
    eliminatedPlayers,
    setEliminatedPlayers,
  ] = useState<string[]>(
    [],
  );

  const [
    deadPlayers,
    setDeadPlayers,
  ] = useState<string[]>(
    [],
  );

  const [
    survivalWinners,
    setSurvivalWinners,
  ] = useState<any[]>(
    [],
  );

  const [
    finalPodium,
    setFinalPodium,
  ] = useState<any[]>(
    [],
  );

  const [
    finalLeaderboard,
    setFinalLeaderboard,
  ] = useState<any[]>(
    [],
  );

  const [
    playerChoices,
    setPlayerChoices,
  ] = useState<
    Record<
      string,
      'left' | 'right'
    >
  >({});

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
        setMode('quiz');

        if (
          data.roundType &&
          data.roundType !==
          'normal'
        ) {
          setRoundBanner(
            data.roundType,
          );

          setTimeout(() => {
            setRoundBanner(
              null,
            );
          }, 2000);
        }

        setQuestion(data);

        setQuestionEnded(false);

        setCorrectAnswer(
          null,
        );

        setReactionWinner(
          null,
        );
      },
    );

    socket.on(
      'finalQuestionStarted',
      (data) => {
        setMode('final');

        setQuestion(data);

        setQuestionEnded(
          false,
        );

        setCorrectAnswer(
          null,
        );
      },
    );

    socket.on(
      'finalFinished',
      (data) => {
        setMode(
          'final-results',
        );

        setFinalPodium(
          data.podium,
        );

        setFinalLeaderboard(
          data.leaderboard,
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
      'reactionWaiting',
      () => {
        setQuestion(null);

        setMode(
          'reaction-wait',
        );
      },
    );

    socket.on(
      'reactionStarted',
      () => {
        setMode(
          'reaction-active',
        );
      },
    );

    socket.on(
      'reactionEnded',
      (data) => {
        setReactionWinner(
          data.winner,
        );

        setMode(
          'reaction-finished',
        );
      },
    );

    socket.on(
      'mazeStarted',
      (data) => {
        setQuestion(null);

        setMode('maze');

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
        setMode('idle');
      },
    );

    socket.on(
      'bombPassStarted',
      (data) => {
        setMode(
          'bomb-pass',
        );

        setBombHolder(
          data.holder,
        );
      },
    );

    socket.on(
      'bombPassed',
      (data) => {
        setBombHolder(
          data.holder,
        );
      },
    );

    socket.on(
      'bombExploded',
      (data) => {
        setExplodedPlayer(
          data.player,
        );

        setTimeout(() => {
          setMode('idle');

          setExplodedPlayer(
            null,
          );
        }, 4000);
      },
    );

    socket.on(
      'survivalRunStarted',
      (data) => {
        setMode(
          'survival-run',
        );

        setSurvivalQuestion(
          data.question,
        );

        setPlayerChoices(
          {},
        );

        setSurvivalRound(
          data.round,
        );

        setEliminatedPlayers(
          [],
        );
      },
    );

    socket.on(
      'survivalNextRound',
      (data) => {
        setEliminatedPlayers(
          data.eliminated,
        );

        setDeadPlayers(
          (
            prev: string[],
          ) => [
              ...prev,
              ...data.eliminated,
            ],
        );

        setTimeout(() => {
          setPlayerChoices(
            {},
          );

          setSurvivalQuestion(
            data.question,
          );

          setSurvivalRound(
            data.round,
          );

          setEliminatedPlayers(
            [],
          );
        }, 3000);
      },
    );

    socket.on(
      'survivalRunFinished',
      (data) => {
        setSurvivalWinners(
          data.winners,
        );

        setTimeout(() => {
          setMode('idle');
        }, 7000);
      },
    );

    socket.on(
      'survivalPlayerMoved',
      (data) => {
        setPlayerChoices(
          (prev) => ({
            ...prev,
            [
              data.telegramId
            ]:
              data.answer,
          }),
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
        'survivalRunStarted',
      );

      socket.off(
        'survivalNextRound',
      );

      socket.off(
        'survivalRunFinished',
      );

      socket.off(
        'survivalPlayerMoved',
      );

      socket.off(
        'timerUpdate',
      );

      socket.off(
        'questionEnded',
      );

      socket.off(
        'reactionWaiting',
      );

      socket.off(
        'reactionStarted',
      );

      socket.off(
        'reactionEnded',
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

      socket.off(
        'bombPassStarted',
      );

      socket.off(
        'bombPassed',
      );

      socket.off(
        'bombExploded',
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

  if (
    mode ===
    'bomb-pass'
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        {explodedPlayer ? (
          <>
            <div className="mb-10 animate-bounce text-[220px]">
              💥
            </div>

            <div className="mb-6 text-[100px] font-black text-red-500">
              БОМБА
              ВЗОРВАЛАСЬ
            </div>

            <div className="text-[80px] font-black">
              {
                explodedPlayer.name
              }
            </div>
          </>
        ) : (
          <>
            {bombHolder
              ?.avatar?.startsWith(
                'http',
              ) ? (
              <img
                src={
                  bombHolder.avatar
                }
                alt="avatar"
                className="mb-10 h-72 w-72 rounded-full border-[10px] border-red-500 object-cover shadow-[0_0_100px_rgba(255,0,0,0.9)]"
              />
            ) : (
              <div className="mb-10 text-[240px]">
                {
                  bombHolder?.avatar
                }
              </div>
            )}

            <div className="mb-8 text-[90px] font-black">
              {
                bombHolder?.name
              }
            </div>

            <div className="animate-pulse text-[260px]">
              💣
            </div>
          </>
        )}
      </main>
    );
  }

  if (
    mode ===
    'survival-run'
  ) {
    return (
      <main className="flex min-h-screen flex-col bg-black p-8 text-white">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-6xl font-black text-yellow-400">
            ROUND {
              survivalRound
            } / 5
          </div>

          <div className="text-5xl font-black">
            🏃 SURVIVAL
          </div>
        </div>

        <div className="mb-10 rounded-3xl bg-gray-900 p-8 text-center text-5xl font-black">
          {
            survivalQuestion?.question
          }
        </div>

        {survivalWinners.length >
          0 ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8 animate-bounce text-[160px]">
              👑
            </div>

            <div className="mb-10 text-7xl font-black text-yellow-400">
              ПОБЕДИТЕЛЬ
            </div>

            <div className="flex flex-wrap justify-center gap-12">
              {survivalWinners.map(
                (
                  player: any,
                ) => (
                  <div
                    key={
                      player.telegramId
                    }
                    className="flex flex-col items-center"
                  >
                    {player.avatar?.startsWith(
                      'http',
                    ) ||
                      player.avatar?.startsWith(
                        'data:image',
                      ) ? (
                      <img
                        src={
                          player.avatar
                        }
                        alt="avatar"
                        className="h-40 w-40 rounded-full border-8 border-yellow-400 object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-yellow-400 bg-black text-8xl">
                        {
                          player.avatar
                        }
                      </div>
                    )}

                    <div className="mt-5 text-5xl font-black">
                      {
                        player.name
                      }
                    </div>

                    <div className="mt-3 text-3xl text-yellow-400">
                      +400
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (

          <div className="grid flex-1 grid-cols-2 gap-8">
            <div className="flex flex-col items-center rounded-[40px] border-8 border-blue-500 bg-blue-950 p-8">
              <div className="mb-8 text-6xl font-black">
                {
                  survivalQuestion?.left
                }
              </div>

              <div className="flex flex-wrap justify-center gap-8">

                {players
                  .filter(
                    (
                      player: any,
                    ) =>
                      playerChoices[
                      player.telegramId
                      ] === 'left',
                  )
                  .map(
                    (
                      player: any,
                      index: number,
                    ) => (
                      <motion.div
                        key={
                          player.telegramId
                        }

                        initial={{
                          x: 0,
                          y: 0,
                          scale: 0.7,
                        }}

                        animate={{
                          x: -250 +
                            index * 90,

                          y:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 500
                              : 0,

                          opacity:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 0
                              : 1,

                          rotate:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 90
                              : 0,
                        }}

                        transition={{
                          duration: 0.8,
                        }}
                        className={`flex flex-col items-center transition-all duration-700
                        ${eliminatedPlayers.includes(
                          player.telegramId,
                        )
                            ? 'translate-y-96 opacity-0'
                            : ''
                          }`}
                      >
                        {player.avatar?.startsWith(
                          'http',
                        ) ||
                          player.avatar?.startsWith(
                            'data:image',
                          ) ? (
                          <img
                            src={
                              player.avatar
                            }
                            alt="avatar"
                            className="h-24 w-24 rounded-full border-4 border-white object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black text-5xl">
                            {
                              player.avatar
                            }
                          </div>
                        )}

                        <div className="mt-3 text-2xl font-black">
                          {
                            player.name
                          }
                        </div>

                        <div className="relative mt-6 flex h-[180px] w-[120px] flex-col items-center justify-start">

                          <div className="absolute bottom-0 h-6 w-20 rounded-full bg-black/40 blur-md" />

                          <div className="relative z-10 flex flex-col items-center">

                            <div className="h-20 w-16 rounded-t-[30px] rounded-b-[20px] bg-gradient-to-b from-red-400 to-red-700" />

                            <div className="mt-[-6px] flex gap-7">
                              <div
                                className={`h-16 w-3 rounded-full bg-white
                                  ${playerChoices[
                                    player.telegramId
                                  ]
                                    ? 'animate-bounce'
                                    : ''
                                  }`}
                              />

                              <div
                                className={`h-16 w-3 rounded-full bg-white
                                  ${playerChoices[
                                    player.telegramId
                                  ]
                                    ? 'animate-bounce'
                                    : ''
                                  }`}
                              />
                            </div>

                            <div className="absolute top-[20px] left-[-18px] h-12 w-3 rotate-45 rounded-full bg-white" />

                            <div className="absolute top-[20px] right-[-18px] h-12 w-3 -rotate-45 rounded-full bg-white" />
                          </div>
                        </div>
                      </motion.div>
                    ),
                  )}
              </div>
            </div>

            <div className="flex flex-col items-center rounded-[40px] border-8 border-red-500 bg-red-950 p-8">
              <div className="mb-8 text-6xl font-black">
                {
                  survivalQuestion?.right
                }
              </div>

              <div className="flex flex-wrap justify-center gap-8">
                {players
                  .filter(
                    (
                      player: any,
                    ) =>
                      playerChoices[
                      player.telegramId
                      ] === 'right',
                  )
                  .map(
                    (
                      player: any,
                      index: number,
                    ) => (
                      <motion.div
                        key={
                          player.telegramId
                        }

                        initial={{
                          x: 0,
                          y: 0,
                          scale: 0.7,
                        }}

                        animate={{
                          x: 250 -
                            index * 90,

                          y:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 500
                              : 0,

                          opacity:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 0
                              : 1,

                          rotate:
                            eliminatedPlayers.includes(
                              player.telegramId,
                            )
                              ? 90
                              : 0,
                        }}

                        transition={{
                          duration: 0.8,
                        }}
                        className={`flex flex-col items-center transition-all duration-700
                  ${eliminatedPlayers.includes(
                          player.telegramId,
                        )
                            ? 'translate-y-96 opacity-0'
                            : ''
                          }`}
                      >
                        {player.avatar?.startsWith(
                          'http',
                        ) ||
                          player.avatar?.startsWith(
                            'data:image',
                          ) ? (
                          <img
                            src={
                              player.avatar
                            }
                            alt="avatar"
                            className="h-24 w-24 rounded-full border-4 border-white object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black text-5xl">
                            {
                              player.avatar
                            }
                          </div>
                        )}

                        <div className="mt-3 text-2xl font-black">
                          {
                            player.name
                          }
                        </div>

                        <div className="relative mt-6 flex h-[180px] w-[120px] flex-col items-center justify-start">

                          <div className="absolute bottom-0 h-6 w-20 rounded-full bg-black/40 blur-md" />

                          <div className="relative z-10 flex flex-col items-center">

                            <div className="h-20 w-16 rounded-t-[30px] rounded-b-[20px] bg-gradient-to-b from-red-400 to-red-700" />

                            <div className="mt-[-6px] flex gap-7">
                              <div
                                className={`h-16 w-3 rounded-full bg-white
                                  ${playerChoices[
                                    player.telegramId
                                  ]
                                    ? 'animate-bounce'
                                    : ''
                                  }`}
                              />

                              <div
                                className={`h-16 w-3 rounded-full bg-white
                                  ${playerChoices[
                                    player.telegramId
                                  ]
                                    ? 'animate-bounce'
                                    : ''
                                  }`}
                              />
                            </div>

                            <div className="absolute top-[20px] left-[-18px] h-12 w-3 rotate-45 rounded-full bg-white" />

                            <div className="absolute top-[20px] right-[-18px] h-12 w-3 -rotate-45 rounded-full bg-white" />
                          </div>
                        </div>
                      </motion.div>
                    ),
                  )}
              </div>
            </div>
          </div>
        )
        }
      </main>
    );
  }

  if (
    mode ===
    'reaction-wait'
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0 animate-pulse bg-red-950 opacity-30" />

        <div className="relative z-10 text-center">
          <div className="mb-10 animate-spin text-[180px]">
            ⚡
          </div>

          <div className="animate-pulse text-[120px] font-black">
            ГОТОВЬТЕСЬ...
          </div>

          <div className="mt-8 text-4xl text-gray-400">
            НЕ НАЖИМАЙТЕ
            РАНЬШЕ ВРЕМЕНИ
          </div>
        </div>
      </main>
    );
  }

  if (
    mode ===
    'reaction-active'
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-red-950 text-white">
        <div className="absolute inset-0 animate-pulse bg-red-600 opacity-20" />

        <div className="relative z-10 text-center">
          <div className="mb-12 animate-bounce text-[200px]">
            ⚡
          </div>

          <div className="animate-pulse text-[160px] font-black text-white drop-shadow-[0_0_40px_rgba(255,0,0,0.9)]">
            ЖМИ!!!
          </div>
        </div>
      </main>
    );
  }

  if (
    mode ===
    'reaction-finished' &&
    reactionWinner
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-transparent to-transparent" />

        <div className="relative z-10 text-center">
          <div className="mb-10 animate-bounce text-[180px]">
            ⚡
          </div>

          <div className="mb-6 text-7xl font-black text-yellow-400">
            САМЫЙ БЫСТРЫЙ
          </div>

          <div className="mb-8 text-8xl font-black text-red-500">
            {
              reactionWinner.name
            }
          </div>

          {reactionWinner.avatar?.startsWith(
            'http',
          ) ? (
            <img
              src={
                reactionWinner.avatar
              }
              alt="avatar"
              className="mx-auto h-56 w-56 rounded-full border-8 border-yellow-400 object-cover shadow-[0_0_80px_rgba(255,255,0,0.7)]"
            />
          ) : (
            <div className="text-[200px]">
              {
                reactionWinner.avatar
              }
            </div>
          )}

          <div className="mt-10 text-5xl font-black text-yellow-400">
            +150 ОЧКОВ
          </div>
        </div>
      </main>
    );
  }

  if (
    roundBanner
  ) {
    const banners = {
      speed: {
        icon: '⚡',
        text: 'SPEED ROUND',
        color:
          'text-yellow-400',
      },

      blackout: {
        icon: '🌑',
        text:
          'BLACKOUT ROUND',
        color:
          'text-purple-400',
      },

      'last-chance': {
        icon: '☠',
        text:
          'LAST CHANCE',
        color:
          'text-red-500',
      },
    };

    const banner =
      banners[
      roundBanner as keyof typeof banners
      ];

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#120014] text-white">

        <div className="animate-bounce text-[220px]">
          {banner.icon}
        </div>

        <div
          className={`animate-pulse text-center text-[120px] font-black ${banner.color}`}
        >
          {banner.text}
        </div>

      </main>
    );
  }

  if (
    mode === 'maze'
  ) {
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
              ${mazeTimer <= 10
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
                      ${index ===
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
        </div>
      </main>
    );
  }

  if (
    mode ===
    'final-results'
  ) {
    return (
      <main className="flex min-h-screen flex-col overflow-y-auto bg-[#120014] p-10 text-white">

        <div className="mb-14 text-center text-8xl font-black text-yellow-400">
          👑 FINAL RESULTS
        </div>

        <div className="mb-24 flex items-end justify-center gap-10">

          {finalPodium[1] && (
            <div className="flex flex-col items-center">
              <div className="mb-5 text-6xl">
                🥈
              </div>

              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-8 border-gray-300 bg-black">
                {finalPodium[1]
                  .avatar?.startsWith(
                    'http',
                  ) ? (
                  <img
                    src={
                      finalPodium[1]
                        .avatar
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-8xl">
                    {
                      finalPodium[1]
                        .avatar
                    }
                  </div>
                )}
              </div>

              <div className="mt-5 text-4xl font-black">
                {
                  finalPodium[1]
                    .name
                }
              </div>

              <div className="mt-6 flex h-56 w-52 items-center justify-center rounded-t-[40px] bg-gray-400 text-7xl font-black">
                2
              </div>
            </div>
          )}

          {finalPodium[0] && (
            <div className="flex flex-col items-center">
              <div className="mb-5 animate-bounce text-7xl">
                👑
              </div>

              <div className="flex h-52 w-52 items-center justify-center overflow-hidden rounded-full border-[10px] border-yellow-400 bg-black shadow-[0_0_60px_gold]">
                {finalPodium[0]
                  .avatar?.startsWith(
                    'http',
                  ) ? (
                  <img
                    src={
                      finalPodium[0]
                        .avatar
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-9xl">
                    {
                      finalPodium[0]
                        .avatar
                    }
                  </div>
                )}
              </div>

              <div className="mt-5 text-5xl font-black text-yellow-400">
                {
                  finalPodium[0]
                    .name
                }
              </div>

              <div className="mt-6 flex h-72 w-60 items-center justify-center rounded-t-[40px] bg-yellow-400 text-8xl font-black text-black">
                1
              </div>
            </div>
          )}

          {finalPodium[2] && (
            <div className="flex flex-col items-center">
              <div className="mb-5 text-6xl">
                🥉
              </div>

              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-8 border-orange-500 bg-black">
                {finalPodium[2]
                  .avatar?.startsWith(
                    'http',
                  ) ? (
                  <img
                    src={
                      finalPodium[2]
                        .avatar
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-8xl">
                    {
                      finalPodium[2]
                        .avatar
                    }
                  </div>
                )}
              </div>

              <div className="mt-5 text-4xl font-black">
                {
                  finalPodium[2]
                    .name
                }
              </div>

              <div className="mt-6 flex h-44 w-52 items-center justify-center rounded-t-[40px] bg-orange-500 text-7xl font-black">
                3
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          {finalLeaderboard.map(
            (
              player: any,
              index: number,
            ) => (
              <div
                key={
                  player.telegramId
                }
                className={`flex items-center justify-between rounded-[30px] p-6
              ${player.lives >
                    0
                    ? 'bg-white/10'
                    : 'bg-red-950/40 opacity-70'
                  }`}
              >
                <div className="flex items-center gap-6">

                  <div className="text-4xl font-black text-yellow-400">
                    #
                    {index + 1}
                  </div>

                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-black text-5xl">
                    {player.avatar?.startsWith(
                      'http',
                    ) ? (
                      <img
                        src={
                          player.avatar
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      player.avatar
                    )}
                  </div>

                  <div>
                    <div className="text-3xl font-black">
                      {
                        player.name
                      }
                    </div>

                    <div className="mt-2 text-2xl">
                      {player.lives >
                        0
                        ? '❤️'.repeat(
                          player.lives,
                        )
                        : '💀'}
                    </div>
                  </div>
                </div>

                <div className="text-4xl font-black text-cyan-400">
                  {
                    player.score
                  }
                </div>
              </div>
            ),
          )}
        </div>
      </main>
    );
  }

  const answerColors = [
    'bg-red-600 border-red-400',
    'bg-blue-600 border-blue-400',
    'bg-yellow-500 border-yellow-300',
    'bg-green-600 border-green-400',
  ];

  return (
    <main className="min-h-screen bg-[#120014] p-10 text-white">
      <div className="mb-10 grid grid-cols-4 gap-5">

        <div className="rounded-[30px] border border-purple-500/40 bg-black/40 p-5 text-center backdrop-blur">
          <div className="text-lg text-purple-300">
            КОМНАТА
          </div>

          <div className="text-4xl font-black text-red-500">
            {roomCode}
          </div>
        </div>

        <div className="rounded-[30px] border border-cyan-500/40 bg-black/40 p-5 text-center backdrop-blur">
          <div className="text-lg text-cyan-300">
            ИГРОКОВ
          </div>

          <div className="text-4xl font-black text-cyan-400">
            {players.length}
          </div>
        </div>

        <div className="rounded-[30px] border border-red-500/40 bg-black/40 p-5 text-center backdrop-blur">
          <div className="text-lg text-red-300">
            ЖИВЫХ
          </div>

          <div className="text-4xl font-black text-red-400">
            {
              players.filter(
                (p) => p.lives > 0,
              ).length
            }
          </div>
        </div>

        <div className="rounded-[30px] border border-yellow-500/40 bg-black/40 p-5 text-center backdrop-blur">
          <div className="text-lg text-yellow-300">
            ТАЙМЕР
          </div>

          <div
            className={`text-5xl font-black ${mode === 'final'
              ? 'animate-pulse text-yellow-400'
              : 'text-yellow-400'
              }`}
          >
            {timeLeft}
          </div>
        </div>

      </div>

      {question && (
        <div>

          {mode ===
            'final' && (
              <div className="mb-6 animate-pulse text-center text-7xl font-black text-yellow-400">
                👑 FINAL ROUND
              </div>
            )}

          <div className="mb-10 rounded-[40px] border-4 border-purple-500 bg-gradient-to-b from-purple-950 to-black p-10 text-center text-5xl font-black shadow-[0_0_40px_rgba(168,85,247,0.6)]">
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
                  className={`
                  rounded-[35px]
                  border-4
                  p-10
                  text-center
                  text-4xl
                  font-black
                  transition-all
                  duration-500

                      ${answerColors[index]}

                      ${questionEnded &&
                      correctAnswer === index
                      ? 'scale-105 shadow-[0_0_50px_rgba(0,255,0,0.9)]'
                      : ''
                    }
                 `}
                >
                  {answer}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-6 text-5xl font-black">
          🏆 ЛИДЕРЫ
        </div>

        <div className="flex flex-col gap-4">
          {topPlayers.map(
            (
              player,
              index,
            ) => (
              <div
                key={player.id}
                className={`rounded-[35px] p-6
  ${player.lives <= 0
                    ? 'border border-red-500/20 bg-red-950/20 opacity-50'
                    : index === 0
                      ? 'border-2 border-yellow-400 bg-yellow-500/10 shadow-[0_0_30px_rgba(255,215,0,0.4)]'
                      : 'border border-purple-500/30 bg-black/50'
                  }`}
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-6">

                    <div className="text-5xl font-black text-yellow-400">
                      #{index + 1}
                    </div>

                    {player.avatar?.startsWith('http') ? (
                      <img
                        src={player.avatar}
                        alt="avatar"
                        className="h-20 w-20 rounded-full border-4 border-purple-500 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-purple-500 bg-black text-5xl">
                        {player.avatar}
                      </div>
                    )}

                    <div>
                      <div className="text-3xl font-black">
                        {player.name}
                      </div>

                      <div className="mt-2 text-xl text-gray-300">
                        {player.lives > 0
                          ? '❤️'.repeat(player.lives)
                          : '💀 ВЫБЫЛ'}
                      </div>
                    </div>

                  </div>

                  <div className="text-right">

                    <div className="text-4xl font-black text-cyan-400">
                      {player.score}
                    </div>

                    <div className="mt-2 text-xl text-orange-400">
                      🔥 {player.bestStreak || 0}
                    </div>

                  </div>

                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </main >
  );
}