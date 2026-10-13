import { CASE_1 } from './case1';
import { CASE_2 } from './case2';
import type { Chapter } from './types';

export type { Beat, Chapter, CharacterId, Puzzle } from './types';
export { CHARACTERS } from './characters';

export const CHAPTERS: Chapter[] = [...CASE_1, ...CASE_2];

export const NEXT_CASE_TEASER = {
  title: 'Act II: The Cipher',
  text: 'Algebra, ratios, statistics, and a code made of letters and numbers. Coming soon. Until then, take a practice test and keep your skills sharp on the board.',
};
