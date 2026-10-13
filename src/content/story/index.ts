import { CASE_1 } from './case1';
import type { Chapter } from './types';

export type { Beat, Chapter, CharacterId, Puzzle } from './types';
export { CHARACTERS } from './characters';

export const CHAPTERS: Chapter[] = [...CASE_1];

export const NEXT_CASE_TEASER = {
  title: 'Case 2: The Insurance Man',
  text: 'Decimals, percents, and a policy worth killing for. Coming soon. Until then, sharpen your skills on the evidence board.',
};
