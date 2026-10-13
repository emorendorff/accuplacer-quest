import { num } from '../../engine/format';
import { buildQuestion, nearMisses, type Generator } from '../../engine/question';
import type { Skill } from './types';

const N = (x: number) => `$${num(x)}$`;

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['addMul', 'subDiv']) : difficulty === 2 ? rng.pick(['parens', 'story']) : rng.pick(['exponent', 'squareGroup']);

  if (variant === 'addMul') {
    const a = rng.int(2, 30), b = rng.int(2, 9), c = rng.int(3, 12);
    const ans = a + b * c;
    return buildQuestion(rng, {
      skillId: 'whole-numbers', difficulty,
      prompt: `What is the value of $${a} + ${b} \\times ${c}$?`,
      answer: { text: N(ans), value: ans, why: `Right. Multiplication first: $${b} \\times ${c} = ${b * c}$, then $${a} + ${b * c} = ${ans}$.` },
      distractors: [
        { text: N((a + b) * c), value: (a + b) * c, trap: 'Read left to right', why: `This is what you get reading it like an English sentence, left to right: $${a} + ${b}$ first. But multiplication binds tighter than addition. $${b} \\times ${c}$ is one unit ("${b} groups of ${c}") and has to be worked out first.` },
        { text: N(a * b + c), value: a * b + c, trap: 'Multiplied the wrong pair', why: `You multiplied $${a} \\times ${b}$, but the $\\times$ sign sits between ${b} and ${c}. An operation only touches the numbers right next to it.` },
        { text: N(a + b + c), value: a + b + c, trap: 'Treated × as +', why: `That treats the $\\times$ as a $+$. Look at each operation sign carefully before you start.` },
        ...nearMisses(ans, N),
      ],
      hints: [
        'Two operations: one addition, one multiplication. Which one goes first?',
        `Multiplication before addition. Start with $${b} \\times ${c}$.`,
      ],
      steps: [`Multiply first: $${b} \\times ${c} = ${b * c}$.`, `Then add: $${a} + ${b * c} = ${ans}$.`],
    });
  }

  if (variant === 'subDiv') {
    const c = rng.int(2, 6), k = rng.int(2, 9), j = rng.int(2, 9);
    const b = c * k;
    const a = b + c * j;
    const ans = a - k;
    return buildQuestion(rng, {
      skillId: 'whole-numbers', difficulty,
      prompt: `What is the value of $${a} - ${b} \\div ${c}$?`,
      answer: { text: N(ans), value: ans, why: `Right. Division first: $${b} \\div ${c} = ${k}$, then $${a} - ${k} = ${ans}$.` },
      distractors: [
        { text: N(j), value: j, trap: 'Read left to right', why: `You subtracted first: $${a} - ${b} = ${a - b}$, then divided by ${c}. But division outranks subtraction, so $${b} \\div ${c}$ comes first.` },
        { text: N(k), value: k, trap: 'Dropped a number', why: `$${k}$ is just $${b} \\div ${c}$. You still need to subtract that from ${a}.` },
        { text: N(a - b - c), value: a - b - c, trap: 'Treated ÷ as −', why: `That treats the $\\div$ as a minus sign.` },
        ...nearMisses(ans, N),
      ],
      hints: ['Subtraction and division. Division has the higher rank.', `Work out $${b} \\div ${c}$ first.`],
      steps: [`Divide first: $${b} \\div ${c} = ${k}$.`, `Then subtract: $${a} - ${k} = ${ans}$.`],
    });
  }

  if (variant === 'parens') {
    const a = rng.int(2, 15), b = rng.int(2, 15), c = rng.int(2, 9), d = rng.int(2, 20);
    const ans = (a + b) * c - d;
    return buildQuestion(rng, {
      skillId: 'whole-numbers', difficulty,
      prompt: `What is the value of $(${a} + ${b}) \\times ${c} - ${d}$?`,
      answer: { text: N(ans), value: ans, why: `Right. Parentheses: $${a + b}$. Multiply: $${(a + b) * c}$. Subtract: $${ans}$.` },
      distractors: [
        { text: N(a + b * c - d), value: a + b * c - d, trap: 'Ignored parentheses', why: `You skipped the parentheses and multiplied $${b} \\times ${c}$ first. Parentheses are the strongest grouping: whatever is inside them happens before anything else.` },
        { text: N((a + b) * (c - d)), value: (a + b) * (c - d), trap: 'Subtracted too early', why: `You did $${c} - ${d}$ before multiplying. Without parentheses around it, the subtraction waits until the multiplication is done.` },
        { text: N((a + b) * c + d), value: (a + b) * c + d, trap: 'Sign slip', why: `Check the sign at the end: it's minus ${d}, not plus.` },
        ...nearMisses(ans, N),
      ],
      hints: ['Parentheses first, always.', `Inside the parentheses: $${a} + ${b} = ${a + b}$. What's next, the $\\times$ or the $-$?`],
      steps: [`Parentheses: $${a} + ${b} = ${a + b}$.`, `Multiply: $${a + b} \\times ${c} = ${(a + b) * c}$.`, `Subtract: $${(a + b) * c} - ${d} = ${ans}$.`],
    });
  }

  if (variant === 'story') {
    const p = rng.int(3, 9), q = rng.int(8, 24), u = rng.int(2, q - 1);
    const thing = rng.pick([
      ['boxes', 'case files', 'files', 'box'],
      ['crates', 'bottles of rye', 'bottles', 'crate'],
      ['cartons', 'flashbulbs', 'flashbulbs', 'carton'],
    ] as const);
    const ans = p * q - u;
    return buildQuestion(rng, {
      skillId: 'whole-numbers', difficulty,
      prompt: `The precinct receives ${p} ${thing[0]}, each holding ${q} ${thing[1]}. By Friday, ${u} ${thing[2]} have been used up. How many ${thing[2]} are left?`,
      answer: { text: N(ans), value: ans, why: `Right. $${p} \\times ${q} = ${p * q}$ in total, minus the ${u} used: $${ans}$.` },
      distractors: [
        { text: N(p * (q - u)), value: p * (q - u), trap: 'Subtracted from every group', why: `That subtracts ${u} from *each* of the ${thing[0]}. But ${u} were used in total, not ${u} per ${thing[3]}. Read the sentence again: the ${u} is about the whole pile.` },
        { text: N(p * q + u), value: p * q + u, trap: 'Wrong operation', why: `"Used up" means they're gone, so subtract.` },
        { text: N(p + q - u), value: p + q - u, trap: 'Added instead of multiplied', why: `${p} ${thing[0]} *of* ${q} each is ${p} groups of ${q}: multiplication, not addition.` },
        ...nearMisses(ans, N),
      ],
      hints: ['First: how many are there in total?', `Total is ${p} groups of ${q}. Then take away what's been used.`],
      steps: [`Total: $${p} \\times ${q} = ${p * q}$.`, `Left: $${p * q} - ${u} = ${ans}$.`, `As one expression: $${p} \\times ${q} - ${u} = ${ans}$.`],
    });
  }

  if (variant === 'exponent') {
    const a = rng.int(2, 20), b = rng.int(3, 7), c = rng.int(2, 5);
    const ans = a + b * b * c;
    return buildQuestion(rng, {
      skillId: 'whole-numbers', difficulty,
      prompt: `What is the value of $${a} + ${b}^2 \\times ${c}$?`,
      answer: { text: N(ans), value: ans, why: `Right. Exponent: $${b}^2 = ${b * b}$. Multiply: $${b * b * c}$. Add: $${ans}$.` },
      distractors: [
        { text: N(a + 2 * b * c), value: a + 2 * b * c, trap: 'Exponent read as ×2', why: `You treated $${b}^2$ as $${b} \\times 2$. The little 2 means "multiply ${b} by *itself*": $${b} \\times ${b} = ${b * b}$.` },
        { text: N((a + b * b) * c), value: (a + b * b) * c, trap: 'Read left to right', why: `You added before multiplying. After the exponent, multiplication still comes before addition.` },
        { text: N(a + (b * c) ** 2), value: a + (b * c) ** 2, trap: 'Squared too much', why: `The exponent belongs only to the ${b}, the number it's touching. It doesn't square $${b} \\times ${c}$.` },
        ...nearMisses(ans, N),
      ],
      hints: ['Exponents come right after parentheses.', `$${b}^2$ means $${b} \\times ${b}$. Then multiply, then add.`],
      steps: [`Exponent: $${b}^2 = ${b * b}$.`, `Multiply: $${b * b} \\times ${c} = ${b * b * c}$.`, `Add: $${a} + ${b * b * c} = ${ans}$.`],
    });
  }

  // squareGroup: a × (b − c)² ÷ d, with d dividing a so everything stays whole.
  const d = rng.int(2, 5), t = rng.int(2, 6), s = rng.int(2, 5), c = rng.int(1, 9);
  const a = d * t, b = c + s;
  const ans = t * s * s;
  return buildQuestion(rng, {
    skillId: 'whole-numbers', difficulty,
    prompt: `What is the value of $${a} \\times (${b} - ${c})^2 \\div ${d}$?`,
    answer: { text: N(ans), value: ans, why: `Right. Parentheses: ${s}. Square: ${s * s}. Then left to right: $${a} \\times ${s * s} = ${a * s * s}$, $\\div ${d} = ${ans}$.` },
    distractors: [
      { text: N(t * (b * b - c * c)), value: t * (b * b - c * c), trap: 'Squared each term separately', why: `You squared ${b} and ${c} separately: $${b}^2 - ${c}^2$. The exponent applies to the *result* of the parentheses, $${s}$, so it's $${s}^2 = ${s * s}$.` },
      { text: N(t * 2 * s), value: t * 2 * s, trap: 'Exponent read as ×2', why: `$${s}^2$ means $${s} \\times ${s}$, not $${s} \\times 2$.` },
      { text: N(d * t * t * s * s), value: d * t * t * s * s, trap: 'Squared too much', why: `You squared $${a} \\times ${s}$. The exponent only touches the parentheses right before it.` },
      ...nearMisses(ans, N),
    ],
    hints: ['Parentheses, then the exponent.', `$(${b} - ${c}) = ${s}$, and $${s}^2 = ${s * s}$. Multiplication and division then go left to right.`],
    steps: [`Parentheses: $${b} - ${c} = ${s}$.`, `Exponent: $${s}^2 = ${s * s}$.`, `Left to right: $${a} \\times ${s * s} = ${a * s * s}$.`, `$${a * s * s} \\div ${d} = ${ans}$.`],
  });
};

export const wholeNumbers: Skill = {
  id: 'whole-numbers',
  act: 1,
  name: 'Order of Operations',
  caseName: 'The Grammar of the Ledger',
  summary: 'Reading math in the right order: which operations bind first.',
  prereqs: [],
  board: { x: 12, y: 50 },
  generate,
  lesson: [
    {
      heading: 'Math is a language',
      body: `You already know how to parse a tricky sentence. In "The old man the boats," you hit a wall, back up, and realise *man* is the verb. Grammar tells you which words group together.

Arithmetic has grammar too. $40 + 3 \\times 12$ is a sentence, and like English it has rules about which pieces bind together first. Get the grammar wrong and you say something you didn't mean. In a ledger, that's $516$ crates instead of $76$.`,
    },
    {
      heading: 'Why multiplication goes first',
      body: `Multiplication is shorthand. $3 \\times 12$ means "three twelves." It's a single noun phrase, the way "three dozen" is.

So $40 + 3 \\times 12$ reads: **forty, plus three twelves.** You'd never read that as "forty-three, twelve times." Work the noun phrase out first ($3 \\times 12 = 36$), then add: $40 + 36 = 76$.

Exponents are an even tighter phrase. $5^2$ means "five, times itself." That's $25$, and it gets worked out before any multiplying.`,
    },
    {
      heading: 'The full ranking',
      body: `1. **Parentheses** (and any grouping), the strongest bond. Do what's inside first.
2. **Exponents.**
3. **Multiplication and division**, tied. Go left to right.
4. **Addition and subtraction**, tied. Go left to right.

You may remember *PEMDAS* ("Please Excuse My Dear Aunt Sally"). It's fine, with one trap: M doesn't beat D, and A doesn't beat S. They're pairs of equals, worked left to right. So $10 - 4 + 2 = 8$, not $4$.`,
    },
    {
      heading: 'Worked example',
      body: `$20 - 3 \\times (1 + 3)^2 \\div 8$

- Parentheses: $1 + 3 = 4$. Now it's $20 - 3 \\times 4^2 \\div 8$.
- Exponent: $4^2 = 16$. Now $20 - 3 \\times 16 \\div 8$.
- Multiply and divide, left to right: $3 \\times 16 = 48$, then $48 \\div 8 = 6$. Now $20 - 6$.
- Subtract: $14$.

Rewrite the whole line after every step. It feels slow, and it's the single best defence against careless errors.`,
    },
    {
      heading: 'Traps the test sets',
      body: `- **Reading left to right like prose.** The wrong answer for $40 + 3 \\times 12$ will be $516$. It's always on the answer list.
- **Squaring means doubling.** $6^2$ is $36$, not $12$.
- **Squaring parts of a group.** $(7 - 2)^2$ is $5^2 = 25$, not $49 - 4$.
- **Word problems that hide the order.** "3 boxes of 12, and 5 were used" means $3 \\times 12 - 5$. The "5 used" applies to the total, not to each box.`,
    },
  ],
};
