import type { Difficulty, Option, SkillId } from '../../engine/question';

export type CharacterId = 'you' | 'vance' | 'finch' | 'desmond' | 'halloway' | 'crane' | 'lark' | 'weiss';

export interface Puzzle {
  skillId: SkillId;
  prompt: string;
  answer: Option;
  distractors: Option[];
  hints: string[];
  steps: string[];
  calculator?: boolean;
}

/**
 * A story is a list of beats played one at a time. Text fields are MathText,
 * and `{name}` is replaced with the player's name.
 */
export type Beat =
  | { type: 'scene'; title: string; place: string }
  | { type: 'narration'; text: string }
  | { type: 'line'; who: CharacterId; text: string }
  | { type: 'notebook'; skillId: SkillId; text: string }
  | { type: 'puzzle'; puzzle: Puzzle }
  | { type: 'drill'; skillId: SkillId; count: number; difficulty?: Difficulty; text: string }
  | { type: 'clue'; id: string; title: string; text: string }
  | { type: 'deduction'; prompt: string; options: { label: string; correct: boolean; response: string }[] }
  | { type: 'unlock'; skillIds: SkillId[] }
  /** A dramatic pause: the story waits for Continue here. */
  | { type: 'break' };

export interface Chapter {
  id: string;
  caseTitle: string;
  number: number;
  title: string;
  skills: SkillId[];
  beats: Beat[];
}
