import { BACKSLASH, EMPTY, FORWARD } from '../grid';
import { LineColours } from './line-colours';

describe('LineColours', () => {
  const size = { w: 3, h: 1 };

  it('gives one colour to connected lines, and different colours to neighbouring groups', () => {
    // "\/" share a point (a V), the third square's "/" is separate but adjacent.
    const colours = new LineColours(6).coloursFor(size, Int8Array.of(BACKSLASH, FORWARD, EMPTY));
    expect(colours[0]).toBe(colours[1]);
    expect(colours[2]).toBe(-1);

    const separate = new LineColours(6).coloursFor(size, Int8Array.of(BACKSLASH, BACKSLASH, BACKSLASH));
    expect(new Set(separate).size).toBe(3);
  });

  it('keeps the bigger group’s colour when groups join', () => {
    const colours = new LineColours(6);
    const before = colours.coloursFor({ w: 4, h: 1 }, Int8Array.of(BACKSLASH, FORWARD, EMPTY, FORWARD));
    // Filling square 2 with "\" joins the V (squares 0–1) to square 3.
    const after = colours.coloursFor({ w: 4, h: 1 }, Int8Array.of(BACKSLASH, FORWARD, BACKSLASH, FORWARD));
    expect(after[3]).toBe(before[0]);
    expect(new Set(after).size).toBe(1);
  });
});
