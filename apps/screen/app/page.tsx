'use client';

import {
  useEffect,
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
        setQuestionEnded(true);

        setCorrectAnswer(
          data.correct,
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
    <main
      className={`min-h-screen p-10 text-white transition-all
      ${
        isLastChanceRound
          ? 'bg-red-950'
          : isSpeedRound
          ? 'bg-red-950'
          : 'bg-black'
      }`}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="text-5xl font-black text-red-600">
          {roomCode}
        </div>

        <div
          className={`text-7xl font-black
          ${
            timeLeft <= 3
              ? 'animate-pulse text-red-500'
              : 'text-yellow-400'
          }`}
        >
          {timeLeft}
        </div>
      </div>

      {isSpeedRound && (
        <div className="mb-6 rounded-3xl bg-yellow-400 p-6 text-center text-5xl font-black text-black">
          ⚡ SPEED ROUND
        </div>
      )}

      {isBlackoutRound && (
        <div className="mb-6 rounded-3xl bg-white p-6 text-center text-5xl font-black text-black">
          🌑 BLACKOUT
        </div>
      )}

      {isLastChanceRound && (
        <div className="mb-6 rounded-3xl bg-red-700 p-6 text-center text-5xl font-black">
          ☠ LAST CHANCE
        </div>
      )}

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
                  className={`rounded-3xl p-10 text-center text-4xl font-black transition-all duration-700
                  ${
                    questionEnded &&
                    correctAnswer ===
                      index
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }

                  ${
                    isBlackoutRound &&
                    timeLeft <= 7
                      ? 'opacity-0'
                      : ''
                  }`}
                >
                  {answer}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-6 text-5xl font-black">
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
                  player.lives <= 0
                    ? 'bg-gray-900 opacity-40'
                    : 'bg-gray-800'
                }`}
              >
                <div>
                  #{index + 1}{' '}
                  {player.name}
                </div>

                <div className="flex gap-6">
                  <div>
                    ❤️{' '}
                    {player.lives}
                  </div>

                  <div>
                    🏆{' '}
                    {player.score}
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