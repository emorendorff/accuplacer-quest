import { CASE_1 } from './case1';
import { CASE_2 } from './case2';
import { CASE_3 } from './case3';
import type { Chapter } from './types';

export type { Beat, Chapter, CharacterId, Puzzle } from './types';
export { CHARACTERS } from './characters';

export const CHAPTERS: Chapter[] = [...CASE_1, ...CASE_2, ...CASE_3];

export const NEXT_CASE_TEASER = {
  title: 'Case 4: The Lucky Table',
  text: 'Graphs, statistics, probability, geometry and exponents, plus a Greenville card game that wins too often. Coming soon. Until then, keep your skills sharp on the board and take a practice test.',
};
