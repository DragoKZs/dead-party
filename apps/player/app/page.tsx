'use client';

import {
  useEffect,
  useState,
} from 'react';

import { io } from 'socket.io-client';

const socket = io(
  'ТВОЙ_RENDER_URL',
);

export default function Home() {
  const [playerName, setPlayerName] =
    useState('');

  const [roomCode, setRoomCode] =
    useState('');

  const [joined, setJoined] =
    useState(false);

  const [question, setQuestion] =
    useState<any>(null);

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

  const [paused, setPaused] =
    useState(false);

  const [
    lockedAnswer,
    setLockedAnswer,
  ] = useState(false);

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
    if (
      typeof window ===
      'undefined'
    )
      return;

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const roomFromUrl =
      params.get('room');

    if (roomFromUrl) {
      setRoomCode(
        roomFromUrl,
      );
    }
  }, []);

  useEffect(() => {
    socket.on(
      'questionStarted',
      (data) => {
        setQuestion(data);

        setQuestionEnded(false);

        setCorrectAnswer(null);

        setLockedAnswer(false);

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

    socket.on(
      'gameState',
      (data) => {
        setPaused(data.paused);
      },
    );

    socket.on(
      'answerLocked',
      () => {
        setLockedAnswer(true);
      },
    );

    socket.on(
      'roomError',
      (data) => {
        alert(data.message);
      },
    );

    return () => {
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
        'answerLocked',
      );

      socket.off('roomError');
    };
  }, []);

  const joinRoom = () => {
    if (
      !playerName.trim() ||
      !roomCode.trim()
    )
      return;

    socket.emit('joinRoom', {
      roomCode,
      playerName,
    });

    setJoined(true);
  };

  const submitAnswer = (
    answerIndex: number,
  ) => {
    if (questionEnded) return;

    if (paused) return;

    if (lockedAnswer) return;

    socket.emit(
      'submitAnswer',
      {
        roomCode,
        answerIndex,
      },
    );
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
        <h1 className="mb-12 text-center text-6xl font-black text-red-600">
          DEAD PARTY
        </h1>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <div>
            <div className="mb-2 text-sm font-bold text-gray-400">
              NICKNAME
            </div>

            <input
              type="text"
              placeholder="YOUR NAME"
              value={playerName}
              onChange={(e) =>
                setPlayerName(
                  e.target.value,
                )
              }
              className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-5 text-xl outline-none"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-gray-400">
              ROOM CODE
            </div>

            <input
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) =>
                setRoomCode(
                  e.target.value,
                )
              }
              className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-5 text-xl outline-none"
            />
          </div>

          <button
            onClick={joinRoom}
            className="mt-2 rounded-2xl bg-red-600 p-5 text-2xl font-black transition-all active:scale-95"
          >
            JOIN ROOM
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col p-4 text-white transition-all
      ${
        isLastChanceRound
          ? 'bg-red-950'
          : isSpeedRound
          ? 'bg-red-950'
          : 'bg-black'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">
            PLAYER
          </div>

          <div className="text-2xl font-black">
            {playerName}
          </div>
        </div>

        <div
          className={`text-5xl font-black
          ${
            timeLeft <= 3
              ? 'animate-pulse text-red-500'
              : 'text-yellow-400'
          }`}
        >
          ⏳ {timeLeft}
        </div>
      </div>

      {paused && (
        <div className="mb-4 rounded-2xl bg-yellow-500 p-4 text-center text-2xl font-black text-black">
          GAME PAUSED
        </div>
      )}

      {question && (
        <div className="flex flex-1 flex-col gap-4">
          {isSpeedRound && (
            <div className="rounded-2xl bg-yellow-400 p-4 text-center text-2xl font-black text-black">
              ⚡ SPEED ROUND ⚡
            </div>
          )}

          {isBlackoutRound && (
            <div className="rounded-2xl bg-white p-4 text-center text-2xl font-black text-black">
              🌑 ANSWERS WILL
              DISAPPEAR
            </div>
          )}

          {isLastChanceRound && (
            <div className="rounded-2xl bg-red-950 p-4 text-center text-2xl font-black text-white">
              ☠ LAST CHANCE
              ROUND
              <div className="mt-2 text-lg text-gray-300">
                ❤️ Recover lives
                <br />
                🏆 Or gain bonus
                points
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-gray-900 p-6 text-center text-3xl font-black">
            {question.text}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4">
            {question.answers.map(
              (
                answer: string,
                index: number,
              ) => (
                <button
                  key={index}
                  disabled={
                    paused ||
                    lockedAnswer
                  }
                  onClick={() =>
                    submitAnswer(
                      index,
                    )
                  }
                  className={`min-h-[90px] rounded-3xl p-6 text-2xl font-black transition-all duration-700 active:scale-95 disabled:opacity-50
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
                      ? 'opacity-10 blur-sm'
                      : ''
                  }`}
                >
                  {answer}
                </button>
              ),
            )}
          </div>

          {lockedAnswer &&
            !questionEnded && (
              <div className="rounded-2xl bg-blue-600 p-5 text-center text-3xl font-black">
                ANSWER LOCKED
              </div>
            )}

          {questionEnded && (
            <div className="rounded-2xl bg-gray-900 p-5 text-center text-3xl font-black">
              TIME'S UP
            </div>
          )}
        </div>
      )}
    </main>
  );
}