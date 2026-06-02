const survivalQuestions = [
  {
    question:
      'Что больше?',
    left:
      'Слон',
    right:
      'Муравей',
    correct:
      'left',
  },

  {
    question:
      'Что горячее?',
    left:
      'Лёд',
    right:
      'Огонь',
    correct:
      'right',
  },

  {
    question:
      'Кто летает?',
    left:
      'Пингвин',
    right:
      'Орел',
    correct:
      'right',
  },

  {
    question:
      'Что быстрее?',
    left:
      'Черепаха',
    right:
      'Гепард',
    correct:
      'right',
  },
];

export function startSurvivalRun(
  room: any,
) {
  room.miniGameActive =
    true;

  room.currentMiniGame =
    'survival-run';

  room.survivalRound =
    1;

  room.survivalAnswers =
    {};

  room.survivalPlayers =
    room.players.map(
      (p: any) => ({
        telegramId:
          p.telegramId,

        alive: true,
      }),
    );

  const question =
    survivalQuestions[
    Math.floor(
      Math.random() *
      survivalQuestions.length,
    )
    ];

  room.currentSurvivalQuestion =
    question;

  return question;
}

export function submitSurvivalAnswer(
  room: any,
  telegramId: string,
  answer: string,
) {
  const player =
    room.survivalPlayers.find(
      (p: any) =>
        p.telegramId ===
        telegramId,
    );

  if (
    !player ||
    !player.alive
  ) {
    return;
  }

  room.survivalAnswers[
    telegramId
  ] = answer;
}

export function finishSurvivalRound(
  room: any,
) {
  const correct =
    room
      .currentSurvivalQuestion
      .correct;

  const eliminated: string[] =
    [];

  room.survivalPlayers.forEach(
    (player: any) => {
      if (!player.alive)
        return;

      const answer =
        room
          .survivalAnswers[
        player.telegramId
        ];

      if (
        answer !== correct
      ) {
        player.alive =
          false;

        eliminated.push(
          player.telegramId,
        );
      }
    },
  );

  const alivePlayers =
    room.survivalPlayers.filter(
      (p: any) => p.alive,
    );

  if (
    room.survivalRound >=
    5
  ) {
    alivePlayers.forEach(
      (survivalPlayer: any) => {
        const player =
          room.players.find(
            (p: any) =>
              p.telegramId ===
              survivalPlayer.telegramId,
          );

        if (player) {
          player.score +=
            400;
        }
      },
    );

    room.miniGameActive =
      false;

    room.currentMiniGame =
      null;

    return {
      finished: true,
      winners:
        alivePlayers,
      eliminated,
    };
  }

  room.survivalRound++;

  room.survivalAnswers =
    {};

  const question =
    survivalQuestions[
    Math.floor(
      Math.random() *
      survivalQuestions.length,
    )
    ];

  room.currentSurvivalQuestion =
    question;

  return {
    finished: false,
    eliminated,
    question,
    alivePlayers,
  };
}