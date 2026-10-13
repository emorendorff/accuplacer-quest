import { frac, tex, value } from '../../engine/fraction';
import { linear } from '../../engine/format';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

/** An answer choice x = n/d, shown as an integer or a fraction. */
const x = (n: number, d: number, why: string, trap?: string): Option => {
  const f = frac(n, d);
  return { text: `$x = ${tex(f)}$`, value: value(f), why, trap };
};
const near = (ans: number) => [ans + 1, ans - 1, ans + 2, -ans].map((v) => x(v, 1, 'Close. Check your answer by putting it back into the original equation.', 'Arithmetic slip'));

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['twoStep', 'twoStep', 'oneStepDivide']) : difficulty === 2 ? rng.pick(['bothSides', 'words']) : rng.pick(['distribute', 'fraction', 'inequality']);

  if (variant === 'oneStepDivide' || variant === 'twoStep') {
    const a = rng.int(2, 9), sol = rng.int(-6, 12) || 3, b = variant === 'twoStep' ? rng.int(1, 20) : 0;
    const c = a * sol + b;
    const eq = `${linear(a, b)} = ${c}`;
    return buildQuestion(rng, {
      skillId: 'linear-equations', difficulty,
      prompt: `Solve for $x$: $${eq}$`,
      answer: x(sol, 1, `Right. ${b ? `Subtract ${b} from both sides: $${a}x = ${c - b}$. ` : ''}Divide both sides by ${a}: $x = ${sol}$. Check: $${a}(${sol})${b ? ` + ${b}` : ''} = ${c}$ ✓`),
      distractors: [
        ...(b ? [
          x(c + b, a, `You added ${b} to both sides. To undo "+ ${b}", do the opposite: subtract ${b}.`, 'Did the same operation instead of the opposite'),
          x(c - a * b, a, `You divided only the ${c} by ${a}, then subtracted ${b}. Undo in reverse order: first the "+ ${b}", then the "× ${a}".`, 'Undid steps in the wrong order'),
          x(c - b - a, 1, `$${a}x$ means ${a} *times* $x$, so undo it by *dividing* by ${a}, not subtracting.`, 'Subtracted instead of divided'),
        ] : [
          x(c * a, 1, `To undo "× ${a}", divide by ${a}, don't multiply.`, 'Did the same operation instead of the opposite'),
          x(c - a, 1, `$${a}x$ means ${a} times $x$. Undo it by dividing.`, 'Subtracted instead of divided'),
        ]),
        ...near(sol),
      ],
      hints: ['Undo what was done to $x$, in reverse order. Whatever you do to one side, do to the other.', b ? `First undo the "+ ${b}": subtract ${b} from both sides.` : `Undo the "× ${a}": divide both sides by ${a}.`],
      steps: [...(b ? [`Subtract ${b}: $${a}x = ${c - b}$`] : []), `Divide by ${a}: $x = ${sol}$`, `Check: $${a}(${sol})${b ? ` + ${b}` : ''} = ${c}$ ✓`],
    });
  }

  if (variant === 'bothSides') {
    const c = rng.int(1, 6), a = c + rng.int(1, 5), sol = rng.int(-5, 10) || 2, b = rng.int(-10, 15);
    const d = (a - c) * sol + b;
    return buildQuestion(rng, {
      skillId: 'linear-equations', difficulty,
      prompt: `Solve for $x$: $${linear(a, b)} = ${linear(c, d)}$`,
      answer: x(sol, 1, `Right. Subtract $${c}x$ from both sides: $${linear(a - c, b)} = ${d}$. Then ${b ? `${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}: $${a - c}x = ${d - b}$, and ` : ''}divide by ${a - c}: $x = ${sol}$.`),
      distractors: [
        x(d + b, a - c, `Moving the ${Math.abs(b)} across the equals sign flips its sign. You need $${a - c}x = ${d} ${b > 0 ? '-' : '+'} ${Math.abs(b)}$.`, 'Sign slip moving a term'),
        x(d - b, a + c, `To get the $x$'s on one side, *subtract* $${c}x$ from both sides. That leaves $${a - c}x$, not $${a + c}x$.`, 'Added the x terms'),
        x(b - d, a - c, 'The signs are flipped. Moving a term to the other side changes its sign: plus becomes minus.', 'Moved terms but kept their signs'),
        ...near(sol),
      ],
      hints: ['Get all the $x$ terms on one side and the plain numbers on the other.', `Subtract $${c}x$ from both sides first.`],
      steps: [`Subtract $${c}x$: $${linear(a - c, b)} = ${d}$`, ...(b ? [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $${a - c}x = ${d - b}$`] : []), `Divide by ${a - c}: $x = ${sol}$`],
    });
  }

  if (variant === 'words') {
    const a = rng.pick([2, 3, 4, 5]), sol = rng.int(3, 15), b = rng.int(2, 20);
    const r = a * sol + b;
    const verb = { 2: 'doubled', 3: 'tripled', 4: 'multiplied by 4', 5: 'multiplied by 5' }[a];
    const N = (v: number) => ({ text: `$${Number.isInteger(v) ? v : tex(frac(Math.round(v * a), a))}$`, value: v });
    return buildQuestion(rng, {
      skillId: 'linear-equations', difficulty,
      prompt: `When a number is ${verb} and then increased by ${b}, the result is ${r}. What is the number?`,
      answer: { ...N(sol), why: `Right. Translate: $${a}n + ${b} = ${r}$. Subtract ${b}: $${a}n = ${r - b}$. Divide by ${a}: $n = ${sol}$.` },
      distractors: [
        { ...N((r + b) / a), trap: 'Did the same operation instead of the opposite', why: `To undo "increased by ${b}", subtract ${b}; don't add it.` },
        { ...N(r / a - b), trap: 'Undid steps in the wrong order', why: 'Undo the steps in reverse order. The last thing done was "+ ' + b + '", so undo that first.' },
        { ...N(r - b), trap: 'Forgot a step', why: `That undoes the "+ ${b}" but not the "${verb}".` },
        { ...N(sol + 1), why: 'Close. Check by working it forward: does your number give ' + r + '?' },
      ],
      hints: [`Translate it into an equation first: "${verb}" → $${a}n$, "increased by ${b}" → $+ ${b}$.`, `$${a}n + ${b} = ${r}$. Now solve.`],
      steps: [`Translate: $${a}n + ${b} = ${r}$`, `Subtract ${b}: $${a}n = ${r - b}$`, `Divide by ${a}: $n = ${sol}$`],
    });
  }

  if (variant === 'distribute') {
    const a = rng.int(2, 6), b = rng.int(1, 8), sol = rng.int(-4, 9) || 1;
    const c = a * (sol + b);
    return buildQuestion(rng, {
      skillId: 'linear-equations', difficulty,
      prompt: `Solve for $x$: $${a}(x + ${b}) = ${c}$`,
      answer: x(sol, 1, `Right. Either divide both sides by ${a} ($x + ${b} = ${c / a}$) or distribute ($${a}x + ${a * b} = ${c}$). Both give $x = ${sol}$.`),
      distractors: [
        x(c - b, a, `You treated it as $${a}x + ${b}$. The ${a} multiplies the ${b} too: $${a}x + ${a * b}$.`, 'Only multiplied the first term'),
        x(c / a + b, 1, `After dividing by ${a}, you have $x + ${b} = ${c / a}$. Subtract the ${b}, don't add it.`, 'Sign slip'),
        x(c - a * b, 1, `You distributed correctly ($${a}x + ${a * b} = ${c}$) but forgot to divide by ${a} at the end.`, 'Forgot a step'),
        ...near(sol),
      ],
      hints: [`Easiest move: divide both sides by ${a}.`, `$x + ${b} = ${c / a}$`],
      steps: [`Divide both sides by ${a}: $x + ${b} = ${c / a}$`, `Subtract ${b}: $x = ${sol}$`],
    });
  }

  if (variant === 'fraction') {
    const a = rng.int(2, 6), b = rng.int(1, 9), c = rng.int(1, 9);
    const sol = a * (c + b);
    return buildQuestion(rng, {
      skillId: 'linear-equations', difficulty,
      prompt: `Solve for $x$: $\\dfrac{x}{${a}} - ${b} = ${c}$`,
      answer: x(sol, 1, `Right. Add ${b}: $\\frac{x}{${a}} = ${c + b}$. Multiply by ${a}: $x = ${sol}$.`),
      distractors: [
        x(a * (c - b), 1, `To undo "− ${b}", *add* ${b} to both sides.`, 'Did the same operation instead of the opposite'),
        x(c + b, a, `To undo "divided by ${a}", *multiply* by ${a}.`, 'Divided instead of multiplied'),
        x(a * c + b, 1, `Undo in reverse order: first add ${b}, *then* multiply everything by ${a}.`, 'Undid steps in the wrong order'),
        ...near(sol),
      ],
      hints: [`First undo the "− ${b}".`, `$\\frac{x}{${a}} = ${c + b}$. What undoes dividing by ${a}?`],
      steps: [`Add ${b}: $\\frac{x}{${a}} = ${c + b}$`, `Multiply by ${a}: $x = ${sol}$`],
    });
  }

  // inequality: b - ax > c  →  x < (b - c) / a
  const a = rng.int(2, 6), k = rng.int(-5, 8), c = rng.int(-5, 15);
  const b = c + a * k;
  const ineq = (op: string, v: number) => ({ text: `$x ${op} ${v}$`, why: '' });
  return buildQuestion(rng, {
    skillId: 'linear-equations', difficulty,
    prompt: `Solve: $${b} - ${a}x > ${c}$`,
    answer: { ...ineq('<', k), why: `Right. Subtract ${b}: $-${a}x > ${c - b}$. Divide by $-${a}$, and **flip the inequality** because you divided by a negative: $x < ${k}$.` },
    distractors: [
      { ...ineq('>', k), trap: 'Forgot to flip the inequality', why: `Dividing (or multiplying) both sides by a *negative* number flips the inequality sign. Check with a number: try $x = ${k + 1}$ in the original. Is $${b} - ${a * (k + 1)} > ${c}$? No.` },
      { ...ineq('<', -k === k ? k + 1 : -k), trap: 'Sign slip', why: `$${c - b} \\div (-${a}) = ${k}$. Watch the sign when dividing negatives.` },
      { ...ineq('>', -k === k ? k - 1 : -k), trap: 'Sign slip', why: `Two slips: the sign of the number, and the direction of the inequality. $${c - b} \\div (-${a}) = ${k}$, and dividing by a negative flips $>$ to $<$.` },
      { ...ineq('<', k + 1), why: 'Close. Redo the arithmetic: subtract first, then divide.' },
    ],
    hints: ['Solve it like an equation, with one extra rule.', 'If you multiply or divide both sides by a negative number, flip the inequality sign.'],
    steps: [`Subtract ${b}: $-${a}x > ${c - b}$`, `Divide by $-${a}$ and flip: $x < ${k}$`],
  });
};

export const linearEquations: Skill = {
  id: 'linear-equations',
  act: 2,
  name: 'Solving Equations',
  caseName: 'Solving for X',
  summary: 'One- and two-step equations, variables on both sides, word problems, inequalities.',
  prereqs: ['expressions'],
  board: { x: 128, y: 20 },
  generate,
  lesson: [
    {
      heading: 'An equation is a balanced scale',
      body: `$3x + 5 = 20$ says the left side weighs exactly the same as the right. You can do anything you like, **as long as you do it to both sides**, and the scale stays balanced.

Your goal is to get $x$ alone on one side. Everything else is just clearing the clutter away from it.`,
    },
    {
      heading: 'Undo, in reverse order',
      body: `Think of how $3x + 5$ was built: start with $x$, **multiply** by 3, then **add** 5. To unwrap it, reverse the steps, like taking off shoes before socks:

1. Undo the "+ 5": subtract 5 from both sides. $3x = 15$.
2. Undo the "× 3": divide both sides by 3. $x = 5$.

**Always check** by putting your answer back in: $3(5) + 5 = 20$ ✓. On a multiple-choice test you can even check the choices this way when you're stuck.`,
    },
    {
      heading: 'Variables on both sides',
      body: `$7x - 4 = 3x + 12$. Gather the $x$'s on one side by subtracting $3x$ from both: $4x - 4 = 12$. Then it's a normal two-step: $4x = 16$, so $x = 4$.

Moving a term across the equals sign flips its sign. That's just "subtract it from both sides," said quickly.`,
    },
    {
      heading: 'Word problems: translate, then solve',
      body: `"A number tripled, plus 7, is 31." Translate phrase by phrase: $3n + 7 = 31$. Now it's an ordinary equation: $3n = 24$, $n = 8$.

"Is" means $=$. That one word is where the equation splits into two sides.`,
    },
    {
      heading: 'Inequalities: one extra rule',
      body: `Solve $<$, $>$, $\\le$, $\\ge$ just like equations, **except**: when you multiply or divide both sides by a *negative* number, flip the sign.

$-2x > 6$ → divide by $-2$ → $x < -3$.

Why? $2 < 5$, but multiply both by $-1$ and you get $-2$ and $-5$, and now $-2 > -5$. Negatives reverse the order.`,
    },
  ],
};
