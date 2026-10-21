import { GeneratedPuzzle } from '@studio/engine/puzzle-game';
import { RandomState } from '@studio/engine/random/random-state';
import { encodeDescription } from '../description';
import { SlantParams } from '../params';
import { encodeSolution } from '../solution';
import { solveSlant } from '../solver/solver';
import { allClues, removeClues } from './clues';
import { fillRandomSlashes } from './fill';

/**
 * Generates a Slant puzzle: a random maze first, then as few clues as
 * possible that still lead to it. A Hard puzzle is rejected (and another
 * made) if the Easy solver can solve it. Ported from new_game_desc(); the
 * same seed produces exactly the same puzzle as the original.
 */
export function generateSlant(params: SlantParams, random: RandomState): GeneratedPuzzle {
  for (;;) {
    const slashes = fillRandomSlashes(params, random);
    const clues = allClues(params, slashes);
    removeClues(params, clues, params.difficulty, random);

    const tooEasy = params.difficulty > 0 && solveSlant(params, clues, params.difficulty - 1) !== 'ambiguous';
    if (!tooEasy) return { description: encodeDescription(clues), solution: encodeSolution(slashes) };
  }
}
