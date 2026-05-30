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
    reconnectionAttempts:
      Infinity,
    reconnectionDelay: 1000,
  },
);

const randomEmojis = [
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

export default function Home() {
  const [connected, setConnected] =
    useState(false);

  const [
    telegramUser,
    setTelegramUser,
  ] = useState<any>(null);

  const [telegramId, setTelegramId] =
    useState('');

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

  const [
    isFinalRound,
    setIsFinalRound,
  ] = useState(false);

  const [streak, setStreak] =
    useState(0);

  const [
    streakPopup,
    setStreakPopup,
  ] = useState(false);

  const [
    killFeed,
    setKillFeed,
  ] = useState<any[]>([]);

  const [
    reconnectAvailable,
    setReconnectAvailable,
  ] = useState(false);

  const [avatar, setAvatar] =
    useState('');

  const randomEmoji =
    useMemo(() => {
      return randomEmojis[
        Math.floor(
          Math.random() *
            randomEmojis.length,
        )
      ];
    }, []);

  useEffect(() => {
    socket.on(
      'connect',
      () => {
        setConnected(true);
      },
    );

    socket.on(
      'disconnect',
      () => {
        setConnected(false);
      },
    );

    return () => {
      socket.off('connect');

      socket.off(
        'disconnect',
      );
    };
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
        setTelegramUser(
          user,
        );

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
      console.log(
        'Telegram unavailable',
      );

      setAvatar(
        randomEmoji,
      );
    }
  }, [randomEmoji]);

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

    const room =
      params.get('room');

    if (room) {
      setRoomCode(room);
    }
  }, []);

  useEffect(() => {
    const saved =
      localStorage.getItem(
        'dead-party-player',
      );

    if (!saved) return;

    const parsed =
      JSON.parse(saved);

    setReconnectAvailable(
      true,
    );

    setPlayerName(
      parsed.playerName,
    );

    setRoomCode(
      parsed.roomCode,
    );

    setTelegramId(
      parsed.telegramId,
    );

    setAvatar(
      parsed.avatar,
    );
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

        setJoined(false);
      },
    );

    socket.on(
      'streak',
      (data) => {
        setStreak(
          data.streak,
        );

        setStreakPopup(
          true,
        );

        setTimeout(() => {
          setStreakPopup(
            false,
          );
        }, 2500);
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
      'reconnected',
      () => {
        setJoined(true);
      },
    );

    socket.on(
      'gameFinished',
      () => {
        setQuestion(null);
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

      socket.off(
        'gameState',
      );

      socket.off(
        'answerLocked',
      );

      socket.off(
        'roomError',
      );

      socket.off(
        'streak',
      );

      socket.off(
        'killFeedUpdated',
      );

      socket.off(
        'reconnected',
      );

      socket.off(
        'gameFinished',
      );
    };
  }, []);

  const saveReconnectData =
    () => {
      localStorage.setItem(
        'dead-party-player',
        JSON.stringify({
          playerName,
          roomCode,
          telegramId,
          avatar,
        }),
      );
    };

  const joinRoom = () => {
    if (
      !playerName.trim() ||
      !roomCode.trim()
    )
      return;

    socket.emit(
      'joinRoom',
      {
        roomCode,
        playerName,
        telegramId,
        avatar,
      },
    );

    saveReconnectData();

    setJoined(true);
  };

  const reconnect =
    () => {
      joinRoom();
    };

  const submitAnswer = (
    answerIndex: number,
  ) => {
    if (questionEnded)
      return;

    if (paused) return;

    if (lockedAnswer)
      return;

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

        <div className="mb-4 text-sm text-gray-500">
          {connected
            ? '🟢 Подключено'
            : '🔴 Подключение...'}
        </div>

        {reconnectAvailable && (
          <button
            onClick={
              reconnect
            }
            className="mb-6 rounded-2xl bg-yellow-500 p-4 text-2xl font-black text-black"
          >
            🔄 ВЕРНУТЬСЯ
            В ИГРУ
          </button>
        )}

        <div className="mb-6 flex flex-col items-center gap-4">
          {avatar.startsWith(
            'http',
          ) ? (
            <img
              src={avatar}
              alt="avatar"
              className="h-28 w-28 rounded-full border-4 border-red-600 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 bg-gray-900 text-6xl">
              {avatar}
            </div>
          )}

          <button
            onClick={() =>
              setAvatar(
                randomEmojis[
                  Math.floor(
                    Math.random() *
                      randomEmojis.length,
                  )
                ],
              )
            }
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm"
          >
            СЛУЧАЙНЫЙ
            АВАТАР
          </button>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          <input
            type="text"
            placeholder="ВАШЕ ИМЯ"
            value={playerName}
            onChange={(e) =>
              setPlayerName(
                e.target.value,
              )
            }
            className="w-full rounded-2xl bg-gray-900 p-5 text-xl outline-none"
          />

          <input
            type="text"
            placeholder="КОД КОМНАТЫ"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value,
              )
            }
            className="w-full rounded-2xl bg-gray-900 p-5 text-xl outline-none"
          />

          <button
            onClick={joinRoom}
            className="rounded-2xl bg-red-600 p-5 text-2xl font-black"
          >
            ВОЙТИ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-hidden p-4 text-white transition-all
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
      <div className="absolute right-3 top-3 flex w-[320px] flex-col gap-2">
        {killFeed.map(
          (
            event,
          ) => (
            <div
              key={
                event.id
              }
              className="animate-pulse rounded-xl border border-red-600 bg-black/80 p-3 text-sm font-bold backdrop-blur"
            >
              {
                event.text
              }
            </div>
          ),
        )}
      </div>

      {streakPopup && (
        <div className="absolute left-1/2 top-28 z-50 -translate-x-1/2 animate-bounce rounded-3xl border-4 border-yellow-400 bg-black p-6 text-center text-4xl font-black text-yellow-400 shadow-[0_0_40px_rgba(255,255,0,0.8)]">
          🔥 СЕРИЯ x
          {streak}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatar.startsWith(
            'http',
          ) ? (
            <img
              src={avatar}
              alt="avatar"
              className="h-14 w-14 rounded-full border-2 border-red-500 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500 bg-gray-900 text-2xl">
              {avatar}
            </div>
          )}

          <div className="text-2xl font-black">
            {
              playerName
            }
          </div>
        </div>

        <div
          className={`text-5xl font-black
          ${
            timeLeft <=
            (isFinalRound
              ? 5
              : 3)
              ? 'animate-pulse text-red-500'
              : 'text-yellow-400'
          }`}
        >
          ⏳ {timeLeft}
        </div>
      </div>

      {paused && (
        <div className="mb-4 rounded-2xl bg-yellow-500 p-4 text-center text-2xl font-black text-black">
          ИГРА НА ПАУЗЕ
        </div>
      )}

      {isSpeedRound && (
        <div className="mb-4 rounded-2xl bg-yellow-400 p-4 text-center text-2xl font-black text-black">
          ⚡ БЛИЦ
        </div>
      )}

      {isBlackoutRound && (
        <div className="mb-4 rounded-2xl bg-white p-4 text-center text-2xl font-black text-black">
          🌑 ТЕМНОТА
        </div>
      )}

      {isLastChanceRound && (
        <div className="mb-4 rounded-2xl bg-red-700 p-4 text-center text-2xl font-black">
          ☠ ПОСЛЕДНИЙ
          ШАНС
        </div>
      )}

      {isFinalRound && (
        <div className="mb-4 animate-pulse rounded-2xl border-4 border-red-500 bg-black p-6 text-center text-4xl font-black text-red-500 shadow-[0_0_40px_rgba(255,0,0,0.8)]">
          🔥 ФИНАЛ 🔥
        </div>
      )}

      {question && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-3xl bg-gray-900 p-6 text-center text-3xl font-black">
            {
              question.text
            }
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
                  className={`min-h-[90px] rounded-3xl p-6 text-2xl font-black transition-all duration-700
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
                  {
                    answer
                  }
                </button>
              ),
            )}
          </div>

          {lockedAnswer &&
            !questionEnded && (
              <div className="rounded-2xl bg-blue-600 p-5 text-center text-3xl font-black">
                ОТВЕТ ПРИНЯТ
              </div>
            )}

          {questionEnded && (
            <div className="rounded-2xl bg-gray-900 p-5 text-center text-3xl font-black">
              ВРЕМЯ
              ВЫШЛО
            </div>
          )}
        </div>
      )}
    </main>
  );
}