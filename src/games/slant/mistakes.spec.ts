import { BACKSLASH, EMPTY, FORWARD } from './grid';
import { findMistakes } from './mistakes';
import { decodeParams } from './params';
import { slantGame as game } from './slant-game';

const B = BACKSLASH;
const F = FORWARD;
const _ = EMPTY;

describe('Slant mistakes', () => {
  it('marks only the lines that form a closed loop', () => {
    // 3×2 with no clues: a diamond in the left 2×2, plus a stray line.
    const state = game.newGame(decodeParams('3x2de'), 'l');
    const slashes = Int8Array.of(F, B, B, B, F, _);
    const { loopSquares } = findMistakes({ ...state, slashes });
    expect(Array.from(loopSquares)).toEqual([1, 1, 0, 1, 1, 0]);
  });

  it('marks no loop lines when there is no loop', () => {
    const state = game.newGame(decodeParams('3x2de'), 'l');
    const slashes = Int8Array.of(B, B, B, B, F, _);
    expect(findMistakes({ ...state, slashes }).loopSquares.every((s) => s === 0)).toBe(true);
  });

  it('marks numbers with too many lines, or that can no longer get enough', () => {
    // 2×2 squares, so a 3×3 grid of points: a 1 in the top-left corner, a 2 in the centre.
    const state = game.newGame(decodeParams('2x2de'), '1c2d');
    const W = 3;
    const centre = 1 * W + 1;
    const corner = 0;

    // Nothing drawn: both can still be satisfied.
    let bad = findMistakes({ ...state, slashes: Int8Array.of(_, _, _, _) }).badClues;
    expect([bad[corner], bad[centre]]).toEqual([0, 0]);

    // Three lines touch the centre 2: too many.
    bad = findMistakes({ ...state, slashes: Int8Array.of(B, F, F, _) }).badClues;
    expect(bad[centre]).toBe(1);

    // The corner 1's only square points away from it: it can never be reached.
    bad = findMistakes({ ...state, slashes: Int8Array.of(F, _, _, _) }).badClues;
    expect(bad[corner]).toBe(1);

    // Three squares point away from the centre 2, one left: it can't reach 2.
    bad = findMistakes({ ...state, slashes: Int8Array.of(F, B, B, _) }).badClues;
    expect(bad[centre]).toBe(1);
  });
});
