# Numbers Don't Lie

*A Port Halcyon Mystery*: a noir detective game that teaches the math on the **Accuplacer** college placement test.

You're an obituary writer who gave up on math years ago. A homicide detective needs someone who reads carefully, and the dead man's ledger is full of numbers. Every chapter hinges on a piece of math, explained in plain English before you need it. Every wrong answer tells you *which trap* you fell into, and the real test sets the same traps.

## Running it

You need **Node.js 18 or newer**. If you don't have it, install the "LTS" version from [nodejs.org](https://nodejs.org).

```bash
git clone <this repo's URL>
cd accuplacer-quest
npm install
npm run dev
```

The game opens in your browser at http://localhost:5173. To play again later, just `cd` into the folder and run `npm run dev`.

**Your progress is saved in the browser**, so use the same browser each time, and don't clear its site data for `localhost`.

## How to use it

- **The case** (on your desk) is the story. Play it in order; it introduces each skill.
- **Vance's notebook** explains each skill in plain language: why it works, a worked example, and the traps the test sets. It's worth reading slowly.
- **The evidence board** lists every skill. Click one to practice ("interrogate"). Questions get harder as you improve, and stars are never taken away.
- **The exam room** is a full practice test in the real format: 20 adaptive questions across every skill, no hints, no going back, and every answer explained at the end. It gives a *rough* score band on the 200–300 scale. That band isn't calibrated against real Accuplacer scoring, so use it to watch your trend over time.
- **Cold cases** brings back skills you practiced a while ago (after 1 day, then 2, 4, 7, 14, 30) so they're still fresh on test day.
- The **Calculator allowed / No calculator** badge on each question mimics the real test, where the on-screen calculator only appears on some questions.
- Keyboard: `1`–`4` to choose, `Enter` to confirm, `H` for a hint, `Space` to continue the story.

## What's covered

| | Section | Status |
|---|---|---|
| Act I | **Arithmetic**: order of operations, fractions, decimals, percents, comparing & converting | Playable: all 7 skills, story Cases 1–2, practice test |
| Act II | **Quantitative Reasoning, Algebra & Statistics**: ratios, exponents, expressions, linear equations, graphs, statistics, probability, geometry | Coming soon |

## For developers

Vite + React + TypeScript, KaTeX for math. No backend; state lives in `localStorage`.

```
src/
  engine/          question model, fractions, formatting, mastery & spaced review, practice-test logic
  content/skills/  one file per skill: lesson text + question generator
  content/story/   chapters as lists of "beats" (narration, dialogue, puzzles, clues…)
  components/      UI
  state/store.tsx  save data
```

- `npm test` runs the test suite: every generator produces 1,200 well-formed questions (exactly one right answer, four distinct choices, balanced math), and every story puzzle is checked the same way.
- **Adding a skill:** create `src/content/skills/<name>.ts` exporting a `Skill` with a `lesson` and a `generate` function, then register it in `src/content/skills/index.ts`. The Act II skills are already there as "sealed" placeholders.
- **Wrong answers matter most.** Each distractor should be the result of a *specific, common mistake*, with a `why` that explains the mistake and a short `trap` label (these are tallied to show the player their habits).
- **Adding story:** chapters live in `src/content/story/`. Text supports `$math$`, `**bold**`, `*italic*`, and `{name}` for the player's name.
