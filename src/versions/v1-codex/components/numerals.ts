/** Chiffres romains des volumes et des ordinaux de rois (I à MMMCMXCIX). */
const ROMAN: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** `toRoman(5)` -> « V ». Hors de 1 à 3999 : le nombre en chiffres arabes. */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);
  let rest = value;
  let out = '';
  for (const [amount, letters] of ROMAN) {
    while (rest >= amount) {
      out += letters;
      rest -= amount;
    }
  }
  return out;
}
