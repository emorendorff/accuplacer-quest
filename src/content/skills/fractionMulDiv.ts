import { add, div, frac, gcd, mul, raw, tex, value, type Frac } from '../../engine/fraction';
import { buildQuestion, nearMisses, type Generator, type Option } from '../../engine/question';
import type { Rng } from '../../engine/rng';
import type { Skill } from './types';

const opt = (f: Frac, why: string, trap?: string, asMixed = false): Option => ({ text: `$${tex(f, asMixed)}$`, value: value(f), why, trap });

function proper(rng: Rng, minD: number, maxD: number): Frac {
  for (;;) {
    const d = rng.int(minD, maxD);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return { n, d };
  }
}

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['multiply', 'of']) : difficulty === 2 ? rng.pick(['divide', 'howMany']) : rng.pick(['mixedMul', 'mixedDiv']);

  if (variant === 'multiply' || variant === 'of') {
    const a = proper(rng, 2, 9), b = proper(rng, 2, 9);
    const ans = mul(a, b);
    const prompt = variant === 'multiply'
      ? `What is $${tex(a)} \\times ${tex(b)}$?`
      : `Vance finds that $${tex(b)}$ of the crates in a warehouse are mislabeled, and $${tex(a)}$ of *those* hold contraband. What fraction of all the crates hold contraband?`;
    return buildQuestion(rng, {
      skillId: 'fraction-muldiv', difficulty,
      prompt,
      answer: opt(ans, `Right. Multiply straight across: $\\frac{${a.n} \\times ${b.n}}{${a.d} \\times ${b.d}} = \\frac{${a.n * b.n}}{${a.d * b.d}}${frac(a.n * b.n, a.d * b.d).d !== a.d * b.d ? ` = ${tex(ans)}` : ''}$.`),
      distractors: [
        opt(div(a, b), `You flipped one of the fractions. That's the move for *division*. Multiplication just goes straight across, top × top and bottom × bottom.`, 'Flipped when multiplying'),
        opt(add(a, b), variant === 'of' ? `You added. "A fraction *of* a fraction" means multiply: half of a half is a quarter, not a whole.` : `That's the sum. This one is multiplication.`, variant === 'of' ? '"Of" means multiply' : 'Wrong operation'),
        opt(raw(a.n * b.n, a.d + b.d), `You multiplied the tops but added the bottoms. Both go straight across with multiplication.`, 'Added the bottoms'),
        opt(raw(a.n * b.d + a.d * b.n, a.d * b.d), `You cross-multiplied and added, which is part of the recipe for *adding* fractions. Multiplying is simpler: straight across.`, 'Mixed up the recipes'),
      ],
      hints: [
        variant === 'of' ? '"A fraction *of* something" means multiply.' : 'No common denominator needed for multiplying.',
        'Top times top, bottom times bottom. Then simplify.',
      ],
      steps: [`$${tex(a)} \\times ${tex(b)} = \\frac{${a.n * b.n}}{${a.d * b.d}}$`, ...(frac(a.n * b.n, a.d * b.d).d !== a.d * b.d ? [`Simplify: $${tex(ans)}$`] : [])],
    });
  }

  if (variant === 'divide') {
    const a = proper(rng, 2, 9), b = proper(rng, 2, 9);
    if (value(a) === value(b)) return generate(rng, difficulty);
    const ans = div(a, b);
    return buildQuestion(rng, {
      skillId: 'fraction-muldiv', difficulty,
      prompt: `What is $${tex(a)} \\div ${tex(b)}$?`,
      answer: opt(ans, `Right. Keep, change, flip: $${tex(a)} \\times \\frac{${b.d}}{${b.n}} = ${tex(ans)}$.`),
      distractors: [
        opt(mul(a, b), `You multiplied straight across without flipping the second fraction. Dividing by $${tex(b)}$ is the same as multiplying by its flip, $\\frac{${b.d}}{${b.n}}$.`, 'Forgot to flip'),
        opt(div(b, a), `You flipped the *first* fraction instead of the second. Keep the first one as it is; flip the one you're dividing by.`, 'Flipped the wrong fraction'),
        opt(mul(frac(a.d, a.n), frac(b.d, b.n)), `You flipped both fractions. Only the second one (the divisor) gets flipped.`, 'Flipped both'),
        opt(add(ans, frac(1, ans.d)), 'Close. Recheck the multiplication after flipping.'),
      ],
      hints: ['Dividing by a fraction = multiplying by its flip (reciprocal).', `Keep $${tex(a)}$, change ÷ to ×, flip $${tex(b)}$ to $\\frac{${b.d}}{${b.n}}$.`],
      steps: [`Flip the divisor: $${tex(b)} \\to \\frac{${b.d}}{${b.n}}$.`, `$${tex(a)} \\times \\frac{${b.d}}{${b.n}} = \\frac{${a.n * b.d}}{${a.d * b.n}}$`, ...(frac(a.n * b.d, a.d * b.n).d !== a.d * b.n ? [`Simplify: $${tex(ans)}$`] : [])],
    });
  }

  if (variant === 'howMany') {
    const piece = proper(rng, 2, 8);
    const k = rng.int(3, 16);
    const total = mul(frac(k), piece);
    const N = (x: number) => `$${x}$`;
    const thing = rng.pick([
      ['feet of rope', 'pieces'],
      ['pounds of coffee', 'bags'],
      ['hours of tape', 'reels'],
    ] as const);
    const totalStr = tex(total, true);
    return buildQuestion(rng, {
      skillId: 'fraction-muldiv', difficulty,
      prompt: `The evidence room has $${totalStr}$ ${thing[0]}, to be split into ${thing[1]} of $${tex(piece)}$ each. How many ${thing[1]} is that?`,
      answer: { text: N(k), value: k, why: `Right. "How many $${tex(piece)}$s fit in $${totalStr}$?" is division: $${tex(total)} \\div ${tex(piece)} = ${tex(total)} \\times \\frac{${piece.d}}{${piece.n}} = ${k}$.` },
      distractors: [
        opt(mul(total, piece), `You multiplied. "How many of these fit into that?" is a division question.`, 'Multiplied instead of divided', true),
        opt(div(piece, total), `You divided the wrong way round, piece ÷ total. You want total ÷ piece size. The answer should be a count bigger than 1.`, 'Divided backwards', true),
        ...nearMisses(k, N),
      ],
      hints: ['"How many X fit into Y" is Y ÷ X.', `Convert $${totalStr}$ to an improper fraction, then multiply by the flip of $${tex(piece)}$.`],
      steps: [`$${totalStr} = ${tex(total)}$`, `$${tex(total)} \\div ${tex(piece)} = ${tex(total)} \\times \\frac{${piece.d}}{${piece.n}} = ${k}$`],
    });
  }

  // Mixed numbers: always convert to improper fractions first.
  const w1 = rng.int(1, 4), w2 = rng.int(1, 3);
  const f1 = proper(rng, 2, 5), f2 = proper(rng, 2, 5);
  const A = add(frac(w1), f1), B = add(frac(w2), f2);
  const show = (w: number, f: Frac) => `${w}\\tfrac{${f.n}}{${f.d}}`;
  const dividing = variant === 'mixedDiv';
  if (dividing && value(A) === value(B)) return generate(rng, difficulty);
  const ans = dividing ? div(A, B) : mul(A, B);
  const sym = dividing ? '\\div' : '\\times';
  return buildQuestion(rng, {
    skillId: 'fraction-muldiv', difficulty,
    prompt: `What is $${show(w1, f1)} ${sym} ${show(w2, f2)}$?`,
    answer: opt(ans, `Right. Convert first: $${tex(A)} ${sym} ${tex(B)} = ${tex(ans)}${ans.n > ans.d ? ` = ${tex(ans, true)}` : ''}$.`, undefined, true),
    distractors: [
      dividing
        ? opt(add(frac(w1, w2), div(f1, f2)), `You divided the wholes and the fractions separately. That doesn't work for mixed numbers. Convert to improper fractions first.`, 'Split the mixed numbers apart', true)
        : opt(add(frac(w1 * w2), mul(f1, f2)), `You multiplied wholes by wholes and fractions by fractions. That misses the cross terms (like $${w1} \\times ${tex(f2)}$). Convert to improper fractions first.`, 'Split the mixed numbers apart', true),
      dividing
        ? opt(mul(A, B), `You multiplied without flipping the second fraction.`, 'Forgot to flip', true)
        : opt(div(A, B), `You flipped the second fraction. That's only for division.`, 'Flipped when multiplying', true),
      opt(dividing ? div(B, A) : add(A, B), dividing ? 'You flipped the wrong fraction: keep the first, flip the second.' : 'That\'s the sum, not the product.', dividing ? 'Flipped the wrong fraction' : 'Wrong operation', true),
      opt(add(ans, frac(1)), 'Off by one whole. Redo the conversion to improper fractions carefully.', undefined, true),
    ],
    hints: ['Mixed numbers must become improper fractions before multiplying or dividing.', `$${show(w1, f1)} = ${tex(A)}$ and $${show(w2, f2)} = ${tex(B)}$.`],
    steps: [
      `Convert: $${show(w1, f1)} = ${tex(A)}$, $${show(w2, f2)} = ${tex(B)}$.`,
      dividing ? `Flip and multiply: $${tex(A)} \\times \\frac{${B.d}}{${B.n}} = ${tex(ans)}$` : `Multiply across: $${tex(A)} \\times ${tex(B)} = ${tex(ans)}$`,
      ...(ans.n > ans.d ? [`As a mixed number: $${tex(ans, true)}$`] : []),
    ],
  });
};

export const fractionMulDiv: Skill = {
  id: 'fraction-muldiv',
  act: 1,
  name: 'Multiplying & Dividing Fractions',
  caseName: 'The Contraband Count',
  summary: '"Of" means times, keep-change-flip, and splitting things into fractional pieces.',
  prereqs: ['fraction-basics'],
  board: { x: 52, y: 42 },
  generate,
  lesson: [
    {
      heading: 'Multiplying is the easy one',
      body: `No common denominator needed. **Top times top, bottom times bottom.**

$\\frac{2}{3} \\times \\frac{3}{4} = \\frac{6}{12} = \\frac{1}{2}$

Why does it work? Read $\\times$ as **"of."** "Two-thirds *of* three-quarters": take a pie that's three-quarters left, then take two-thirds of what's there. The bottoms multiply because you're cutting pieces into smaller pieces (quarters into thirds makes twelfths).`,
    },
    {
      heading: '"Of" is a translation rule',
      body: `In word problems, **"of" almost always means multiply.** "Half of the 40 crates" is $\\frac{1}{2} \\times 40 = 20$. "$\\frac{3}{5}$ of the suspects" is $\\frac{3}{5} \\times$ (number of suspects).

A useful gut-check: multiplying by a fraction smaller than 1 makes things **smaller**. Half of something is less than the something.`,
    },
    {
      heading: 'Dividing: keep, change, flip',
      body: `$\\frac{3}{4} \\div \\frac{1}{8}$ asks: **how many eighths fit inside three-quarters?** Picture it: three-quarters is six eighths, so the answer is 6.

The shortcut that always gets you there:
- **Keep** the first fraction.
- **Change** $\\div$ to $\\times$.
- **Flip** the second fraction.

$\\frac{3}{4} \\div \\frac{1}{8} = \\frac{3}{4} \\times \\frac{8}{1} = \\frac{24}{4} = 6$ ✓

Dividing by a small fraction gives a *bigger* answer. That feels strange until you read it as "how many tiny pieces fit?"`,
    },
    {
      heading: 'Mixed numbers: convert first, always',
      body: `$2\\tfrac{1}{2} \\times 1\\tfrac{1}{3}$ is **not** $2 \\times 1$ plus $\\frac{1}{2} \\times \\frac{1}{3}$. That skips the cross pieces, the same way $(20 + 5) \\times 3 \\neq 20 + 5 \\times 3$.

Convert to improper fractions first: $\\frac{5}{2} \\times \\frac{4}{3} = \\frac{20}{6} = 3\\tfrac{1}{3}$.`,
    },
    {
      heading: 'Traps the test sets',
      body: `- Flipping when multiplying, or forgetting to flip when dividing.
- Flipping the *first* fraction instead of the second.
- Splitting mixed numbers into wholes and fractions.
- "How many $\\frac{3}{4}$-foot pieces in 6 feet?" That's $6 \\div \\frac{3}{4} = 8$, not $6 \\times \\frac{3}{4}$.`,
    },
  ],
};
