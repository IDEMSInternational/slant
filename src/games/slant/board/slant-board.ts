import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { placeLabel } from '@studio/container/board-label';
import { EMPTY, NO_CLUE } from '../grid';
import { SlantHint } from '../hint';
import { Point, SlantStroke } from '../input';
import { SlantMove, SquareChange } from '../moves';
import { SlantState } from '../state';
import { findMistakes } from '../mistakes';
import { LineColours } from './line-colours';

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Number of line colours defined in slant-board.scss (--line-0 ... --line-5). */
const LINE_COLOURS = 6;
/** Space around the board for clues on its edge, in squares. */
const MARGIN = 0.45;

/** Board for Slant, drawn as SVG in square units. Emits moves; never changes state itself. */
@Component({
  selector: 'slant-board',
  templateUrl: './slant-board.html',
  styleUrl: './slant-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlantBoard {
  readonly state = input.required<SlantState>();
  /** Tutorial guidance: highlights squares and animates the gesture. */
  readonly hint = input<SlantHint | null>(null);
  /** Thinking mode: swipes draw dotted, tentative lines. */
  readonly thinking = input(false);
  /** Show mistakes: lines on closed loops, and numbers that can't be satisfied, in red. */
  readonly showMistakes = input(false);
  readonly move = output<SlantMove>();

  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private stroke: SlantStroke | null = null;
  /** Slashes being drawn by the current swipe. */
  protected readonly pending = signal<readonly SquareChange[]>([]);

  protected readonly viewBox = computed(() => {
    const { w, h } = this.state();
    return `${-MARGIN} ${-MARGIN} ${w + 2 * MARGIN} ${h + 2 * MARGIN}`;
  });

  protected readonly gridLines = computed(() => {
    const { w, h } = this.state();
    const lines: Segment[] = [];
    for (let x = 1; x < w; x++) lines.push({ x1: x, y1: 0, x2: x, y2: h });
    for (let y = 1; y < h; y++) lines.push({ x1: 0, y1: y, x2: w, y2: y });
    return lines;
  });

  private readonly colours = new LineColours(LINE_COLOURS);
  private coloursFor: Int8Array | null = null;

  private readonly mistakes = computed(() => (this.showMistakes() ? findMistakes(this.state()) : null));

  protected readonly lines = computed(() => {
    const state = this.state();
    if (state.clues !== this.coloursFor) {
      this.colours.reset(); // a new puzzle
      this.coloursFor = state.clues;
    }
    const colours = this.colours.coloursFor(state, state.slashes);
    const loops = this.mistakes()?.loopSquares;
    const lines: (Segment & { colour: number; dotted: boolean; wrong: boolean })[] = [];
    state.slashes.forEach((slash, i) => {
      if (slash === EMPTY) return;
      const segment = slashSegment(i % state.w, Math.floor(i / state.w), slash);
      lines.push({ ...segment, colour: colours[i], dotted: state.tentative[i] === 1, wrong: loops?.[i] === 1 });
    });
    return lines;
  });

  protected readonly pendingLines = computed(() =>
    this.pending().map(({ x, y, slash, tentative }) => ({ ...slashSegment(x, y, slash), dotted: !!tentative })),
  );

  protected readonly clues = computed(() => {
    const { w, clues } = this.state();
    const bad = this.mistakes()?.badClues;
    const list: { x: number; y: number; value: number; wrong: boolean }[] = [];
    clues.forEach((value, i) => {
      if (value !== NO_CLUE) {
        list.push({ x: i % (w + 1), y: Math.floor(i / (w + 1)), value, wrong: bad?.[i] === 1 });
      }
    });
    return list;
  });

  protected readonly hintView = computed(() => {
    const hint = this.hint();
    if (!hint) return null;
    if (hint.gesture === 'tap') {
      const s = hint.square;
      return { squares: [s], centre: { x: s.x + 0.5, y: s.y + 0.5 }, path: null };
    }
    const squares = hint.path.slice(1).map((p, i) => ({
      x: Math.min(p.x, hint.path[i].x),
      y: Math.min(p.y, hint.path[i].y),
    }));
    const path = 'M ' + hint.path.map((p) => `${p.x} ${p.y}`).join(' L ');
    return { squares, centre: null, path };
  });

  /** A tutorial note next to the hinted squares, e.g. "Closes a loop". */
  protected readonly noteLabel = computed(() => {
    const hint = this.hint();
    const view = this.hintView();
    if (!hint?.note || !view || this.pending().length) return null;
    const xs = view.squares.map((s) => s.x);
    const ys = view.squares.map((s) => s.y);
    const area = { x: Math.min(...xs), y: Math.min(...ys), w: 0, h: 0 };
    area.w = Math.max(...xs) + 1 - area.x;
    area.h = Math.max(...ys) + 1 - area.y;
    return placeLabel(hint.note, area, this.state());
  });

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.svg().nativeElement.setPointerCapture(event.pointerId);
    this.stroke = new SlantStroke(this.state(), this.boardPoint(event), this.thinking());
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.stroke) return;
    this.stroke.moveTo(this.boardPoint(event));
    this.pending.set(this.stroke.changes);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.stroke) return;
    this.stroke.moveTo(this.boardPoint(event));
    const move = this.stroke.finish(this.state());
    this.cancelStroke();
    if (move) this.move.emit(move);
  }

  protected cancelStroke(): void {
    this.stroke = null;
    this.pending.set([]);
  }

  /** Converts a pointer position to board coordinates, in squares. */
  private boardPoint(event: PointerEvent): Point {
    const matrix = this.svg().nativeElement.getScreenCTM()?.inverse();
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return { x: p.x, y: p.y };
  }
}

/** The line a slash draws in square (x, y). */
function slashSegment(x: number, y: number, slash: number): Segment {
  return slash < 0 ? { x1: x, y1: y, x2: x + 1, y2: y + 1 } : { x1: x + 1, y1: y, x2: x, y2: y + 1 };
}
