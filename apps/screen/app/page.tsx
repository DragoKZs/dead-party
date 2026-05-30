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

  const [question, setQuestion] =
    useState<any>(null);

  const [players, setPlayers] =
    useState<any[]>([]);

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

  const [
    isFinalRound,
    setIsFinalRound,
  ] = useState(false);

  const [
    killFeed,
    setKillFeed,
  ] = useState<any[]>([]);

  const [
    gameFinished,
    setGameFinished,
  ] = useState(false);

  const [
    winner,
    setWinner,
  ] = useState<any>(null);

  useEffect(() => {
    socket.on(
      'playersUpdated',
      (data) => {
        const sorted =
          [...data.players].sort(
            (a, b) => {
              if (
                a.lives > 0 &&
                b.lives <= 0
              )
                return -1;

              if (
                a.lives <= 0 &&
                b.lives > 0
              )
                return 1;

              return (
                b.score -
                a.score
              );
            },
          );

        setPlayers(sorted);
      },
    );

    socket.on(
      'questionStarted',
      (data) => {
        setQuestion(data);

        setQuestionEnded(false);

        setCorrectAnswer(null);

        setGameFinished(false);

        setIsSpeedRound(
          data.isSpeedRound,
        );

        setIsBlackoutRound(
          data.isBlackoutRound,
        );

        setIsLastChanceRound(
          data.isLastChanceRound,
        );

        setIsFinalRound(
          data.isFinalRound,
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
      'killFeedUpdated',
      (
        events,
      ) => {
        setKillFeed(events);
      },
    );

    socket.on(
      'gameFinished',
      (data) => {
        setGameFinished(
          true,
        );

        setWinner(
          data.winner,
        );

        setPlayers(
          data.players,
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
        'killFeedUpdated',
      );

      socket.off(
        'gameFinished',
      );
    };
  }, []);

  const topThree =
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
        .slice(0, 3);
    }, [players]);

  const achievements =
    useMemo(() => {
      if (
        !players.length
      )
        return [];

      const fastest =
        [...players].sort(
          (
            a,
            b,
          ) =>
            b.bestStreak -
            a.bestStreak,
        )[0];

      const smartest =
        [...players].sort(
          (
            a,
            b,
          ) =>
            b.correctAnswers -
            a.correctAnswers,
        )[0];

      const survivor =
        [...players].sort(
          (
            a,
            b,
          ) =>
            b.lives -
            a.lives,
        )[0];

      return [
        {
          title:
            '🔥 ЛУЧШАЯ СЕРИЯ',
          player:
            fastest,
          value:
            fastest?.bestStreak ||
            0,
        },

        {
          title:
            '🧠 БОЛЬШЕ ВСЕГО ПРАВИЛЬНЫХ',
          player:
            smartest,
          value:
            smartest?.correctAnswers ||
            0,
        },

        {
          title:
            '☠ ВЫЖИВШИЙ',
          player:
            survivor,
          value:
            survivor?.lives ||
            0,
        },
      ];
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

  if (gameFinished) {
    return (
      <main className="min-h-screen overflow-hidden bg-black p-10 text-white">
        <div className="mb-16 text-center">
          <div className="mb-4 text-8xl font-black text-yellow-400">
            👑
          </div>

          <div className="mb-2 text-7xl font-black">
            ПОБЕДИТЕЛЬ
          </div>

          <div className="text-6xl font-black text-red-500">
            {
              winner?.name
            }
          </div>
        </div>

        <div className="mb-20">
          <div className="mb-10 text-center text-6xl font-black">
            🏆 ТОП 3
          </div>

          <div className="grid grid-cols-3 gap-8">
            {topThree.map(
              (
                player,
                index,
              ) => (
                <div
                  key={
                    player.id
                  }
                  className={`rounded-3xl border-4 p-8 text-center shadow-[0_0_40px_rgba(255,255,255,0.2)]
                  ${
                    index ===
                    0
                      ? 'border-yellow-400 bg-yellow-500/10'
                      : index ===
                        1
                      ? 'border-gray-300 bg-gray-300/10'
                      : 'border-orange-700 bg-orange-700/10'
                  }`}
                >
                  <div className="mb-4 text-7xl">
                    {player.avatar?.startsWith(
                      'http',
                    ) ? (
                      <img
                        src={
                          player.avatar
                        }
                        alt="avatar"
                        className="mx-auto h-28 w-28 rounded-full object-cover"
                      />
                    ) : (
                      player.avatar
                    )}
                  </div>

                  <div className="mb-3 text-4xl font-black">
                    {
                      player.name
                    }
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

        <div>
          <div className="mb-10 text-center text-6xl font-black">
            ⚡ ДОСТИЖЕНИЯ
          </div>

          <div className="grid grid-cols-3 gap-8">
            {achievements.map(
              (
                achievement,
                index,
              ) => (
                <div
                  key={index}
                  className="rounded-3xl border-2 border-red-500 bg-red-500/10 p-8 text-center"
                >
                  <div className="mb-4 text-3xl font-black">
                    {
                      achievement.title
                    }
                  </div>

                  <div className="mb-4 text-5xl">
                    {achievement.player?.avatar?.startsWith(
                      'http',
                    ) ? (
                      <img
                        src={
                          achievement
                            .player
                            .avatar
                        }
                        alt="avatar"
                        className="mx-auto h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      achievement
                        .player
                        ?.avatar
                    )}
                  </div>

                  <div className="mb-2 text-4xl font-black">
                    {
                      achievement
                        .player
                        ?.name
                    }
                  </div>

                  <div className="text-3xl font-black text-yellow-400">
                    {
                      achievement.value
                    }
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden p-10 text-white transition-all
      ${
        isFinalRound
          ? 'bg-gradient-to-b from-red-950 via-black to-black'
          : isLastChanceRound
          ? 'bg-red-950'
          : isSpeedRound
          ? 'bg-red-950'
          : 'bg-black'
      }`}
    >
      <div className="absolute right-5 top-5 z-50 flex w-[420px] flex-col gap-3">
        {killFeed.map(
          (
            event,
          ) => (
            <div
              key={
                event.id
              }
              className="animate-pulse rounded-2xl border border-red-600 bg-black/80 p-4 text-xl font-black shadow-[0_0_20px_rgba(255,0,0,0.4)] backdrop-blur"
            >
              {
                event.text
              }
            </div>
          ),
        )}
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="text-5xl font-black text-red-600">
          {
            roomCode
          }
        </div>

        <div
          className={`text-7xl font-black
          ${
            timeLeft <=
            (isFinalRound
              ? 5
              : 3)
              ? 'animate-pulse text-red-500'
              : 'text-yellow-400'
          }`}
        >
          {timeLeft}
        </div>
      </div>

      {isSpeedRound && (
        <div className="mb-6 rounded-3xl bg-yellow-400 p-6 text-center text-5xl font-black text-black">
          ⚡ БЛИЦ
        </div>
      )}

      {isBlackoutRound && (
        <div className="mb-6 rounded-3xl bg-white p-6 text-center text-5xl font-black text-black">
          🌑 ТЕМНОТА
        </div>
      )}

      {isLastChanceRound && (
        <div className="mb-6 rounded-3xl bg-red-700 p-6 text-center text-5xl font-black">
          ☠ ПОСЛЕДНИЙ
          ШАНС
        </div>
      )}

      {isFinalRound && (
        <div className="mb-6 animate-pulse rounded-3xl border-4 border-red-500 bg-black p-8 text-center text-7xl font-black text-red-500 shadow-[0_0_60px_rgba(255,0,0,0.8)]">
          🔥 ФИНАЛ 🔥
        </div>
      )}

      {question && (
        <div>
          <div className="mb-10 rounded-3xl bg-gray-900 p-10 text-center text-5xl font-black shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            {
              question.text
            }
          </div>

          <div className="grid grid-cols-2 gap-6">
            {question.answers.map(
              (
                answer: string,
                index: number,
              ) => (
                <div
                  key={index}
                  className={`rounded-3xl p-10 text-center text-4xl font-black transition-all duration-700
                  ${
                    questionEnded &&
                    correctAnswer ===
                      index
                      ? 'scale-105 bg-green-600 shadow-[0_0_40px_rgba(0,255,0,0.8)]'
                      : 'bg-red-600'
                  }

                  ${
                    isBlackoutRound &&
                    timeLeft <= 7
                      ? 'opacity-0'
                      : ''
                  }`}
                >
                  {
                    answer
                  }
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-6 text-5xl font-black">
          🏆 ЛИДЕРЫ
        </h2>

        <div className="flex flex-col gap-4">
          {players.map(
            (
              player,
              index,
            ) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-3xl p-6 text-3xl font-black transition-all
                ${
                  player.lives <= 0
                    ? 'bg-gray-900 opacity-30'
                    : index ===
                      0
                    ? 'border-2 border-yellow-400 bg-yellow-500/10'
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="text-4xl">
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
                      #
                      {index +
                        1}{' '}
                      {
                        player.name
                      }
                    </div>

                    {player.bestStreak >=
                      3 && (
                      <div className="mt-1 text-lg text-yellow-400">
                        🔥 x
                        {
                          player.bestStreak
                        }
                      </div>
                    )}
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
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}