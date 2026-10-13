import { useState } from 'react';
import { stars } from '../engine/mastery';
import type { SkillId } from '../engine/question';
import { skillById } from '../content/skills';
import { isUnlocked, useStore } from '../state/store';
import { Notebook } from './Notebook';
import { Stars } from './Stars';

const STAR_GOALS = ['Answer easy questions correctly', 'Move on to medium questions', 'Crack the hard ones', 'Cracked'];

export function SkillDetail({ skillId, onBack, onPractice }: { skillId: SkillId; onBack: () => void; onPractice: () => void }) {
  const { save, progress } = useStore();
  const [reading, setReading] = useState(false);
  const skill = skillById[skillId];
  const p = progress(skillId);
  const s = stars(p.mastery);
  const traps = Object.entries(p.traps).sort((a, b) => b[1] - a[1]);
  const missing = skill.prereqs.filter((id) => stars(save.skills[id]?.mastery ?? 0) < 1);

  return (
    <div className="panel skill-detail">
      <button className="link" onClick={onBack}>← Evidence board</button>
      <div className="kicker">{skill.caseName}</div>
      <h2>{skill.name} <Stars count={s} /></h2>
      <p>{skill.summary}</p>

      {!isUnlocked(save, skill) && missing.length > 0 && (
        <p className="warning">Vance recommends earning a star in {missing.map((id) => skillById[id].name).join(' and ')} first. You can still go ahead.</p>
      )}

      <div className="meter" aria-label={`Mastery ${Math.round(p.mastery)} of 100`}>
        <div className="meter-fill" style={{ width: `${p.mastery}%` }} />
        {[30, 60, 90].map((t) => <span key={t} className="meter-tick" style={{ left: `${t}%` }} />)}
      </div>
      <div className="muted small">Mastery {Math.round(p.mastery)}/100 · Next: {STAR_GOALS[s]}</div>

      <div className="row">
        <button className="btn ghost" onClick={() => setReading(true)}>Read Vance's notes</button>
        <button className="btn primary" onClick={onPractice}>Interrogate (8 questions)</button>
      </div>

      <div className="stats">
        <div><strong>{p.attempts}</strong><span>questions answered</span></div>
        <div><strong>{p.attempts ? Math.round((p.correct / p.attempts) * 100) : 0}%</strong><span>correct</span></div>
        <div><strong>{p.dueAt ? new Date(p.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</strong><span>next review</span></div>
      </div>

      {traps.length > 0 && (
        <div className="summary-traps">
          <h3>Your usual traps</h3>
          <ul>{traps.slice(0, 5).map(([t, n]) => <li key={t}>{t} <span className="muted">×{n}</span></li>)}</ul>
        </div>
      )}

      {reading && <Notebook skillId={skillId} onClose={() => setReading(false)} />}
    </div>
  );
}
