'use client';

import {
  useEffect,
  useMemo,
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
  },
);

const emojiAvatars = [
  '😈',
  '👻',
  '🤖',
  '💀',
  '👽',
  '🔥',
  '🦊',
  '🐼',
  '🦁',
  '🐸',
];

type GameMode =
  | 'menu'
  | 'quiz'
  | 'reaction-wait'
  | 'reaction-active'
  | 'reaction-finished'
  | 'maze'
  | 'bomb-pass';

export default function Home() {
  const [mode, setMode] =
    useState<GameMode>(
      'menu',
    );

  const [joined, setJoined] =
    useState(false);

  const [roomCode, setRoomCode] =
    useState('');

  const [telegramId, setTelegramId] =
    useState('');

  const [playerName, setPlayerName] =
    useState('');

  const [
    telegramAvatar,
    setTelegramAvatar,
  ] = useState('');

  const [avatar, setAvatar] =
    useState('');

  const [question, setQuestion] =
    useState<any>(null);

  const [
    blackoutHidden,
    setBlackoutHidden,
  ] = useState(false);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [locked, setLocked] =
    useState(false);

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

  const [maze, setMaze] =
    useState<number[][]>(
      [],
    );

  const [
    mazePosition,
    setMazePosition,
  ] = useState({
    x: 1,
    y: 1,
  });

  const [
    mazeTimer,
    setMazeTimer,
  ] = useState(45);

  const [
    mazeDifficulty,
    setMazeDifficulty,
  ] = useState('');

  const [
    mazeFinished,
    setMazeFinished,
  ] = useState(false);

  const [
    notification,
    setNotification,
  ] = useState('');

  const [
    players,
    setPlayers,
  ] = useState<any[]>(
    [],
  );

  const [
    bombHolder,
    setBombHolder,
  ] = useState<any>(
    null,
  );

  const [
    bombPlayers,
    setBombPlayers,
  ] = useState<any[]>(
    [],
  );

  const [
    explodedPlayer,
    setExplodedPlayer,
  ] = useState<any>(
    null,
  );

  const randomEmoji =
    useMemo(() => {
      return emojiAvatars[
        Math.floor(
          Math.random() *
          emojiAvatars.length,
        )
      ];
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
        setTelegramId(
          String(user.id),
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

        if (
          user.photo_url
        ) {
          setTelegramAvatar(
            user.photo_url,
          );

          setAvatar(
            user.photo_url,
          );
        } else {
          setAvatar(
            randomEmoji,
          );
        }
      } else {
        setAvatar(
          randomEmoji,
        );
      }
    } catch {
      setAvatar(
        randomEmoji,
      );
    }
  }, [randomEmoji]);

  useEffect(() => {
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
        setMode('quiz');

        setQuestion(data);

        setBlackoutHidden(
          false,
        );


        if (
          data.isBlackoutRound
        ) {
          setTimeout(() => {
            setBlackoutHidden(
              true,
            );
          }, 3000);
        }


        setQuestionEnded(false);

        setCorrectAnswer(
          null,
        );

        setLocked(false);

        setReactionWinner(
          null,
        );
      },
    );

    socket.on(
      'playersUpdated',
      (data) => {
        setPlayers(
          data.players,
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
      'answerLocked',
      () => {
        setLocked(true);
      },
    );

    socket.on(
      'achievement',
      (data) => {
        setNotification(
          data.text,
        );

        setTimeout(() => {
          setNotification(
            '',
          );
        }, 3000);
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

        setMaze(
          data.maze,
        );

        setMazeTimer(
          data.timer,
        );

        setMazeDifficulty(
          data.difficulty,
        );

        setMazePosition({
          x: 1,
          y: 1,
        });

        setMazeFinished(
          false,
        );
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
      'mazePosition',
      (data) => {
        setMazePosition({
          x: data.x,
          y: data.y,
        });
      },
    );

    socket.on(
      'mazeEnded',
      () => {
        setMode('menu');
      },
    );

    socket.on(
      'mazePlayerFinished',
      (data) => {
        if (
          data.player
            ?.name ===
          playerName
        ) {
          setMazeFinished(
            true,
          );
        }
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
          setMode('menu');

          setExplodedPlayer(
            null,
          );
        }, 4000);
      },
    );

    return () => {
      socket.off(
        'questionStarted',
      );

      socket.off(
        'playersUpdated',
      );

      socket.off(
        'timerUpdate',
      );

      socket.off(
        'questionEnded',
      );

      socket.off(
        'answerLocked',
      );

      socket.off(
        'achievement',
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
        'mazePosition',
      );

      socket.off(
        'mazeEnded',
      );

      socket.off(
        'mazePlayerFinished',
      );
    };
  }, [playerName]);

  const joinRoom = () => {
    socket.emit(
      'joinRoom',
      {
        roomCode,
        playerName,
        telegramId,
        avatar,
      },
    );

    setJoined(true);
  };

  const submitAnswer = (
    index: number,
  ) => {
    if (locked)
      return;

    socket.emit(
      'submitAnswer',
      {
        roomCode,
        answerIndex: index,
      },
    );
  };

  const reactionClick =
    () => {
      socket.emit(
        'reactionClick',
        {
          roomCode,
        },
      );
    };

  const move = (
    direction:
      | 'up'
      | 'down'
      | 'left'
      | 'right',
  ) => {
    if (
      mazeFinished
    )
      return;

    socket.emit(
      'moveMazePlayer',
      {
        roomCode,
        direction,
      },
    );
  };

  const uploadAvatar =
    (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        e.target.files?.[0];

      if (!file)
        return;

      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            'string'
          ) {
            setAvatar(
              reader.result,
            );
          }
        };

      reader.readAsDataURL(
        file,
      );
    };

  const setRandomEmoji =
    () => {
      const random =
        emojiAvatars[
        Math.floor(
          Math.random() *
          emojiAvatars.length,
        )
        ];

      setAvatar(random);
    };

  const restoreTelegramAvatar =
    () => {
      if (
        telegramAvatar
      ) {
        setAvatar(
          telegramAvatar,
        );
      }
    };

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
        <div className="mb-8 text-6xl font-black text-red-600">
          DEAD PARTY
        </div>

        <div className="mb-6">
          {avatar?.startsWith(
            'data:image',
          ) ||
            avatar?.startsWith(
              'http',
            ) ? (
            <img
              src={avatar}
              alt="avatar"
              className="h-32 w-32 rounded-full border-4 border-red-500 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-red-500 bg-gray-900 text-7xl">
              {avatar}
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={
              setRandomEmoji
            }
            className="rounded-2xl bg-gray-900 px-5 py-3 text-xl font-black"
          >
            🎲 ЭМОДЗИ
          </button>

          {telegramAvatar && (
            <button
              onClick={
                restoreTelegramAvatar
              }
              className="rounded-2xl bg-blue-600 px-5 py-3 text-xl font-black"
            >
              📸 TELEGRAM
            </button>
          )}

          <label className="cursor-pointer rounded-2xl bg-green-600 px-5 py-3 text-xl font-black">
            🖼 ЗАГРУЗИТЬ
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={
                uploadAvatar
              }
            />
          </label>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <input
            type="text"
            value={playerName}
            onChange={(e) =>
              setPlayerName(
                e.target.value,
              )
            }
            placeholder="ВАШЕ ИМЯ"
            className="rounded-2xl bg-gray-900 p-5 text-2xl outline-none"
          />

          <input
            type="text"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value,
              )
            }
            placeholder="КОД КОМНАТЫ"
            className="rounded-2xl bg-gray-900 p-5 text-2xl outline-none"
          />

          <button
            onClick={joinRoom}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            ВОЙТИ
          </button>
        </div>
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
          <div className="mb-10 animate-spin text-9xl">
            ⚡
          </div>

          <div className="animate-pulse text-6xl font-black">
            ГОТОВЬТЕСЬ...
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-red-950 text-white">
        <button
          onClick={
            reactionClick
          }
          className="flex h-[320px] w-[320px] items-center justify-center rounded-full bg-red-600 text-[120px] shadow-[0_0_80px_rgba(255,0,0,0.9)] active:scale-95"
        >
          ⚡
        </button>

        <div className="mt-10 animate-pulse text-5xl font-black">
          ЖМИ!!!
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="mb-8 text-8xl">
          ⚡
        </div>

        <div className="mb-5 text-5xl font-black text-yellow-400">
          САМЫЙ БЫСТРЫЙ
        </div>

        <div className="text-6xl font-black text-red-500">
          {
            reactionWinner.name
          }
        </div>
      </main>
    );
  }

  if (
    mode === 'maze'
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-black p-4 text-white">
        {notification && (
          <div className="absolute top-8 z-50 animate-bounce rounded-3xl border-2 border-yellow-400 bg-black px-8 py-4 text-2xl font-black text-yellow-400">
            {notification}
          </div>
        )}

        <div className="mb-4 flex w-full items-center justify-between">
          <div className="rounded-2xl bg-gray-900 px-5 py-3 text-xl font-black">
            🧩{' '}
            {mazeDifficulty.toUpperCase()}
          </div>

          <div className="text-5xl font-black text-yellow-400">
            ⏳ {mazeTimer}
          </div>
        </div>

        {mazeFinished ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8 text-9xl">
              ❤️
            </div>

            <div className="text-5xl font-black text-green-400">
              ЛАБИРИНТ
              ПРОЙДЕН
            </div>
          </div>
        ) : (
          <>
            <div
              className="grid gap-[2px] rounded-3xl bg-gray-950 p-3"
              style={{
                gridTemplateColumns: `repeat(${maze[0]?.length}, 1fr)`,
              }}
            >
              {maze.flatMap(
                (
                  row,
                  y,
                ) =>
                  row.map(
                    (
                      cell,
                      x,
                    ) => {
                      const isPlayer =
                        mazePosition.x ===
                        x &&
                        mazePosition.y ===
                        y;

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`flex h-6 w-6 items-center justify-center rounded-sm text-xs
                          ${cell === 1
                              ? 'bg-red-950'
                              : cell ===
                                2
                                ? 'bg-pink-500'
                                : 'bg-gray-800'
                            }`}
                        >
                          {cell ===
                            2 &&
                            !isPlayer &&
                            '❤️'}

                          {isPlayer &&
                            '🙂'}
                        </div>
                      );
                    },
                  ),
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() =>
                  move('up')
                }
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 text-5xl"
              >
                ⬆
              </button>

              <div className="flex gap-4">
                <button
                  onClick={() =>
                    move(
                      'left',
                    )
                  }
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 text-5xl"
                >
                  ⬅
                </button>

                <button
                  onClick={() =>
                    move(
                      'down',
                    )
                  }
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 text-5xl"
                >
                  ⬇
                </button>

                <button
                  onClick={() =>
                    move(
                      'right',
                    )
                  }
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 text-5xl"
                >
                  ➡
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    );
  }

  if (
    mode ===
    'bomb-pass'
  ) {
    const isHolder =
      bombHolder
        ?.telegramId ===
      telegramId;

    return (
      <main className="flex min-h-screen flex-col bg-black p-4 text-white">
        <div className="mb-6 text-center text-5xl font-black text-red-500">
          💣 BOMB PASS
        </div>

        {explodedPlayer ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8 animate-bounce text-[140px]">
              💥
            </div>

            <div className="mb-4 text-5xl font-black text-red-500">
              БОМБА
              ВЗОРВАЛАСЬ
            </div>

            <div className="text-4xl font-black">
              {
                explodedPlayer.name
              }
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center">
              {bombHolder
                ?.avatar?.startsWith(
                  'data:image',
                ) ||
                bombHolder?.avatar?.startsWith(
                  'http',
                ) ? (
                <img
                  src={
                    bombHolder.avatar
                  }
                  alt="avatar"
                  className="mb-4 h-40 w-40 rounded-full border-4 border-red-500 object-cover"
                />
              ) : (
                <div className="mb-4 flex h-40 w-40 items-center justify-center rounded-full border-4 border-red-500 bg-gray-900 text-8xl">
                  {
                    bombHolder?.avatar
                  }
                </div>
              )}

              <div className="text-5xl font-black">
                {
                  bombHolder?.name
                }
              </div>

              <div className="mt-4 text-8xl animate-pulse">
                💣
              </div>
            </div>

            {isHolder ? (
              <div className="grid gap-4">
                {players
                  ?.filter(
                    (
                      player: any,
                    ) =>
                      player.telegramId !==
                      telegramId &&
                      player.telegramId !==
                      bombHolder
                        ?.telegramId,
                  )
                  .slice(0, 6)
                  .map(
                    (
                      player: any,
                    ) => (
                      <button
                        key={
                          player.telegramId
                        }
                        onClick={() => {
                          socket.emit(
                            'passBomb',
                            {
                              roomCode,
                              fromId:
                                telegramId,
                              toId:
                                player.telegramId,
                            },
                          );
                        }}
                        className="flex items-center gap-4 rounded-3xl bg-red-600 p-5 text-left"
                      >
                        {player.avatar?.startsWith(
                          'data:image',
                        ) ||
                          player.avatar?.startsWith(
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
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-4xl">
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
                      </button>
                    ),
                  )}
              </div>
            ) : (
              <div className="mt-10 text-center text-4xl font-black text-gray-400">
                У КОГО-ТО 💣
              </div>
            )}
          </>
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-black p-4 text-white">
      {notification && (
        <div className="absolute left-1/2 top-8 z-50 -translate-x-1/2 animate-bounce rounded-3xl border-2 border-yellow-400 bg-black px-8 py-4 text-2xl font-black text-yellow-400">
          {notification}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-black">
          {playerName}
        </div>

        <div className="text-5xl font-black text-yellow-400">
          {timeLeft}
        </div>
      </div>

      {question && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-3xl bg-gray-900 p-6 text-center text-3xl font-black">
            {question.text}
          </div>

          <div className="grid gap-4">
            {question.answers.map(
              (
                answer: string,
                index: number,
              ) => (
                <button
                  key={index}
                  disabled={locked}
                  onClick={() =>
                    submitAnswer(
                      index,
                    )
                  }
                  className={`rounded-3xl p-6 text-center text-2xl font-black transition-all duration-500

                      ${blackoutHidden
                      ? 'blur-md brightness-50'
                      : ''
                    }

                      ${questionEnded &&
                      correctAnswer ===
                      index
                      ? 'bg-green-600'
                      : locked
                        ? 'bg-gray-700'
                        : 'bg-red-600 active:scale-[0.98]'
                    }`}
                >
                  {answer}
                </button>
              ),
            )}
          </div>

          {locked &&
            !questionEnded && (
              <div className="rounded-2xl bg-blue-600 p-5 text-center text-2xl font-black">
                ОТВЕТ ПРИНЯТ
              </div>
            )}
        </div>
      )}
    </main>
  );
}