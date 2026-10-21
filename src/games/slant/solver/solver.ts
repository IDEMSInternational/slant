import { EASY } from '../params';
import { BACKSLASH, EMPTY, FORWARD, NO_CLUE, Size } from '../grid';
import { CARET_RIGHT, GT_BELOW, LT_BELOW, SolverWorkspace, V_RIGHT, fillSquare } from './workspace';

export type SolverResult = 'solved' | 'ambiguous' | 'impossible';

/** Thrown inside the solver when the clues contradict each other. */
class Impossible extends Error {}

/**
 * Solves a Slant puzzle by deduction, porting slant_solve() from the
 * original. Easy uses only clue counting and simple loop avoidance; Hard
 * adds dead-end avoidance and reasoning about squares that must slant the
 * same way. `slashes` receives the (possibly partial) solution.
 */
export function solveSlant(
  size: Size,
  clues: Int8Array,
  difficulty: number,
  slashes = new Int8Array(size.w * size.h),
): SolverResult {
  slashes.fill(EMPTY);
  const ws = new SolverWorkspace(size, clues);
  const hard = difficulty > EASY;

  try {
    for (;;) {
      if (fillAroundClues(ws, slashes, hard)) continue;
      if (avoidLoops(ws, slashes, hard)) continue;
      if (!hard || !reasonAboutVShapes(ws, slashes)) break;
    }
  } catch (e) {
    if (e instanceof Impossible) return 'impossible';
    throw e;
  }
  return slashes.includes(EMPTY) ? 'ambiguous' : 'solved';
}

/** A square next to a clue point, and the slash that would touch the point. */
interface Neighbour {
  pos: number;
  slash: number;
}

/**
 * At a clue point that needs no more lines, or as many lines as it has
 * undecided squares, every undecided square around it is decided.
 * On Hard, two undecided neighbours known to slant the same way count as
 * one line, and a point needing one line from two adjacent undecided
 * squares makes them slant the same way.
 */
function fillAroundClues(ws: SolverWorkspace, slashes: Int8Array, hard: boolean): boolean {
  const { w, h } = ws;
  const W = w + 1;
  let progress = false;

  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const clue = ws.clues[y * W + x];
      if (clue === NO_CLUE) continue;

      // The squares around the point, in order around it.
      const around: Neighbour[] = [];
      if (x > 0 && y > 0) around.push({ pos: (y - 1) * w + (x - 1), slash: BACKSLASH });
      if (x > 0 && y < h) around.push({ pos: y * w + (x - 1), slash: FORWARD });
      if (x < w && y < h) around.push({ pos: y * w + x, slash: BACKSLASH });
      if (x < w && y > 0) around.push({ pos: (y - 1) * w + x, slash: FORWARD });

      let undecided = 0;
      let needed = clue;
      let last = around[around.length - 1].pos;
      let eq = slashes[last] === EMPTY ? ws.equiv.canonify(last) : -1;
      let pairClass = -1;
      let pair1 = -1;
      let pair2 = -1;
      for (const { pos, slash } of around) {
        if (slashes[pos] === EMPTY) {
          undecided++;
          if (pairClass < 0 && hard) {
            const eq2 = ws.equiv.canonify(pos);
            if (eq === eq2 && last !== pos) {
              // Two neighbours slanting the same way: together, exactly one line.
              pairClass = eq;
              pair1 = last;
              pair2 = pos;
              needed--;
              undecided -= 2;
            } else {
              eq = eq2;
            }
          }
        } else {
          eq = -1;
          if (slashes[pos] === slash) needed--;
        }
        last = pos;
      }

      if (needed < 0 || needed > undecided) throw new Impossible();

      if (undecided > 0 && (needed === 0 || needed === undecided)) {
        for (const { pos, slash } of around) {
          if (slashes[pos] === EMPTY && pos !== pair1 && pos !== pair2) {
            fillSquare(ws, pos % w, Math.floor(pos / w), needed ? slash : -slash, slashes, ws.connected, ws);
          }
        }
        progress = true;
      } else if (undecided === 2 && needed === 1 && hard) {
        markAdjacentPairEquivalent(ws, slashes, around, pair1, pair2);
      }
    }
  }
  return progress;
}

/** Two adjacent undecided squares that share one line must slant the same way. */
function markAdjacentPairEquivalent(
  ws: SolverWorkspace,
  slashes: Int8Array,
  around: Neighbour[],
  skip1: number,
  skip2: number,
): void {
  let first = -1;
  let i = 0;
  for (; i < around.length; i++) {
    const pos = around[i].pos;
    if (slashes[pos] !== EMPTY || pos === skip1 || pos === skip2) continue;
    if (first < 0) first = i;
    else if (first === i - 1 || (first === 0 && i === 3)) break;
  }
  if (i >= around.length) return;

  const a = ws.equiv.canonify(around[first].pos);
  const b = ws.equiv.canonify(around[i].pos);
  const va = ws.slashValue[a];
  const vb = ws.slashValue[b];
  if (va !== 0 && vb !== 0 && va !== vb) throw new Impossible();
  ws.equiv.merge(a, b);
  ws.slashValue[ws.equiv.canonify(a)] = va || vb;
}

/**
 * A slash that would close a loop is impossible, so the square takes the
 * other one. On Hard, also avoid joining two "dead ends" (groups away from
 * the edge with at most one exit left), and copy known equivalent squares.
 */
function avoidLoops(ws: SolverWorkspace, slashes: Int8Array, hard: boolean): boolean {
  const { w, h, connected } = ws;
  const W = w + 1;
  let progress = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (slashes[y * w + x] !== EMPTY) continue;
      const known = hard ? ws.slashValue[ws.equiv.canonify(y * w + x)] : 0;

      const mustBeForward =
        closesOrStrands(ws, connected.canonify(y * W + x), connected.canonify((y + 1) * W + x + 1), hard) ||
        known === FORWARD;
      const mustBeBackslash =
        closesOrStrands(ws, connected.canonify(y * W + x + 1), connected.canonify((y + 1) * W + x), hard) ||
        known === BACKSLASH;

      if (mustBeForward && mustBeBackslash) throw new Impossible();
      if (mustBeForward) fillSquare(ws, x, y, FORWARD, slashes, connected, ws);
      else if (mustBeBackslash) fillSquare(ws, x, y, BACKSLASH, slashes, connected, ws);
      else continue;
      progress = true;
    }
  }
  return progress;
}

/** Would joining these two point groups close a loop (or, on Hard, strand a dead end)? */
function closesOrStrands(ws: SolverWorkspace, a: number, b: number, hard: boolean): boolean {
  if (a === b) return true;
  return hard && !ws.border[a] && !ws.border[b] && ws.exits[a] <= 1 && ws.exits[b] <= 1;
}

/**
 * Hard only: tracks which v shapes (pairs of squares meeting in a point)
 * are possible. Lines rule out shapes they contradict; 1s and 3s rule out
 * shapes pointing at or away from them; a 2 passes rulings across itself.
 * Two squares that can form neither kind of v must slant the same way.
 */
function reasonAboutVShapes(ws: SolverWorkspace, slashes: Int8Array): boolean {
  const { w, h, vShapes } = ws;
  const W = w + 1;
  let progress = false;
  const clear = (x: number, y: number, bits: number) => {
    if (ws.clearVShapes(x, y, bits)) progress = true;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = slashes[y * w + x];
      if (s !== EMPTY) {
        const back = s === BACKSLASH;
        if (x > 0) clear(x - 1, y, back ? V_RIGHT : CARET_RIGHT);
        if (x + 1 < w) clear(x, y, back ? CARET_RIGHT : V_RIGHT);
        if (y > 0) clear(x, y - 1, back ? GT_BELOW : LT_BELOW);
        if (y + 1 < h) clear(x, y, back ? LT_BELOW : GT_BELOW);
      }

      if (x + 1 < w && !(vShapes[y * w + x] & (V_RIGHT | CARET_RIGHT))) {
        if (!ws.equiv.equivalent(y * w + x, y * w + x + 1)) {
          ws.equiv.merge(y * w + x, y * w + x + 1);
          progress = true;
        }
      }
      if (y + 1 < h && !(vShapes[y * w + x] & (GT_BELOW | LT_BELOW))) {
        if (!ws.equiv.equivalent(y * w + x, (y + 1) * w + x)) {
          ws.equiv.merge(y * w + x, (y + 1) * w + x);
          progress = true;
        }
      }

      // The rest only applies to clue points away from the edge.
      if (y === 0 || x === 0) continue;
      const clue = ws.clues[y * W + x];
      if (clue === 1) {
        // No v shape may point at a 1.
        clear(x - 1, y - 1, V_RIGHT | GT_BELOW);
        clear(x - 1, y, CARET_RIGHT);
        clear(x, y - 1, LT_BELOW);
      } else if (clue === 3) {
        // No v shape may point away from a 3.
        clear(x - 1, y - 1, CARET_RIGHT | LT_BELOW);
        clear(x - 1, y, V_RIGHT);
        clear(x, y - 1, GT_BELOW);
      } else if (clue === 2) {
        // A shape ruled out on one side of a 2 is ruled out on the other.
        clear(x - 1, y - 1, (vShapes[y * w + (x - 1)] & 0x3) ^ 0x3);
        clear(x - 1, y - 1, (vShapes[(y - 1) * w + x] & 0xc) ^ 0xc);
        clear(x - 1, y, (vShapes[(y - 1) * w + (x - 1)] & 0x3) ^ 0x3);
        clear(x, y - 1, (vShapes[(y - 1) * w + (x - 1)] & 0xc) ^ 0xc);
      }
    }
  }
  return progress;
}
