import { dailyPuzzle } from '@studio/engine/daily';
import { GameSession } from '@studio/engine/game-session';
import { slantGame } from './slant-game';

describe('Slant daily puzzles', () => {
  // A promise to players: everyone gets the same puzzle on the same day,
  // whatever the version. If this fails, the generator, the schedule or
  // the date rule has changed the daily puzzles.
  it.each([
    ['2026-10-26', '8x8de:c0b1a1b33a1a1a03g2a222e1a2a2a4b31b3a2a12a3a12a2b123a23b1d1b'], // Monday
    [
      '2026-10-28',
      '10x12de:a2c0a0e1g2c3a2a2a1b4a23a2b3a1d133b21c12e12c22f24b2a13c1123a11a2a12a21b3c1a2c22f1a21b01a0e2b',
    ], // Wednesday
    [
      '2026-10-30',
      '10x10dh:a1f11c3b213a3b1b1a11e2a31b3c13a1b1a3b2a112a22a1a321b121d23a2e1a2a3a1a33b23a2b3a3g1d',
    ], // Friday
    [
      '2026-11-01',
      '10x12dh:a01b1b1c2b1b123b2a3e21a2a11a1212e222a12b2b1g13c32a1b212b233e222a112b1a1d31b11a2a232b1a31a1a2b1d1c11a',
    ], // Sunday
  ])('%s is always %s', (date, expected) => {
    const puzzle = dailyPuzzle('slant', slantGame.daily!, date)!;
    const session = new GameSession(slantGame, puzzle.params, puzzle.seed);
    expect(`${slantGame.encodeParams(session.params)}:${session.description}`).toBe(expected);
  });

  it('numbers the puzzles from launch week', () => {
    expect(dailyPuzzle('slant', slantGame.daily!, '2026-10-26')?.number).toBe(1);
  });
});
