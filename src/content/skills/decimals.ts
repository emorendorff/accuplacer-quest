import { clean, money, num } from '../../engine/format';
import { buildQuestion, type Generator, type Option } from '../../engine/question';
import type { Skill } from './types';

const D = (x: number) => `$${num(clean(x))}$`;
const o = (x: number, why: string, trap?: string): Option => ({ text: D(x), value: clean(x), why, trap });
const slip = (x: number) => o(x, 'Close, but not it. Line up the decimal points and redo it one column at a time.');

const generate: Generator = (rng, difficulty) => {
  const variant = difficulty === 1 ? rng.pick(['add', 'subtract', 'round']) : difficulty === 2 ? rng.pick(['multiply', 'divide']) : rng.pick(['toDecimal', 'change']);

  if (variant === 'add') {
    const x = clean(rng.int(11, 99) / 10), y = clean(rng.int(11, 99) / 100);
    const ans = clean(x + y);
    const xi = Math.round(x * 10), yi = Math.round(y * 100);
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `What is $${num(x)} + ${num(y)}$?`,
      answer: o(ans, `Right. Line up the decimal points: $${x.toFixed(2)} + ${y.toFixed(2)} = ${ans.toFixed(2)}$.`),
      distractors: [
        o((xi + yi) / 100, `You lined up the right-hand edges of the numbers instead of the decimal points, which added tenths to hundredths. Pad with zeros so both have the same number of decimal places: $${x.toFixed(2)}$.`, 'Lined up the wrong edge'),
        o((xi + yi) / 10, `You added the digits as if both had one decimal place. $${num(y)}$ has two. Pad $${num(x)}$ to $${x.toFixed(2)}$ and line up the points.`, 'Lined up the wrong edge'),
        slip(ans + 0.1), slip(ans - 0.1), slip(ans + 1),
      ],
      hints: ['Line up the decimal points, not the last digits.', `Write $${num(x)}$ as $${x.toFixed(2)}$ so both have two decimal places.`],
      steps: [`$${x.toFixed(2)}$`, `$+\\,${y.toFixed(2)}$`, `$= ${ans.toFixed(2)}$`],
    });
  }

  if (variant === 'subtract') {
    const w = rng.int(3, 12), y = clean(rng.int(101, w * 100 - 101) / 100);
    if (Math.round(y * 100) % 10 === 0) return generate(rng, difficulty);
    const ans = clean(w - y);
    const whole = Math.floor(y), part = clean(y - whole);
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `What is $${w} - ${num(y)}$?`,
      answer: o(ans, `Right. Write ${w} as $${w}.00$ and subtract: $${w}.00 - ${y.toFixed(2)} = ${ans.toFixed(2)}$.`),
      distractors: [
        o(w - whole + part, `You subtracted the whole numbers and then just carried the $.${y.toFixed(2).split('.')[1]}$ along. But you're taking that part *away* too. Write ${w} as $${w}.00$ and borrow.`, 'Ignored the decimal part'),
        o(w - whole - 1 + part, `It looks like you borrowed but then *kept* the decimal part instead of subtracting it. $${w}.00 - ${y.toFixed(2)}$: work column by column from the right.`, 'Borrowing slip'),
        slip(ans + 1), slip(ans - 0.1), slip(ans + 0.1),
      ],
      hints: [`Write ${w} as $${w}.00$.`, 'Now subtract column by column from the right, borrowing as needed.'],
      steps: [`$${w}.00 - ${y.toFixed(2)}$`, `$= ${ans.toFixed(2)}$`, `Check: $${ans.toFixed(2)} + ${y.toFixed(2)} = ${w}.00$ ✓`],
    });
  }

  if (variant === 'round') {
    // 3 decimal places with the thousandths digit ≥ 5, so rounding and chopping differ.
    const intPart = rng.int(1, 40), tenths = rng.int(0, 9), hund = rng.int(0, 8), thou = rng.int(5, 9);
    const x = clean(intPart + tenths / 10 + hund / 100 + thou / 1000);
    const ans = clean(intPart + tenths / 10 + (hund + 1) / 100);
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `Round $${num(x)}$ to the nearest **hundredth**.`,
      answer: o(ans, `Right. The hundredths digit is ${hund}; the digit after it is ${thou}, which is 5 or more, so round up to $${ans.toFixed(2)}$.`),
      distractors: [
        o(intPart + tenths / 10 + hund / 100, `You chopped off the last digit instead of rounding. The digit after the hundredths place is ${thou}, which is 5 or more, so round *up*.`, 'Truncated instead of rounding'),
        o(Math.round(x * 10) / 10, `That's rounded to the nearest *tenth* (one decimal place). Hundredths is two decimal places.`, 'Wrong place value'),
        o(clean(intPart + (tenths + 1) / 10), `That's rounded up at the tenths place. Hundredths is the *second* digit after the point.`, 'Wrong place value'),
        o(Math.round(x), 'That\'s rounded to the nearest whole number.', 'Wrong place value'),
      ],
      hints: ['Hundredths is the second digit after the decimal point.', 'Look at the digit just after it: 5 or more rounds up.'],
      steps: [`Hundredths digit: ${hund}. Next digit: ${thou}.`, `${thou} ≥ 5, so round up: $${ans.toFixed(2)}$.`],
    });
  }

  if (variant === 'multiply') {
    const a = rng.int(2, 9), b = rng.int(2, 9);
    const places = rng.pick([[1, 1], [1, 2], [0, 1], [0, 2]] as const);
    const x = clean(a / 10 ** places[0]), y = clean(b / 10 ** places[1]);
    const ans = clean(x * y);
    const total = places[0] + places[1];
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `What is $${num(x)} \\times ${num(y)}$?`,
      answer: o(ans, `Right. $${a} \\times ${b} = ${a * b}$, and there are ${total} decimal place${total > 1 ? 's' : ''} in total, so $${num(ans)}$.`),
      distractors: [
        o(ans * 10, `You placed the decimal point one spot too far right. Count the decimal places in *both* numbers and add them: ${places[0]} + ${places[1]} = ${total}.`, 'Miscounted decimal places'),
        o(ans / 10, `One decimal place too many. Count the places in both numbers together: ${total}.`, 'Miscounted decimal places'),
        o(x + y, 'That\'s the sum. This one is multiplication.', 'Wrong operation'),
        o(ans * 100, 'Decimal point is two places off. Count decimal places in both numbers and add them.', 'Miscounted decimal places'),
      ],
      hints: ['Ignore the decimal points and multiply the digits.', `Then count the decimal places in both numbers together (${total}), and put that many in the answer.`],
      steps: [`Multiply as whole numbers: $${a} \\times ${b} = ${a * b}$.`, `Decimal places: ${places[0]} + ${places[1]} = ${total}.`, `So the answer is $${num(ans)}$.`, `Sanity check: multiplying by a number less than 1 makes the result *smaller*.`],
    });
  }

  if (variant === 'divide') {
    const y = clean(rng.int(2, 9) / 10), k = rng.int(3, 40);
    const x = clean(k * y);
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `What is $${num(x)} \\div ${num(y)}$?`,
      answer: o(k, `Right. Multiply both by 10 to clear the decimal: $${num(x * 10)} \\div ${num(y * 10)} = ${k}$.`),
      distractors: [
        o(k / 10, `You moved the decimal point the wrong way. Dividing by a number *smaller than 1* gives a *bigger* answer: how many ${num(y)}s fit into ${num(x)}? Lots.`, 'Moved the decimal the wrong way'),
        o(k * 10, `Off by a factor of 10. If you multiply one number by 10 to clear its decimal point, multiply the other by 10 as well.`, 'Shifted only one number'),
        o(x * y, 'That\'s multiplication. This one is division.', 'Wrong operation'),
        o(k + 1, 'Close. Recheck the division after shifting both decimal points.'),
      ],
      hints: [`Turn ${num(y)} into a whole number by multiplying by 10. Do the same to ${num(x)}.`, `Now it's $${num(x * 10)} \\div ${num(y * 10)}$.`],
      steps: [`Multiply both by 10: $${num(x)} \\div ${num(y)} = ${num(x * 10)} \\div ${num(y * 10)}$.`, `$${num(x * 10)} \\div ${num(y * 10)} = ${k}$`],
    });
  }

  if (variant === 'toDecimal') {
    const [n, d] = rng.pick([[1, 8], [3, 8], [5, 8], [7, 8], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 20], [3, 20], [7, 20], [9, 25], [3, 16]] as const);
    const ans = clean(n / d);
    return buildQuestion(rng, {
      skillId: 'decimals', difficulty,
      prompt: `Which decimal is equal to $\\frac{${n}}{${d}}$?`,
      answer: o(ans, `Right. A fraction bar means divide: $${n} \\div ${d} = ${num(ans)}$.`),
      distractors: [
        o(clean(Number(`${n}.${d}`)), `You wrote the top and bottom side by side with a point between them. A fraction means *top divided by bottom*.`, 'Read digits as a decimal'),
        o(clean(Number(`0.${n}${d}`)), `You wrote the digits after a decimal point. A fraction means *top divided by bottom*: $${n} \\div ${d}$.`, 'Read digits as a decimal'),
        o(clean(Math.round((d / n) * 1000) / 1000), `You divided the wrong way: bottom ÷ top. It's top ÷ bottom, and a proper fraction is always less than 1.`, 'Divided backwards'),
        o(clean(n / d / 10), 'One decimal place off. Check your long division.', 'Miscounted decimal places'),
      ],
      hints: ['The fraction bar means "divided by."', `Work out $${n} \\div ${d}$. Add zeros after a decimal point: $${n}.000 \\div ${d}$.`],
      steps: [`$\\frac{${n}}{${d}} = ${n} \\div ${d}$`, `$= ${num(ans)}$`],
      calculator: true,
    });
  }

  // change: a money word problem with several steps.
  const qty = rng.int(2, 5), price = clean(rng.int(115, 395) / 100), extra = clean(rng.int(25, 150) / 100);
  const subtotal = clean(qty * price + extra);
  const paid = [5, 10, 20, 50].find((bill) => bill > subtotal) ?? 100;
  const ans = clean(paid - subtotal);
  const M = (x: number): Option['text'] => `$${money(x)}$`;
  const mo = (x: number, why: string, trap?: string): Option => ({ text: M(x), value: clean(x), why, trap });
  return buildQuestion(rng, {
    skillId: 'decimals', difficulty,
    prompt: `At the diner, Vance orders ${qty} coffees at $${money(price)}$ each and a newspaper for $${money(extra)}$. She pays with a $${money(paid)}$ bill. How much change should she get?`,
    answer: mo(ans, `Right. Coffees: $${qty} \\times ${money(price)} = ${money(qty * price)}$. Plus the paper: $${money(subtotal)}$. Change: $${money(paid)} - ${money(subtotal)} = ${money(ans)}$.`),
    distractors: [
      mo(paid - price - extra, `You only counted one coffee. She ordered ${qty}, so multiply first: $${qty} \\times ${money(price)}$.`, 'Skipped a step'),
      mo(paid - qty * price, `You forgot the newspaper.`, 'Skipped a step'),
      mo(subtotal, `That's the total bill. The question asks for her *change*.`, 'Answered a different question'),
      mo(ans + 1, 'Close. Recheck the subtraction, lining up the decimal points.'),
    ],
    hints: ['Three steps: cost of the coffees, total bill, then change.', `Coffees: $${qty} \\times ${money(price)}$.`],
    steps: [`Coffees: $${qty} \\times ${money(price)} = ${money(qty * price)}$.`, `Total: $${money(qty * price)} + ${money(extra)} = ${money(subtotal)}$.`, `Change: $${money(paid)} - ${money(subtotal)} = ${money(ans)}$.`],
  });
};

export const decimals: Skill = {
  id: 'decimals',
  act: 1,
  name: 'Decimals',
  caseName: 'The Diner Receipt',
  summary: 'Lining up decimal points, multiplying and dividing decimals, rounding, and money problems.',
  prereqs: ['whole-numbers'],
  board: { x: 32, y: 74 },
  generate,
  lesson: [
    {
      heading: 'A decimal is a fraction in disguise',
      body: `Decimals are just fractions whose bottoms are 10, 100, 1000…

$0.7 = \\frac{7}{10}$ (seven tenths), $0.25 = \\frac{25}{100}$ (twenty-five hundredths), $0.375 = \\frac{375}{1000}$.

Each place to the right is ten times smaller: tenths, hundredths, thousandths. That's why money works: $\\$4.25$ is 4 dollars, 2 dimes (tenths of a dollar), 5 pennies (hundredths).`,
    },
    {
      heading: 'Adding and subtracting: line up the points',
      body: `The decimal point is the anchor. Line them up so tenths sit over tenths:

$\\begin{array}{r} 4.50 \\\\ +\\,0.37 \\\\ \\hline 4.87 \\end{array}$

Pad with zeros so the columns are even ($4.5$ becomes $4.50$; $7$ becomes $7.00$). Adding zeros at the *end* of a decimal never changes its value.`,
    },
    {
      heading: 'Multiplying: ignore the points, then count',
      body: `$0.3 \\times 0.04$: multiply $3 \\times 4 = 12$, ignoring the points. Then count the decimal places in the question: one in $0.3$, two in $0.04$, so three total. Put three in the answer: $0.012$.

Gut check: multiplying by a number less than 1 makes things *smaller*. $0.3 \\times 0.04$ should be tiny, and it is.`,
    },
    {
      heading: 'Dividing: make the divisor a whole number',
      body: `$6 \\div 0.2$ is annoying. But if you multiply *both* numbers by 10, the answer doesn't change (just like scaling a fraction's top and bottom): $60 \\div 2 = 30$.

Read it in English: "how many 0.2s fit into 6?" Five fit in each 1, so $6 \\times 5 = 30$. Dividing by something smaller than 1 gives something **bigger**.`,
    },
    {
      heading: 'Rounding',
      body: `To round to a place, look at the **next digit to the right**. 5 or more: round up. 4 or less: leave it.

$3.4567$ to the nearest hundredth: hundredths digit is 5, the next digit is 6, so round up to $3.46$.

Know your place names: tenths (1st after the point), hundredths (2nd), thousandths (3rd). The test loves offering the answer rounded to the wrong place.`,
    },
  ],
};
