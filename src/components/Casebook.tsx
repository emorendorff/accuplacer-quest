import { CHAPTERS } from '../content/story';
import { useStore } from '../state/store';
import { MathText } from './MathText';

export function Casebook({ onBack }: { onBack: () => void }) {
  const { save } = useStore();
  const clues = CHAPTERS.flatMap((c) =>
    c.beats.flatMap((b) => (b.type === 'clue' && save.clues.includes(b.id) ? [{ ...b, chapter: c }] : [])),
  );

  return (
    <div className="panel">
      <button className="link" onClick={onBack}>← Back to your desk</button>
      <div className="kicker">Casebook</div>
      <h2>What you know so far</h2>
      {clues.length === 0 && <p className="muted">No clues yet. Open the case file on your desk.</p>}
      <div className="clue-list">
        {clues.map((c) => (
          <div key={c.id} className="beat-clue">
            <div className="clue-label">{c.chapter.caseTitle} · Ch. {c.chapter.number} · {c.title}</div>
            <MathText text={c.text} />
          </div>
        ))}
      </div>
    </div>
  );
}
