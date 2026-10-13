import { isDue, stars } from '../engine/mastery';
import type { SkillId } from '../engine/question';
import { isPlayable, SKILLS, skillById } from '../content/skills';
import { isUnlocked, useStore } from '../state/store';
import { Stars } from './Stars';

// Board coordinates (skill.board) are scaled into pixels here.
const SX = 10, SY = 6.2, PAD = 30;
const W = 1560, H = 640;
const px = (x: number, y: number) => ({ left: x * SX, top: y * SY + PAD });

export function EvidenceBoard({ onOpenSkill, onBack }: { onOpenSkill: (id: SkillId) => void; onBack: () => void }) {
  const { save } = useStore();
  const now = Date.now();

  return (
    <div className="board-page">
      <div className="story-head">
        <button className="link" onClick={onBack}>← Back to your desk</button>
        <div className="kicker">The evidence board</div>
      </div>
      <p className="muted board-intro">Each card is one skill on the test. Red string shows what builds on what. Click a card to read Vance's notes or start an interrogation. Three stars means you've cracked it at the hardest level.</p>

      <div className="board-scroll">
        <div className="board" style={{ width: W, height: H }}>
          <div className="act-label" style={{ left: 20 }}>Act I · Arithmetic</div>
          <div className="act-label" style={{ left: 840 }}>Act II · Quantitative Reasoning, Algebra &amp; Statistics</div>
          <div className="act-divider" style={{ left: 820 }} />

          <svg className="strings" width={W} height={H}>
            {SKILLS.flatMap((s) =>
              s.prereqs.map((p) => {
                const a = px(skillById[p].board.x, skillById[p].board.y);
                const b = px(s.board.x, s.board.y);
                const sealed = !isPlayable(s);
                // A little sag, like real string.
                const mx = (a.left + b.left) / 2, my = (a.top + b.top) / 2 + 18;
                return <path key={`${p}-${s.id}`} d={`M ${a.left} ${a.top} Q ${mx} ${my} ${b.left} ${b.top}`} className={sealed ? 'string sealed' : 'string'} />;
              }),
            )}
          </svg>

          {SKILLS.map((s) => {
            const pos = px(s.board.x, s.board.y);
            const p = save.skills[s.id];
            const playable = isPlayable(s);
            const open = isUnlocked(save, s);
            const due = p && isDue(p, now);
            return (
              <button
                key={s.id}
                className={`card ${playable ? '' : 'sealed'} ${playable && !open ? 'locked' : ''}`}
                style={{ left: pos.left, top: pos.top }}
                onClick={() => playable && onOpenSkill(s.id)}
                disabled={!playable}
                title={playable ? s.summary : 'Sealed: Act 2 is coming soon'}
              >
                <span className="pin" />
                <span className="card-case">{s.caseName}</span>
                <span className="card-name">{s.name}</span>
                {playable ? <Stars count={stars(p?.mastery ?? 0)} /> : <span className="stamp">Sealed</span>}
                {due && <span className="card-due">Cold case: review due</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
