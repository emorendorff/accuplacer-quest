import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

/** TeX for a signed integer; `paren` wraps negatives so "5 - (-3)" reads clearly. */
const s = (x: number, paren = false) => (x < 0 && paren ? `(${x})` : `${x}`);
const N = (x: number) => `$${x}$`;
const o = (x: number, why: string, trap?: string): Option => ({ text: N(x), value: x, why, trap });
/** Near-miss wrong answers that keep the right sign. */
const near = (x: number) => [x + 1, x - 1, x + 2, x - 2, x + 10].map((v) => o(v, 'Close, but not it. Redo it one step at a time, deciding the sign last.', 'Arithmetic slip'));

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['addNeg', 'subNeg', 'tide']) : difficulty === 2 ? rng.pick(['multiply', 'divide', 'mixedOps']) : rng.pick(['squareNeg', 'absolute', 'mixedOps']);

  if (variant === 'addNeg') {
    const a = rng.int(2, 15), b = rng.int(2, 15);
    if (a === b) return generate(rng, difficulty);
    const ans = -a + b;
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `What is $-${a} + ${b}$?`,
      answer: o(ans, `Right. Start at $-${a}$ on the number line and move ${b} to the right: you land on $${ans}$.`),
      distractors: [
        o(-(a + b), `You added the sizes and kept the minus sign. But $+${b}$ moves you *toward* zero from $-${a}$, not further away.`, 'Added the sizes, kept the minus'),
        o(-ans, `Right size, wrong sign. Which is bigger, the ${a} you owe or the ${b} you have? The answer takes the sign of the bigger one.`, 'Wrong sign'),
        o(a + b, `That ignores the minus sign on the ${a}.`, 'Ignored the negative sign'),
        ...near(ans),
      ],
      hints: ['Think of a number line, or of money: you owe ' + a + ' and then get ' + b + '.', `The signs are different, so subtract the sizes ($${Math.max(a, b)} - ${Math.min(a, b)}$) and keep the sign of the bigger one.`],
      steps: [`Different signs: subtract the sizes, $${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.abs(ans)}$.`, `The bigger size is ${a > b ? `the ${a}, which is negative` : `the ${b}, which is positive`}, so the answer is $${ans}$.`],
    });
  }

  if (variant === 'subNeg') {
    const a = rng.int(-12, 12), b = rng.int(2, 12);
    const ans = a + b;
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `What is $${s(a)} - (-${b})$?`,
      answer: o(ans, `Right. Subtracting a negative is the same as adding: $${s(a)} + ${b} = ${ans}$.`),
      distractors: [
        o(a - b, `You treated it as $${s(a)} - ${b}$. But taking away a *debt* leaves you better off: subtracting $-${b}$ means adding ${b}.`, 'Subtracting a negative'),
        o(-ans, 'Right size, wrong sign. Rewrite it as addition first, then work it out.', 'Wrong sign'),
        o(-a - b, 'Both signs got flipped. Only the subtraction of a negative turns into addition; the first number keeps its sign.', 'Flipped too many signs'),
        ...near(ans),
      ],
      hints: ['Two minus signs next to each other, "minus negative", turn into a plus.', `$${s(a)} - (-${b}) = ${s(a)} + ${b}$`],
      steps: [`"Minus a negative" becomes "plus": $${s(a)} - (-${b}) = ${s(a)} + ${b}$.`, `$${s(a)} + ${b} = ${ans}$`],
    });
  }

  if (variant === 'tide') {
    const start = -rng.int(1, 4) - rng.pick([0, 0.5]), rise = rng.int(3, 8), fall = rng.int(1, 9) + rng.pick([0, 0.5]);
    const ans = start + rise - fall;
    const f = (x: number) => (Number.isInteger(x) ? `${x}` : x.toFixed(1));
    const ft = (x: number) => ({ text: `$${f(x)}$ ft`, value: x });
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `At dawn the tide at the Battery reads $${f(start)}$ feet. By noon it has risen ${rise} feet, and by evening it has fallen ${f(fall)} feet from there. What does it read in the evening?`,
      answer: { ...ft(ans), why: `Right. $${f(start)} + ${rise} - ${f(fall)} = ${f(ans)}$ feet.` },
      distractors: [
        { ...ft(-start + rise - fall), trap: 'Ignored the negative sign', why: `The tide started *below* zero, at $${f(start)}$, not at $${f(-start)}$.` },
        { ...ft(start - rise + fall), trap: 'Mixed up rise and fall', why: '"Risen" adds, "fallen" subtracts. You went the opposite way each time.' },
        { ...ft(start + rise + fall), trap: 'Wrong operation', why: `It *fell* ${f(fall)} feet, so subtract.` },
        { ...ft(ans + 1), why: 'Close. Go step by step: dawn, then noon, then evening.' },
        { ...ft(ans - 1), why: 'Close. Go step by step: dawn, then noon, then evening.' },
      ],
      hints: ['Write it as one expression: start, plus the rise, minus the fall.', `Noon: $${f(start)} + ${rise} = ${f(start + rise)}$.`],
      steps: [`Noon: $${f(start)} + ${rise} = ${f(start + rise)}$`, `Evening: $${f(start + rise)} - ${f(fall)} = ${f(ans)}$`],
    });
  }

  if (variant === 'multiply' || variant === 'divide') {
    const a = rng.int(2, 9), b = rng.int(2, 9);
    const signs = rng.pick([[-1, -1], [-1, 1], [1, -1]] as const);
    const x = signs[0] * a, y = signs[1] * b;
    const product = x * y;
    const negative = product < 0;
    if (variant === 'multiply') {
      return buildQuestion(rng, {
        skillId: 'signed-numbers', difficulty,
        prompt: `What is $${s(x, true)} \\times ${s(y, true)}$?`,
        answer: o(product, `Right. ${negative ? 'One negative: the answer is negative.' : 'Two negatives make a positive.'} $${a} \\times ${b} = ${a * b}$, so $${product}$.`),
        distractors: [
          o(-product, negative ? 'Signs differ, so the product is negative.' : 'Two negatives multiply to a *positive*. Losing a debt three times over is a gain.', negative ? 'Wrong sign' : 'Two negatives make a positive'),
          o(x + y, "That's the sum. This one is multiplication.", 'Wrong operation'),
          o(-(x + y), "That's the sum with its sign flipped. This one is multiplication.", 'Wrong operation'),
          ...near(product),
        ],
        hints: ['Multiply the sizes first, then decide the sign.', 'Same signs → positive. Different signs → negative.'],
        steps: [`Sizes: $${a} \\times ${b} = ${a * b}$.`, `Signs: ${negative ? 'different, so negative' : 'both negative, so positive'}.`, `Answer: $${product}$.`],
      });
    }
    const q = x;
    const dividend = product;
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `What is $${s(dividend, true)} \\div ${s(y, true)}$?`,
      answer: o(q, `Right. $${Math.abs(dividend)} \\div ${b} = ${a}$, and ${(dividend < 0) === (y < 0) ? 'the signs match, so it\'s positive' : 'the signs differ, so it\'s negative'}: $${q}$.`),
      distractors: [
        o(-q, 'Right size, wrong sign. Division follows the same sign rules as multiplication.', (dividend < 0 && y < 0) ? 'Two negatives make a positive' : 'Wrong sign'),
        o(dividend * y, "That's multiplication. This one is division.", 'Wrong operation'),
        o(dividend - y, "That's subtraction. This one is division.", 'Wrong operation'),
        ...near(q),
      ],
      hints: ['Divide the sizes, then decide the sign.', 'Same signs → positive. Different signs → negative.'],
      steps: [`Sizes: $${Math.abs(dividend)} \\div ${b} = ${a}$.`, `Signs: ${(dividend < 0) === (y < 0) ? 'same, so positive' : 'different, so negative'}.`, `Answer: $${q}$.`],
    });
  }

  if (variant === 'mixedOps') {
    const a = rng.int(2, 15), b = rng.int(2, 6), c = rng.int(2, 6);
    const ans = a - -b * c;
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `What is $${a} - (-${b}) \\times ${c}$?`,
      answer: o(ans, `Right. Multiply first: $(-${b}) \\times ${c} = -${b * c}$. Then $${a} - (-${b * c}) = ${a} + ${b * c} = ${ans}$.`),
      distractors: [
        o(a - b * c, `The multiplication gives $-${b * c}$, and subtracting a negative means *adding*: $${a} + ${b * c}$.`, 'Subtracting a negative'),
        o((a + b) * c, 'You worked left to right. Multiplication comes before subtraction, even with negatives around.', 'Read left to right'),
        o((a - b) * c, 'Two slips: left to right, and the minus-negative. Multiply first, then turn "minus negative" into "plus".', 'Read left to right'),
        ...near(ans),
      ],
      hints: ['Order of operations still rules: multiply first.', `$(-${b}) \\times ${c} = -${b * c}$. Now what's $${a} - (-${b * c})$?`],
      steps: [`Multiply: $(-${b}) \\times ${c} = -${b * c}$.`, `$${a} - (-${b * c}) = ${a} + ${b * c} = ${ans}$`],
    });
  }

  if (variant === 'squareNeg') {
    const a = rng.int(2, 9), b = rng.int(1, 20);
    const ans = -(a * a) + b;
    return buildQuestion(rng, {
      skillId: 'signed-numbers', difficulty,
      prompt: `What is $-${a}^2 + ${b}$?`,
      answer: o(ans, `Right. The exponent touches only the ${a}: $${a}^2 = ${a * a}$, then the minus sign: $-${a * a}$. Then $-${a * a} + ${b} = ${ans}$.`),
      distractors: [
        o(a * a + b, `You squared $-${a}$. But without parentheses, $-${a}^2$ means "the negative of ${a}²." Only $(-${a})^2$ would be $+${a * a}$.`, 'Squared the negative sign'),
        o(-2 * a + b, `The little 2 means ${a} times itself, not ${a} times 2.`, 'Exponent read as ×2'),
        o(-(a * a) - b, `The ${b} is added, not subtracted.`, 'Sign slip'),
        ...near(ans),
      ],
      hints: ['Exponents happen before the negative sign is applied, unless there are parentheses.', `$-${a}^2 = -(${a}^2) = -${a * a}$`],
      steps: [`$-${a}^2 = -(${a} \\times ${a}) = -${a * a}$`, `$-${a * a} + ${b} = ${ans}$`],
    });
  }

  // absolute
  const a = rng.int(2, 12), b = rng.int(1, 9), c = rng.int(b + 2, 15);
  const ans = a - (c - b);
  return buildQuestion(rng, {
    skillId: 'signed-numbers', difficulty,
    prompt: `What is $|-${a}| - |${b} - ${c}|$?`,
    answer: o(ans, `Right. $|-${a}| = ${a}$. Inside the second bars: $${b} - ${c} = -${c - b}$, and $|-${c - b}| = ${c - b}$. So $${a} - ${c - b} = ${ans}$.`),
    distractors: [
      o(-a - (c - b), `Absolute value is *distance from zero*, which is never negative. $|-${a}| = ${a}$, not $-${a}$.`, 'Absolute value kept the minus'),
      o(a + (c - b), `$|${b} - ${c}| = ${c - b}$, and then you subtract it. The minus sign *outside* the bars still counts.`, 'Dropped the outside minus'),
      o(a - (b + c), `Work out what's inside the bars first: $${b} - ${c} = -${c - b}$. Then take its distance from zero.`, 'Took absolute value of each piece'),
      ...near(ans),
    ],
    hints: ['Absolute value bars $| \\; |$ mean "distance from zero": always positive or zero.', 'Do the arithmetic inside each pair of bars first, then make it positive.'],
    steps: [`$|-${a}| = ${a}$`, `$|${b} - ${c}| = |-${c - b}| = ${c - b}$`, `$${a} - ${c - b} = ${ans}$`],
  });
};

export const signedNumbers: Skill = {
  id: 'signed-numbers',
  act: 2,
  name: 'Negative Numbers',
  caseName: 'Below the Waterline',
  summary: 'Adding, subtracting, multiplying and dividing with negatives; absolute value.',
  prereqs: ['whole-numbers'],
  board: { x: 92, y: 50 },
  generate,
  lesson: [
    {
      heading: 'Negatives are just "below zero"',
      body: `Charleston's tide tables are full of them. When the water drops below its usual low mark, the table says $-1.5$ feet. A bank ledger does the same: $-\\$40$ means you owe forty dollars.

Picture a number line: zero in the middle, positives to the right, negatives to the left. $-7$ is seven steps *left* of zero. Every rule below is about moving along that line.`,
    },
    {
      heading: 'Adding and subtracting',
      body: `**Adding a positive** moves right. **Adding a negative** moves left.

$-8 + 5$: start at $-8$, move 5 right, land on $-3$. A shortcut for different signs: subtract the sizes ($8 - 5 = 3$) and keep the sign of the bigger one (the 8 was negative, so $-3$).

**Subtracting a negative is adding.** $6 - (-4) = 6 + 4 = 10$. In plain English, if someone *cancels a $4 debt* you owe, you're $4 better off. The two minus signs together, "minus negative," become a plus.`,
    },
    {
      heading: 'Multiplying and dividing: just count the negatives',
      body: `Multiply or divide the sizes as usual, then fix the sign:

- **Same signs → positive.** $(-6) \\times (-3) = 18$, and $-20 \\div -4 = 5$.
- **Different signs → negative.** $(-6) \\times 3 = -18$, and $20 \\div -4 = -5$.

Why do two negatives make a positive? Reverse a reverse and you're facing forward again. "It is *not untrue*" means it's true.`,
    },
    {
      heading: 'The parentheses trap',
      body: `$(-3)^2$ and $-3^2$ are different numbers.

- $(-3)^2$ means $(-3) \\times (-3) = 9$.
- $-3^2$ means "the negative of $3^2$", which is $-9$. The exponent only grabs the 3.

This is order of operations again: exponents come before the negative sign is applied, unless parentheses say otherwise. The test loves this one.`,
    },
    {
      heading: 'Absolute value',
      body: `$|x|$ means **distance from zero**, so it's never negative. $|-7| = 7$ and $|7| = 7$.

Work out what's inside the bars first, then make it positive: $|3 - 10| = |-7| = 7$. A minus sign *outside* the bars still counts: $-|{-7}| = -7$.`,
    },
  ],
};
