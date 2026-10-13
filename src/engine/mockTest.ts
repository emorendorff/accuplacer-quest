// Practice-test logic: which skills to ask about, adaptive difficulty, and a
// rough score estimate. The estimate is NOT calibrated against real Accuplacer
// scoring. It rewards getting harder questions right, which is the spirit of
// an adaptive test, and that's all it claims to do.

import type { Difficulty, SkillId } from './question';
import type { Rng } from './rng';

export const TEST_LENGTH = 20;

/** Cover every skill at least twice, fill the rest at random, and avoid back-to-back repeats. */
export function planSkills(rng: Rng, skills: SkillId[], length = TEST_LENGTH): SkillId[] {
  const pool: SkillId[] = [];
  while (pool.length + skills.length <= length) pool.push(...skills);
  pool.push(...rng.shuffle(skills).slice(0, length - pool.length));
  for (let attempt = 0; attempt < 50; attempt++) {
    const order = rng.shuffle(pool);
    if (order.every((s, i) => i === 0 || s !== order[i - 1])) return order;
  }
  return rng.shuffle(pool);
}

export function nextDifficulty(current: Difficulty, correct: boolean): Difficulty {
  return (correct ? Math.min(3, current + 1) : Math.max(1, current - 1)) as Difficulty;
}

export const START_DIFFICULTY: Difficulty = 2;

const POINTS: Record<Difficulty, number> = { 1: 0.6, 2: 1.0, 3: 1.4 };
/** Points that map to a 300: roughly "nearly everything right, mostly at the hardest level." */
const FULL_MARKS = 26;

export function estimateScore(answers: { correct: boolean; difficulty: Difficulty }[]): { estimate: number; low: number; high: number } {
  const points = answers.reduce((sum, a) => sum + (a.correct ? POINTS[a.difficulty] : 0), 0);
  const estimate = Math.round(200 + 100 * Math.min(1, points / FULL_MARKS));
  return { estimate, low: Math.max(200, estimate - 8), high: Math.min(300, estimate + 8) };
}
