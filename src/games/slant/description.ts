import { NO_CLUE, Size } from './grid';

/**
 * Text form of a puzzle, compatible with the original collection. Clue
 * points are listed row by row: a digit 0–4 is a clue, and a letter stands
 * for a run of points without clues (a = 1 ... z = 26).
 * Example: "a0b3c1".
 */

export function encodeDescription(clues: ArrayLike<number>): string {
  let text = '';
  let run = 0;
  for (let i = 0; i <= clues.length; i++) {
    const n = i < clues.length ? clues[i] : -2;
    if (n === NO_CLUE) {
      run++;
      continue;
    }
    while (run > 0) {
      const chunk = Math.min(run, 26);
      text += String.fromCharCode(96 + chunk);
      run -= chunk;
    }
    if (n >= 0) text += String(n);
  }
  return text;
}

/** Returns an error message, or null if `text` describes clues for this size. */
export function validateDescription(size: Size, text: string): string | null {
  if (!/^[a-z0-4]*$/.test(text)) return 'Invalid character in game description';
  const points = decodePoints(text).length;
  const area = (size.w + 1) * (size.h + 1);
  if (points < area) return 'Not enough data to fill grid';
  if (points > area) return 'Too much data to fit in grid';
  return null;
}

/** Decodes a valid description into clues, one per grid point. */
export function decodeDescription(size: Size, text: string): Int8Array {
  const error = validateDescription(size, text);
  if (error) throw new Error(error);
  return Int8Array.from(decodePoints(text));
}

function decodePoints(text: string): number[] {
  const points: number[] = [];
  for (const c of text) {
    if (c >= 'a' && c <= 'z') for (let i = 0; i < c.charCodeAt(0) - 96; i++) points.push(NO_CLUE);
    else points.push(Number(c));
  }
  return points;
}
