import { clean, num } from '../../engine/format';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

const D = (x: number) => `$${num(clean(x))}$`;
const P = (x: number) => `$${num(clean(x))}\\%$`;

const NICE_FRACTIONS: [number, number][] = [[1, 4], [1, 5], [2, 5], [3, 5], [3, 4], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 2], [7, 10], [3, 10], [9, 10]];

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['decToPct', 'pctToDec', 'largestDecimal']) : difficulty === 2 ? rng.pick(['orderForms', 'between']) : rng.pick(['estimate', 'orderForms']);

  if (variant === 'decToPct') {
    const x = clean(rng.pick([rng.int(1, 9) / 1000 + rng.int(1, 9) / 100, rng.int(1, 9) / 100, rng.int(11, 99) / 100, rng.int(101, 250) / 100]));
    const ans = clean(x * 100);
    const o = (v: number, why: string, trap?: string): Option => ({ text: P(v), value: clean(v), why, trap });
    return buildQuestion(rng, {
      skillId: 'number-sense', difficulty,
      prompt: `Write $${num(x)}$ as a percent.`,
      answer: o(ans, `Right. Multiply by 100 (move the point two places right): $${num(x)} = ${num(ans)}\\%$.`),
      distractors: [
        o(x * 10, 'You moved the decimal point only one place. Percent means per *hundred*: two places.', 'Moved the point one place'),
        o(x, `You just added a % sign. But $${num(x)}\\%$ means $${num(x)}$ *hundredths*, which is a tiny amount. Multiply by 100 first.`, 'Just added a % sign'),
        o(x * 1000, 'Three places is one too many. Percent = × 100.', 'Moved the point three places'),
        o(x / 100, 'You moved the point the wrong way. Decimal → percent makes the number *bigger*.', 'Moved the point the wrong way'),
      ],
      hints: ['Percent means "out of 100." Multiply the decimal by 100.', 'Multiplying by 100 moves the decimal point two places right.'],
      steps: [`$${num(x)} \\times 100 = ${num(ans)}$`, `So $${num(x)} = ${num(ans)}\\%$.`],
    });
  }

  if (variant === 'pctToDec') {
    const p = clean(rng.pick([rng.int(1, 9), rng.int(11, 99), rng.int(1, 9) + 0.5, rng.int(101, 200)]));
    const ans = clean(p / 100);
    const o = (v: number, why: string, trap?: string): Option => ({ text: D(v), value: clean(v), why, trap });
    return buildQuestion(rng, {
      skillId: 'number-sense', difficulty,
      prompt: `Write $${num(p)}\\%$ as a decimal.`,
      answer: o(ans, `Right. Divide by 100 (move the point two places left): $${num(p)}\\% = ${num(ans)}$.`),
      distractors: [
        o(p / 10, `One place isn't enough. Percent is per *hundred*, so move the point two places left. ${p < 10 ? `This is the classic one: $${num(p)}\\%$ is $${num(ans)}$, not $${num(p / 10)}$.` : ''}`, 'Moved the point one place'),
        o(p, 'You dropped the % sign without converting. Divide by 100.', 'Just dropped the % sign'),
        o(p / 1000, 'Three places is one too many. Percent = ÷ 100.', 'Moved the point three places'),
        o(p * 100, 'Wrong direction. Percent → decimal makes the number smaller.', 'Moved the point the wrong way'),
      ],
      hints: ['Divide by 100.', 'Move the decimal point two places to the left. Add zeros in front if you run out of digits.'],
      steps: [`$${num(p)}\\% = ${num(p)} \\div 100 = ${num(ans)}$`],
    });
  }

  if (variant === 'largestDecimal') {
    // The largest has the fewest digits; the others are longer but smaller.
    const t = rng.int(3, 8);
    const big = clean(t / 10);
    const twoDigit = clean((t - 1) / 10 + rng.int(1, 9) / 100);
    const threeDigit = clean((t - 1) / 10 + rng.int(1, 9) / 100 + rng.int(1, 9) / 1000);
    const tiny = clean(t / 100 + rng.int(1, 9) / 1000);
    const o = (v: number, why: string, trap?: string): Option => ({ text: D(v), value: v, why, trap });
    return buildQuestion(rng, {
      skillId: 'number-sense', difficulty,
      prompt: 'Which number is the greatest?',
      answer: o(big, `Right. Compare the tenths digit first: $${num(big)}$ has ${t} tenths; the others have fewer. Write them all with three decimal places to see it: $${big.toFixed(3)}$.`),
      distractors: [
        o(threeDigit, `More digits doesn't mean bigger. Pad them to the same length: $${threeDigit.toFixed(3)}$ vs $${big.toFixed(3)}$. Compare left to right.`, 'Longer decimal = bigger'),
        o(twoDigit, `Pad to the same length: $${twoDigit.toFixed(3)}$ vs $${big.toFixed(3)}$. The tenths digit decides it.`, 'Longer decimal = bigger'),
        o(tiny, `$${num(tiny)}$ has a 0 in the tenths place. It's less than one tenth.`, 'Ignored the leading zero'),
      ],
      hints: ['Write every number with the same number of decimal places.', 'Then compare digit by digit from the left, starting with the tenths.'],
      steps: [...[big, twoDigit, threeDigit, tiny].map((v) => `$${num(v)} = ${v.toFixed(3)}$`), `Greatest: $${num(big)}$.`],
    });
  }

  if (variant === 'between') {
    for (;;) {
      const [a, b] = rng.shuffle(NICE_FRACTIONS).slice(0, 2).sort((x, y) => x[0] / x[1] - y[0] / y[1]);
      const lo = a[0] / a[1], hi = b[0] / b[1];
      if (hi - lo < 0.1) continue;
      const mid = clean(Math.round(((lo + hi) / 2) * 100) / 100);
      if (mid <= lo || mid >= hi) continue;
      const o = (v: number, why: string, trap?: string): Option => ({ text: D(v), value: v, why, trap });
      const misread = clean(Number(`0.${a[0]}${a[1]}`));
      // The misread decimal is only a wrong answer if it falls outside the range.
      if (misread > lo && misread < hi) continue;
      return buildQuestion(rng, {
        skillId: 'number-sense', difficulty,
        prompt: `Which number is between $\\frac{${a[0]}}{${a[1]}}$ and $\\frac{${b[0]}}{${b[1]}}$?`,
        answer: o(mid, `Right. $\\frac{${a[0]}}{${a[1]}} = ${num(lo)}$ and $\\frac{${b[0]}}{${b[1]}} = ${num(hi)}$, and $${num(mid)}$ falls between them.`),
        distractors: [
          o(misread, `You read the fraction's digits as a decimal. $\\frac{${a[0]}}{${a[1]}}$ means $${a[0]} \\div ${a[1]} = ${num(lo)}$.`, 'Read digits as a decimal'),
          o(clean(Math.max(0.01, lo - 0.05)), `That's below $\\frac{${a[0]}}{${a[1]}} = ${num(lo)}$.`, 'Out of range'),
          o(clean(hi + 0.05), `That's above $\\frac{${b[0]}}{${b[1]}} = ${num(hi)}$.`, 'Out of range'),
          o(clean(Math.max(0.01, lo - 0.1)), `That's below $\\frac{${a[0]}}{${a[1]}} = ${num(lo)}$.`, 'Out of range'),
        ],
        hints: ['Convert both fractions to decimals first.', `$\\frac{${a[0]}}{${a[1]}} = ${a[0]} \\div ${a[1]}$.`],
        steps: [`$\\frac{${a[0]}}{${a[1]}} = ${num(lo)}$, $\\frac{${b[0]}}{${b[1]}} = ${num(hi)}$`, `Only $${num(mid)}$ is between them.`],
      });
    }
  }

  if (variant === 'orderForms') {
    for (;;) {
      const [fn, fd] = rng.pick(NICE_FRACTIONS);
      const v = fn / fd;
      const offsets = rng.shuffle([-0.06, -0.04, -0.03, -0.02, 0.02, 0.03, 0.04, 0.06]);
      const dv = clean(v + offsets[0]), pv = clean(v + offsets[1]);
      if (dv <= 0 || pv <= 0 || dv >= 1 || pv >= 1 || dv === pv) continue;
      const items = [
        { tex: `\\frac{${fn}}{${fd}}`, v },
        { tex: num(dv), v: dv },
        { tex: `${num(pv * 100)}\\%`, v: pv },
      ];
      const sorted = [...items].sort((x, y) => x.v - y.v);
      const list = (xs: typeof items) => xs.map((x) => `$${x.tex}$`).join(', ');
      const perms = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => sorted[i]));
      // Misconception: compare the digits you see (36% "beats" 0.4 because 36 > 4).
      const byVisible = [...items].sort((x, y) => parseFloat(x.tex.replace(/[^0-9.]/g, '')) - parseFloat(y.tex.replace(/[^0-9.]/g, '')));
      return buildQuestion(rng, {
        skillId: 'number-sense', difficulty,
        prompt: 'Which list is in order from **least to greatest**?',
        answer: { text: list(sorted), why: `Right. As decimals: ${sorted.map((x) => `$${num(clean(x.v))}$`).join(' < ')}.` },
        distractors: [
          { text: list(byVisible), trap: 'Compared different forms directly', why: 'That compares the digits as written. A fraction, a decimal and a percent are different "languages." Translate all three into decimals before comparing.' },
          { text: list([...sorted].reverse()), trap: 'Reversed the order', why: 'Right comparison, wrong direction: that\'s greatest to least.' },
          ...perms.map((p) => ({ text: list(p), why: 'Convert everything to decimals and line them up.' })),
        ],
        hints: ['Translate everything into the same form: decimals are easiest.', `$\\frac{${fn}}{${fd}} = ${num(v)}$, and $${num(pv * 100)}\\% = ${num(pv)}$.`],
        steps: [`$\\frac{${fn}}{${fd}} = ${num(v)}$`, `$${num(dv)}$ stays as it is.`, `$${num(pv * 100)}\\% = ${num(pv)}$`, `Least to greatest: ${list(sorted)}`],
      });
    }
  }

  // estimate
  const A = rng.pick([20, 30, 40, 50, 60, 70, 80, 90]), B = rng.pick([10, 20, 30, 40, 50, 200, 300]);
  const jitter = () => (rng.int(1, 6) / 10) * (rng.chance(0.5) ? 1 : -1);
  const x = clean(A + jitter()), y = clean(B + jitter());
  const ans = A * B;
  const o = (v: number, why: string, trap?: string): Option => ({ text: `$${num(v)}$`, value: v, why, trap });
  return buildQuestion(rng, {
    skillId: 'number-sense', difficulty,
    prompt: `Without working it out exactly, which is the best estimate of $${num(x)} \\times ${num(y)}$?`,
    answer: o(ans, `Right. Round to $${A} \\times ${B} = ${num(ans)}$.`),
    distractors: [
      o(ans / 10, `Count the zeros. $${A} \\times ${B}$: multiply ${A / 10} × ${B / 10} = ${(A * B) / 100}, then add back both zeros.`, 'Lost a zero'),
      o(ans * 10, `One zero too many: $${A} \\times ${B} = ${num(ans)}$.`, 'Extra zero'),
      o(A + B, 'You added. The question multiplies.', 'Wrong operation'),
    ],
    hints: ['Round each number to something friendly.', `$${num(x)} \\approx ${A}$ and $${num(y)} \\approx ${B}$.`],
    steps: [`Round: $${num(x)} \\approx ${A}$, $${num(y)} \\approx ${B}$`, `$${A} \\times ${B} = ${num(ans)}$`],
  });
};

export const numberSense: Skill = {
  id: 'number-sense',
  act: 1,
  name: 'Comparing & Converting',
  caseName: 'Three Witnesses, Three Languages',
  summary: 'Fractions, decimals and percents as translations of each other; ordering and estimating.',
  prereqs: ['decimals', 'fraction-basics'],
  board: { x: 72, y: 86 },
  generate,
  lesson: [
    {
      heading: 'Three languages, one meaning',
      body: `$\\frac{3}{4}$, $0.75$ and $75\\%$ say exactly the same thing in three different languages. Think of them as a translator's problem: before you compare two statements, put them in the same language.

**Decimals are the common tongue.** They're the easiest form to compare.`,
    },
    {
      heading: 'The translation table',
      body: `- **Fraction → decimal:** divide top by bottom. $\\frac{3}{8} = 3 \\div 8 = 0.375$.
- **Decimal → percent:** × 100 (point moves two right). $0.375 = 37.5\\%$.
- **Percent → decimal:** ÷ 100 (point moves two left). $6\\% = 0.06$.
- **Decimal → fraction:** read it aloud. $0.35$ is "thirty-five hundredths," $\\frac{35}{100} = \\frac{7}{20}$.

Worth memorising: $\\frac{1}{2} = 0.5$, $\\frac{1}{4} = 0.25$, $\\frac{3}{4} = 0.75$, $\\frac{1}{5} = 0.2$, $\\frac{1}{8} = 0.125$, $\\frac{1}{3} \\approx 0.333$, $\\frac{2}{3} \\approx 0.667$.`,
    },
    {
      heading: 'Comparing decimals: length is a liar',
      body: `Is $0.405$ bigger than $0.5$? It *looks* bigger: more digits. But pad them to the same length, $0.405$ vs $0.500$, and compare left to right. Tenths first: 4 vs 5. Done. $0.5$ wins.`,
    },
    {
      heading: 'Estimating',
      body: `When a question says *estimate* or *approximately*, it's inviting you to round. $49.7 \\times 20.3 \\approx 50 \\times 20 = 1000$.

For multiplying round numbers: multiply the front digits, then tack on all the zeros. $50 \\times 20$: $5 \\times 2 = 10$, plus two zeros, $1000$.

Estimation is also your **error-catcher** on every other question. If you calculate $\\$4.50 \\times 3$ and get $\\$135$, something slipped.`,
    },
  ],
};
