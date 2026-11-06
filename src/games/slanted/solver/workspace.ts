import { Dsf } from '@studio/engine/algorithms/dsf';
import { BACKSLASH, NO_CLUE, Size } from '../grid';

/**
 * Possible "v" shapes between neighbouring squares, as bits of `vShapes`:
 * the square and the one to its right may form a v (1) or a ^ (2); the
 * square and the one below may form a > (4) or a < (8).
 */
export const V_RIGHT = 0x1;
export const CARET_RIGHT = 0x2;
export const GT_BELOW = 0x4;
export const LT_BELOW = 0x8;

/**
 * Everything the solver tracks while it works. Ported from struct
 * solver_scratch in the original.
 */
export class SolverWorkspace {
  readonly w: number;
  readonly h: number;
  readonly clues: Int8Array;
  /** Which grid points are joined by lines. */
  readonly connected: Dsf;
  /** For each group of joined points: how many more lines it could still take. */
  readonly exits: Int32Array;
  /** For each group of joined points: whether it touches the edge of the board. */
  readonly border: Uint8Array;
  /** Squares known to hold the same kind of slash. */
  readonly equiv: Dsf;
  /** The slash known for each group of equivalent squares, or 0. */
  readonly slashValue: Int8Array;
  /** Which v shapes are still possible at each square (bits above). */
  readonly vShapes: Uint8Array;

  constructor(size: Size, clues: Int8Array) {
    const { w, h } = size;
    const W = w + 1;
    const H = h + 1;
    this.w = w;
    this.h = h;
    this.clues = clues;
    this.connected = new Dsf(W * H);
    this.exits = new Int32Array(W * H);
    this.border = new Uint8Array(W * H);
    this.equiv = new Dsf(w * h);
    this.slashValue = new Int8Array(w * h);
    this.vShapes = new Uint8Array(w * h).fill(0xf);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        this.border[i] = y === 0 || y === H - 1 || x === 0 || x === W - 1 ? 1 : 0;
        this.exits[i] = clues[i] === NO_CLUE ? 4 : clues[i];
      }
    }
  }

  /** Rules out some v shapes at square (x, y). Returns true if any were still possible. */
  clearVShapes(x: number, y: number, bits: number): boolean {
    const i = y * this.w + x;
    if (!(this.vShapes[i] & bits)) return false;
    this.vShapes[i] &= ~bits;
    return true;
  }
}

/**
 * Puts a slash in square (x, y), joining its two points, and updates the
 * workspace if given. Ported from fill_square(): like the original's
 * release build, it does not check for a slash already there or a loop.
 */
export function fillSquare(
  size: Size,
  x: number,
  y: number,
  slash: number,
  slashes: Int8Array,
  connected: Dsf,
  ws: SolverWorkspace | null,
): void {
  const { w } = size;
  const W = w + 1;
  if (slashes[y * w + x] === slash) return;

  // The points this slash joins, and the two it keeps apart.
  const [join1, join2, apart1, apart2] =
    slash === BACKSLASH
      ? [y * W + x, (y + 1) * W + x + 1, y * W + x + 1, (y + 1) * W + x]
      : [y * W + x + 1, (y + 1) * W + x, y * W + x, (y + 1) * W + x + 1];

  slashes[y * w + x] = slash;
  if (ws) ws.slashValue[ws.equiv.canonify(y * w + x)] = slash;

  mergePoints(connected, ws, join1, join2);
  if (ws) {
    reduceExits(ws, apart1);
    reduceExits(ws, apart2);
  }
}

/** Joins two points' groups, combining their exit counts and border flags. */
function mergePoints(connected: Dsf, ws: SolverWorkspace | null, a: number, b: number): void {
  if (!ws) {
    connected.merge(a, b);
    return;
  }
  const ra = connected.canonify(a);
  const rb = connected.canonify(b);
  // Each group uses up one of its exits on the new line.
  const exits = ws.exits[ra] + ws.exits[rb] - 2;
  const border = ws.border[ra] || ws.border[rb];
  connected.merge(ra, rb);
  const root = connected.canonify(ra);
  ws.exits[root] = exits;
  ws.border[root] = border;
}

/** A line was kept away from a point: a point without a clue loses one possible exit. */
function reduceExits(ws: SolverWorkspace, point: number): void {
  if (ws.clues[point] === NO_CLUE) ws.exits[ws.connected.canonify(point)]--;
}
