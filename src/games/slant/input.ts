import { BACKSLASH, EMPTY, FORWARD, Size } from './grid';
import { SlantMove, SquareChange } from './moves';
import { SlantState } from './state';

export interface Point {
  x: number;
  y: number;
}

/** How far (in squares) the finger must move before a swipe counts. */
const START_DISTANCE = 0.3;
/** A movement counts as diagonal if both its parts are at least this fraction of it. */
const DIAGONAL = 0.4;

/**
 * One touch on the board. Swiping diagonally across a square draws that
 * slash in that one square (a longer swipe still draws just one). A tap
 * on a square with a slash removes it. Positions are in squares (e.g. 2.4, 0.9).
 *
 * In thinking mode, swipes draw dotted (tentative) slashes, and solid
 * slashes are protected: they can't be redrawn or tapped away, so
 * discarding a hypothesis never loses work the player was sure of.
 */
export class SlantStroke {
  private readonly size: Size;
  private readonly start: Point;
  private readonly thinking: boolean;
  private drawn: SquareChange | null = null;
  private farthest = 0;

  constructor(size: Size, start: Point, thinking = false) {
    this.size = size;
    this.start = start;
    this.thinking = thinking;
  }

  moveTo(p: Point): void {
    const dx = p.x - this.start.x;
    const dy = p.y - this.start.y;
    const length = Math.hypot(dx, dy);
    this.farthest = Math.max(this.farthest, length);
    if (this.drawn || length < START_DISTANCE || Math.min(Math.abs(dx), Math.abs(dy)) < DIAGONAL * length) return;

    // The square the swipe began in, judged just ahead of the touch, so
    // starting right on a corner picks the square being entered.
    const square = this.squareAt({ x: this.start.x + dx / 2, y: this.start.y + dy / 2 });
    this.drawn = { ...square, slash: dx > 0 === dy > 0 ? BACKSLASH : FORWARD };
    if (this.thinking) this.drawn.tentative = true;
  }

  /** The slash this stroke draws, if it has become a swipe. */
  get changes(): SquareChange[] {
    return this.drawn ? [this.drawn] : [];
  }

  /** The move this touch makes when released, or null if it does nothing. */
  finish(state: SlantState): SlantMove | null {
    const square = this.drawn ?? this.squareAt(this.start);
    const i = square.y * this.size.w + square.x;
    const solid = state.slashes[i] !== EMPTY && !state.tentative[i];
    if (this.thinking && solid) return null; // protected while thinking

    if (this.drawn) return { kind: 'set', changes: [this.drawn] };
    if (this.farthest >= START_DISTANCE) return null; // a drag that wasn't a swipe
    if (state.slashes[i] === EMPTY) return null;
    return { kind: 'set', changes: [{ x: square.x, y: square.y, slash: EMPTY }] };
  }

  private squareAt(p: Point): Point {
    return {
      x: Math.min(Math.max(Math.floor(p.x), 0), this.size.w - 1),
      y: Math.min(Math.max(Math.floor(p.y), 0), this.size.h - 1),
    };
  }
}
