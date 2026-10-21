import { RandomState } from '@studio/engine/random/random-state';
import { shuffle } from '@studio/engine/random/shuffle';
import { NO_CLUE, Size, pointDegree } from '../grid';
import { EASY } from '../params';
import { solveSlant } from '../solver/solver';

/** Stage 2: a clue on every grid point, counting the lines that touch it. */
export function allClues(size: Size, slashes: Int8Array): Int8Array {
  const W = size.w + 1;
  const clues = new Int8Array(W * (size.h + 1));
  for (let y = 0; y <= size.h; y++) {
    for (let x = 0; x <= size.w; x++) clues[y * W + x] = pointDegree(size, slashes, x, y);
  }
  return clues;
}

/**
 * Stage 3: removes clues in random order, keeping each removal only if the
 * puzzle can still be solved at the chosen difficulty. On Hard, obvious
 * starting points (4s, 0s, 2s on the edge and 1s in corners) are removed
 * first, so that as few as possible remain.
 */
export function removeClues(size: Size, clues: Int8Array, difficulty: number, random: RandomState): void {
  const W = size.w + 1;
  const H = size.h + 1;
  const order = Array.from({ length: W * H }, (_, i) => i);
  shuffle(order, random);

  for (let pass = 0; pass < 2; pass++) {
    for (const point of order) {
      const x = point % W;
      const y = Math.floor(point / W);
      const clue = clues[point];
      const onEdgeX = x === 0 || x === W - 1;
      const onEdgeY = y === 0 || y === H - 1;
      const obvious =
        clue === 4 || clue === 0 || (clue === 2 && (onEdgeX || onEdgeY)) || (clue === 1 && onEdgeX && onEdgeY);
      const removalPass = difficulty === EASY || obvious ? 0 : 1;
      if (removalPass !== pass) continue;

      clues[point] = NO_CLUE;
      if (solveSlant(size, clues, difficulty) !== 'solved') clues[point] = clue; // put it back
    }
  }
}
