import { Dsf } from '@studio/engine/algorithms/dsf';
import { EMPTY, NO_CLUE, Size, pointDegree, slashEnds } from './grid';

/** What "Show mistakes" marks on a Slant board. */
export interface SlantMistakes {
  /** 1 for each square whose line is part of a closed loop. */
  readonly loopSquares: Uint8Array;
  /** 1 for each clue point that can no longer be satisfied. */
  readonly badClues: Uint8Array;
}

/**
 * Finds rule-breaking parts of a Slant board. Dotted (thinking-mode)
 * lines count like solid ones, since they count towards the solution.
 */
export function findMistakes(state: Size & { clues: Int8Array; slashes: Int8Array }): SlantMistakes {
  return { loopSquares: findLoopSquares(state, state.slashes), badClues: findBadClues(state) };
}

/**
 * A clue is bad if it already touches more lines than its number, or if
 * so many squares around it point away that it can never reach its number.
 * A clue that could still be satisfied is never marked.
 */
function findBadClues(state: Size & { clues: Int8Array; slashes: Int8Array }): Uint8Array {
  const { w, h, clues, slashes } = state;
  const W = w + 1;
  const bad = new Uint8Array(clues.length);
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const clue = clues[y * W + x];
      if (clue === NO_CLUE) continue;
      const touching = pointDegree(state, slashes, x, y);
      const undecided = squaresAround(state, x, y).filter((s) => slashes[s] === EMPTY).length;
      if (touching > clue || touching + undecided < clue) bad[y * W + x] = 1;
    }
  }
  return bad;
}

/** The squares that meet at grid point (x, y). */
function squaresAround(size: Size, x: number, y: number): number[] {
  const { w, h } = size;
  const squares: number[] = [];
  if (x > 0 && y > 0) squares.push((y - 1) * w + (x - 1));
  if (x > 0 && y < h) squares.push(y * w + (x - 1));
  if (x < w && y > 0) squares.push((y - 1) * w + x);
  if (x < w && y < h) squares.push(y * w + x);
  return squares;
}

/**
 * Squares whose line lies on a closed loop: a line is on a loop exactly
 * when its two ends are still joined by the other lines without it.
 */
function findLoopSquares(size: Size, slashes: Int8Array): Uint8Array {
  const { w, h } = size;
  const points = (w + 1) * (h + 1);
  const onLoop = new Uint8Array(w * h);
  const lines: [number, number, number][] = [];
  slashes.forEach((slash, s) => {
    if (slash !== EMPTY) lines.push([s, ...slashEnds(size, s % w, Math.floor(s / w), slash as -1 | 1)]);
  });

  // Quick check: no loop at all is the usual case.
  const all = new Dsf(points);
  let anyLoop = false;
  for (const [, a, b] of lines) {
    if (all.equivalent(a, b)) anyLoop = true;
    all.merge(a, b);
  }
  if (!anyLoop) return onLoop;

  for (const [square, a, b] of lines) {
    const others = new Dsf(points);
    for (const [other, c, d] of lines) if (other !== square) others.merge(c, d);
    if (others.equivalent(a, b)) onLoop[square] = 1;
  }
  return onLoop;
}
