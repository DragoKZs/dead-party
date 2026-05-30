import * as fs from 'fs';

import * as path from 'path';

const questionsPath =
  path.join(
    process.cwd(),
    'src/questions/questions.json',
  );

const rawData =
  fs.readFileSync(
    questionsPath,
    'utf-8',
  );

export const questions =
  JSON.parse(rawData);