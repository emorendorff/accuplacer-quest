import { useEffect } from 'react';
import type { SkillId } from '../engine/question';
import { skillById } from '../content/skills';
import { MathText } from './MathText';

export function Notebook({ skillId, onClose }: { skillId: SkillId; onClose: () => void }) {
  const skill = skillById[skillId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className="notebook" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Notes: ${skill.name}`}>
        <button className="notebook-close" onClick={onClose} aria-label="Close">×</button>
        <div className="notebook-kicker">Vance's notebook · {skill.caseName}</div>
        <h2>{skill.name}</h2>
        {skill.lesson?.map((s) => (
          <section key={s.heading}>
            <h3>{s.heading}</h3>
            <MathText text={s.body} />
          </section>
        ))}
        <button className="btn primary" onClick={onClose}>Close the notebook</button>
      </article>
    </div>
  );
}
