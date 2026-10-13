import { describe, expect, it } from 'vitest';
import { buildQuestion } from '../../engine/question';
import { createRng } from '../../engine/rng';
import { isPlayable, skillById } from '../skills';
import { CHAPTERS, CHARACTERS } from './index';
import type { Beat } from './types';

/** Every unescaped $ must be paired. Escaped \$ is a literal dollar sign. */
const balanced = (s: string) => s.replace(/\\\$/g, '').replace(/\$\$/g, '').split('$').length % 2 === 1;

/** Italic *markers* can't span math, so outside of math they must pair up within each text run. */
const italicsPair = (s: string) =>
  s.replace(/\\\$/g, '').split('$').filter((_, i) => i % 2 === 0)
    .every((run) => (run.replace(/\*\*/g, '').match(/\*/g) ?? []).length % 2 === 0);

function texts(beat: Beat): string[] {
  switch (beat.type) {
    case 'scene': return [beat.title, beat.place];
    case 'narration': case 'document': case 'line': case 'notebook': case 'drill': return [beat.text];
    case 'clue': return [beat.title, beat.text];
    case 'deduction': return [beat.prompt, ...beat.options.flatMap((o) => [o.label, o.response])];
    case 'puzzle': {
      const p = beat.puzzle;
      return [p.prompt, p.answer.text, p.answer.why, ...p.distractors.flatMap((d) => [d.text, d.why]), ...p.hints, ...p.steps];
    }
    case 'unlock': case 'break': return [];
  }
}

describe.each(CHAPTERS.map((c) => [c.id, c] as const))('chapter %s', (_id, chapter) => {
  it('has balanced math in every piece of text', () => {
    for (const beat of chapter.beats) for (const t of texts(beat)) expect(balanced(t), t).toBe(true);
  });

  it('never wraps italics around math', () => {
    for (const beat of chapter.beats) for (const t of texts(beat)) expect(italicsPair(t), t).toBe(true);
  });

  it('has puzzles with exactly one right answer and three distinct wrong ones', () => {
    for (const beat of chapter.beats) {
      if (beat.type !== 'puzzle') continue;
      const q = buildQuestion(createRng(1), { ...beat.puzzle, difficulty: 1 });
      expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
      expect(new Set(q.choices.map((c) => c.text)).size).toBe(4);
    }
  });

  it('only references real characters and playable skills', () => {
    for (const beat of chapter.beats) {
      if (beat.type === 'line') expect(CHARACTERS[beat.who]).toBeDefined();
      if (beat.type === 'drill' || beat.type === 'notebook') expect(isPlayable(skillById[beat.skillId])).toBe(true);
      if (beat.type === 'deduction') expect(beat.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
});

it('clue ids are unique across the whole story', () => {
  const ids = CHAPTERS.flatMap((c) => c.beats.flatMap((b) => (b.type === 'clue' ? [b.id] : [])));
  expect(new Set(ids).size).toBe(ids.length);
});
