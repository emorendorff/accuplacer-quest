// Number formatting for prompts and answer choices.

/** Strip floating-point noise: 0.1 + 0.2 -> 0.3. */
export function clean(x: number, places = 10): number {
  return Number(x.toFixed(places));
}

/** Plain-text number with thousands separators. */
export function fmt(x: number, maxDecimals = 6): string {
  return clean(x).toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
}

/** TeX-safe number: commas wrapped so KaTeX doesn't add a space after them. */
export function num(x: number, maxDecimals = 6): string {
  return fmt(x, maxDecimals).replace(/,/g, '{,}');
}

/** Money with exactly two decimals, e.g. $1,250.50. TeX-safe. */
export function money(x: number): string {
  const s = clean(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `\\$${s.replace(/,/g, '{,}')}`;
}

/** Inline-math wrapper for prose strings. */
export const m = (texSrc: string) => `$${texSrc}$`;
