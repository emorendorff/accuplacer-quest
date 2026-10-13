import { gcd } from '../../engine/fraction';
import { clean, money, num } from '../../engine/format';
import { buildQuestion, nearMisses, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

const N = (x: number) => `$${num(clean(x), 2)}$`;
const o = (x: number, why: string, trap?: string): Option => ({ text: N(x), value: clean(x), why, trap });

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['partOfTotal', 'unitRate']) : difficulty === 2 ? rng.pick(['proportion', 'mapScale']) : rng.pick(['rate', 'ratioToPercent']);

  if (variant === 'partOfTotal') {
    let a = rng.int(1, 7), b = rng.int(2, 8);
    while (gcd(a, b) !== 1 || a === b) [a, b] = [rng.int(1, 7), rng.int(2, 8)];
    const m = rng.int(2, 12), total = (a + b) * m;
    const ans = a * m;
    const [p, q] = rng.pick([['rowboats', 'motorboats'], ['dockhands', 'clerks'], ['red buoys', 'green buoys']] as const);
    return buildQuestion(rng, {
      skillId: 'ratios', difficulty,
      prompt: `The ratio of ${p} to ${q} in the harbor is $${a}:${b}$. There are ${total} in all. How many are ${p}?`,
      answer: o(ans, `Right. $${a}:${b}$ means ${a + b} parts in all, so each part is $${total} \\div ${a + b} = ${m}$. ${p[0].toUpperCase() + p.slice(1)} get ${a} parts: $${a} \\times ${m} = ${ans}$.`),
      distractors: [
        o((a / b) * total, `$${a}:${b}$ doesn't mean ${p} are $\\frac{${a}}{${b}}$ of the total. It means ${a} out of every **${a + b}** (${a} + ${b}).`, 'Used a:b as a fraction of the total'),
        o(b * m, `That's the number of ${q}. Check which one the question asks about.`, 'Answered a different question'),
        o(total / a, `Find the size of one part first: total ÷ (${a} + ${b}).`, 'Divided by the wrong number'),
        ...nearMisses(ans, N),
      ],
      hints: [`$${a}:${b}$ means: for every ${a} ${p}, there are ${b} ${q}. How many in one full "group"?`, `Each group has ${a + b}. How many groups make ${total}?`],
      steps: [`Parts in all: $${a} + ${b} = ${a + b}$`, `One part: $${total} \\div ${a + b} = ${m}$`, `${p}: $${a} \\times ${m} = ${ans}$`],
    });
  }

  if (variant === 'unitRate') {
    const count = rng.int(3, 12), each = clean(rng.int(5, 30) * 0.05);
    const total = clean(count * each);
    const M = (x: number): Option['text'] => `$${money(x)}$`;
    const om = (x: number, why: string, trap?: string): Option => ({ text: M(x), value: clean(Math.round(x * 100) / 100), why, trap });
    return buildQuestion(rng, {
      skillId: 'ratios', difficulty,
      prompt: `${count} cans of boat paint cost $${money(total)}$. What is the price per can?`,
      answer: om(each, `Right. "Per can" means divide by the number of cans: $${money(total)} \\div ${count} = ${money(each)}$.`),
      distractors: [
        om(count / total, `You divided cans by dollars. "Dollars per can" puts dollars on top: $${money(total)} \\div ${count}$.`, 'Divided the wrong way'),
        om(total * count, '"Per" means divide, not multiply.', 'Wrong operation'),
        om(each / 10, 'Decimal point slipped. Sanity check: is that a believable price for one can?', 'Decimal slip'),
        om(each + 0.1, 'Close. Redo the division carefully.'),
      ],
      hints: ['"Per" means "for each one," which is division.', `$${money(total)} \\div ${count}$`],
      steps: [`$${money(total)} \\div ${count} = ${money(each)}$ per can`],
      calculator: true,
    });
  }

  if (variant === 'proportion') {
    const b = rng.int(2, 9), a = rng.int(1, 12), k = rng.int(2, 6);
    if (a === b) return generate(rng, difficulty);
    const c = b * k, ans = a * k;
    return buildQuestion(rng, {
      skillId: 'ratios', difficulty,
      prompt: `Solve for $x$: $\\dfrac{${a}}{${b}} = \\dfrac{x}{${c}}$`,
      answer: o(ans, `Right. The bottom went from ${b} to ${c}, which is $\\times ${k}$, so the top does too: $${a} \\times ${k} = ${ans}$. (Or cross-multiply: $${b}x = ${a * c}$.)`),
      distractors: [
        o((c * b) / a, `Cross-multiplying pairs the numbers *diagonally*: $${a} \\times ${c}$ and $${b} \\times x$.`, 'Cross-multiplied the wrong pair'),
        o(a + (c - b), `The bottom was *multiplied* by ${k}, not increased by ${c - b}. Do the same to the top.`, 'Added instead of scaled'),
        o(a * c, `That's the cross-product $${a} \\times ${c}$. You still need to divide by ${b}.`, 'Forgot a step'),
        ...nearMisses(ans, N),
      ],
      hints: ['How did ' + b + ' become ' + c + '?', `Or cross-multiply: $${b} \\cdot x = ${a} \\cdot ${c}$.`],
      steps: [`Cross-multiply: $${b}x = ${a} \\times ${c} = ${a * c}$`, `Divide by ${b}: $x = ${ans}$`],
    });
  }

  if (variant === 'mapScale') {
    const scale = rng.pick([5, 8, 10, 12, 15, 20, 25]), inches = rng.int(2, 9) + rng.pick([0, 0.5]);
    const ans = scale * inches;
    return buildQuestion(rng, {
      skillId: 'ratios', difficulty,
      prompt: `On Vance's road map of South Carolina, 1 inch represents ${scale} miles. Two towns are $${num(inches)}$ inches apart on the map. How far apart are they really?`,
      answer: o(ans, `Right. Every inch is ${scale} miles: $${num(inches)} \\times ${scale} = ${num(ans)}$ miles.`),
      distractors: [
        o(scale / inches, `Set it up as a proportion: $\\frac{1 \\text{ in}}{${scale} \\text{ mi}} = \\frac{${num(inches)} \\text{ in}}{? \\text{ mi}}$. More inches means *more* miles.`, 'Divided instead of multiplied'),
        o(scale + inches, 'The scale multiplies; each inch is worth ' + scale + ' miles.', 'Added instead of scaled'),
        o(inches / scale, 'More inches on the map means more miles on the road, so the answer should be bigger than ' + scale + '.', 'Divided the wrong way'),
        ...nearMisses(ans, N),
      ],
      hints: [`1 inch → ${scale} miles. So 2 inches → ${scale * 2} miles…`, `$${num(inches)} \\times ${scale}$`],
      steps: [`$\\frac{1}{${scale}} = \\frac{${num(inches)}}{d}$`, `$d = ${num(inches)} \\times ${scale} = ${num(ans)}$ miles`],
      calculator: true,
    });
  }

  if (variant === 'rate') {
    const v = rng.pick([30, 35, 40, 45, 50, 55, 60]), t = rng.int(2, 5);
    let u = rng.int(2, 7);
    while (u === t) u = rng.int(2, 7);
    const D = v * t, ans = v * u;
    return buildQuestion(rng, {
      skillId: 'ratios', difficulty,
      prompt: `Driving from Charleston, Vance covers ${D} miles in ${t} hours. At the same speed, how far would she go in ${u} hours?`,
      answer: o(ans, `Right. Her speed is $${D} \\div ${t} = ${v}$ miles per hour, so in ${u} hours: $${v} \\times ${u} = ${ans}$ miles.`),
      distractors: [
        o((D * t) / u, `The proportion is upside down. Keep the same units in the same position: $\\frac{${D} \\text{ mi}}{${t} \\text{ h}} = \\frac{? \\text{ mi}}{${u} \\text{ h}}$.`, 'Set up the proportion upside down'),
        o(D * u, `Find the miles for *one* hour first ($${D} \\div ${t}$), then multiply by ${u}.`, 'Skipped the unit rate'),
        o(D + (u - t), "You added hours to miles. They're different units; scale by the rate instead.", 'Added instead of scaled'),
        ...nearMisses(ans, N),
      ],
      hints: ['Find the unit rate: miles in *one* hour.', `$${D} \\div ${t} = ${v}$ mph`],
      steps: [`Rate: $${D} \\div ${t} = ${v}$ miles per hour`, `Distance: $${v} \\times ${u} = ${ans}$ miles`],
      calculator: true,
    });
  }

  // ratioToPercent
  const [a, b] = rng.pick([[1, 3], [1, 4], [3, 5], [2, 3], [3, 7], [1, 1], [2, 5], [7, 13], [9, 11], [1, 9]] as const);
  const P = (x: number) => ({ text: `$${num(clean(x), 1)}\\%$`, value: Math.round(x * 10) / 10 });
  const ans = (b / (a + b)) * 100;
  return buildQuestion(rng, {
    skillId: 'ratios', difficulty,
    prompt: `In a stack of ledger pages, the ratio of typed pages to handwritten pages is $${a}:${b}$. What percent of the pages are **handwritten**?`,
    answer: { ...P(ans), why: `Right. ${b} out of every ${a + b} pages: $\\frac{${b}}{${a + b}} \\approx ${num(clean(ans), 1)}\\%$.` },
    distractors: [
      { ...P((b / a) * 100), trap: 'Used a:b as a fraction of the total', why: `$${a}:${b}$ compares the two kinds to *each other*. As a share of all pages, handwritten is ${b} out of ${a + b}.` },
      { ...P((a / (a + b)) * 100), trap: 'Answered a different question', why: "That's the typed pages. The question asks about handwritten." },
      { ...P((a / b) * 100), trap: 'Used a:b as a fraction of the total', why: `Two slips: that's typed compared to handwritten. The share of handwritten pages is $\\frac{${b}}{${a + b}}$.` },
      { ...P(ans + 5), why: 'Close. Divide the part by the total number of parts, then × 100.' },
    ],
    hints: ['A ratio $a:b$ means $a + b$ parts in all.', `Handwritten pages: ${b} of every ${a + b}.`],
    steps: [`Total parts: $${a} + ${b} = ${a + b}$`, `$\\frac{${b}}{${a + b}} \\times 100 \\approx ${num(clean(ans), 1)}\\%$`],
    calculator: true,
  });
};

export const ratios: Skill = {
  id: 'ratios',
  act: 2,
  name: 'Ratios & Proportions',
  caseName: 'The Split',
  summary: 'Ratios, unit rates, proportions, map scales, and rates.',
  prereqs: ['percents', 'fraction-muldiv'],
  board: { x: 92, y: 18 },
  generate,
  lesson: [
    {
      heading: 'A ratio is a recipe',
      body: `"Mix sweet tea at 1 cup of sugar to 4 quarts of tea" is a ratio, $1:4$. It tells you the *relationship*, not the amounts. Make a bigger batch and the numbers grow, but the relationship stays the same: $2:8$, $3:12$.

That's all ratios are: equivalent fractions in a recipe costume.`,
    },
    {
      heading: 'Parts of a whole',
      body: `If boats to cars are $3:5$, that's **3 + 5 = 8 parts in all.** With 40 total, each part is $40 \\div 8 = 5$. Boats get 3 parts (15) and cars get 5 parts (25).

The trap: treating $3:5$ as "boats are $\\frac{3}{5}$ of the total." They're $\\frac{3}{8}$. The ratio compares the two groups *to each other*; the total is the sum.`,
    },
    {
      heading: 'Unit rates: "per" means "for one"',
      body: `Miles **per** hour, dollars **per** can, feet **per** second. Find what *one* unit gets you by dividing:

$\\$4.80$ for 6 cans → $4.80 \\div 6 = \\$0.80$ per can.

Once you know the rate for one, scaling is easy. Half the rate problems on the test fall to this one move.`,
    },
    {
      heading: 'Proportions: two equal ratios',
      body: `$\\frac{3}{4} = \\frac{x}{20}$. Two ways to solve it:

- **Scale it.** The bottom went $4 \\to 20$, which is $\\times 5$, so the top goes $3 \\to 15$.
- **Cross-multiply.** $3 \\times 20 = 4 \\times x$, so $60 = 4x$, and $x = 15$. This always works, even when the numbers aren't friendly.

Setting up word problems: **keep the same units in the same position.** Miles on top in both, hours on the bottom in both:
$$\\frac{150 \\text{ miles}}{3 \\text{ hours}} = \\frac{x \\text{ miles}}{5 \\text{ hours}}$$`,
    },
  ],
};
