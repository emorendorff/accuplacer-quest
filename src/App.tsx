import { useState } from 'react';
import { Casebook } from './components/Casebook';
import { Desk } from './components/Desk';
import { EvidenceBoard } from './components/EvidenceBoard';
import { Intro } from './components/Intro';
import { MockTest } from './components/MockTest';
import { PracticeSession } from './components/PracticeSession';
import { SkillDetail } from './components/SkillDetail';
import { StoryPlayer } from './components/StoryPlayer';
import type { Chapter } from './content/story';
import { skillById } from './content/skills';
import type { SkillId } from './engine/question';
import { useStore } from './state/store';

type Screen =
  | { name: 'desk' }
  | { name: 'story'; chapter: Chapter }
  | { name: 'board' }
  | { name: 'skill'; id: SkillId }
  | { name: 'practice'; ids: SkillId[]; title: string; back: Screen }
  | { name: 'casebook' }
  | { name: 'mock' };

export function App() {
  const { save } = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'desk' });
  const go = (s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  };

  if (!save.name) return <main className="shell"><Intro /></main>;

  return (
    <main className="shell">
      {screen.name === 'desk' && (
        <Desk
          onStory={(chapter) => go({ name: 'story', chapter })}
          onBoard={() => go({ name: 'board' })}
          onReview={(ids) => go({ name: 'practice', ids, title: 'Cold cases', back: { name: 'desk' } })}
          onCasebook={() => go({ name: 'casebook' })}
          onSkill={(id) => go({ name: 'skill', id })}
          onMockTest={() => go({ name: 'mock' })}
        />
      )}
      {screen.name === 'story' && (
        <StoryPlayer key={screen.chapter.id} chapter={screen.chapter} onExit={() => go({ name: 'desk' })} onOpenChapter={(chapter) => go({ name: 'story', chapter })} />
      )}
      {screen.name === 'board' && <EvidenceBoard onBack={() => go({ name: 'desk' })} onOpenSkill={(id) => go({ name: 'skill', id })} />}
      {screen.name === 'skill' && (
        <SkillDetail
          skillId={screen.id}
          onBack={() => go({ name: 'board' })}
          onPractice={() => go({ name: 'practice', ids: [screen.id], title: `Interrogation: ${skillById[screen.id].caseName}`, back: screen })}
        />
      )}
      {screen.name === 'practice' && <PracticeSession title={screen.title} skillIds={screen.ids} length={8} onExit={() => go(screen.back)} />}
      {screen.name === 'casebook' && <Casebook onBack={() => go({ name: 'desk' })} />}
      {screen.name === 'mock' && <MockTest onExit={() => go({ name: 'desk' })} onPractice={(id) => go({ name: 'skill', id })} />}
    </main>
  );
}
