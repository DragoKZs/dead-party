'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
);

export default function ScreenPage() {
  const [roomCode, setRoomCode] =
    useState('123');

  const [joined, setJoined] =
    useState(false);

  const [players, setPlayers] =
    useState<any[]>([]);

  const [question, setQuestion] =
    useState<any>(null);

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState<number | null>(
    null,
  );

  const [paused, setPaused] =
    useState(false);

  const [phase, setPhase] =
    useState('LOBBY');

  const [category, setCategory] =
    useState('');

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

  const tickSound = useRef<any>(
    null,
  );

  const revealSound =
    useRef<any>(null);

  const leaderboardSound =
    useRef<any>(null);

  const panicSound =
    useRef<any>(null);

  useEffect(() => {
    tickSound.current = new Audio(
      '/sounds/tick.mp3',
    );

    revealSound.current =
      new Audio(
        '/sounds/reveal.mp3',
      );

    leaderboardSound.current =
      new Audio(
        '/sounds/leaderboard.mp3',
      );

    panicSound.current =
      new Audio(
        '/sounds/panic.mp3',
      );
  }, []);

  useEffect(() => {
    socket.on(
      'playersUpdated',
      (data) => {
        setPlayers(data.players);
      },
    );

    socket.on(
      'questionStarted',
      (data) => {
        setQuestion(data);

        setCorrectAnswer(null);

        setIsSpeedRound(
          data.isSpeedRound,
        );

        setIsBlackoutRound(
          data.isBlackoutRound,
        );

        setIsLastChanceRound(
          data.isLastChanceRound,
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
        setCorrectAnswer(
          data.correct,
        );
      },
    );

    socket.on(
      'gameState',
      (data) => {
        setPaused(data.paused);
      },
    );

    socket.on(
      'phaseChanged',
      (data) => {
        setPhase(data.phase);
      },
    );

    socket.on(
      'roundIntro',
      (data) => {
        setCategory(
          data.category,
        );

        setIsSpeedRound(
          data.isSpeedRound,
        );

        setIsBlackoutRound(
          data.isBlackoutRound,
        );

        setIsLastChanceRound(
          data.isLastChanceRound,
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

      socket.off('gameState');

      socket.off(
        'phaseChanged',
      );

      socket.off(
        'roundIntro',
      );
    };
  }, []);

  useEffect(() => {
    const stopAllSounds = () => {
      [
        tickSound.current,
        revealSound.current,
        leaderboardSound.current,
        panicSound.current,
      ].forEach((sound) => {
        if (!sound) return;

        sound.pause();

        sound.currentTime = 0;
      });
    };

    stopAllSounds();

    if (phase === 'QUESTION') {
      tickSound.current.loop = true;

      tickSound.current.volume = 0.3;

      tickSound.current.play();
    }

    if (phase === 'REVEAL') {
      revealSound.current.volume = 1;

      revealSound.current.play();
    }

    if (
      phase ===
      'LEADERBOARD'
    ) {
      leaderboardSound.current.volume =
        0.5;

      leaderboardSound.current.play();
    }

    return () => {
      stopAllSounds();
    };
  }, [phase]);

  useEffect(() => {
    if (
      timeLeft <= 3 &&
      timeLeft > 0 &&
      phase === 'QUESTION'
    ) {
      panicSound.current.pause();

      panicSound.current.currentTime =
        0;

      panicSound.current.volume = 1;

      panicSound.current.play();
    }
  }, [timeLeft, phase]);

  const joinScreen = () => {
    socket.emit('joinScreen', {
      roomCode,
    });

    setJoined(true);
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-10 text-7xl font-black text-red-600">
          DEAD PARTY SCREEN
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
            CONNECT SCREEN
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen overflow-hidden p-10 text-white transition-all duration-500
      ${
        isLastChanceRound
          ? 'bg-red-950'
          : isSpeedRound &&
            phase ===
              'QUESTION'
          ? 'bg-red-950'
          : 'bg-black'
      }`}
    >
      {paused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="rounded-3xl bg-yellow-400 px-20 py-10 text-7xl font-black text-black">
            GAME PAUSED
          </div>
        </div>
      )}

      {phase === 'LOBBY' && (
        <div className="flex h-screen flex-col items-center justify-center">
          <div className="mb-8 text-8xl font-black text-red-600">
            DEAD PARTY
          </div>

          <div className="mb-10 text-[140px] font-black">
            {roomCode}
          </div>

          <div className="text-4xl text-gray-500">
            Waiting for players...
          </div>
        </div>
      )}

      {phase ===
        'ROUND_INTRO' && (
        <div
          className={`flex h-screen flex-col items-center justify-center text-center transition-all
          ${
            isLastChanceRound
              ? 'bg-red-950'
              : isSpeedRound
              ? 'bg-red-950'
              : ''
          }`}
        >
          {isLastChanceRound && (
            <>
              <div className="mb-8 animate-pulse text-7xl font-black text-red-500">
                ☠ LAST CHANCE ☠
              </div>

              <div className="mb-6 text-4xl font-black text-white">
                EVERYONE GETS ONE MORE SHOT
              </div>

              <div className="mb-16 text-2xl text-gray-300">
                ❤️ Recover lives
                <br />
                🏆 Or earn bonus
                points
              </div>
            </>
          )}

          {!isLastChanceRound &&
            isSpeedRound && (
              <div className="mb-8 animate-pulse text-5xl font-black text-yellow-400">
                ⚡ SPEED ROUND ⚡
              </div>
            )}

          {!isLastChanceRound &&
            isBlackoutRound && (
              <div className="mb-6 animate-pulse text-5xl font-black text-white">
                🌑 BLACKOUT ROUND 🌑
              </div>
            )}

          <div className="mb-8 text-4xl font-black text-red-500">
            CATEGORY
          </div>

          <div className="animate-pulse text-[120px] font-black uppercase">
            {category}
          </div>
        </div>
      )}

      {phase === 'QUESTION' &&
        question && (
          <div>
            <div className="mb-10 flex items-center justify-between">
              <h1 className="text-7xl font-black text-red-600">
                DEAD PARTY
              </h1>

              <div
                className={`text-6xl font-black transition-all
                ${
                  timeLeft <= 3
                    ? isSpeedRound
                      ? 'animate-bounce scale-125 text-red-500'
                      : 'animate-pulse text-red-500'
                    : 'text-yellow-400'
                }`}
              >
                ⏳ {timeLeft}
              </div>
            </div>

            <div
              className={`rounded-3xl p-10 transition-all
              ${
                isSpeedRound
                  ? 'border-4 border-red-500 bg-red-900/40'
                  : 'bg-gray-900'
              }`}
            >
              {isSpeedRound && (
                <div className="mb-6 text-3xl font-black text-yellow-400">
                  ⚡ SPEED ROUND •
                  DOUBLE POINTS
                </div>
              )}

              {isBlackoutRound && (
                <div className="mb-6 text-3xl font-black text-white">
                  🌑 ANSWERS WILL
                  DISAPPEAR
                </div>
              )}

              {isLastChanceRound && (
                <div className="mb-6 rounded-2xl bg-red-950 p-5 text-3xl font-black text-white">
                  ☠ LAST CHANCE
                  ROUND
                  <div className="mt-2 text-xl text-gray-300">
                    ❤️ Players
                    recover lives
                    <br />
                    🏆 Full health
                    players gain
                    points
                  </div>
                </div>
              )}

              <h2 className="mb-10 text-6xl font-bold leading-tight">
                {
                  question.text
                }
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {question.answers.map(
                  (
                    answer: string,
                    index: number,
                  ) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-8 text-4xl font-bold transition-all duration-700
                      ${
                        isSpeedRound
                          ? 'bg-red-600'
                          : 'bg-red-700'
                      }

                      ${
                        isBlackoutRound &&
                        timeLeft <= 7
                          ? 'opacity-10 blur-sm'
                          : ''
                      }`}
                    >
                      {answer}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

      {phase === 'REVEAL' &&
        question &&
        correctAnswer !==
          null && (
          <div className="flex h-screen flex-col items-center justify-center text-center">
            <div className="mb-10 animate-pulse text-5xl font-black text-green-400">
              CORRECT ANSWER
            </div>

            <div className="scale-110 rounded-3xl bg-green-600 px-20 py-12 text-8xl font-black shadow-2xl">
              {
                question.answers[
                  correctAnswer
                ]
              }
            </div>

            {isSpeedRound && (
              <div className="mt-10 text-4xl font-black text-yellow-400">
                ⚡ SPEED ROUND
                BONUS ⚡
              </div>
            )}

            {isBlackoutRound && (
              <div className="mt-10 text-4xl font-black text-white">
                🌑 BLACKOUT
                SURVIVED
              </div>
            )}

            {isLastChanceRound && (
              <div className="mt-10 text-4xl font-black text-red-400">
                ☠ LAST CHANCE
                COMPLETE ☠
              </div>
            )}
          </div>
        )}

      {phase ===
        'LEADERBOARD' && (
        <div>
          <div className="mb-10 animate-pulse text-center text-7xl font-black text-yellow-400">
            LEADERBOARD
          </div>

          <div className="grid grid-cols-2 gap-6">
            {players
              .sort((a, b) => {
                if (
                  a.lives <= 0 &&
                  b.lives > 0
                )
                  return 1;

                if (
                  a.lives > 0 &&
                  b.lives <= 0
                )
                  return -1;

                return (
                  b.score -
                  a.score
                );
              })
              .slice(0, 10)
              .map(
                (
                  player,
                  index,
                ) => (
                  <div
                    key={player.id}
                    className={`relative flex items-center justify-between rounded-3xl p-8 transition-all duration-700 animate-[fadeIn_.5s_ease]

                    ${
                      player.lives <=
                      0
                        ? 'scale-95 bg-gray-900 opacity-40'
                        : 'bg-gray-900'
                    }

                    ${
                      index === 0
                        ? 'scale-105 border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.8)]'
                        : ''
                    }

                    ${
                      player.lastResult &&
                      isLastChanceRound
                        ? 'animate-pulse ring-4 ring-green-400'
                        : ''
                    }
                    `}
                  >
                    {index === 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-6 py-2 text-xl font-black text-black">
                        👑 LEADER
                      </div>
                    )}

                    <div>
                      <div className="mb-3 flex items-center gap-4">
                        <div
                          className={`text-5xl font-black
                          ${
                            index === 0
                              ? 'text-yellow-400'
                              : 'text-red-500'
                          }`}
                        >
                          #
                          {index +
                            1}
                        </div>

                        <div className="text-4xl font-black">
                          {
                            player.name
                          }
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {'❤️'.repeat(
                            Math.max(
                              0,
                              player.lives,
                            ),
                          )}
                        </div>

                        {player.lives <=
                          0 && (
                          <div className="rounded-full bg-red-950 px-4 py-1 text-lg font-black text-red-400">
                            ELIMINATED
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div
                        className={`text-6xl font-black transition-all
                        ${
                          player.lastResult
                            ? 'scale-110 text-yellow-300'
                            : 'text-yellow-400'
                        }`}
                      >
                        {
                          player.score
                        }
                      </div>

                      {player.lastResult && (
                        <div className="mt-2 animate-bounce text-2xl font-black text-green-400">
                          +
                          {isSpeedRound
                            ? '200'
                            : '100'}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
          </div>
        </div>
      )}
    </main>
  );
}