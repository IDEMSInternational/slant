import { EMPTY, Slash } from './grid';
import { SlantState, isSolved } from './state';

export interface SquareChange {
  x: number;
  y: number;
  slash: Slash;
  /** Drawn in thinking mode: a dotted, tentative line. */
  tentative?: boolean;
}

export type SlantMove =
  /** Set some squares' slashes (EMPTY removes one). One swipe or tap = one move. */
  | { kind: 'set'; changes: readonly SquareChange[] }
  /** Thinking mode: make every dotted line solid (the hypothesis held). */
  | { kind: 'keep-thoughts' }
  /** Thinking mode: remove every dotted line (the hypothesis failed). */
  | { kind: 'discard-thoughts' }
  /** Replace every slash with the solution (marks the game as cheated). */
  | { kind: 'solve'; slashes: Int8Array };

/** Applies a move, returning a new state, or null if the move is invalid or changes nothing. */
export function applyMove(state: SlantState, move: SlantMove): SlantState | null {
  const { w, h } = state;
  const slashes = state.slashes.slice();
  const tentative = state.tentative.slice();

  switch (move.kind) {
    case 'solve':
      if (move.slashes.length !== w * h) return null;
      slashes.set(move.slashes);
      tentative.fill(0);
      break;
    case 'keep-thoughts':
      if (!tentative.includes(1)) return null;
      tentative.fill(0);
      break;
    case 'discard-thoughts':
      if (!tentative.includes(1)) return null;
      tentative.forEach((t, i) => t && (slashes[i] = EMPTY));
      tentative.fill(0);
      break;
    case 'set': {
      let changed = false;
      for (const { x, y, slash, tentative: dotted } of move.changes) {
        if (x < 0 || y < 0 || x >= w || y >= h) return null;
        const i = y * w + x;
        const t = slash !== EMPTY && dotted ? 1 : 0;
        changed ||= slashes[i] !== slash || tentative[i] !== t;
        slashes[i] = slash;
        tentative[i] = t;
      }
      if (!changed) return null;
      break;
    }
  }

  return {
    ...state,
    slashes,
    tentative,
    completed: state.completed || isSolved({ ...state, slashes }),
    cheated: state.cheated || move.kind === 'solve',
  };
}
