import { dailyPuzzle } from '@studio/engine/daily';
import { GameSession } from '@studio/engine/game-session';
import { slantedGame } from './slanted-game';

describe('Slanted daily puzzles', () => {
  // A promise to players: everyone gets the same puzzle on the same day,
  // whatever the version. If this fails, the generator, the schedule or
  // the date rule has changed the daily puzzles.
  it.each([
    ['2026-11-02', 0, '5x5de:a2a2d2b02a2b212a2f11a20b0'], // Monday, Easy
    ['2026-11-02', 1, '8x8de:b0b0b02b3a22b123b222a1d212b122h3a1a1a1a32b2a1a1b3212f0c'], // Monday, Medium
    ['2026-11-02', 2, '6x6dh:a1b1b1b221b3b12b2a12a1122c1a23a1e111a'], // Monday, Hard
    ['2026-11-08', 0, '7x7de:b12a2b0e1b1b1a302d21b2a2d2b1b22b4a2b1a2a2a2b'], // Sunday, Easy
    ['2026-11-08', 1, '10x12de:b0a120a10a1b13d2a22c2a22c21a12c1b23c3c12a1b32a4a1b3a1d3a0a2c1b2c1223a231a2e223a1b22a22c22b31b1g110b2a'], // Sunday, Medium
    ['2026-11-08', 2, '10x12dh:b1b1a1c12a22a2a21b1131a121b1c1b1a1c1e1a1a3b2a12b1121a11a1a1c221a12a11b1a22d1a2d12b1a113c12a11a12a11a32g111b'], // Sunday, Hard
  ])('%s at level %i is always %s', (date, level, expected) => {
    const puzzle = dailyPuzzle('slanted', slantedGame.daily!, date, level)!;
    const session = new GameSession(slantedGame, puzzle.params, puzzle.seed);
    expect(`${slantedGame.encodeParams(session.params)}:${session.description}`).toBe(expected);
  });

  it('numbers the puzzles from launch day, Saturday 24 October 2026', () => {
    expect(dailyPuzzle('slanted', slantedGame.daily!, '2026-10-24', 0)?.number).toBe(1);
  });
});
