import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildQuestion, generate, generateFresh, type Difficulty, type Question } from '../engine/question';
import { difficultyFor } from '../engine/mastery';
import { createRng } from '../engine/rng';
import { skillById } from '../content/skills';
import { CHAPTERS, CHARACTERS, NEXT_CASE_TEASER, type Beat, type Chapter, type Puzzle } from '../content/story';
import { useStore } from '../state/store';
import { MathText } from './MathText';
import { Notebook } from './Notebook';
import { QuestionCard, type AnswerResult } from './QuestionCard';

const INTERACTIVE: Beat['type'][] = ['puzzle', 'drill', 'deduction'];

interface Props {
  chapter: Chapter;
  onExit: () => void;
  onOpenChapter: (c: Chapter) => void;
}

export function StoryPlayer({ chapter, onExit, onOpenChapter }: Props) {
  const store = useStore();
  const [pos, setPos] = useState(() => Math.min(store.save.storyPosition[chapter.id] ?? 0, chapter.beats.length - 1));
  const [notebook, setNotebook] = useState<Beat & { type: 'notebook' } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const vars = { name: store.save.name || 'Writer' };

  const current = chapter.beats[pos];
  const atEnd = pos >= chapter.beats.length - 1;
  const blocking = INTERACTIVE.includes(current.type);

  // Side effects of reaching a beat.
  useEffect(() => {
    store.setStoryPosition(chapter.id, pos);
    if (current.type === 'clue') store.addClue(current.id);
    if (current.type === 'unlock') store.unlock(current.skillIds);
    // Open the notes automatically the first time this beat is reached.
    if (current.type === 'notebook' && pos > (store.save.storyPosition[chapter.id] ?? -1)) {
      setNotebook(current);
    }
    if (atEnd && !blocking) store.completeChapter(chapter.id);
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [pos, chapter.id]);

  const advance = () => setPos((p) => Math.min(p + 1, chapter.beats.length - 1));

  // Space or Enter moves the story along when nothing needs answering.
  useEffect(() => {
    if (blocking || atEnd || notebook) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const nextChapter = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
  const chapterDone = atEnd && !blocking;

  return (
    <div className="story">
      <div className="story-head">
        <button className="link" onClick={onExit}>← Back to your desk</button>
        <div className="kicker">{chapter.caseTitle} · Chapter {chapter.number}</div>
      </div>

      <div className="story-log">
        {chapter.beats.slice(0, pos + 1).map((beat, i) => (
          <BeatView
            key={i}
            beat={beat}
            live={i === pos}
            vars={vars}
            onOpenNotebook={(b) => setNotebook(b)}
            onResolved={advance}
          />
        ))}
      </div>

      {!blocking && !chapterDone && (
        <div className="story-continue">
          <button className="btn primary" onClick={advance}>Continue</button>
          <span className="muted small">or press Space</span>
        </div>
      )}

      {chapterDone && (
        <div className="panel chapter-end">
          <div className="kicker">End of chapter {chapter.number}</div>
          <h2>{chapter.title}: closed</h2>
          {nextChapter ? (
            <>
              <p>Next: <strong>Chapter {nextChapter.number}: {nextChapter.title}</strong>. Before you go on, an interrogation on the evidence board will lock in what you just learned.</p>
              <div className="row">
                <button className="btn ghost" onClick={onExit}>Back to your desk</button>
                <button className="btn primary" onClick={() => onOpenChapter(nextChapter)}>Next chapter →</button>
              </div>
            </>
          ) : (
            <>
              <h3>{NEXT_CASE_TEASER.title}</h3>
              <p>{NEXT_CASE_TEASER.text}</p>
              <button className="btn primary" onClick={onExit}>Back to your desk</button>
            </>
          )}
        </div>
      )}
      <div ref={endRef} />

      {notebook && <Notebook skillId={notebook.skillId} onClose={() => setNotebook(null)} />}
    </div>
  );
}

interface BeatProps {
  beat: Beat;
  live: boolean;
  vars: Record<string, string>;
  onOpenNotebook: (b: Beat & { type: 'notebook' }) => void;
  onResolved: () => void;
}

function BeatView({ beat, live, vars, onOpenNotebook, onResolved }: BeatProps) {
  switch (beat.type) {
    case 'scene':
      return (
        <div className="beat-scene">
          <h2>{beat.title}</h2>
          <div className="place">{beat.place}</div>
        </div>
      );
    case 'narration':
      return <div className="beat-narration"><MathText text={beat.text} vars={vars} /></div>;
    case 'line': {
      const who = CHARACTERS[beat.who];
      return (
        <div className={`beat-line ${beat.who === 'you' ? 'beat-you' : ''}`}>
          <div className="speaker">{beat.who === 'you' ? vars.name : who.name}</div>
          <div className="speech"><MathText text={beat.text} vars={vars} /></div>
        </div>
      );
    }
    case 'notebook':
      return (
        <div className="beat-notebook">
          <span><MathText text={beat.text} vars={vars} inline /></span>
          <button className="btn small" onClick={() => onOpenNotebook(beat)}>Read the notes</button>
        </div>
      );
    case 'clue':
      return (
        <div className="beat-clue">
          <div className="clue-label">New clue · {beat.title}</div>
          <MathText text={beat.text} vars={vars} />
        </div>
      );
    case 'unlock':
      return (
        <div className="beat-unlock">
          New on the evidence board: {beat.skillIds.map((id) => <strong key={id}>{skillById[id].name}</strong>).reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ', ', el] : [el]), [])}
        </div>
      );
    case 'puzzle':
      return live ? <PuzzleBeat puzzle={beat.puzzle} onResolved={onResolved} /> : <SolvedBeat prompt={beat.puzzle.prompt} />;
    case 'drill':
      return live ? <DrillBeat beat={beat} onResolved={onResolved} /> : <SolvedBeat prompt={beat.text} />;
    case 'deduction':
      return <DeductionBeat beat={beat} live={live} onResolved={onResolved} />;
  }
}

function SolvedBeat({ prompt }: { prompt: string }) {
  return (
    <div className="beat-solved">
      <span className="check">✓</span> <MathText text={prompt.split('\n')[0]} inline />
    </div>
  );
}

function puzzleToQuestion(p: Puzzle): Question {
  return buildQuestion(createRng(), { ...p, difficulty: 1 });
}

function PuzzleBeat({ puzzle, onResolved }: { puzzle: Puzzle; onResolved: () => void }) {
  const store = useStore();
  const question = useMemo(() => puzzleToQuestion(puzzle), [puzzle]);
  const onFirstAnswer = (r: AnswerResult) =>
    store.recordAnswer(puzzle.skillId, { correct: r.correct, difficulty: 1, hintsUsed: r.hintsUsed, trap: r.trap });
  return (
    <div className="beat-puzzle">
      <QuestionCard question={question} mode="story" onFirstAnswer={onFirstAnswer} onDone={onResolved} doneLabel="Continue" />
    </div>
  );
}

function DrillBeat({ beat, onResolved }: { beat: Beat & { type: 'drill' }; onResolved: () => void }) {
  const store = useStore();
  const rng = useMemo(() => createRng(), []);
  const pickDifficulty = (): Difficulty => beat.difficulty ?? difficultyFor(store.progress(beat.skillId).mastery);
  const [n, setN] = useState(0);
  const [question, setQuestion] = useState(() => generate(skillById[beat.skillId].generate!, rng, pickDifficulty()));

  const onFirstAnswer = (r: AnswerResult) =>
    store.recordAnswer(beat.skillId, { correct: r.correct, difficulty: question.difficulty, hintsUsed: r.hintsUsed, trap: r.trap });
  const onDone = () => {
    if (n + 1 >= beat.count) return onResolved();
    setN(n + 1);
    setQuestion(generateFresh(skillById[beat.skillId].generate!, rng, pickDifficulty(), question));
  };

  return (
    <div className="beat-puzzle">
      <div className="beat-narration"><MathText text={beat.text} /></div>
      <div className="kicker">Entry {n + 1} of {beat.count}</div>
      <QuestionCard key={n} question={question} mode="story" onFirstAnswer={onFirstAnswer} onDone={onDone} doneLabel={n + 1 >= beat.count ? 'Continue' : 'Next entry'} />
    </div>
  );
}

function DeductionBeat({ beat, live, onResolved }: { beat: Beat & { type: 'deduction' }; live: boolean; onResolved: () => void }) {
  const [tried, setTried] = useState<number[]>([]);
  const solvedIdx = beat.options.findIndex((o) => o.correct);
  const solved = !live || tried.includes(solvedIdx);
  const last = tried[tried.length - 1];
  return (
    <div className="beat-deduction">
      <div className="kicker">Deduction</div>
      <MathText text={beat.prompt} />
      <div className="deduction-options">
        {beat.options.map((o, i) => (
          <button
            key={i}
            className={`choice ${tried.includes(i) ? (o.correct ? 'right' : 'wrong out') : ''} ${!live && o.correct ? 'right' : ''}`}
            disabled={solved || tried.includes(i)}
            onClick={() => setTried((t) => [...t, i])}
          >
            <span className="choice-text">{o.label}</span>
          </button>
        ))}
      </div>
      {live && last !== undefined && (
        <div className={`feedback ${beat.options[last].correct ? 'feedback-right' : 'feedback-wrong'}`}>
          <MathText text={beat.options[last].response} />
        </div>
      )}
      {!live && <div className="feedback feedback-right"><MathText text={beat.options[solvedIdx].response} /></div>}
      {live && solved && <button className="btn primary" onClick={onResolved}>Continue</button>}
    </div>
  );
}
