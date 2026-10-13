import type { SkillId } from '../../engine/question';
import { decimals } from './decimals';
import { expressions } from './expressions';
import { fractionAddSub } from './fractionAddSub';
import { fractionBasics } from './fractionBasics';
import { fractionMulDiv } from './fractionMulDiv';
import { linearEquations } from './linearEquations';
import { numberSense } from './numberSense';
import { percents } from './percents';
import { ratios } from './ratios';
import { signedNumbers } from './signedNumbers';
import type { Skill } from './types';
import { wholeNumbers } from './wholeNumbers';

export type { Skill } from './types';

/** Act 2 topics, shown on the board as sealed files until they're built. */
const sealed = (id: SkillId, name: string, caseName: string, prereqs: SkillId[], x: number, y: number): Skill => ({
  id, act: 2, name, caseName, prereqs, board: { x, y },
  summary: 'Act 2: Quantitative Reasoning, Algebra & Statistics. Coming soon.',
});

export const SKILLS: Skill[] = [
  wholeNumbers,
  fractionBasics,
  fractionAddSub,
  fractionMulDiv,
  decimals,
  percents,
  numberSense,
  signedNumbers,
  expressions,
  linearEquations,
  ratios,
  sealed('exponents', 'Exponents & Roots', 'The Compound Interest', ['signed-numbers'], 92, 82),
  sealed('linear-graphs', 'Lines & Graphs', 'The Map Room', ['linear-equations'], 146, 36),
  sealed('statistics', 'Statistics', 'The Alibi Averages', ['decimals', 'percents'], 110, 66),
  sealed('probability', 'Probability', 'The Card Game', ['fraction-basics', 'percents'], 128, 86),
  sealed('geometry', 'Geometry', 'The Scene of the Crime', ['exponents'], 146, 66),
];

export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>;

export const isPlayable = (s: Skill) => s.generate !== undefined;
