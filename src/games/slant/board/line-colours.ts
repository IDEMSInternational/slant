import { Dsf } from '@studio/engine/algorithms/dsf';
import { EMPTY, Size, slashEnds } from '../grid';

/**
 * Colours the lines on a Slant board by connected group: lines that touch
 * form one group, and each group gets a palette colour.
 *
 * Colours are kept stable while playing: a group keeps the colour most of
 * its lines had before (so when two groups join, the joined group usually
 * keeps the bigger one's colour), and a group touching a same-coloured
 * neighbour, or a brand-new group, takes the next colour its neighbours
 * aren't using.
 */
export class LineColours {
  private readonly paletteSize: number;
  private previous = new Map<number, number>();
  private next = 0;

  constructor(paletteSize: number) {
    this.paletteSize = paletteSize;
  }

  /** Forgets all colours, e.g. when a new puzzle starts. */
  reset(): void {
    this.previous.clear();
    this.next = 0;
  }

  /** Returns a colour index for each square, or -1 for empty squares. */
  coloursFor(size: Size, slashes: Int8Array): Int16Array {
    const { w, h } = size;
    const groups = findGroups(size, slashes);
    const colours = new Int16Array(w * h).fill(-1);

    for (const squares of groups) {
      const taken = neighbourColours(size, colours, squares);
      const inherited = this.mostCommonPrevious(squares).find((c) => !taken.has(c));
      const colour = inherited ?? this.fresh(taken);
      for (const s of squares) colours[s] = colour;
    }

    this.previous = new Map();
    colours.forEach((c, s) => c >= 0 && this.previous.set(s, c));
    return colours;
  }

  /** Previous colours of these squares, most common first. */
  private mostCommonPrevious(squares: readonly number[]): number[] {
    const counts = new Map<number, number>();
    for (const s of squares) {
      const c = this.previous.get(s);
      if (c !== undefined) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }

  private fresh(taken: ReadonlySet<number>): number {
    for (let i = 0; i < this.paletteSize; i++) {
      const c = (this.next + i) % this.paletteSize;
      if (!taken.has(c)) {
        this.next = (c + 1) % this.paletteSize;
        return c;
      }
    }
    const c = this.next;
    this.next = (c + 1) % this.paletteSize;
    return c;
  }
}

/** Groups of squares whose lines are connected, largest first. */
function findGroups(size: Size, slashes: Int8Array): number[][] {
  const { w, h } = size;
  const points = new Dsf((w + 1) * (h + 1));
  for (let s = 0; s < w * h; s++) {
    if (slashes[s] !== EMPTY) points.merge(...slashEnds(size, s % w, Math.floor(s / w), slashes[s] as -1 | 1));
  }

  const byRoot = new Map<number, number[]>();
  for (let s = 0; s < w * h; s++) {
    if (slashes[s] === EMPTY) continue;
    const root = points.canonify(slashEnds(size, s % w, Math.floor(s / w), slashes[s] as -1 | 1)[0]);
    const group = byRoot.get(root);
    if (group) group.push(s);
    else byRoot.set(root, [s]);
  }
  return [...byRoot.values()].sort((a, b) => b.length - a.length || a[0] - b[0]);
}

/** Colours already given to other groups in squares around this group (including diagonally). */
function neighbourColours(size: Size, colours: Int16Array, squares: readonly number[]): Set<number> {
  const { w, h } = size;
  const own = new Set(squares);
  const taken = new Set<number>();
  for (const s of squares) {
    const x = s % w;
    const y = Math.floor(s / w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (!own.has(n) && colours[n] >= 0) taken.add(colours[n]);
      }
    }
  }
  return taken;
}
