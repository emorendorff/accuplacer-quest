import { linear } from '../../engine/format';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

const N = (x: number) => `$${x}$`;
const o = (x: number, why: string, trap?: string): Option => ({ text: N(x), value: x, why, trap });
const e = (tex: string, why: string, trap?: string): Option => ({ text: `$${tex}$`, why, trap });
const near = (x: number) => [x + 1, x - 1, x + 2, x + 10].map((v) => o(v, 'Close. Substitute, then follow the order of operations one step at a time.', 'Arithmetic slip'));

const PHRASES = [
  (m: number, k: number) => ({
    words: `${k} less than ${m} times a number $n$`,
    answer: `${m}n - ${k}`,
    why: `"${m} times a number" is $${m}n$, and "${k} less than" that means take ${k} away from it.`,
    wrong: [
      e(`${k} - ${m}n`, `"${k} less than X" means X minus ${k}, not ${k} minus X. "Less than" flips the order you read it in. "Five less than your salary" is your salary minus five.`, '"Less than" flips the order'),
      e(`${m}(n - ${k})`, `That subtracts ${k} *before* multiplying. The phrase multiplies first, then takes ${k} away from the result.`, 'Grouped the wrong part'),
      e(`${m}n + ${k}`, '"Less than" means subtract.', 'Wrong operation'),
    ],
  }),
  (m: number, k: number) => ({
    words: `${m} times the sum of a number $n$ and ${k}`,
    answer: `${m}(n + ${k})`,
    why: `"The sum of a number and ${k}" is a single unit, $(n + ${k})$, and that whole unit gets multiplied by ${m}.`,
    wrong: [
      e(`${m}n + ${k}`, `"The sum of… and…" is a package deal: the parentheses keep $n + ${k}$ together so *both* get multiplied by ${m}.`, 'Missed the grouping'),
      e(`${m} + n + ${k}`, '"Times" means multiply.', 'Wrong operation'),
      e(`(${m} + n) \\cdot ${k}`, `The sum is of the number and ${k}, not of ${m} and the number.`, 'Grouped the wrong part'),
    ],
  }),
  (m: number, k: number) => ({
    words: `the difference of a number $n$ and ${k}, divided by ${m}`,
    answer: `\\frac{n - ${k}}{${m}}`,
    why: `"The difference of $n$ and ${k}" is $n - ${k}$, in that order, and the whole difference is divided by ${m}.`,
    wrong: [
      e(`n - \\frac{${k}}{${m}}`, `That divides only the ${k}. The comma tells you the *whole difference* gets divided.`, 'Missed the grouping'),
      e(`\\frac{${k} - n}{${m}}`, `"The difference of $n$ and ${k}" keeps the order it's read in: $n - ${k}$.`, 'Reversed the difference'),
      e(`\\frac{${m}}{n - ${k}}`, `"Divided by ${m}" puts ${m} on the bottom.`, 'Divided the wrong way'),
    ],
  }),
];

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['evaluate', 'translate']) : difficulty === 2 ? rng.pick(['combine', 'distribute', 'translate']) : rng.pick(['evalNegative', 'distributeNegative']);

  if (variant === 'evaluate') {
    const a = rng.int(2, 9), b = rng.int(1, 15), c = rng.int(2, 9);
    const ans = a * c + b;
    return buildQuestion(rng, {
      skillId: 'expressions', difficulty,
      prompt: `If $x = ${c}$, what is the value of $${a}x + ${b}$?`,
      answer: o(ans, `Right. $${a}x$ means $${a} \\times x$: $${a} \\times ${c} + ${b} = ${a * c} + ${b} = ${ans}$.`),
      distractors: [
        o(Number(`${a}${c}`) + b, `You wrote ${a} and ${c} side by side to make ${a}${c}. A number stuck to a letter means *multiply*: $${a}x = ${a} \\times ${c}$.`, 'Read 3x as digits side by side'),
        o(a + c + b, `$${a}x$ means ${a} *times* $x$, not ${a} plus $x$.`, 'Treated 3x as 3 + x'),
        o(a * (c + b), 'You added before multiplying. Order of operations still applies after you substitute.', 'Read left to right'),
        ...near(ans),
      ],
      hints: ['Replace $x$ with the number, in parentheses.', `$${a}(${c}) + ${b}$. Multiply first.`],
      steps: [`Substitute: $${a}(${c}) + ${b}$`, `Multiply: $${a * c} + ${b}$`, `Add: $${ans}$`],
    });
  }

  if (variant === 'translate') {
    const m = rng.int(2, 9), k = rng.int(2, 12);
    const p = rng.pick(PHRASES)(m, k);
    return buildQuestion(rng, {
      skillId: 'expressions', difficulty,
      prompt: `Which expression means "${p.words}"?`,
      answer: { text: `$${p.answer}$`, why: `Right. ${p.why}` },
      distractors: p.wrong,
      hints: ['Translate one phrase at a time, the way you would a sentence in another language.', 'Watch for grouping words like "the sum of" and "the difference of," and for "less than," which reverses the order.'],
      steps: [p.why, `So the expression is $${p.answer}$.`],
    });
  }

  if (variant === 'combine') {
    const a = rng.int(2, 9), c = rng.int(2, 9), b = rng.int(1, 12), d = rng.int(1, 12);
    if (b === d) return generate(rng, difficulty);
    const ans = linear(a + c, b - d);
    return buildQuestion(rng, {
      skillId: 'expressions', difficulty,
      prompt: `Simplify: $${a}x + ${b} + ${c}x - ${d}$`,
      answer: e(ans, `Right. Combine the $x$ terms ($${a}x + ${c}x = ${a + c}x$) and the plain numbers ($${b} - ${d} = ${b - d}$) separately.`),
      distractors: [
        e(`${a + c + b - d}x`, `You combined $x$ terms with plain numbers. They're different kinds of thing, like apples and dollars. $${a}x$ and ${b} can't merge.`, 'Combined unlike terms'),
        e(linear(a + c, b + d), `The ${d} has a minus sign in front of it. It goes with the ${d}, so subtract it.`, 'Sign slip'),
        e(`${a + c}x^2 ${b - d < 0 ? '-' : '+'} ${Math.abs(b - d)}`, `$${a}x + ${c}x$ is ${a + c} $x$'s, not $x^2$. Adding like terms adds the counts in front; the $x$ stays as it is.`, 'Added x + x to get x²'),
        e(linear(a * c, b - d), 'You multiplied the coefficients. Combining like terms means adding them.', 'Wrong operation'),
      ],
      hints: ['"Like terms" are the same kind of thing: $x$ terms with $x$ terms, numbers with numbers.', `$x$ terms: $${a}x + ${c}x$. Numbers: $${b} - ${d}$.`],
      steps: [`$x$ terms: $${a}x + ${c}x = ${a + c}x$`, `Numbers: $${b} - ${d} = ${b - d}$`, `Together: $${ans}$`],
    });
  }

  if (variant === 'distribute') {
    const k = rng.int(2, 7), m = rng.int(1, 9), n = rng.int(1, 9);
    const ans = linear(k + n, k * m);
    return buildQuestion(rng, {
      skillId: 'expressions', difficulty,
      prompt: `Simplify: $${k}(x + ${m}) + ${n === 1 ? '' : n}x$`,
      answer: e(ans, `Right. Distribute: $${k}x + ${k * m}$. Then combine: $${k}x + ${n}x = ${k + n}x$.`),
      distractors: [
        e(linear(k + n, m), `You multiplied the ${k} by the $x$ but not by the ${m}. The ${k} multiplies *everything* inside the parentheses.`, 'Only multiplied the first term'),
        e(linear(k + n, k + m), `Distributing means multiplying: $${k} \\times ${m}$, not $${k} + ${m}$.`, 'Added instead of multiplied'),
        e(`${k + n + k * m}x`, `$${k * m}$ is a plain number; it can't join the $x$ terms.`, 'Combined unlike terms'),
        e(linear(k * n + k, k * m), 'Distribute first, then combine like terms by adding.', 'Wrong operation'),
      ],
      hints: [`The ${k} outside multiplies *both* terms inside the parentheses.`, `$${k}(x + ${m}) = ${k}x + ${k * m}$. Now combine the $x$ terms.`],
      steps: [`Distribute: $${k}(x + ${m}) = ${k}x + ${k * m}$`, `Combine: $${k}x + ${n}x = ${k + n}x$`, `Result: $${ans}$`],
    });
  }

  if (variant === 'evalNegative') {
    const c = rng.int(2, 6), a = rng.int(2, 7);
    const ans = c * c + a * c;
    return buildQuestion(rng, {
      skillId: 'expressions', difficulty,
      prompt: `If $x = -${c}$, what is the value of $x^2 - ${a}x$?`,
      answer: o(ans, `Right. $(-${c})^2 = ${c * c}$ and $-${a}(-${c}) = +${a * c}$. Total: $${ans}$.`),
      distractors: [
        o(-(c * c) + a * c, `When you substitute a negative, wrap it in parentheses: $(-${c})^2 = (-${c})(-${c}) = +${c * c}$. Squaring a negative gives a positive.`, 'Squared a negative wrong'),
        o(c * c - a * c, `$-${a}x$ with $x = -${c}$ is $-${a} \\times (-${c}) = +${a * c}$. Two negatives make a positive.`, 'Two negatives make a positive'),
        o(-(c * c) - a * c, 'Both signs came out wrong. Put $-' + c + '$ in parentheses everywhere you see $x$, then apply the sign rules.', 'Wrong sign'),
        ...near(ans),
      ],
      hints: [`Write $(-${c})$ in parentheses everywhere you see $x$.`, `$(-${c})^2 - ${a}(-${c})$`],
      steps: [`Substitute: $(-${c})^2 - ${a}(-${c})$`, `$(-${c})^2 = ${c * c}$ and $-${a}(-${c}) = ${a * c}$`, `$${c * c} + ${a * c} = ${ans}$`],
    });
  }

  // distributeNegative: nx - k(x - m)
  const n = rng.int(3, 9), k = rng.int(2, 6), m = rng.int(1, 9);
  if (n === k) return generate(rng, difficulty);
  const ans = linear(n - k, k * m);
  return buildQuestion(rng, {
    skillId: 'expressions', difficulty,
    prompt: `Simplify: $${n}x - ${k}(x - ${m})$`,
    answer: e(ans, `Right. Distribute the $-${k}$: $-${k}x + ${k * m}$. (Negative times negative is positive.) Then $${n}x - ${k}x = ${n - k}x$.`),
    distractors: [
      e(linear(n - k, -k * m), `The $-${k}$ multiplies the $-${m}$ too, and negative times negative is *positive*: $+${k * m}$.`, 'Two negatives make a positive'),
      e(linear(n - k, -m), `The ${k} has to multiply *both* terms in the parentheses, including the ${m}.`, 'Only multiplied the first term'),
      e(linear(n + k, k * m), `The minus sign in front of the ${k} goes with it: $-${k} \\times x = -${k}x$, so you subtract ${k}x.`, 'Sign slip'),
      e(linear(n - k, k + m), 'Distributing means multiplying, not adding.', 'Added instead of multiplied'),
    ],
    hints: [`Treat it as $${n}x + (-${k})(x - ${m})$: the minus sign belongs to the ${k}.`, `$(-${k})(x) = -${k}x$ and $(-${k})(-${m}) = +${k * m}$.`],
    steps: [`Distribute $-${k}$: $-${k}x + ${k * m}$`, `Combine: $${n}x - ${k}x = ${n - k}x$`, `Result: $${ans}$`],
  });
};

export const expressions: Skill = {
  id: 'expressions',
  act: 2,
  name: 'Algebraic Expressions',
  caseName: 'The Coded Letters',
  summary: 'Substituting values, translating words into algebra, combining like terms, distributing.',
  prereqs: ['signed-numbers'],
  board: { x: 110, y: 36 },
  generate,
  lesson: [
    {
      heading: 'A letter is a blank waiting to be filled',
      body: `In algebra, a letter like $x$ stands for a number we don't know yet, or one that can change. It's a pronoun. "*She* bought three hats" works for any *she*. $3x$ works for any $x$.

**A number stuck to a letter means multiply.** $3x$ is "three times $x$," just as "three dozen" is three times twelve. So if $x = 4$, then $3x = 12$, *not* 34.`,
    },
    {
      heading: 'Substituting',
      body: `To find the value of an expression, replace the letter with its number **in parentheses**, then follow the order of operations.

$x = -2$ in $x^2 - 5x$: write $(-2)^2 - 5(-2) = 4 + 10 = 14$.

The parentheses are what save you with negatives. Without them, $-2^2$ looks like $-4$.`,
    },
    {
      heading: 'Translating English into algebra',
      body: `This is where a strong reader has the edge. Translate phrase by phrase:

- "the sum of $n$ and 5" → $n + 5$
- "the product of 4 and $n$" → $4n$
- "twice a number" → $2n$
- "7 **less than** a number" → $n - 7$. *Note the reversal*: "less than" puts the 7 second.
- "3 times **the sum of** a number and 2" → $3(n + 2)$. "The sum of" makes a package that stays together.

Read "less than" and "subtracted from" twice. Those two phrases reverse the order you read them in.`,
    },
    {
      heading: 'Like terms: count the same kind of thing',
      body: `$5x + 3 + 2x - 1$. The $x$ terms are one kind of thing; plain numbers are another. Combine each kind separately: $7x + 2$.

Think apples and dollars: 5 apples + 3 dollars + 2 apples − 1 dollar = 7 apples + 2 dollars. You can't merge them into 9 "apple-dollars."

And $x + x = 2x$, not $x^2$. Two apples, not an apple squared.`,
    },
    {
      heading: 'Distributing',
      body: `$4(x + 3)$ means four copies of $(x + 3)$: four $x$'s and four 3's. So $4x + 12$. **The outside number multiplies every term inside.**

With a minus sign out front, the minus goes in too: $-2(x - 5) = -2x + 10$. Negative times negative is positive. That's the single most common slip on this topic.`,
    },
  ],
};
