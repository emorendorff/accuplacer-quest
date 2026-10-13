import { useMemo, useState } from 'react';
import { difficultyFor, stars } from '../engine/mastery';
import { generateFresh, type Question, type SkillId } from '../engine/question';
import { createRng } from '../engine/rng';
import { skillById } from '../content/skills';
import { useStore } from '../state/store';
import { QuestionCard, type AnswerResult } from './QuestionCard';
import { Stars } from './Stars';

interface Props {
  title: string;
  skillIds: SkillId[];
  length: number;
  onExit: () => void;
}

interface Result {
  skillId: SkillId;
  correct: boolean;
  trap?: string;
}

export function PracticeSession({ title, skillIds, length, onExit }: Props) {
  const store = useStore();
  const rng = useMemo(() => createRng(), []);
  const [startMastery] = useState(() => Object.fromEntries(skillIds.map((id) => [id, store.progress(id).mastery])));
  const [results, setResults] = useState<Result[]>([]);
  const [run, setRun] = useState(0);

  const makeQuestion = (index: number, previous?: Question): Question => {
    // Interleave skills; mixing topics is harder in the moment but sticks better.
    const id = skillIds[index % skillIds.length];
    return generateFresh(skillById[id].generate!, rng, difficultyFor(store.progress(id).mastery), previous);
  };
  const [question, setQuestion] = useState(() => makeQuestion(0));

  const index = results.length;
  const done = index >= length;

  const onFirstAnswer = (r: AnswerResult) => {
    store.recordAnswer(question.skillId, { correct: r.correct, difficulty: question.difficulty, hintsUsed: r.hintsUsed, trap: r.trap });
    const next = [...results, { skillId: question.skillId, correct: r.correct, trap: r.trap }];
    setResults(next);
    if (next.length >= length) store.finishSession(next);
  };

  const onNext = () => {
    if (index < length) setQuestion(makeQuestion(index, question));
    setRun((n) => n + 1);
  };

  // The last answer has been recorded but its feedback is still on screen until "Finish" is clicked.
  const showingSummary = done && run >= length;

  if (showingSummary) {
    const score = results.filter((r) => r.correct).length;
    const traps = Object.entries(results.reduce<Record<string, number>>((acc, r) => (r.trap ? { ...acc, [r.trap]: (acc[r.trap] ?? 0) + 1 } : acc), {}));
    return (
      <div className="panel summary">
        <div className="kicker">{title}</div>
        <h2>Interrogation over: {score} of {length}</h2>
        <p className="muted">{score === length ? 'Clean sweep. Vance raises an eyebrow, which for her is a standing ovation.' : score >= length * 0.75 ? 'Solid work. The suspects are sweating.' : 'Rough session, and that\'s fine. Every wrong answer told you exactly which trap to watch for.'}</p>
        <div className="summary-skills">
          {skillIds.map((id) => {
            const before = startMastery[id], after = store.progress(id).mastery;
            return (
              <div key={id} className="summary-skill">
                <div>
                  <div className="summary-skill-name">{skillById[id].name}</div>
                  <div className="muted small">Mastery {Math.round(before)} → {Math.round(after)}{stars(after) > stars(before) ? ' · new star!' : ''}</div>
                </div>
                <Stars count={stars(after)} />
              </div>
            );
          })}
        </div>
        {traps.length > 0 && (
          <div className="summary-traps">
            <h3>Traps you stepped in</h3>
            <ul>{traps.map(([t, n]) => <li key={t}>{t}{n > 1 ? ` (×${n})` : ''}</li>)}</ul>
            <p className="muted small">These are the exact mistakes the real test baits. Knowing your usual ones is half the battle.</p>
          </div>
        )}
        <div className="row">
          <button className="btn ghost" onClick={onExit}>Back</button>
          <button className="btn primary" onClick={() => { setResults([]); setRun(0); setQuestion(makeQuestion(0)); }}>Another round</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="session-head">
        <button className="link" onClick={onExit}>← Leave</button>
        <div className="kicker">{title} · {skillById[question.skillId].name}</div>
        <div className="dots" aria-label={`Question ${Math.min(run + 1, length)} of ${length}`}>
          {Array.from({ length }, (_, i) => (
            <span key={i} className={`dot ${i < results.length ? (results[i].correct ? 'dot-right' : 'dot-wrong') : i === run ? 'dot-current' : ''}`} />
          ))}
        </div>
      </div>
      <QuestionCard
        key={run}
        question={question}
        mode="practice"
        onFirstAnswer={onFirstAnswer}
        onDone={onNext}
        doneLabel={index >= length ? 'Finish' : 'Next'}
      />
    </div>
  );
}
