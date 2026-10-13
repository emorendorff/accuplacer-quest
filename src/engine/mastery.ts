// Mastery and spaced review.
//
// Mastery is 0–100 per skill. Easy questions can only carry you so far:
// the caps force harder questions before the higher stars unlock.

import type { Difficulty } from './question';

export interface SkillProgress {
  mastery: number;
  attempts: number;
  correct: number;
  /** Leitner box: higher means longer until the next review. */
  box: number;
  lastPracticed?: number;
  dueAt?: number;
  /** How often each trap has caught the player. */
  traps: Record<string, number>;
}

export const emptyProgress = (): SkillProgress => ({ mastery: 0, attempts: 0, correct: 0, box: 0, traps: {} });

const DAY = 24 * 60 * 60 * 1000;
const REVIEW_DAYS = [1, 2, 4, 7, 14, 30];
const GAIN: Record<Difficulty, number> = { 1: 9, 2: 11, 3: 13 };
const CAP: Record<Difficulty, number> = { 1: 45, 2: 80, 3: 100 };
const LOSS = 5;
const STAR_FLOOR = [0, 30, 60, 90];

export function stars(mastery: number): 0 | 1 | 2 | 3 {
  if (mastery >= 90) return 3;
  if (mastery >= 60) return 2;
  if (mastery >= 30) return 1;
  return 0;
}

export function difficultyFor(mastery: number): Difficulty {
  if (mastery < 35) return 1;
  if (mastery < 70) return 2;
  return 3;
}

export interface AnswerEvent {
  correct: boolean;
  difficulty: Difficulty;
  hintsUsed: number;
  trap?: string;
  now: number;
}

export function applyAnswer(p: SkillProgress, e: AnswerEvent): SkillProgress {
  let mastery = p.mastery;
  if (e.correct) {
    const gain = GAIN[e.difficulty] * Math.pow(0.5, e.hintsUsed);
    // Never push mastery down just because the question was easy.
    mastery = Math.max(mastery, Math.min(CAP[e.difficulty], mastery + gain));
  } else {
    // Stars, once earned, are never taken away.
    mastery = Math.max(STAR_FLOOR[stars(mastery)], mastery - LOSS);
  }
  const traps = { ...p.traps };
  if (!e.correct && e.trap) traps[e.trap] = (traps[e.trap] ?? 0) + 1;
  return {
    ...p,
    mastery: Math.round(mastery * 10) / 10,
    attempts: p.attempts + 1,
    correct: p.correct + (e.correct ? 1 : 0),
    lastPracticed: e.now,
    traps,
  };
}

/** Schedule the next review after a practice session. */
export function scheduleReview(p: SkillProgress, accuracy: number, now: number): SkillProgress {
  const box = accuracy >= 0.75 ? Math.min(p.box + 1, REVIEW_DAYS.length - 1) : Math.max(p.box - 1, 0);
  return { ...p, box, dueAt: now + REVIEW_DAYS[box] * DAY };
}

export const isDue = (p: SkillProgress, now: number) => p.attempts > 0 && p.dueAt !== undefined && p.dueAt <= now;
