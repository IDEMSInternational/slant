import { Dsf } from '@studio/engine/algorithms/dsf';
import { RandomState } from '@studio/engine/random/random-state';
import { shuffle } from '@studio/engine/random/shuffle';
import { BACKSLASH, FORWARD, Size } from '../grid';
import { fillSquare } from '../solver/workspace';

/**
 * Stage 1: fills every square with a random slash, in random order,
 * never closing a loop. Ported from slant_generate(). This never gets
 * stuck: a square can't have both slashes blocked, because the two paths
 * that would block them would have to cross (see the original's proof).
 */
export function fillRandomSlashes(size: Size, random: RandomState): Int8Array {
  const { w, h } = size;
  const W = w + 1;
  const slashes = new Int8Array(w * h);
  const connected = new Dsf(W * (h + 1));

  const order = Array.from({ length: w * h }, (_, i) => i);
  shuffle(order, random);

  for (const square of order) {
    const x = square % w;
    const y = Math.floor(square / w);
    const backslashClosesLoop = connected.equivalent(y * W + x, (y + 1) * W + x + 1);
    const forwardClosesLoop = connected.equivalent((y + 1) * W + x, y * W + x + 1);
    const slash = backslashClosesLoop
      ? FORWARD
      : forwardClosesLoop
        ? BACKSLASH
        : 2 * random.upto(2) - 1;
    fillSquare(size, x, y, slash, slashes, connected, null);
  }
  return slashes;
}
