import { describe, expect, it } from 'vitest';
import { generate, type Difficulty } from '../../engine/question';
import { createRng } from '../../engine/rng';
import { isPlayable, SKILLS } from './index';

const RUNS = 400;

describe.each(SKILLS.filter(isPlayable).map((s) => [s.id, s] as const))('%s generator', (_id, skill) => {
  it.each([1, 2, 3] as Difficulty[])('difficulty %i makes well-formed questions', (difficulty) => {
    for (let seed = 1; seed <= RUNS; seed++) {
      const q = generate(skill.generate!, createRng(seed * 7919 + difficulty), difficulty);
      const context = `seed ${seed}: ${q.prompt}\n${q.choices.map((c) => c.text).join(' | ')}`;

      expect(q.choices, context).toHaveLength(4);
      expect(q.choices.filter((c) => c.correct), context).toHaveLength(1);
      expect(new Set(q.choices.map((c) => c.text)).size, context).toBe(4);
      expect(q.steps.length, context).toBeGreaterThan(0);
      expect(q.hints.length, context).toBeGreaterThan(0);

      const all = [q.prompt, ...q.choices.flatMap((c) => [c.text, c.why]), ...q.steps, ...q.hints].join('\n');
      expect(all, context).not.toMatch(/NaN|undefined|Infinity|\[object/);
      // Every $ that opens math must close it (escaped \$ is a literal dollar sign).
      for (const text of [q.prompt, ...q.choices.map((c) => c.text)]) {
        expect(text.replace(/\\\$/g, '').split('$').length % 2, `unbalanced $ in: ${text}`).toBe(1);
      }
    }
  });
});
