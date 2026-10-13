// The question model and the builder every generator uses.
//
// Text fields are "MathText": prose with inline math between $...$ and
// light markdown (**bold**, *italic*, blank-line paragraphs).

import type { Rng } from './rng';

export type SkillId =
  | 'whole-numbers'
  | 'fraction-basics'
  | 'fraction-addsub'
  | 'fraction-muldiv'
  | 'decimals'
  | 'percents'
  | 'number-sense'
  // Act 2: Quantitative Reasoning, Algebra & Statistics.
  | 'signed-numbers'
  | 'ratios'
  | 'exponents'
  | 'expressions'
  | 'linear-equations'
  | 'linear-graphs'
  | 'statistics'
  | 'probability'
  | 'geometry';

export type Difficulty = 1 | 2 | 3;

export interface Choice {
  text: string;
  correct: boolean;
  /** Shown when this choice is picked: why it's right, or why it's tempting but wrong. */
  why: string;
  /** Short label for the mistake behind a wrong choice, tallied per skill. */
  trap?: string;
}

export interface Question {
  skillId: SkillId;
  difficulty: Difficulty;
  prompt: string;
  choices: Choice[];
  /** Progressive nudges; each one reveals a bit more. */
  hints: string[];
  /** Full worked solution, one step per entry. */
  steps: string[];
  /** Whether the real test would likely offer the on-screen calculator. */
  calculator: boolean;
}

export interface Option {
  text: string;
  /** Numeric value, used to catch two choices that look different but are equal. */
  value?: number;
  why: string;
  trap?: string;
}

export interface QuestionSpec {
  skillId: SkillId;
  difficulty: Difficulty;
  prompt: string;
  answer: Option;
  /** Wrong answers in priority order; the first three distinct ones are used. */
  distractors: Option[];
  hints: string[];
  steps: string[];
  calculator?: boolean;
}

export type Generator = (rng: Rng, difficulty: Difficulty) => Question;

const same = (a: Option, b: Option) =>
  a.value !== undefined && b.value !== undefined
    ? Math.abs(a.value - b.value) < 1e-9
    : a.text === b.text;

/** Assemble a four-choice question. Throws if fewer than three distinct distractors. */
export function buildQuestion(rng: Rng, spec: QuestionSpec): Question {
  const picked: Option[] = [];
  for (const d of spec.distractors) {
    if (same(d, spec.answer) || d.text === spec.answer.text) continue;
    if (picked.some((p) => same(p, d) || p.text === d.text)) continue;
    if (d.value !== undefined && !Number.isFinite(d.value)) continue;
    picked.push(d);
    if (picked.length === 3) break;
  }
  if (picked.length < 3) {
    throw new Error(`Not enough distinct distractors for ${spec.skillId}: ${spec.prompt}`);
  }
  const choices: Choice[] = rng.shuffle([
    { text: spec.answer.text, correct: true, why: spec.answer.why },
    ...picked.map((d) => ({ text: d.text, correct: false, why: d.why, trap: d.trap })),
  ]);
  return {
    skillId: spec.skillId,
    difficulty: spec.difficulty,
    prompt: spec.prompt,
    choices,
    hints: spec.hints,
    steps: spec.steps,
    calculator: spec.calculator ?? false,
  };
}

/** Run a generator, retrying if it happened to draw numbers with too few distinct wrong answers. */
export function generate(gen: Generator, rng: Rng, difficulty: Difficulty): Question {
  let lastError: unknown;
  for (let i = 0; i < 50; i++) {
    try {
      return gen(rng, difficulty);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/** Like generate, but tries not to repeat the previous question's template. */
export function generateFresh(gen: Generator, rng: Rng, difficulty: Difficulty, previous?: Question): Question {
  const template = (q: Question) => q.prompt.replace(/[\d.,{}]+/g, '#').slice(0, 40);
  let q = generate(gen, rng, difficulty);
  for (let i = 0; previous && i < 8 && template(q) === template(previous); i++) q = generate(gen, rng, difficulty);
  return q;
}

/** Generic near-miss distractors for numeric answers. */
export function nearMisses(answer: number, format: (x: number) => string): Option[] {
  const why = 'Close, but not it. There is a small slip somewhere: redo the calculation one step at a time.';
  const candidates = [answer + 1, answer - 1, answer * 10, answer + 10, answer / 10, answer - 10, answer + 2];
  return candidates
    .filter((x) => x > 0)
    .map((x) => ({ text: format(x), value: x, why, trap: 'Arithmetic slip' }));
}
