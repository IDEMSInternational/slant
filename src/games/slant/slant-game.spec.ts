import { GameSession } from '@studio/engine/game-session';
import { BACKSLASH, EMPTY, FORWARD } from './grid';
import { SlantStroke } from './input';
import { decodeParams } from './params';
import { slantGame as game } from './slant-game';
import { encodeSolution } from './solution';
import reference from './testing/reference-puzzles.json';

describe('Slant solver', () => {
  it('solves every reference puzzle without the stored solution', () => {
    for (const ref of reference) {
      const initial = game.newGame(decodeParams(ref.params), ref.description);
      const move = game.solve(initial);
      expect(move?.kind, `${ref.params}#${ref.seed}`).toBe('solve');
      if (move?.kind === 'solve') expect(encodeSolution(move.slashes)).toBe(ref.solution);
    }
  });

  it('completes every puzzle with its stored solution', () => {
    for (const ref of reference) {
      const initial = game.newGame(decodeParams(ref.params), ref.description);
      const solved = game.applyMove(initial, game.solve(initial, ref.solution)!)!;
      expect(solved.completed, `${ref.params}#${ref.seed}`).toBe(true);
      expect(solved.cheated).toBe(true);
    }
  });
});

describe('Slant rules', () => {
  // 2×2 with no clues: any loop-free filling solves it.
  const blank = () => game.newGame(decodeParams('2x2de'), 'i');

  it('is not solved while a closed loop exists', () => {
    const diamond = { kind: 'solve' as const, slashes: Int8Array.of(FORWARD, BACKSLASH, BACKSLASH, FORWARD) };
    expect(game.applyMove(blank(), diamond)!.completed).toBe(false);
    const open = { kind: 'solve' as const, slashes: Int8Array.of(BACKSLASH, BACKSLASH, BACKSLASH, FORWARD) };
    expect(game.applyMove(blank(), open)!.completed).toBe(true);
  });
});

describe('Slant swipes', () => {
  const state = game.newGame(decodeParams('4x4de'), 'y');

  it('draws a backslash when swiping down-right across a square', () => {
    const stroke = new SlantStroke(state, { x: 1.2, y: 1.2 });
    stroke.moveTo({ x: 1.8, y: 1.8 });
    expect(stroke.changes).toEqual([{ x: 1, y: 1, slash: BACKSLASH }]);
  });

  it('draws a forward slash when swiping up-right', () => {
    const stroke = new SlantStroke(state, { x: 0.2, y: 0.8 });
    stroke.moveTo({ x: 0.8, y: 0.2 });
    expect(stroke.changes).toEqual([{ x: 0, y: 0, slash: FORWARD }]);
  });

  it('draws only in the square where the swipe starts, however far it goes', () => {
    const stroke = new SlantStroke(state, { x: 0.1, y: 0.1 });
    for (const p of [
      { x: 0.6, y: 0.6 },
      { x: 1.1, y: 1.05 },
      { x: 1.9, y: 1.9 },
      { x: 2.4, y: 1.5 },
      { x: 3, y: 1 },
    ]) {
      stroke.moveTo(p);
    }
    expect(stroke.finish(state)).toEqual({ kind: 'set', changes: [{ x: 0, y: 0, slash: BACKSLASH }] });
  });

  it('ignores straight sideways drags, and removes a slash when it is tapped', () => {
    const sideways = new SlantStroke(state, { x: 0.2, y: 0.5 });
    sideways.moveTo({ x: 1.8, y: 0.55 });
    expect(sideways.finish(state)).toBeNull();

    const drawn = game.applyMove(state, { kind: 'set', changes: [{ x: 2, y: 2, slash: FORWARD }] })!;
    const tap = new SlantStroke(drawn, { x: 2.5, y: 2.4 });
    tap.moveTo({ x: 2.52, y: 2.43 });
    expect(tap.finish(drawn)).toEqual({ kind: 'set', changes: [{ x: 2, y: 2, slash: EMPTY }] });
    expect(new SlantStroke(state, { x: 2.5, y: 2.4 }).finish(state)).toBeNull(); // empty square
  });
});

describe('Slant thinking mode', () => {
  const ref = reference.find((r) => r.params === '4x4de')!;
  const initial = () => game.newGame(decodeParams(ref.params), ref.description);
  const swipe = (state: ReturnType<typeof initial>, from: { x: number; y: number }, thinking: boolean) => {
    const stroke = new SlantStroke(state, from, thinking);
    stroke.moveTo({ x: from.x + 0.6, y: from.y + 0.6 }); // down-right: a backslash
    return stroke.finish(state);
  };

  it('draws dotted lines that can be kept or discarded', () => {
    let state = game.applyMove(initial(), { kind: 'set', changes: [{ x: 0, y: 0, slash: FORWARD }] })!;
    state = game.applyMove(state, swipe(state, { x: 1.2, y: 1.2 }, true)!)!;
    expect(state.slashes[1 * 4 + 1]).toBe(BACKSLASH);
    expect(state.tentative[1 * 4 + 1]).toBe(1);

    const kept = game.applyMove(state, { kind: 'keep-thoughts' })!;
    expect(kept.tentative.includes(1)).toBe(false);
    expect(kept.slashes[1 * 4 + 1]).toBe(BACKSLASH);

    const discarded = game.applyMove(state, { kind: 'discard-thoughts' })!;
    expect(discarded.slashes[1 * 4 + 1]).toBe(EMPTY);
    expect(discarded.slashes[0]).toBe(FORWARD); // solid lines stay
    expect(game.applyMove(discarded, { kind: 'discard-thoughts' })).toBeNull(); // nothing to discard
  });

  it('protects solid lines while thinking', () => {
    const state = game.applyMove(initial(), { kind: 'set', changes: [{ x: 0, y: 0, slash: FORWARD }] })!;
    expect(swipe(state, { x: 0.2, y: 0.2 }, true)).toBeNull(); // can't redraw it
    expect(new SlantStroke(state, { x: 0.5, y: 0.5 }, true).finish(state)).toBeNull(); // can't tap it away
    expect(new SlantStroke(state, { x: 0.5, y: 0.5 }, false).finish(state)).not.toBeNull();
  });

  it('counts dotted lines towards the solution', () => {
    const solution = game.solve(initial(), ref.solution) as { kind: 'solve'; slashes: Int8Array };
    const changes = Array.from(solution.slashes, (slash, i) => ({
      x: i % 4,
      y: Math.floor(i / 4),
      slash: slash as -1 | 1,
      tentative: i % 2 === 0, // half of them dotted
    }));
    const state = game.applyMove(initial(), { kind: 'set', changes })!;
    expect(state.completed).toBe(true);
    expect(state.cheated).toBe(false);
  });
});

describe('Slant sizes and difficulty', () => {
  it('offers 5×5 to 10×12 and Easy/Hard, and generates solvable puzzles', () => {
    expect(game.presets().map((p) => p.name)).toEqual(['5×5', '6×6', '7×7', '8×8', '10×10', '10×12']);
    expect(game.difficulties).toEqual(['Easy', 'Hard']);
    for (const text of ['4x4dh', '10x10dh', '15x15dh']) {
      const session = new GameSession(game, decodeParams(text));
      session.newGame(undefined, '42');
      expect(session.gameId).toBe(`${text}#42`);
      expect(session.solve()).toBe(true);
      expect(session.isCompleted).toBe(true);
    }
  }, 30000); // generation competes for the CPU with the other test files
});
