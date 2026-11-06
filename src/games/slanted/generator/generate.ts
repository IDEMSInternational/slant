import { GeneratedPuzzle } from '@studio/engine/puzzle-game';
import { RandomState } from '@studio/engine/random/random-state';
import { encodeDescription } from '../description';
import { SlantedParams } from '../params';
import { encodeSolution } from '../solution';
import { solveSlanted } from '../solver/solver';
import { allClues, removeClues } from './clues';
import { fillRandomSlashes } from './fill';

/**
 * Generates a Slanted puzzle: a random maze first, then as few clues as
 * possible that still lead to it. A Hard puzzle is rejected (and another
 * made) if the Easy solver can solve it. Ported from new_game_desc(); the
 * same seed produces exactly the same puzzle as the original.
 */
export function generateSlanted(params: SlantedParams, random: RandomState): GeneratedPuzzle {
  for (;;) {
    const slashes = fillRandomSlashes(params, random);
    const clues = allClues(params, slashes);
    removeClues(params, clues, params.difficulty, random);

    const tooEasy = params.difficulty > 0 && solveSlanted(params, clues, params.difficulty - 1) !== 'ambiguous';
    if (!tooEasy) return { description: encodeDescription(clues), solution: encodeSolution(slashes) };
  }
}
