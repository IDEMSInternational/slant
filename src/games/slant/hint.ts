import { Point } from './input';

/**
 * Tutorial guidance drawn on the Slant board: a swipe through a path of
 * grid points (each step a diagonal across one square), or a tap on a
 * square. An optional short note sits next to it.
 */
export type SlantHint =
  | { gesture: 'swipe'; path: readonly Point[]; note?: string }
  | { gesture: 'tap'; square: Point; note?: string };
