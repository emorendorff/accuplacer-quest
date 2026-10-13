import type { SkillId } from '../../engine/question';
import { decimals } from './decimals';
import { fractionAddSub } from './fractionAddSub';
import { fractionBasics } from './fractionBasics';
import { fractionMulDiv } from './fractionMulDiv';
import { numberSense } from './numberSense';
import { percents } from './percents';
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
  sealed('ratios', 'Ratios & Proportions', 'The Smuggler\'s Scale', ['percents', 'fraction-muldiv'], 90, 22),
  sealed('exponents', 'Exponents & Roots', 'The Compound Interest', ['whole-numbers'], 90, 44),
  sealed('expressions', 'Algebraic Expressions', 'The Coded Letter', ['whole-numbers', 'fraction-addsub'], 108, 12),
  sealed('linear-equations', 'Linear Equations', 'Solving for X', ['expressions'], 126, 22),
  sealed('linear-graphs', 'Lines & Graphs', 'The Map Room', ['linear-equations'], 144, 34),
  sealed('statistics', 'Statistics', 'The Alibi Averages', ['decimals', 'percents'], 108, 70),
  sealed('probability', 'Probability', 'The Card Game', ['fraction-basics', 'percents'], 126, 82),
  sealed('geometry', 'Geometry', 'The Scene of the Crime', ['exponents'], 144, 58),
];

export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>;

export const isPlayable = (s: Skill) => s.generate !== undefined;
