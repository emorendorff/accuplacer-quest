import { useMemo, useState } from 'react';
import { estimateScore, nextDifficulty, planSkills, START_DIFFICULTY, TEST_LENGTH } from '../engine/mockTest';
import { generateFresh, type Difficulty, type Question, type SkillId } from '../engine/question';
import { createRng } from '../engine/rng';
import { isPlayable, SKILLS, skillById } from '../content/skills';
import { useStore } from '../state/store';
import { MathText } from './MathText';
import { QuestionCard, type AnswerResult } from './QuestionCard';

interface Answered {
  question: Question;
  picked: number;
  correct: boolean;
}

const TEST_SKILLS = SKILLS.filter((s) => s.act === 1 && isPlayable(s)).map((s) => s.id);

export function MockTest({ onExit, onPractice }: { onExit: () => void; onPractice: (id: SkillId) => void }) {
  const store = useStore();
  const rng = useMemo(() => createRng(), []);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [plan, setPlan] = useState<SkillId[]>([]);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(START_DIFFICULTY);

  const start = () => {
    const p = planSkills(rng, TEST_SKILLS);
    setPlan(p);
    setAnswers([]);
    setDifficulty(START_DIFFICULTY);
    setQuestion(generateFresh(skillById[p[0]].generate!, rng, START_DIFFICULTY));
    setPhase('running');
  };

  // In test mode the card moves straight on after the answer, so everything happens here.
  const onAnswer = (r: AnswerResult) => {
    if (!question) return;
    store.recordAnswer(question.skillId, { correct: r.correct, difficulty: question.difficulty, hintsUsed: 0, trap: r.trap });
    const next = [...answers, { question, picked: r.choice, correct: r.correct }];
    setAnswers(next);
    if (next.length >= TEST_LENGTH) {
      const { estimate } = estimateScore(next.map((a) => ({ correct: a.correct, difficulty: a.question.difficulty })));
      store.addMockTest({ at: Date.now(), correct: next.filter((a) => a.correct).length, total: TEST_LENGTH, estimate });
      setPhase('done');
      window.scrollTo(0, 0);
      return;
    }
    const d = nextDifficulty(difficulty, r.correct);
    setDifficulty(d);
    setQuestion(generateFresh(skillById[plan[next.length]].generate!, rng, d, question));
  };

  if (phase === 'intro') {
    const past = store.save.mockTests;
    return (
      <div className="panel exam">
        <button className="link" onClick={onExit}>← Back to your desk</button>
        <div className="kicker">The exam room</div>
        <h2>Practice test: Arithmetic</h2>
        <p>This works like the real Accuplacer, so you'll know what test day feels like:</p>
        <ul>
          <li><strong>{TEST_LENGTH} questions</strong>, four choices each, covering every Arithmetic skill.</li>
          <li><strong>Adaptive:</strong> get one right and the next is harder; miss one and it eases off. Hard questions mean you're doing <em>well</em>.</li>
          <li><strong>No hints, no feedback</strong>, and no going back. You'll see every explanation at the end.</li>
          <li><strong>Untimed.</strong> Use scratch paper. Rewrite each step. The calculator badge tells you whether the real test would give you one.</li>
        </ul>
        {past.length > 0 && (
          <p className="muted small">Previous attempts: {past.slice(-5).map((t) => `${t.estimate} (${t.correct}/${t.total})`).join(' · ')}</p>
        )}
        <div className="row">
          <button className="btn primary" onClick={start}>Begin the test</button>
        </div>
      </div>
    );
  }

  if (phase === 'running' && question) {
    const n = answers.length + 1;
    return (
      <div className="panel exam">
        <div className="session-head">
          <button className="link" onClick={() => window.confirm('Leave the test? This attempt won\'t be scored.') && onExit()}>← Leave</button>
          <div className="kicker">Question {n} of {TEST_LENGTH}</div>
        </div>
        <div className="exam-progress"><div style={{ width: `${(answers.length / TEST_LENGTH) * 100}%` }} /></div>
        <QuestionCard key={n} question={question} mode="test" onFirstAnswer={onAnswer} onDone={() => {}} />
      </div>
    );
  }

  return <Results answers={answers} onExit={onExit} onRetake={start} onPractice={onPractice} />;
}

function Results({ answers, onExit, onRetake, onPractice }: { answers: Answered[]; onExit: () => void; onRetake: () => void; onPractice: (id: SkillId) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const correct = answers.filter((a) => a.correct).length;
  const { low, high } = estimateScore(answers.map((a) => ({ correct: a.correct, difficulty: a.question.difficulty })));
  const bySkill = TEST_SKILLS.map((id) => {
    const mine = answers.filter((a) => a.question.skillId === id);
    return { id, right: mine.filter((a) => a.correct).length, total: mine.length };
  }).filter((s) => s.total > 0);
  const weakest = [...bySkill].sort((a, b) => a.right / a.total - b.right / b.total)[0];
  const hardRight = answers.filter((a) => a.correct && a.question.difficulty === 3).length;

  return (
    <div className="panel exam">
      <div className="kicker">Practice test: results</div>
      <h2>{correct} of {answers.length} correct</h2>

      <div className="score-band">
        <div className="score-number">{low}–{high}</div>
        <div>
          <div><strong>Rough practice estimate</strong> on the 200–300 scale.</div>
          <div className="muted small">
            This game isn't calibrated against real Accuplacer scoring, so treat it as a trend line, not a prediction. Watch whether it climbs over time.
            Each college sets its own cutoff; ask your testing office for theirs.
          </div>
        </div>
      </div>

      <h3>The path you took</h3>
      <div className="path" aria-label="Difficulty of each question; green is right, red is wrong">
        {answers.map((a, i) => (
          <button
            key={i}
            className={`path-bar ${a.correct ? 'right' : 'wrong'}`}
            style={{ height: `${a.question.difficulty * 22}px` }}
            title={`Q${i + 1}: ${['', 'easy', 'medium', 'hard'][a.question.difficulty]}, ${a.correct ? 'right' : 'wrong'}`}
            onClick={() => {
              setOpen(i);
              requestAnimationFrame(() => document.getElementById(`review-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }}
          />
        ))}
      </div>
      <p className="muted small">Taller bars are harder questions. You answered {hardRight} hard question{hardRight === 1 ? '' : 's'} correctly. Click a bar to review that question.</p>

      <h3>By skill</h3>
      <div className="skill-table">
        {bySkill.map((s) => (
          <div key={s.id} className="skill-row">
            <span>{skillById[s.id].name}</span>
            <span className={s.right === s.total ? 'good' : s.right === 0 ? 'bad' : ''}>{s.right} / {s.total}</span>
          </div>
        ))}
      </div>

      <h3>Review every question</h3>
      <div className="review-list">
        {answers.map((a, i) => {
          const right = a.question.choices.find((c) => c.correct)!;
          const mine = a.question.choices[a.picked];
          return (
            <div key={i} id={`review-${i}`} className={`review-item ${a.correct ? 'right' : 'wrong'}`}>
              <button className="review-head" onClick={() => setOpen(open === i ? null : i)}>
                <span className="review-mark">{a.correct ? '✓' : '✗'}</span>
                <span className="review-q">Q{i + 1} · {skillById[a.question.skillId].name}</span>
                <span className="muted small">{open === i ? 'hide' : 'show'}</span>
              </button>
              {open === i && (
                <div className="review-body">
                  <MathText text={a.question.prompt} />
                  {!a.correct && mine && (
                    <div className="feedback feedback-wrong">
                      <div className="feedback-title">You chose <MathText text={mine.text} inline /></div>
                      <MathText text={mine.why} />
                      {mine.trap && <div className="trap-tag">Trap: {mine.trap}</div>}
                    </div>
                  )}
                  <div className="feedback feedback-right">
                    <div className="feedback-title">Answer: <MathText text={right.text} inline /></div>
                    <ol className="steps">{a.question.steps.map((s, j) => <li key={j}><MathText text={s} inline /></li>)}</ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="row">
        <button className="btn ghost" onClick={onExit}>Back to your desk</button>
        {weakest && weakest.right < weakest.total && (
          <button className="btn" onClick={() => onPractice(weakest.id)}>Practice {skillById[weakest.id].name}</button>
        )}
        <button className="btn primary" onClick={onRetake}>Take another test</button>
      </div>
    </div>
  );
}
