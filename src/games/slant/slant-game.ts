import { PuzzleGame } from '@studio/engine/puzzle-game';
import { decodeDescription, validateDescription } from './description';
import { generateSlant } from './generator/generate';
import { SlantMove, applyMove } from './moves';
import {
  DIFFICULTIES,
  HARD,
  SlantParams,
  customFields,
  customParams,
  decodeParams,
  defaultParams,
  encodeParams,
  presets,
  validateParams,
} from './params';
import { decodeSolution } from './solution';
import { solveSlant } from './solver/solver';
import { SlantState } from './state';

/**
 * Slant (also known as Gokigen Naname): draw a diagonal in every square so
 * that each numbered point touches that many lines, with no closed loops.
 */
export const slantGame: PuzzleGame<SlantParams, SlantState, SlantMove> = {
  id: 'slant',
  name: 'Slant',

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

  generate: generateSlant,
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

  solve(initial, solution) {
    if (solution) {
      const slashes = decodeSolution(initial, solution);
      return slashes ? { kind: 'solve', slashes } : null;
    }
    // No stored solution (e.g. a puzzle typed in by hand): use the solver.
    const slashes = new Int8Array(initial.w * initial.h);
    return solveSlant(initial, initial.clues, HARD, slashes) === 'solved' ? { kind: 'solve', slashes } : null;
  },
};
