import { useEffect, useState } from 'react';
import type { Question } from '../engine/question';
import { MathText } from './MathText';

export interface AnswerResult {
  correct: boolean;
  hintsUsed: number;
  trap?: string;
}

interface Props {
  question: Question;
  /** practice: one shot, then the answer is revealed. story: wrong answers can be retried. */
  mode: 'practice' | 'story';
  /** Called once, for the first attempt only. That's what counts toward mastery. */
  onFirstAnswer: (r: AnswerResult) => void;
  onDone: () => void;
  doneLabel?: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionCard({ question, mode, onFirstAnswer, onDone, doneLabel = 'Next' }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // Reset when a new question arrives.
  useEffect(() => {
    setSelected(null);
    setSubmitted(null);
    setEliminated([]);
    setHints(0);
    setRecorded(false);
    setShowSteps(false);
  }, [question]);

  const sub = submitted !== null ? question.choices[submitted] : null;
  const finished = sub !== null && (sub.correct || mode === 'practice');
  const retrying = sub !== null && !sub.correct && mode === 'story';

  const submit = () => {
    if (selected === null || submitted !== null) return;
    const choice = question.choices[selected];
    setSubmitted(selected);
    if (!recorded) {
      setRecorded(true);
      onFirstAnswer({ correct: choice.correct, hintsUsed: hints, trap: choice.trap });
    }
    if (!choice.correct && mode === 'practice') setShowSteps(true);
  };

  const retry = () => {
    if (submitted !== null) setEliminated((e) => [...e, submitted]);
    setSubmitted(null);
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? ['1', '2', '3', '4'].indexOf(k) : ['a', 'b', 'c', 'd'].indexOf(k);
      if (idx >= 0 && submitted === null && !eliminated.includes(idx)) setSelected(idx);
      else if (k === 'enter') {
        e.preventDefault();
        if (finished) onDone();
        else if (retrying) retry();
        else submit();
      } else if (k === 'h' && submitted === null && hints < question.hints.length) setHints((h) => h + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="question">
      <div className="question-meta">
        <span className={`badge ${question.calculator ? 'badge-calc' : ''}`}>{question.calculator ? 'Calculator allowed' : 'No calculator'}</span>
      </div>
      <div className="question-prompt">
        <MathText text={question.prompt} />
      </div>

      <ol className="choices">
        {question.choices.map((c, i) => {
          const isOut = eliminated.includes(i);
          const state = submitted === null
            ? (selected === i ? 'selected' : '')
            : i === submitted
              ? (c.correct ? 'right' : 'wrong')
              : finished && c.correct ? 'right reveal' : '';
          return (
            <li key={i}>
              <button
                className={`choice ${state} ${isOut ? 'out' : ''}`}
                disabled={submitted !== null || isOut}
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                <span className="choice-text"><MathText text={c.text} inline /></span>
              </button>
            </li>
          );
        })}
      </ol>

      {hints > 0 && submitted === null && (
        <div className="hints">
          {question.hints.slice(0, hints).map((h, i) => (
            <div key={i} className="hint"><span className="hint-label">Hint {i + 1}</span> <MathText text={h} inline /></div>
          ))}
        </div>
      )}

      {sub && (
        <div className={`feedback ${sub.correct ? 'feedback-right' : 'feedback-wrong'}`}>
          <div className="feedback-title">{sub.correct ? 'Correct.' : mode === 'story' ? 'Not quite.' : 'Not this time.'}</div>
          <MathText text={sub.why} />
          {!sub.correct && sub.trap && <div className="trap-tag">Trap: {sub.trap}</div>}
          {!sub.correct && mode === 'practice' && (
            <div className="feedback-answer">
              Answer: <MathText text={question.choices.find((c) => c.correct)!.text} inline />
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="steps-toggle">
          <button className="link" onClick={() => setShowSteps((s) => !s)}>{showSteps ? 'Hide' : 'Show'} the full solution</button>
          {showSteps && (
            <ol className="steps">
              {question.steps.map((s, i) => <li key={i}><MathText text={s} inline /></li>)}
            </ol>
          )}
        </div>
      )}

      <div className="question-actions">
        {submitted === null && (
          <>
            <button className="btn ghost" onClick={() => setHints((h) => h + 1)} disabled={hints >= question.hints.length}>
              {hints >= question.hints.length ? 'No more hints' : hints === 0 ? 'Hint' : 'Another hint'}
            </button>
            <button className="btn primary" onClick={submit} disabled={selected === null}>Lock it in</button>
          </>
        )}
        {retrying && <button className="btn primary" onClick={retry}>Try again</button>}
        {finished && <button className="btn primary" onClick={onDone}>{doneLabel} →</button>}
      </div>
      <div className="kbd-help">Keys: 1–4 to pick · Enter to confirm · H for a hint</div>
    </div>
  );
}
