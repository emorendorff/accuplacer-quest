// Game state, saved to the browser's localStorage after every change.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyAnswer, emptyProgress, isDue, scheduleReview, stars, type AnswerEvent, type SkillProgress } from '../engine/mastery';
import type { SkillId } from '../engine/question';
import { isPlayable, SKILLS, skillById, type Skill } from '../content/skills';

const SAVE_KEY = 'numbers-dont-lie/save-v1';

export interface SaveData {
  version: 1;
  name: string;
  skills: Partial<Record<SkillId, SkillProgress>>;
  /** Chapter id -> index of the furthest beat reached. */
  storyPosition: Record<string, number>;
  completedChapters: string[];
  clues: string[];
  /** Skills opened up by the story, regardless of stars. */
  unlocked: SkillId[];
  streak: { lastDay: string; days: number };
  mockTests: MockTestRecord[];
}

export interface MockTestRecord {
  at: number;
  correct: number;
  total: number;
  estimate: number;
}

const fresh = (): SaveData => ({
  version: 1,
  name: '',
  skills: {},
  storyPosition: {},
  completedChapters: [],
  clues: [],
  unlocked: ['whole-numbers'],
  streak: { lastDay: '', days: 0 },
  mockTests: [],
});

function load(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    // Corrupt or unavailable storage: start over rather than crash.
  }
  return fresh();
}

const dayKey = (t: number) => new Date(t).toLocaleDateString('en-CA');

function bumpStreak(streak: SaveData['streak'], now: number): SaveData['streak'] {
  const today = dayKey(now);
  if (streak.lastDay === today) return streak;
  const yesterday = dayKey(now - 24 * 60 * 60 * 1000);
  return { lastDay: today, days: streak.lastDay === yesterday ? streak.days + 1 : 1 };
}

interface Store {
  save: SaveData;
  progress(id: SkillId): SkillProgress;
  setName(name: string): void;
  recordAnswer(id: SkillId, e: Omit<AnswerEvent, 'now'>): void;
  finishSession(results: { skillId: SkillId; correct: boolean }[]): void;
  setStoryPosition(chapterId: string, beat: number): void;
  completeChapter(chapterId: string): void;
  addClue(id: string): void;
  unlock(ids: SkillId[]): void;
  addMockTest(r: MockTestRecord): void;
  reset(): void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full or blocked; progress just won't persist.
    }
  }, [save]);

  const update = useCallback((fn: (s: SaveData) => SaveData) => setSave(fn), []);

  const store = useMemo<Store>(() => ({
    save,
    progress: (id) => save.skills[id] ?? emptyProgress(),
    setName: (name) => update((s) => ({ ...s, name })),
    recordAnswer: (id, e) => update((s) => {
      const now = Date.now();
      return {
        ...s,
        skills: { ...s.skills, [id]: applyAnswer(s.skills[id] ?? emptyProgress(), { ...e, now }) },
        streak: bumpStreak(s.streak, now),
      };
    }),
    finishSession: (results) => update((s) => {
      const now = Date.now();
      const skills = { ...s.skills };
      for (const id of new Set(results.map((r) => r.skillId))) {
        const mine = results.filter((r) => r.skillId === id);
        const accuracy = mine.filter((r) => r.correct).length / mine.length;
        skills[id] = scheduleReview(skills[id] ?? emptyProgress(), accuracy, now);
      }
      return { ...s, skills };
    }),
    setStoryPosition: (chapterId, beat) => update((s) => ({
      ...s,
      storyPosition: { ...s.storyPosition, [chapterId]: Math.max(beat, s.storyPosition[chapterId] ?? 0) },
    })),
    completeChapter: (chapterId) => update((s) => (s.completedChapters.includes(chapterId) ? s : { ...s, completedChapters: [...s.completedChapters, chapterId] })),
    addClue: (id) => update((s) => (s.clues.includes(id) ? s : { ...s, clues: [...s.clues, id] })),
    unlock: (ids) => update((s) => ({ ...s, unlocked: [...new Set([...s.unlocked, ...ids])] })),
    addMockTest: (r) => update((s) => ({ ...s, mockTests: [...s.mockTests, r] })),
    reset: () => setSave(fresh()),
  }), [save, update]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

// Derived views ---------------------------------------------------------------

export function isUnlocked(save: SaveData, skill: Skill): boolean {
  if (!isPlayable(skill)) return false;
  if (save.unlocked.includes(skill.id)) return true;
  return skill.prereqs.every((p) => stars(save.skills[p]?.mastery ?? 0) >= 1);
}

export function dueSkills(save: SaveData, now = Date.now()): SkillId[] {
  return SKILLS.filter((s) => isPlayable(s) && save.skills[s.id] && isDue(save.skills[s.id]!, now)).map((s) => s.id);
}

export function totalStars(save: SaveData): { earned: number; possible: number } {
  const playable = SKILLS.filter(isPlayable);
  return {
    earned: playable.reduce((n, s) => n + stars(save.skills[s.id]?.mastery ?? 0), 0),
    possible: playable.length * 3,
  };
}

/** The weakest unlocked skills, for a "work on this next" suggestion. */
export function weakestSkills(save: SaveData, count: number): Skill[] {
  return SKILLS.filter((s) => isUnlocked(save, s))
    .sort((a, b) => (save.skills[a.id]?.mastery ?? 0) - (save.skills[b.id]?.mastery ?? 0))
    .slice(0, count);
}

export { skillById };
