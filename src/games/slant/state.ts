import { Dsf } from '@studio/engine/algorithms/dsf';
import { EMPTY, NO_CLUE, Size, pointDegree, slashEnds } from './grid';

/** A position in a game of Slant. Treated as immutable. */
export interface SlantState extends Size {
  /** Clue per grid point, (w+1) × (h+1), or NO_CLUE. */
  readonly clues: Int8Array;
  /** Slash per square: BACKSLASH, FORWARD or EMPTY. */
  readonly slashes: Int8Array;
  /**
   * 1 for each slash drawn in thinking mode (shown dotted): part of a
   * hypothesis the player may keep or discard. It still counts towards
   * the solution.
   */
  readonly tentative: Uint8Array;
  readonly completed: boolean;
  /** True once the player has used "Solve". */
  readonly cheated: boolean;
}

/**
 * True when every square has a slash (solid or dotted), every clue point
 * touches exactly its number of lines, and the lines form no closed loop.
 * Only the finished puzzle is judged: nothing is marked right or wrong
 * along the way.
 */
export function isSolved(state: Size & { clues: Int8Array; slashes: Int8Array }): boolean {
  const { w, h, clues, slashes } = state;
  if (slashes.includes(EMPTY)) return false;

  const W = w + 1;
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const clue = clues[y * W + x];
      if (clue !== NO_CLUE && pointDegree(state, slashes, x, y) !== clue) return false;
    }
  }

  const connected = new Dsf(W * (h + 1));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [a, b] = slashEnds(state, x, y, slashes[y * w + x] as -1 | 1);
      if (connected.equivalent(a, b)) return false; // closes a loop
      connected.merge(a, b);
    }
  }
  return true;
}
