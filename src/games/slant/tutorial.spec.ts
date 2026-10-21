import { TutorialRun } from '@studio/engine/tutorial';
import { BACKSLASH, EMPTY, FORWARD } from './grid';
import { SlantMove } from './moves';
import { EASY } from './params';
import { slantGame as game } from './slant-game';
import { solveSlant } from './solver/solver';
import { slantTutorial as tutorial } from './tutorial';

const set = (x: number, y: number, slash: number): SlantMove => ({
  kind: 'set',
  changes: [{ x, y, slash: slash as -1 | 0 | 1 }],
});

describe('Slant tutorial', () => {
  it('uses a puzzle that the Easy solver solves uniquely', () => {
    const initial = game.newGame(tutorial.params, tutorial.description);
    expect(solveSlant(initial, initial.clues, EASY)).toBe('solved');
  });

  it('can be played through from start to finish, one square per swipe', () => {
    const run = new TutorialRun(game, tutorial);
    const play = (move: SlantMove, result = 'applied') => {
      expect(run.move(move)).toBe(result);
      if (result === 'step-done') run.next();
    };

    // The 4: four squares, the hint moving to each one still to draw.
    play(set(0, 0, BACKSLASH), 'refused');
    expect(run.hint).toEqual({ gesture: 'swipe', path: [{ x: 2, y: 1 }, { x: 3, y: 2 }] });
    play(set(2, 1, BACKSLASH));
    expect(run.hint).toEqual({ gesture: 'swipe', path: [{ x: 3, y: 2 }, { x: 4, y: 1 }] });
    play(set(3, 1, FORWARD));
    play(set(3, 2, BACKSLASH));
    play(set(2, 2, FORWARD), 'step-done');
    // The 0 on the bottom edge, then the 3.
    play(set(0, 3, FORWARD));
    play(set(1, 3, BACKSLASH), 'step-done');
    play(set(1, 2, BACKSLASH));
    play(set(2, 3, BACKSLASH), 'step-done');
    // Draw the loop, remove it, draw the other way.
    play(set(1, 1, FORWARD), 'step-done');
    expect(run.hint).toEqual(expect.objectContaining({ gesture: 'tap', note: 'Closed loop' }));
    play(set(1, 1, EMPTY), 'step-done');
    play(set(1, 1, BACKSLASH), 'step-done');

    // Free play: the rest of the solution.
    expect(run.hint).toBeUndefined();
    for (const [x, y, s] of [
      [0, 0, FORWARD],
      [1, 0, BACKSLASH],
      [2, 0, BACKSLASH],
      [3, 0, FORWARD],
      [0, 1, FORWARD],
      [0, 2, BACKSLASH],
    ]) {
      play(set(x, y, s));
    }
    expect(run.move(set(3, 3, BACKSLASH))).toBe('step-done');
    expect(run.next()).toBe(false);
  });
});
