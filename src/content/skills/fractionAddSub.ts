import { add, frac, gcd, lcm, raw, sub, tex, value, type Frac } from '../../engine/fraction';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Skill } from './types';

const opt = (f: Frac, why: string, trap?: string, asMixed = false): Option => ({ text: `$${tex(f, asMixed)}$`, value: value(f), why, trap });

function proper(rng: Rng, d: number): Frac {
  for (;;) {
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return { n, d };
  }
}

const RELATED_DENOMS: [number, number][] = [[2, 4], [3, 6], [2, 6], [4, 8], [5, 10], [2, 8], [3, 9], [4, 12]];
const UNRELATED_DENOMS: [number, number][] = [[3, 4], [2, 3], [2, 5], [3, 5], [4, 5], [4, 6], [6, 8], [3, 8], [5, 6], [6, 9]];

const generate: Generator = (rng, difficulty) => {
  if (difficulty === 3) return mixedNumbers(rng);

  const [d1, d2] = rng.shuffle(rng.pick(difficulty === 1 ? RELATED_DENOMS : UNRELATED_DENOMS));
  let a = proper(rng, d1), b = proper(rng, d2);
  const subtracting = rng.chance(0.5);
  if (subtracting && value(a) <= value(b)) [a, b] = [b, a];
  if (subtracting && value(a) === value(b)) return generate(rng, difficulty);
  const ans = subtracting ? sub(a, b) : add(a, b);
  const sym = subtracting ? '-' : '+';
  const L = lcm(a.d, b.d);
  const a2 = a.n * (L / a.d), b2 = b.n * (L / b.d);
  const top = subtracting ? a2 - b2 : a2 + b2;

  return buildQuestion(rng, {
    skillId: 'fraction-addsub', difficulty,
    prompt: `What is $${tex(a)} ${sym} ${tex(b)}$? Give the answer in lowest terms.`,
    answer: opt(ans, `Right. Common bottom ${L}: $\\frac{${a2}}{${L}} ${sym} \\frac{${b2}}{${L}} = \\frac{${top}}{${L}}${frac(top, L).d !== L ? ` = ${tex(ans)}` : ''}$.`),
    distractors: [
      subtracting
        ? opt(raw(Math.abs(a.n - b.n) || 1, Math.abs(a.d - b.d) || 1), `You subtracted the tops and subtracted the bottoms. That's the classic fraction mistake. You can only combine pieces that are the *same size*, so first rewrite both with a common bottom.`, 'Combined tops and bottoms')
        : opt(raw(a.n + b.n, a.d + b.d), `You added the tops and added the bottoms. That's the classic fraction mistake. Check it with something easy: $\\frac{1}{2} + \\frac{1}{2}$ would become $\\frac{2}{4}$, which is still a half. You can only add pieces of the *same size*.`, 'Combined tops and bottoms'),
      opt(raw(top === a.n + b.n ? a.n + b.n + 1 : (subtracting ? Math.abs(a.n - b.n) : a.n + b.n), L), `You found the common bottom (${L}) but didn't scale the tops to match. When the bottom gets multiplied, the top has to be multiplied by the same number.`, 'Changed bottoms but not tops'),
      opt(subtracting ? add(a, b) : sub(a, b).n > 0 ? sub(a, b) : sub(b, a), subtracting ? `That's the sum, not the difference. Check the sign.` : `That's the difference, not the sum. Check the sign.`, 'Wrong operation'),
      opt(raw(top, L * 2), `The common bottom is ${L}, not ${L * 2}. Use the *smallest* number both bottoms divide into.`, 'Wrong common denominator'),
      opt(frac(top + 1, L), `Close. Recheck how you scaled each top to the common bottom.`),
    ],
    hints: [
      'You can only add or subtract pieces that are the same size. What bottom number can both fractions share?',
      `Both ${a.d} and ${b.d} go into ${L}. Rewrite: $${tex(a)} = \\frac{${a2}}{${L}}$ and $${tex(b)} = \\frac{${b2}}{${L}}$.`,
    ],
    steps: [
      `Common denominator: ${L}.`,
      `$${tex(a)} = \\frac{${a2}}{${L}}$ and $${tex(b)} = \\frac{${b2}}{${L}}$.`,
      `$\\frac{${a2}}{${L}} ${sym} \\frac{${b2}}{${L}} = \\frac{${top}}{${L}}$`,
      ...(frac(top, L).d !== L ? [`Simplify: $\\frac{${top}}{${L}} = ${tex(ans)}$`] : []),
    ],
  });
};

function mixedNumbers(rng: Rng) {
  const difficulty = 3 as const;
  const [d1, d2] = rng.shuffle(rng.pick(UNRELATED_DENOMS));
  const f1 = proper(rng, d1), f2 = proper(rng, d2);
  const subtracting = rng.chance(0.6);
  if (value(f1) === value(f2)) return generate(rng, difficulty);
  const show = (w: number, f: Frac) => `${w}\\tfrac{${f.n}}{${f.d}}`;

  if (subtracting) {
    // Make the first fraction part smaller so borrowing is required.
    const [s, l] = value(f1) < value(f2) ? [f1, f2] : [f2, f1];
    const w2 = rng.int(1, 4), w1 = w2 + rng.int(2, 4);
    const A = add(frac(w1), s), B = add(frac(w2), l);
    const ans = sub(A, B);
    const noBorrow = add(frac(w1 - w2), sub(l, s));
    return buildQuestion(rng, {
      skillId: 'fraction-addsub', difficulty,
      prompt: `What is $${show(w1, s)} - ${show(w2, l)}$?`,
      answer: opt(ans, `Right. Since $${tex(s)}$ is smaller than $${tex(l)}$, you have to borrow 1 from the ${w1}. Or convert both to improper fractions first and subtract.`, undefined, true),
      distractors: [
        opt(noBorrow, `You subtracted the fractions the "easy" way round, $${tex(l)} - ${tex(s)}$, because $${tex(s)}$ is smaller. But the problem is $${tex(s)} - ${tex(l)}$, so you need to borrow a whole.`, 'Flipped to avoid borrowing', true),
        opt(add(ans, frac(1)), `You borrowed 1 to do the fraction part, but forgot to take that 1 away from the whole number.`, 'Forgot the borrow', true),
        opt(add(A, B), `That's the sum. This one is subtraction.`, 'Wrong operation', true),
        opt(sub(ans, frac(1)), `Off by one whole. Recheck the whole-number part after borrowing.`, undefined, true),
      ],
      hints: [
        `The fraction part on the left ($${tex(s)}$) is smaller than the one you're subtracting ($${tex(l)}$). What do you have to do?`,
        `Easiest route: turn both into improper fractions, subtract, then convert back.`,
      ],
      steps: [
        `As improper fractions: $${show(w1, s)} = ${tex(A)}$ and $${show(w2, l)} = ${tex(B)}$.`,
        `Common bottom ${lcm(A.d, B.d)}, then subtract: $${tex(A)} - ${tex(B)} = ${tex(ans)}$.`,
        `As a mixed number: $${tex(ans, true)}$.`,
      ],
    });
  }

  const w1 = rng.int(1, 6), w2 = rng.int(1, 6);
  const A = add(frac(w1), f1), B = add(frac(w2), f2);
  const ans = add(A, B);
  return buildQuestion(rng, {
    skillId: 'fraction-addsub', difficulty,
    prompt: `What is $${show(w1, f1)} + ${show(w2, f2)}$?`,
    answer: opt(ans, `Right. Wholes: ${w1 + w2}. Fractions: $${tex(f1)} + ${tex(f2)} = ${tex(add(f1, f2), true)}$. Together: $${tex(ans, true)}$.`, undefined, true),
    distractors: [
      opt(add(frac(w1 + w2), raw(f1.n + f2.n, f1.d + f2.d)), `You added the fraction tops and bottoms straight across. The fractions need a common bottom first.`, 'Combined tops and bottoms', true),
      opt(value(add(f1, f2)) >= 1 ? sub(ans, frac(1)) : add(ans, frac(1)), value(add(f1, f2)) >= 1 ? `The fraction parts add up to more than 1. That extra whole has to be carried over to the whole-number part.` : `Off by one whole. Recheck the whole numbers: $${w1} + ${w2} = ${w1 + w2}$.`, value(add(f1, f2)) >= 1 ? 'Forgot to carry' : undefined, true),
      opt(add(frac(w1 * w2), add(f1, f2)), `You multiplied the whole numbers. Adding mixed numbers means adding the wholes.`, 'Wrong operation', true),
      opt(add(ans, frac(1, lcm(f1.d, f2.d))), `Close. Recheck how you scaled each top to the common bottom.`, undefined, true),
    ],
    hints: ['Add the whole numbers, then add the fractions (with a common bottom).', `If the fractions add to more than 1, carry the extra whole.`],
    steps: [
      `Wholes: $${w1} + ${w2} = ${w1 + w2}$.`,
      `Fractions: $${tex(f1)} + ${tex(f2)} = ${tex(add(f1, f2))}${value(add(f1, f2)) > 1 ? ` = ${tex(add(f1, f2), true)}` : ''}$.`,
      `Total: $${tex(ans, true)}$.`,
    ],
  });
}

export const fractionAddSub: Skill = {
  id: 'fraction-addsub',
  act: 1,
  name: 'Adding & Subtracting Fractions',
  caseName: "The Partners' Shares",
  summary: 'Common denominators, mixed numbers, borrowing and carrying.',
  prereqs: ['fraction-basics'],
  board: { x: 52, y: 14 },
  generate,
  lesson: [
    {
      heading: 'You can only add things measured in the same unit',
      body: `Three feet plus two inches isn't "five feet-inches." You first convert to a shared unit: 36 inches + 2 inches = 38 inches.

Fractions are the same. The bottom number is the **unit** (thirds, quarters, eighths). $\\frac{1}{3} + \\frac{1}{4}$ is "one third plus one quarter," which is two different units. Before adding, rewrite both in a unit they share.`,
    },
    {
      heading: 'Finding the shared unit',
      body: `Find the smallest number both bottoms divide into evenly (the *least common denominator*). For 3 and 4, that's 12.

Then rewrite each fraction in twelfths, using the equivalent-fractions rule (whatever you multiply the bottom by, multiply the top by too):

$\\frac{1}{3} = \\frac{4}{12}$ and $\\frac{1}{4} = \\frac{3}{12}$

Now the units match, so you just count: $\\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$. **The bottom stays 12.** You're counting twelfths, and the size of a twelfth doesn't change.

If you can't spot the smallest shared number, multiplying the two bottoms always works ($3 \\times 4 = 12$). You may just need to simplify at the end.`,
    },
    {
      heading: 'The mistake to unlearn',
      body: `$\\frac{1}{3} + \\frac{1}{4} \\neq \\frac{2}{7}$.

Sanity check: $\\frac{1}{2} + \\frac{1}{2}$ is obviously $1$. Adding tops and bottoms would give $\\frac{2}{4}$, which is still a half. Adding two halves can't leave you with a half. **Never add or subtract the bottoms.**`,
    },
    {
      heading: 'Mixed numbers',
      body: `**Adding:** add the wholes, add the fractions. If the fractions total more than 1, carry it: $\\frac{5}{6} + \\frac{1}{2} = \\frac{8}{6} = 1\\tfrac{1}{3}$, and that 1 joins the wholes.

**Subtracting** is where people get caught: $5\\tfrac{1}{4} - 2\\tfrac{2}{3}$. You can't take $\\frac{2}{3}$ from $\\frac{1}{4}$, so either borrow a whole, or use the reliable route: **convert both to improper fractions.**

$5\\tfrac{1}{4} = \\frac{21}{4} = \\frac{63}{12}$, and $2\\tfrac{2}{3} = \\frac{8}{3} = \\frac{32}{12}$.
$\\frac{63}{12} - \\frac{32}{12} = \\frac{31}{12} = 2\\tfrac{7}{12}$.

It's more writing, but there's nothing to forget.`,
    },
    {
      heading: 'Word problems',
      body: `"What fraction is left?" means start from **1 whole** and subtract what's been given away. If the nephew gets $\\frac{1}{3}$ and the housekeeper $\\frac{1}{4}$, they took $\\frac{7}{12}$, so $1 - \\frac{7}{12} = \\frac{5}{12}$ is left. The test will offer $\\frac{7}{12}$ as a trap. Read what the question *asks for*.`,
    },
  ],
};
