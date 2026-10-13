import { describe, expect, it } from 'vitest';
import { add, div, frac, mul, sub, tex } from './fraction';
import { applyAnswer, emptyProgress, scheduleReview, stars } from './mastery';

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
