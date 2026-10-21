import { BACKSLASH, FORWARD, Size } from './grid';

/**
 * Text form of a solution, compatible with the original: one character per
 * square, row by row, "\" or "/".
 */
export function encodeSolution(slashes: ArrayLike<number>): string {
  return Array.from(slashes, (s) => (s === BACKSLASH ? '\\' : '/')).join('');
}

/** Reads a solution string; returns null if it isn't one for this size. */
export function decodeSolution(size: Size, text: string): Int8Array | null {
  if (text.length !== size.w * size.h || !/^[\\/]*$/.test(text)) return null;
  return Int8Array.from(text, (c) => (c === '\\' ? BACKSLASH : FORWARD));
}
