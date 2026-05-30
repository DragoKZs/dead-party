'use client';

import {
  useEffect,
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'https://dead-party-server.onrender.com',
  {
    transports: [
      'websocket',
    ],
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

  const [phase, setPhase] =
    useState('LOBBY');

  const [
    currentCategory,
    setCurrentCategory,
  ] = useState('');

  const [
    roundStyle,
    setRoundStyle,
  ] = useState<any>(null);

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
      'phaseChanged',
      (data) => {
        setPhase(data.phase);
      },
    );

    socket.on(
      'roundIntro',
      (data) => {
        setCurrentCategory(
          data.category,
        );

        setRoundStyle(
          data.style,
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
        'phaseChanged',
      );

      socket.off(
        'roundIntro',
      );
    };
  }, []);

  const joinScreen = () => {
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
            className="rounded-2xl bg-gray-900 p-5 text-3xl outline-none"
          />

          <button
            onClick={joinScreen}
            className="rounded-2xl bg-red-600 p-5 text-3xl font-black"
          >
            CONNECT
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-gray-400">
            ROOM
          </div>

          <div className="text-5xl font-black text-red-600">
            {roomCode}
          </div>
        </div>

        <div className="text-7xl font-black text-yellow-400">
          {timeLeft}
        </div>
      </div>

      {phase ===
        'ROUND_INTRO' && (
        <div
          className="rounded-3xl p-10 text-center text-6xl font-black text-white"
          style={{
            background:
              roundStyle?.color ||
              '#111827',
          }}
        >
          <div className="mb-4 text-8xl">
            {roundStyle?.icon}
          </div>

          <div>
            {
              currentCategory
            }
          </div>

          {isSpeedRound && (
            <div className="mt-6 text-4xl">
              ⚡ SPEED ROUND
            </div>
          )}

          {isBlackoutRound && (
            <div className="mt-6 text-4xl">
              🌑 BLACKOUT
            </div>
          )}

          {isLastChanceRound && (
            <div className="mt-6 text-4xl">
              ☠ LAST CHANCE
            </div>
          )}
        </div>
      )}

      {phase ===
        'QUESTION' &&
        question && (
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
                      isBlackoutRound &&
                      timeLeft <= 7
                        ? 'bg-gray-950 text-gray-950'
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

      {phase ===
        'LEADERBOARD' && (
        <div>
          <h2 className="mb-8 text-6xl font-black">
            LEADERBOARD
          </h2>

          <div className="flex flex-col gap-4">
            {players.map(
              (
                player,
                index,
              ) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-3xl p-6 text-3xl font-black
                  ${
                    player.lives <=
                    0
                      ? 'bg-gray-900 opacity-50'
                      : 'bg-gray-800'
                  }`}
                >
                  <div>
                    #{index + 1}{' '}
                    {
                      player.name
                    }
                  </div>

                  <div className="flex items-center gap-6">
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
      )}
    </main>
  );
}