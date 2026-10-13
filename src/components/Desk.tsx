import { useState } from 'react';
import { CHAPTERS, NEXT_CASE_TEASER, type Chapter } from '../content/story';
import { dueSkills, totalStars, useStore, weakestSkills } from '../state/store';
import type { SkillId } from '../engine/question';

interface Props {
  onStory: (c: Chapter) => void;
  onBoard: () => void;
  onReview: (ids: SkillId[]) => void;
  onCasebook: () => void;
  onSkill: (id: SkillId) => void;
  onMockTest: () => void;
}

export function Desk({ onStory, onBoard, onReview, onCasebook, onSkill, onMockTest }: Props) {
  const store = useStore();
  const { save } = store;
  const [aboutOpen, setAboutOpen] = useState(false);
  const nextChapter = CHAPTERS.find((c) => !save.completedChapters.includes(c.id));
  const due = dueSkills(save);
  const { earned, possible } = totalStars(save);
  const weakest = weakestSkills(save, 1)[0];
  const lastTest = save.mockTests[save.mockTests.length - 1];

  return (
    <div className="desk">
      <header className="masthead">
        <div className="kicker">A Lowcountry Mystery</div>
        <h1>Numbers Don't Lie</h1>
        <div className="muted">{Object.keys(save.skills).length ? 'Welcome back' : 'Welcome'}, {save.name}. {save.streak.days > 1 ? `${save.streak.days}-day streak. Vance is impressed.` : 'The city never sleeps, and neither does crime.'}</div>
      </header>

      <div className="desk-grid">
        <section className="tile tile-story">
          <div className="kicker">The case</div>
          {nextChapter ? (
            <>
              <h2>{nextChapter.caseTitle}</h2>
              <p>Chapter {nextChapter.number}: <strong>{nextChapter.title}</strong></p>
              <button className="btn primary" onClick={() => onStory(nextChapter)}>
                {save.storyPosition[nextChapter.id] ? 'Continue the case' : 'Open the file'} →
              </button>
            </>
          ) : (
            <>
              <h2>{NEXT_CASE_TEASER.title}</h2>
              <p>{NEXT_CASE_TEASER.text}</p>
            </>
          )}
          {save.completedChapters.length > 0 && (
            <div className="chapter-list">
              {CHAPTERS.filter((c) => save.completedChapters.includes(c.id)).map((c) => (
                <button key={c.id} className="link small" onClick={() => onStory(c)}>Reread {c.caseTitle.split(':')[0]}, ch. {c.number}: {c.title}</button>
              ))}
            </div>
          )}
        </section>

        <section className="tile">
          <div className="kicker">Evidence board</div>
          <h2>{earned} <span className="muted">/ {possible} ★</span></h2>
          <p>Every skill on the test, and how well you've cracked each one.</p>
          <button className="btn" onClick={onBoard}>Open the board</button>
        </section>

        <section className="tile">
          <div className="kicker">Cold cases</div>
          <h2>{due.length} <span className="muted">due</span></h2>
          {due.length > 0 ? (
            <>
              <p>Skills you practiced a while ago, due for a refresher before they fade.</p>
              <button className="btn" onClick={() => onReview(due)}>Review now</button>
            </>
          ) : weakest && save.skills[weakest.id] ? (
            <>
              <p>Nothing due. Your shakiest skill is <strong>{weakest.name}</strong>.</p>
              <button className="btn" onClick={() => onSkill(weakest.id)}>Work on it</button>
            </>
          ) : (
            <p>Skills you practice come back here for review on a schedule (1 day, then 2, 4, 7…) so they stick until test day.</p>
          )}
        </section>

        <section className="tile">
          <div className="kicker">The exam room</div>
          {lastTest ? (
            <h2>~{lastTest.estimate} <span className="muted">last practice test</span></h2>
          ) : (
            <h2>20 <span className="muted">questions</span></h2>
          )}
          <p>A full practice test in the real format: adaptive, no hints, every answer explained at the end.</p>
          <button className="btn" onClick={onMockTest}>{lastTest ? 'Take another' : 'Take a practice test'}</button>
        </section>

        <section className="tile">
          <div className="kicker">Casebook</div>
          <h2>{save.clues.length} <span className="muted">clues</span></h2>
          <p>Everything you've uncovered so far.</p>
          <button className="btn" onClick={onCasebook}>Open the casebook</button>
        </section>
      </div>

      <section className="about">
        <button className="link" onClick={() => setAboutOpen((o) => !o)}>{aboutOpen ? '▾' : '▸'} About the real Accuplacer test</button>
        {aboutOpen && (
          <ul>
            <li>Each math section is about 20 multiple-choice questions with four answer choices (A–D), just like here.</li>
            <li>It's <strong>untimed</strong>. Take your time and rewrite each step.</li>
            <li>It's <strong>adaptive</strong>: getting questions right brings harder ones. Don't panic if they get tougher; that means you're doing well.</li>
            <li>An on-screen calculator appears only on <strong>some</strong> questions. The badge on each question here mimics that.</li>
            <li>Scores run from 200 to 300. Each college sets its own cutoff for placing into credit-bearing math. Ask your college's testing office for theirs.</li>
            <li>This game covers <strong>Arithmetic</strong> now; <strong>Quantitative Reasoning, Algebra &amp; Statistics</strong> is Act 2.</li>
          </ul>
        )}
      </section>

      <footer className="desk-footer">
        <button
          className="link small muted"
          onClick={() => window.confirm('Erase all progress and start over? This cannot be undone.') && store.reset()}
        >
          Reset progress
        </button>
      </footer>
    </div>
  );
}
