import { clean, money, num } from '../../engine/format';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

const N = (x: number) => `$${num(clean(x), 2)}$`;
const P = (x: number) => `$${num(clean(x), 2)}\\%$`;
const M = (x: number) => `$${money(x)}$`;
const o = (fmt: (x: number) => string) => (x: number, why: string, trap?: string): Option => ({ text: fmt(x), value: clean(x), why, trap });
const on = o(N), op = o(P), om = o(M);

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['percentOf', 'discount']) : difficulty === 2 ? rng.pick(['whatPercent', 'findWhole']) : rng.pick(['change', 'successive']);

  if (variant === 'percentOf') {
    const p = rng.pick([10, 20, 25, 30, 40, 50, 60, 75, 5, 15]);
    const n = rng.int(2, 24) * 20;
    const ans = (p * n) / 100;
    return buildQuestion(rng, {
      skillId: 'percents', difficulty,
      prompt: `What is $${p}\\%$ of $${num(n)}$?`,
      answer: on(ans, `Right. $${p}\\% = ${num(p / 100)}$, and $${num(p / 100)} \\times ${num(n)} = ${num(ans)}$.`),
      distractors: [
        on(p * n, `You multiplied by ${p}, not ${p}%. "Percent" means "per hundred," so ${p}% is $\\frac{${p}}{100} = ${num(p / 100)}$.`, 'Forgot to divide by 100'),
        on(n / p, `You divided ${num(n)} by ${p}. To find a percent *of* something, multiply by the percent written as a decimal.`, 'Divided instead of multiplied'),
        on(n - p, `You subtracted ${p} as if it were a plain number. ${p}% is a *fraction* of ${num(n)}, not ${p} units.`, 'Treated % as a number'),
        on(ans * 10, `Decimal point is one place off. ${p}% as a decimal is ${num(p / 100)}.`, 'Decimal slip'),
      ],
      hints: ['"Of" means multiply. Turn the percent into a decimal first.', `${p}% = ${num(p / 100)}. Now multiply by ${num(n)}.`],
      steps: [`$${p}\\% = \\frac{${p}}{100} = ${num(p / 100)}$`, `$${num(p / 100)} \\times ${num(n)} = ${num(ans)}$`, `Shortcut: 10% of ${num(n)} is ${num(n / 10)}, so ${p}% is ${p / 10} × that.`],
    });
  }

  if (variant === 'discount') {
    const p = rng.pick([10, 15, 20, 25, 30, 40]);
    const price = rng.int(4, 30) * 4;
    const off = (p * price) / 100;
    const ans = price - off;
    return buildQuestion(rng, {
      skillId: 'percents', difficulty,
      prompt: `A trench coat normally costs $${money(price)}$. It's on sale for $${p}\\%$ off. What is the sale price?`,
      answer: om(ans, `Right. The discount is $${p}\\%$ of $${money(price)}$ = $${money(off)}$, so the coat costs $${money(price)} - ${money(off)} = ${money(ans)}$.`),
      distractors: [
        om(off, `That's the discount, how much you *save*. The question asks what you *pay*.`, 'Answered a different question'),
        om(price - p, `You took ${p} *dollars* off. ${p}% off means ${p} out of every 100, which here is $${money(off)}$.`, 'Treated % as a number'),
        om(price + off, `You added the ${p}%. A discount comes *off* the price.`, 'Wrong direction'),
        om(ans - 1, 'Close. Recheck the subtraction.'),
      ],
      hints: [`First find the discount: ${p}% of $${money(price)}$.`, `Then subtract it from $${money(price)}$. (Or multiply by $${num(1 - p / 100)}$, the part you still pay.)`],
      steps: [`Discount: $${num(p / 100)} \\times ${money(price)} = ${money(off)}$`, `Sale price: $${money(price)} - ${money(off)} = ${money(ans)}$`, `Shortcut: you pay ${100 - p}%, so $${num(1 - p / 100)} \\times ${money(price)} = ${money(ans)}$.`],
    });
  }

  if (variant === 'whatPercent') {
    const pct = rng.pick([5, 10, 20, 25, 40, 50, 60, 75, 80]);
    const whole = rng.int(2, 12) * 20;
    const part = (pct * whole) / 100;
    return buildQuestion(rng, {
      skillId: 'percents', difficulty,
      prompt: `${num(part)} of the ${num(whole)} witnesses saw the getaway car. What percent of the witnesses is that?`,
      answer: op(pct, `Right. Part ÷ whole: $${num(part)} \\div ${num(whole)} = ${num(part / whole)}$, which is $${pct}\\%$.`),
      distractors: [
        op((whole / part) * 100, `You divided whole ÷ part. It's always **part ÷ whole**: "${num(part)} out of ${num(whole)}."`, 'Divided backwards'),
        op(part / whole, `You got the decimal $${num(part / whole)}$ but didn't convert it to a percent. Multiply by 100 (move the point two places right).`, 'Forgot to multiply by 100'),
        op(100 - pct, `That's the percent who *didn't* see the car.`, 'Answered a different question'),
        op(part, `That's the number of witnesses, not the percent. Percent means "out of 100," so compare ${num(part)} to ${num(whole)}.`, 'Treated % as a number'),
      ],
      hints: ['"What percent" = part ÷ whole, then × 100.', `$${num(part)} \\div ${num(whole)} = ?$`],
      steps: [`Part ÷ whole: $${num(part)} \\div ${num(whole)} = ${num(part / whole)}$`, `As a percent: $${num(part / whole)} \\times 100 = ${pct}\\%$`],
      calculator: true,
    });
  }

  if (variant === 'findWhole') {
    const pct = rng.pick([10, 20, 25, 40, 50, 60, 75]);
    const whole = rng.int(2, 15) * 20;
    const part = (pct * whole) / 100;
    return buildQuestion(rng, {
      skillId: 'percents', difficulty,
      prompt: `The fence paid $${money(part)}$ for a stolen watch, which is $${pct}\\%$ of what it's worth. What is the watch worth?`,
      answer: om(whole, `Right. $${pct}\\%$ of the value is $${money(part)}$, so the value is $${money(part)} \\div ${num(pct / 100)} = ${money(whole)}$.`),
      distractors: [
        om(part * pct / 100, `You found ${pct}% *of* $${money(part)}$. But $${money(part)}$ already *is* the ${pct}%. You're looking for the whole it came from.`, 'Took the percent of the part'),
        om(part + pct, `You added ${pct}. Percent isn't a dollar amount; set up "${pct}% of what = $${money(part)}$".`, 'Treated % as a number'),
        om(part * (1 + pct / 100), `You increased $${money(part)}$ by ${pct}%. But the paid price *is* ${pct}% of the value, not ${pct}% less than it.`, 'Wrong setup'),
        om(whole / 10, 'Decimal point is off. Check: is $' + money(part) + '$ really ' + pct + '% of your answer?'),
      ],
      hints: [`Translate: "${pct}% of what is $${money(part)}$?" means $${num(pct / 100)} \\times ? = ${money(part)}$.`, `Undo the multiplication: divide $${money(part)}$ by $${num(pct / 100)}$.`],
      steps: [`$${num(pct / 100)} \\times W = ${money(part)}$`, `$W = ${money(part)} \\div ${num(pct / 100)} = ${money(whole)}$`, `Check: ${pct}% of $${money(whole)}$ is $${money(part)}$ ✓`],
      calculator: true,
    });
  }

  if (variant === 'change') {
    const old = rng.pick([20, 40, 50, 80, 120, 200, 250, 400]);
    const pct = rng.pick([10, 20, 25, 40, 50, 60, 75]);
    const up = rng.chance(0.5);
    const now = up ? old * (1 + pct / 100) : old * (1 - pct / 100);
    const diff = Math.abs(now - old);
    const dir = up ? 'increase' : 'decrease';
    const pctOfNew = clean((diff / now) * 100);
    return buildQuestion(rng, {
      skillId: 'percents', difficulty,
      prompt: `Last year the precinct handled ${num(old)} burglaries. This year it handled ${num(now)}. What was the percent ${up ? 'increase' : 'decrease'}?`,
      answer: { text: P(pct), value: pct, why: `Right. Change ÷ original: $${num(diff)} \\div ${num(old)} = ${num(pct / 100)}$, a ${pct}% ${dir}.` },
      distractors: [
        { text: P(Math.round(pctOfNew * 10) / 10), value: Math.round(pctOfNew * 10) / 10, trap: 'Divided by the new value', why: `You divided the change by the *new* number (${num(now)}). Percent change always compares to the **original**: ${num(diff)} ÷ ${num(old)}.` },
        { text: P(diff), value: diff, trap: 'Used the raw difference', why: `${num(diff)} is how many more or fewer, not the percent. Divide it by the original, ${num(old)}.` },
        { text: P((now / old) * 100), value: clean((now / old) * 100), trap: 'Gave the ratio, not the change', why: `That's this year as a percent *of* last year. The *change* is the difference from 100%.` },
        { text: P(pct * 2), value: pct * 2, why: 'Too big. Change ÷ original, then × 100.' },
      ],
      hints: ['Percent change = (change) ÷ (original) × 100.', `Change: $${num(Math.max(old, now))} - ${num(Math.min(old, now))} = ${num(diff)}$. The original is last year.`],
      steps: [`Change: $${num(diff)}$`, `Divide by the original: $${num(diff)} \\div ${num(old)} = ${num(pct / 100)}$`, `As a percent: ${pct}% ${dir}.`],
      calculator: true,
    });
  }

  // successive: up then down by the same percent does NOT get you back.
  const price = rng.pick([50, 80, 100, 120, 200, 250, 400]);
  const a = rng.pick([10, 20, 25, 50]);
  const afterUp = price * (1 + a / 100);
  const ans = clean(afterUp * (1 - a / 100));
  return buildQuestion(rng, {
    skillId: 'percents', difficulty,
    prompt: `A bookie raises his cut on a $${money(price)}$ bet by $${a}\\%$. After complaints, he lowers the new amount by $${a}\\%$. What's the final amount?`,
    answer: om(ans, `Right. Up ${a}%: $${money(afterUp)}$. Down ${a}% *of that*: $${money(afterUp)} - ${money(afterUp * a / 100)} = ${money(ans)}$. The second ${a}% is taken from a bigger number, so you end up lower than you started.`),
    distractors: [
      om(price, `It feels like +${a}% and −${a}% should cancel. But the decrease is ${a}% of the *new, bigger* amount, $${money(afterUp)}$, so it removes more than the increase added.`, 'Assumed the changes cancel'),
      om(afterUp, `That's just after the increase. Apply the decrease to it too.`, 'Skipped a step'),
      om(price * (1 - a / 100), `You only applied the decrease, and to the original amount. Apply the changes one at a time, in order.`, 'Skipped a step'),
      om(ans - 1, 'Close. Recheck the arithmetic.'),
    ],
    hints: ['Do the changes one at a time.', `After the increase it's $${money(afterUp)}$. Now take ${a}% of *that* away.`],
    steps: [`Increase: $${money(price)} \\times ${num(1 + a / 100)} = ${money(afterUp)}$`, `Decrease: $${money(afterUp)} \\times ${num(1 - a / 100)} = ${money(ans)}$`],
    calculator: true,
  });
};

export const percents: Skill = {
  id: 'percents',
  act: 1,
  name: 'Percents',
  caseName: 'The Fence',
  summary: 'Percent of a number, discounts, finding the whole, and percent change.',
  prereqs: ['decimals', 'fraction-muldiv'],
  board: { x: 72, y: 58 },
  generate,
  lesson: [
    {
      heading: '"Percent" means "per hundred"',
      body: `*Per cent*: out of 100. $25\\%$ is $\\frac{25}{100}$, or $0.25$. That's all a percent is: a fraction with 100 on the bottom, wearing a costume.

**To convert:** move the decimal point two places. $35\\% \\to 0.35$. $0.08 \\to 8\\%$. $4\\% \\to 0.04$ (not 0.4!).`,
    },
    {
      heading: 'The one sentence that solves most problems',
      body: `Almost every percent problem is this sentence with one blank:

**[part] is [percent] of [whole]**

Translate it word by word: "is" means $=$, "of" means $\\times$.

$\\text{part} = \\text{percent} \\times \\text{whole}$

- "What is 15% of 80?" The part is missing: $0.15 \\times 80 = 12$.
- "12 is what percent of 48?" The percent is missing: $12 \\div 48 = 0.25 = 25\\%$.
- "18 is 30% of what?" The whole is missing: $18 \\div 0.30 = 60$.

You're good at parsing sentences. Use that: find the "is" and the "of," and the equation writes itself.`,
    },
    {
      heading: 'Mental shortcuts',
      body: `- **10%:** move the decimal one place left. 10% of 340 is 34.
- **5%:** half of 10%. 5% of 340 is 17.
- **20%, 30%…:** multiples of 10%. 30% of 340 is $3 \\times 34 = 102$.
- **25%** is a quarter, **50%** is half, **75%** is three quarters.`,
    },
    {
      heading: 'Discounts and markups',
      body: `25% off a $\\$80$ coat: the discount is $0.25 \\times 80 = \\$20$, so you pay $\\$60$.

Faster: if 25% is *off*, you still pay 75%: $0.75 \\times 80 = \\$60$.

A 6% tax works the other way: you pay 106% of the price, so multiply by $1.06$.`,
    },
    {
      heading: 'Percent change: always compare to the original',
      body: `$$\\text{percent change} = \\frac{\\text{new} - \\text{original}}{\\text{original}} \\times 100$$

From 40 to 50: change is 10, original is 40, so $\\frac{10}{40} = 25\\%$ increase. Divide by 50 instead and you'd get 20%, which is wrong and is always among the answer choices.

**Up 20% then down 20% doesn't get you back.** $\\$100 \\to \\$120 \\to \\$96$. The second 20% is taken from a bigger number.`,
    },
  ],
};
