import { PuzzleGame } from '@studio/engine/puzzle-game';
import { decodeDescription, validateDescription } from './description';
import { generateSlanted } from './generator/generate';
import { SlantedMove, applyMove } from './moves';
import {
  DIFFICULTIES,
  HARD,
  SlantedParams,
  customFields,
  customParams,
  daily,
  decodeParams,
  defaultParams,
  encodeParams,
  presets,
  validateParams,
} from './params';
import { decodeSolution } from './solution';
import { solveSlanted } from './solver/solver';
import { SlantedState } from './state';

/**
 * Slanted, our version of the puzzle Slant (also known as Gokigen Naname):
 * draw a diagonal in every square so that each numbered point touches that
 * many lines, with no closed loops.
 */
export const slantedGame: PuzzleGame<SlantedParams, SlantedState, SlantedMove> = {
  id: 'slanted',
  name: 'Slanted',

  defaultParams,
  presets,
  encodeParams,
  decodeParams,
  validateParams,
  customFields,
  customParams,

  difficulties: DIFFICULTIES,
  difficultyOf: (params) => params.difficulty,
  withDifficulty: (params, difficulty) => ({ ...params, difficulty }),

  generate: generateSlanted,
  validateDescription: (params, description) => validateDescription(params, description),

  newGame(params, description) {
    return {
      w: params.w,
      h: params.h,
      clues: decodeDescription(params, description),
      slashes: new Int8Array(params.w * params.h),
      tentative: new Uint8Array(params.w * params.h),
      completed: false,
      cheated: false,
    };
  },

  applyMove,
  isCompleted: (state) => state.completed,
  canShowMistakes: true,
  daily,

  solve(initial, solution) {
    if (solution) {
      const slashes = decodeSolution(initial, solution);
      return slashes ? { kind: 'solve', slashes } : null;
    }
    // No stored solution (e.g. a puzzle typed in by hand): use the solver.
    const slashes = new Int8Array(initial.w * initial.h);
    return solveSlanted(initial, initial.clues, HARD, slashes) === 'solved' ? { kind: 'solve', slashes } : null;
  },
};
