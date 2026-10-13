import { describe, expect, it } from 'vitest';
import { add, div, frac, mul, sub, tex } from './fraction';
import { applyAnswer, emptyProgress, scheduleReview, stars } from './mastery';
import { estimateScore, nextDifficulty, planSkills } from './mockTest';
import type { SkillId } from './question';
import { createRng } from './rng';

describe('fractions', () => {
  it('reduces and keeps the sign on top', () => {
    expect(frac(6, 8)).toEqual({ n: 3, d: 4 });
    expect(frac(3, -6)).toEqual({ n: -1, d: 2 });
  });
  it('does arithmetic exactly', () => {
    expect(add(frac(1, 3), frac(1, 4))).toEqual({ n: 7, d: 12 });
    expect(sub(frac(1, 2), frac(1, 3))).toEqual({ n: 1, d: 6 });
    expect(mul(frac(2, 3), frac(3, 4))).toEqual({ n: 1, d: 2 });
    expect(div(frac(3, 4), frac(1, 8))).toEqual({ n: 6, d: 1 });
  });
  it('formats TeX, including mixed numbers', () => {
    expect(tex(frac(3, 4))).toBe('\\frac{3}{4}');
    expect(tex(frac(11, 4), true)).toBe('2\\tfrac{3}{4}');
    expect(tex(frac(8, 4), true)).toBe('2');
  });
});

describe('mastery', () => {
  it('caps progress from easy questions', () => {
    let p = emptyProgress();
    for (let i = 0; i < 50; i++) p = applyAnswer(p, { correct: true, difficulty: 1, hintsUsed: 0, now: 0 });
    expect(p.mastery).toBe(45);
    expect(stars(p.mastery)).toBe(1);
  });
  it('halves the gain per hint and never goes negative', () => {
    const hinted = applyAnswer(emptyProgress(), { correct: true, difficulty: 1, hintsUsed: 1, now: 0 });
    expect(hinted.mastery).toBe(4.5);
    const wrong = applyAnswer(emptyProgress(), { correct: false, difficulty: 1, hintsUsed: 0, trap: 'x', now: 0 });
    expect(wrong.mastery).toBe(0);
    expect(wrong.traps).toEqual({ x: 1 });
  });
  it('never takes away an earned star', () => {
    let p = { ...emptyProgress(), mastery: 36 };
    for (let i = 0; i < 10; i++) p = applyAnswer(p, { correct: false, difficulty: 2, hintsUsed: 0, now: 0 });
    expect(p.mastery).toBe(30);
    expect(stars(p.mastery)).toBe(1);
  });
  it('spaces reviews out after good sessions and pulls them in after bad ones', () => {
    const good = scheduleReview(emptyProgress(), 0.9, 0);
    expect(good.box).toBe(1);
    const bad = scheduleReview(good, 0.4, 0);
    expect(bad.box).toBe(0);
  });
});

describe('practice test', () => {
  const skills = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as unknown as SkillId[];

  it('covers every skill at least twice with no back-to-back repeats', () => {
    for (let seed = 1; seed < 50; seed++) {
      const plan = planSkills(createRng(seed), skills);
      expect(plan).toHaveLength(20);
      for (const s of skills) expect(plan.filter((p) => p === s).length).toBeGreaterThanOrEqual(2);
      expect(plan.every((s, i) => i === 0 || s !== plan[i - 1])).toBe(true);
    }
  });

  it('moves difficulty up after right answers and down after wrong ones, within 1–3', () => {
    expect(nextDifficulty(2, true)).toBe(3);
    expect(nextDifficulty(3, true)).toBe(3);
    expect(nextDifficulty(2, false)).toBe(1);
    expect(nextDifficulty(1, false)).toBe(1);
  });

  it('maps all-wrong to 200 and all-right-at-the-top to 300', () => {
    const wrong = Array.from({ length: 20 }, () => ({ correct: false, difficulty: 1 as const }));
    expect(estimateScore(wrong).estimate).toBe(200);
    const right = [{ correct: true, difficulty: 2 as const }, ...Array.from({ length: 19 }, () => ({ correct: true, difficulty: 3 as const }))];
    expect(estimateScore(right).estimate).toBe(300);
    expect(estimateScore(right).high).toBe(300);
  });
});
