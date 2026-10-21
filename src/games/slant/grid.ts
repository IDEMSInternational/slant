/**
 * Conventions shared by the Slant modules, as in the original:
 *
 * - The board has w × h squares, indexed y * w + x.
 * - Clues sit on the (w+1) × (h+1) grid points, indexed y * (w+1) + x.
 * - A square holds BACKSLASH (\, joining its top-left and bottom-right
 *   points), FORWARD (/, joining top-right and bottom-left) or EMPTY.
 * - A clue is the number of lines touching its point, or NO_CLUE.
 */

export const BACKSLASH = -1;
export const FORWARD = 1;
export const EMPTY = 0;
export const NO_CLUE = -1;

export type Slash = typeof BACKSLASH | typeof FORWARD | typeof EMPTY;

export interface Size {
  w: number;
  h: number;
}

/** The two grid points a slash joins in square (x, y), as point indices. */
export function slashEnds(size: Size, x: number, y: number, slash: Slash): [number, number] {
  const W = size.w + 1;
  return slash === BACKSLASH ? [y * W + x, (y + 1) * W + x + 1] : [y * W + x + 1, (y + 1) * W + x];
}

/** How many lines touch grid point (x, y). */
export function pointDegree(size: Size, slashes: Int8Array, x: number, y: number): number {
  const { w, h } = size;
  let degree = 0;
  if (x > 0 && y > 0 && slashes[(y - 1) * w + (x - 1)] === BACKSLASH) degree++;
  if (x > 0 && y < h && slashes[y * w + (x - 1)] === FORWARD) degree++;
  if (x < w && y > 0 && slashes[(y - 1) * w + x] === FORWARD) degree++;
  if (x < w && y < h && slashes[y * w + x] === BACKSLASH) degree++;
  return degree;
}
