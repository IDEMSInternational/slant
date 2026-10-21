import { Tutorial, TutorialStep } from '@studio/engine/tutorial';
import { BACKSLASH, EMPTY, FORWARD, Slash } from './grid';
import { SlantHint } from './hint';
import { SlantMove, SquareChange } from './moves';
import { EASY, SlantParams } from './params';
import { SlantState } from './state';

/**
 * The tutorial puzzle (4×4, unique solution). Clues sit on grid points:
 *
 *     · 2 · 0 ·        / \ \ /
 *     · · · · ·        / \ \ /
 *     2 · · 4 ·        \ \ / \
 *     · · 3 · ·        / \ \ \
 *     · 0 · · ·
 */
const DESCRIPTION = 'a2a0f2b4c3c0c';

const line = (x: number, y: number, slash: Slash): SquareChange => ({ x, y, slash });
const has = (state: SlantState, c: SquareChange) => state.slashes[c.y * state.w + c.x] === c.slash;

/** The swipe hint for one slash: across its square, from one end to the other. */
function swipeHint(c: SquareChange, note?: string): SlantHint {
  const path =
    c.slash === BACKSLASH
      ? [{ x: c.x, y: c.y }, { x: c.x + 1, y: c.y + 1 }]
      : [{ x: c.x, y: c.y + 1 }, { x: c.x + 1, y: c.y }];
  return { gesture: 'swipe', path, note };
}

/**
 * A step: draw these slashes, one swipe each. The hint shows the next one
 * still to draw, so the player is guided square by square.
 */
function draw(text: string, ...wanted: SquareChange[]): TutorialStep<SlantState, SlantMove, SlantHint> {
  return {
    text,
    hint: (state) => {
      const next = wanted.find((c) => !has(state, c));
      return next && swipeHint(next);
    },
    expect: (move) =>
      move.kind === 'set' && move.changes.length === 1 && wanted.some((c) => sameChange(c, move.changes[0])),
    done: (state) => wanted.every((c) => has(state, c)),
  };
}

const LOOP_SQUARE = { x: 1, y: 1 };

/**
 * Teaches by doing, one swipe or tap at a time: the rules and a 4, a 0,
 * a 3, then a line that closes a loop (drawn, recognised and removed),
 * then the rest of the puzzle alone.
 */
export const slantTutorial: Tutorial<SlantParams, SlantState, SlantMove, SlantHint> = {
  params: { w: 4, h: 4, difficulty: EASY },
  description: DESCRIPTION,
  steps: [
    draw(
      'Draw a diagonal line in every square. Each number shows how many lines touch that point, ' +
        'and the lines must never form a closed loop. This 4 needs a line in all four squares ' +
        'around it. Swipe across each one.',
      line(2, 1, BACKSLASH),
      line(3, 1, FORWARD),
      line(3, 2, BACKSLASH),
      line(2, 2, FORWARD),
    ),
    draw(
      'A 0 means no line can touch that point, so the lines next to it must point away from it. ' +
        'Swipe across both squares.',
      line(0, 3, FORWARD),
      line(1, 3, BACKSLASH),
    ),
    draw(
      'This 3 needs three lines. One already touches it and the line below on its left points away, ' +
        'so the other two must both touch it. Swipe across them.',
      line(1, 2, BACKSLASH),
      line(2, 3, BACKSLASH),
    ),
    draw('Now try a line in this square.', line(1, 1, FORWARD)),
    {
      text: 'That closes a loop, which isn’t allowed. Tap it to remove it.',
      hint: { gesture: 'tap', square: LOOP_SQUARE, note: 'Closed loop' },
      expect: (move) =>
        move.kind === 'set' && move.changes.some((c) => sameChange(c, line(LOOP_SQUARE.x, LOOP_SQUARE.y, EMPTY))),
      done: (state) => has(state, line(LOOP_SQUARE.x, LOOP_SQUARE.y, EMPTY)),
    },
    draw('So this square must slant the other way. Draw it.', line(1, 1, BACKSLASH)),
    {
      text: 'Now finish the puzzle yourself.',
      done: (state) => state.completed,
    },
  ],
};

function sameChange(a: SquareChange, b: SquareChange): boolean {
  return a.x === b.x && a.y === b.y && a.slash === b.slash;
}
