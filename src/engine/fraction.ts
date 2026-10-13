// Exact fraction arithmetic and TeX formatting.

export interface Frac {
  n: number;
  d: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** A reduced fraction with a positive denominator. */
export function frac(n: number, d = 1): Frac {
  if (d === 0) throw new Error('zero denominator');
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: (sign * n) / g, d: (sign * d) / g };
}

/** A fraction kept exactly as written (not reduced), for showing mistakes. */
export function raw(n: number, d: number): Frac {
  return { n, d };
}

export const add = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);
export const value = (f: Frac) => f.n / f.d;
export const isWhole = (f: Frac) => f.n % f.d === 0;

/** Mixed number from whole part and proper fraction, e.g. mixed(2, 3, 4) = 11/4. */
export function mixed(whole: number, n: number, d: number): Frac {
  return frac(whole * d + n, d);
}

/** TeX for a fraction. `asMixed` writes improper fractions as mixed numbers. */
export function tex(f: Frac, asMixed = false): string {
  const sign = f.n < 0 ? '-' : '';
  const n = Math.abs(f.n);
  if (f.d === 1) return `${sign}${n}`;
  if (asMixed && n > f.d) {
    const whole = Math.floor(n / f.d);
    const rem = n % f.d;
    if (rem === 0) return `${sign}${whole}`;
    return `${sign}${whole}\\tfrac{${rem}}{${f.d}}`;
  }
  return `${sign}\\frac{${n}}{${f.d}}`;
}
