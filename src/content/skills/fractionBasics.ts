import { frac, gcd, raw, tex, value, type Frac } from '../../engine/fraction';
import { buildQuestion, nearMisses, type Generator, type Option } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Skill } from './types';

const F = (f: Frac, asMixed = false) => `$${tex(f, asMixed)}$`;
const opt = (f: Frac, why: string, trap?: string, asMixed = false): Option => ({ text: F(f, asMixed), value: value(f), why, trap });

/** A proper fraction a/b in lowest terms with b in [minD, maxD]. */
function properFraction(rng: Rng, minD: number, maxD: number): Frac {
  for (;;) {
    const d = rng.int(minD, maxD);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return { n, d };
  }
}

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['simplify', 'missing']) : difficulty === 2 ? rng.pick(['greatest', 'toMixed']) : rng.pick(['toImproper', 'order']);

  if (variant === 'simplify') {
    const { n: a, d: b } = properFraction(rng, 3, 9);
    const g = rng.int(2, 6);
    const n = a * g, d = b * g;
    return buildQuestion(rng, {
      skillId: 'fraction-basics', difficulty,
      prompt: `Which fraction is $\\frac{${n}}{${d}}$ written in lowest terms?`,
      answer: opt(frac(a, b), `Right. Both ${n} and ${d} divide evenly by ${g}: $\\frac{${n} \\div ${g}}{${d} \\div ${g}} = \\frac{${a}}{${b}}$.`),
      distractors: [
        opt(raw(b, a), `That's the fraction flipped upside down. Simplifying never swaps top and bottom.`, 'Flipped the fraction'),
        opt(raw(a, d - n + a), `It looks like you *subtracted* the same number from top and bottom. Subtracting changes the fraction's value; only dividing (or multiplying) both by the same number keeps it equal.`, 'Subtracted instead of divided'),
        opt(raw(a, d), `You divided the top by ${g} but left the bottom alone. Whatever you do to the top, you must do to the bottom.`, 'Changed only one part'),
        opt(raw(a + 1, b), `Close, but not equal. Check: does ${g} go into both numbers exactly?`),
        opt(raw(a, b + 1), `Close, but not equal. Check: does ${g} go into both numbers exactly?`),
      ],
      hints: ['Find a number that divides evenly into both the top and the bottom.', `Try ${g}. What's ${n} ÷ ${g}, and ${d} ÷ ${g}?`],
      steps: [`The biggest number that divides both ${n} and ${d} is ${g}.`, `$${n} \\div ${g} = ${a}$ and $${d} \\div ${g} = ${b}$.`, `So $\\frac{${n}}{${d}} = \\frac{${a}}{${b}}$.`],
    });
  }

  if (variant === 'missing') {
    const { n: a, d: b } = properFraction(rng, 2, 9);
    const k = rng.int(2, 8);
    const ans = a * k;
    const N = (x: number) => `$${x}$`;
    return buildQuestion(rng, {
      skillId: 'fraction-basics', difficulty,
      prompt: `What number goes in the box? $\\dfrac{${a}}{${b}} = \\dfrac{\\square}{${b * k}}$`,
      answer: { text: N(ans), value: ans, why: `Right. The bottom went from ${b} to ${b * k}, which is $\\times ${k}$. Do the same to the top: $${a} \\times ${k} = ${ans}$.` },
      distractors: [
        { text: N(a + b * k - b), value: a + b * k - b, trap: 'Added instead of multiplied', why: `You *added* ${b * k - b} to the top because the bottom grew by ${b * k - b}. But the bottom grew by being *multiplied* by ${k}, so the top must be multiplied by ${k} too.` },
        { text: N(k), value: k, trap: 'Gave the multiplier', why: `${k} is the multiplier, which is the right idea, but you still need to apply it to the top: $${a} \\times ${k}$.` },
        { text: N(a * b), value: a * b, trap: 'Multiplied by the wrong number', why: `You multiplied the top by ${b}. The number to multiply by is however many times bigger the new bottom is: $${b * k} \\div ${b} = ${k}$.` },
        ...nearMisses(ans, N),
      ],
      hints: ['How did the bottom number get from the left fraction to the right one?', `$${b} \\times ? = ${b * k}$. Do the same thing to the top.`],
      steps: [`$${b * k} \\div ${b} = ${k}$, so the bottom was multiplied by ${k}.`, `Multiply the top by the same amount: $${a} \\times ${k} = ${ans}$.`],
    });
  }

  if (variant === 'greatest') {
    // Four fractions where the biggest denominator and the biggest numerator are both *not* the answer.
    for (;;) {
      const fs: Frac[] = [];
      while (fs.length < 4) {
        const f = properFraction(rng, 3, 12);
        if (!fs.some((g) => value(g) === value(f))) fs.push(f);
      }
      const best = fs.reduce((x, y) => (value(y) > value(x) ? y : x));
      const maxD = Math.max(...fs.map((f) => f.d));
      const maxN = Math.max(...fs.map((f) => f.n));
      if (best.d === maxD || best.n === maxN) continue;
      const others = fs.filter((f) => f !== best);
      return buildQuestion(rng, {
        skillId: 'fraction-basics', difficulty,
        prompt: 'Which of these fractions is the greatest?',
        answer: opt(best, `Right. As decimals: ${fs.map((f) => `$${tex(f)} \\approx ${value(f).toFixed(2)}$`).join(', ')}.`),
        distractors: others.map((f) => {
          if (f.d === maxD) return opt(f, `It has the biggest bottom number, but a bigger bottom means the whole is cut into *more* pieces, so each piece is *smaller*. $${tex(f)} \\approx ${value(f).toFixed(2)}$.`, 'Bigger bottom = bigger fraction');
          if (f.n === maxN) return opt(f, `It has the biggest top number, but the top only counts pieces. If the pieces are tiny, many of them can still add up to less. $${tex(f)} \\approx ${value(f).toFixed(2)}$.`, 'Bigger top = bigger fraction');
          return opt(f, `$${tex(f)} \\approx ${value(f).toFixed(2)}$, which isn't the biggest. Convert each to a decimal (top ÷ bottom) to compare.`, 'Compared by eye');
        }),
        hints: ['Neither the top number nor the bottom number alone tells you the size.', 'Turn each fraction into a decimal: divide top by bottom. Or ask how close each one is to 1.'],
        steps: [...fs.map((f) => `$${tex(f)} = ${f.n} \\div ${f.d} \\approx ${value(f).toFixed(3)}$`), `The greatest is $${tex(best)}$.`],
        calculator: true,
      });
    }
  }

  if (variant === 'toMixed') {
    // Remainder coprime to d so the answer keeps d as its denominator; q < d keeps the swap distractor sensible.
    const d = rng.int(3, 9), q = rng.int(1, Math.min(6, d - 1));
    let r = rng.int(1, d - 1);
    while (gcd(r, d) !== 1) r = rng.int(1, d - 1);
    const n = q * d + r;
    return buildQuestion(rng, {
      skillId: 'fraction-basics', difficulty,
      prompt: `Which mixed number is equal to $\\frac{${n}}{${d}}$?`,
      answer: opt(frac(n, d), `Right. ${d} goes into ${n} ${q} whole time${q > 1 ? 's' : ''} ($${q * d}$), with ${r} left over: $${q}\\tfrac{${r}}{${d}}$.`, undefined, true),
      distractors: [
        { text: `$${r}\\tfrac{${q}}{${d}}$`, value: r + q / d, trap: 'Swapped whole and remainder', why: `The whole number and the remainder are swapped. The *number of times* ${d} fits into ${n} (${q}) is the whole part; the *leftover* (${r}) goes on top.` },
        { text: `$${q}\\tfrac{${r}}{${n}}$`, value: q + r / n, trap: 'Changed the denominator', why: `The bottom number stays ${d}: you're still counting pieces of size $\\frac{1}{${d}}$.` },
        { text: `$${q + 1}\\tfrac{${r}}{${d}}$`, value: q + 1 + r / d, trap: 'Miscounted the wholes', why: `Count again: $${q + 1} \\times ${d} = ${(q + 1) * d}$, which is more than ${n}. ${d} only fits ${q} times.` },
        { text: `$${q}\\tfrac{${d - r}}{${d}}$`, value: q + (d - r) / d, trap: 'Used the gap instead of the remainder', why: `${d - r} is how far ${n} is from the *next* multiple of ${d}. You want what's left *over*: $${n} - ${q * d} = ${r}$.` },
      ],
      hints: [`How many whole times does ${d} fit into ${n}?`, `$${q} \\times ${d} = ${q * d}$. What's left over?`],
      steps: [`$${n} \\div ${d} = ${q}$ remainder ${r}.`, `The ${q} is the whole number; the remainder ${r} sits over the original bottom, ${d}.`, `$\\frac{${n}}{${d}} = ${q}\\tfrac{${r}}{${d}}$`],
    });
  }

  if (variant === 'toImproper') {
    const d = rng.int(3, 9), w = rng.int(2, 9);
    let n = rng.int(1, d - 1);
    while (gcd(n, d) !== 1) n = rng.int(1, d - 1);
    const top = w * d + n;
    return buildQuestion(rng, {
      skillId: 'fraction-basics', difficulty,
      prompt: `Write $${w}\\tfrac{${n}}{${d}}$ as an improper fraction.`,
      answer: opt(raw(top, d), `Right. ${w} wholes is $${w} \\times ${d} = ${w * d}$ pieces of size $\\frac{1}{${d}}$, plus ${n} more: $${top}$ pieces.`),
      distractors: [
        opt(raw(w + n, d), `You added the ${w} straight onto the top. But ${w} *wholes* is ${w * d} pieces of size $\\frac{1}{${d}}$, not ${w} pieces.`, 'Added the whole to the top'),
        opt(raw(w * n + d, d), `You multiplied the whole by the *top* number. Multiply by the *bottom* (how many pieces make one whole), then add the top.`, 'Multiplied the wrong pair'),
        opt(raw(w * d - n, d), `You subtracted the ${n}. The fraction part adds onto the wholes: $${w * d} + ${n}$.`, 'Subtracted instead of added'),
        opt(raw(w * d + n, w * d), `The bottom stays ${d}: the pieces are still $\\frac{1}{${d}}$ size.`, 'Changed the denominator'),
      ],
      hints: [`How many $\\frac{1}{${d}}$ pieces are in one whole?`, `${w} wholes is $${w} \\times ${d}$ pieces. Add the ${n} extra pieces.`],
      steps: [`Wholes into pieces: $${w} \\times ${d} = ${w * d}$.`, `Add the extra pieces: $${w * d} + ${n} = ${top}$.`, `Keep the bottom: $\\frac{${top}}{${d}}$.`],
    });
  }

  // order: three fractions, least to greatest.
  for (;;) {
    const fs: Frac[] = [];
    while (fs.length < 3) {
      const f = properFraction(rng, 3, 10);
      if (!fs.some((g) => value(g) === value(f))) fs.push(f);
    }
    const sorted = [...fs].sort((x, y) => value(x) - value(y));
    const byDenom = [...fs].sort((x, y) => x.d - y.d || x.n - y.n);
    const byNum = [...fs].sort((x, y) => x.n - y.n || x.d - y.d);
    const list = (xs: Frac[]) => xs.map((f) => `$${tex(f)}$`).join(', ');
    const key = (xs: Frac[]) => xs.map((f) => `${f.n}/${f.d}`).join(',');
    // Need the misconception orderings to differ from the right one.
    if (key(byDenom) === key(sorted) && key(byNum) === key(sorted)) continue;
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => sorted[i]));
    const generic = 'Convert each fraction to a decimal (top ÷ bottom) and line them up.';
    return buildQuestion(rng, {
      skillId: 'fraction-basics', difficulty,
      prompt: 'Which list puts these fractions in order from **least to greatest**?',
      answer: { text: list(sorted), why: `Right. ${sorted.map((f) => `$${tex(f)} \\approx ${value(f).toFixed(2)}$`).join(' < ')}.` },
      distractors: [
        { text: list(byNum), trap: 'Bigger top = bigger fraction', why: `That's sorted by the top numbers alone. The top only counts pieces; the bottom decides how big they are.` },
        { text: list(byDenom), trap: 'Bigger bottom = bigger fraction', why: `That's sorted by the bottom numbers. A bigger bottom means *smaller* pieces, so it doesn't mean a bigger fraction.` },
        { text: list([...sorted].reverse()), trap: 'Reversed the order', why: `Right values, wrong direction: that's greatest to least.` },
        ...perms.slice(1).map((p) => ({ text: list(p), why: generic })),
      ],
      hints: ['Compare sizes, not digits.', 'Divide top by bottom for each, then order the decimals.'],
      steps: [...fs.map((f) => `$${tex(f)} \\approx ${value(f).toFixed(3)}$`), `Least to greatest: ${list(sorted)}.`],
      calculator: true,
    });
  }
};

export const fractionBasics: Skill = {
  id: 'fraction-basics',
  act: 1,
  name: 'What Fractions Mean',
  caseName: 'The Will',
  summary: 'Simplifying, equivalent fractions, mixed numbers, and comparing sizes.',
  prereqs: ['whole-numbers'],
  board: { x: 32, y: 28 },
  generate,
  lesson: [
    {
      heading: 'A fraction is a tiny sentence',
      body: `$\\frac{3}{8}$ says: **cut one whole into 8 equal pieces, and take 3 of them.**

The bottom (the *denominator*) names the size of the pieces: "eighths." The top (the *numerator*) counts how many you have. So $\\frac{3}{8}$ literally reads "three eighths," the same way "three dollars" is a count and a unit.

Hold onto that: **bottom = size of the piece, top = how many pieces.** Nearly every fraction rule falls out of it.`,
    },
    {
      heading: 'Bigger bottom, smaller pieces',
      body: `This is the one that trips people. Is $\\frac{1}{8}$ bigger than $\\frac{1}{5}$? Eight is bigger than five, so it *feels* bigger.

But think of a pie cut for 8 people vs. a pie cut for 5. You want to be at the table of 5. **More pieces means smaller pieces.**

To compare fractions honestly, turn them into decimals (top ÷ bottom): $\\frac{3}{8} = 0.375$ and $\\frac{2}{5} = 0.4$. Now it's obvious: $\\frac{2}{5}$ is bigger, even though both its numbers are smaller.`,
    },
    {
      heading: 'Equivalent fractions: same amount, different wording',
      body: `$\\frac{1}{2}$, $\\frac{2}{4}$ and $\\frac{4}{8}$ are the same amount described in different units, like "half a dollar," "two quarters" and "fifty cents."

The rule: **multiply or divide the top and bottom by the same number** and the value doesn't change. That's really multiplying by $\\frac{2}{2}$ or $\\frac{3}{3}$, which is just $1$ in disguise.

*Simplifying* (or "lowest terms") means dividing both by the biggest number that goes into both: $\\frac{12}{30}$, divide both by 6, gives $\\frac{2}{5}$.

⚠ **Adding or subtracting** the same number from top and bottom does *not* keep the value. $\\frac{1}{2}$ plus 1 on both is $\\frac{2}{3}$, which is a different amount.`,
    },
    {
      heading: 'Mixed numbers and improper fractions',
      body: `$2\\tfrac{3}{4}$ means 2 wholes and 3 quarters. To write it as just quarters: each whole is 4 quarters, so 2 wholes is $8$ quarters, plus 3 more is $\\frac{11}{4}$.

**Mixed → improper:** (whole × bottom) + top, all over the same bottom.

**Improper → mixed:** divide. $\\frac{17}{5}$: 5 goes into 17 three times (15), with 2 left over, so $3\\tfrac{2}{5}$.`,
    },
    {
      heading: 'Traps the test sets',
      body: `- Picking the fraction with the biggest bottom (or biggest top) as "biggest."
- Subtracting from top and bottom to "simplify."
- Turning $2\\tfrac{3}{4}$ into $\\frac{5}{4}$ by adding the 2 straight onto the top.
- Swapping the whole number and the remainder: $\\frac{17}{5}$ is $3\\tfrac{2}{5}$, **not** $2\\tfrac{3}{5}$.`,
    },
  ],
};
