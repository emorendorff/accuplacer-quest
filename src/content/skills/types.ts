import type { Generator, SkillId } from '../../engine/question';

export interface LessonSection {
  heading: string;
  /** MathText: prose with $inline math$, **bold**, *italic*, blank-line paragraphs. */
  body: string;
}

export interface Skill {
  id: SkillId;
  /** 1 = Arithmetic, 2 = Quantitative Reasoning, Algebra & Statistics. */
  act: 1 | 2;
  name: string;
  /** In-world name for the evidence board. */
  caseName: string;
  summary: string;
  prereqs: SkillId[];
  /** Position on the evidence board, in percent of the board's width/height. */
  board: { x: number; y: number };
  lesson?: LessonSection[];
  generate?: Generator;
}
