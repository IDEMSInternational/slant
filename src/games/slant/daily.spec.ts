import { dailyPuzzle } from '@studio/engine/daily';
import { GameSession } from '@studio/engine/game-session';
import { slantGame } from './slant-game';

describe('Slant daily puzzles', () => {
  // A promise to players: everyone gets the same puzzle on the same day,
  // whatever the version. If this fails, the generator, the schedule or
  // the date rule has changed the daily puzzles.
  it.each([
    ['2026-11-02', 0, '5x5de:b01a0c2c4b31c21a0c20a11c'], // Monday, Low
    ['2026-11-02', 1, '8x8de:f0a013a131c1c12c1b3a33b1a4b12a1a11a3c0a2c321d2a112b02c2b'], // Monday, Medium
    ['2026-11-02', 2, '6x6dh:d11b21222b12b21b123a1a22a23a1a32a111c1b'], // Monday, High
    ['2026-11-08', 0, '7x7de:11a21a11f3b2123a2a03132e3b1a2212b2b12b2b0a1a1a1b'], // Sunday, Low
    ['2026-11-08', 1, '10x12de:1c110a11c231a2312b1f31c2d213b1b1a3c11a222c3a1a23a21c31a223d2b1a32a23a24e3a3b2b3c3b3c222b21d12a21a2a2a'], // Sunday, Medium
    ['2026-11-08', 2, '10x12dh:a1d1f2a32b24b3a21a321d232d1b31c1a22b212231b1f22e12c3132a13b321a31c231a31e313a22a1b313a2b12c1b1a1a10'], // Sunday, High
  ])('%s at level %i is always %s', (date, level, expected) => {
    const puzzle = dailyPuzzle('slant', slantGame.daily!, date, level)!;
    const session = new GameSession(slantGame, puzzle.params, puzzle.seed);
    expect(`${slantGame.encodeParams(session.params)}:${session.description}`).toBe(expected);
  });

  it('numbers the puzzles from launch day, Saturday 24 October 2026', () => {
    expect(dailyPuzzle('slant', slantGame.daily!, '2026-10-24', 0)?.number).toBe(1);
  });
});
