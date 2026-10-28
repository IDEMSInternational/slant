// Draws Slant's app icon: a "3" clue with three blue lines meeting at it and
// a teal line beside it, on the board, in the game's own colours.
//
// Usage: node tools/make-icon.mjs   (then: npm run app-images)
import { resolve } from 'node:path';
import { makeAppIcon } from '../games-common-core/tools/make-app-icon.mjs';

// Colours from theme.scss and slant-board.scss.
const BOARD = '#fffdf8';
const GRID = '#d9d3c5';
const INK = '#22252b';
const BLUE = '#4a7fc1';
const TEAL = '#2a9187';

/** The icon in board units around the clue point at (0, 0). */
function svg(zoomOut) {
  const half = 0.62 * zoomOut;
  const line = (x1, y1, x2, y2, colour) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="0.13" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half} ${2 * half} ${2 * half}">
  <rect x="-2" y="-2" width="4" height="4" fill="${BOARD}"/>
  <g stroke="${GRID}" stroke-width="0.025">
    <line x1="0" y1="-2" x2="0" y2="2"/><line x1="-2" y1="0" x2="2" y2="0"/>
    <line x1="-1" y1="-2" x2="-1" y2="2"/><line x1="1" y1="-2" x2="1" y2="2"/>
    <line x1="-2" y1="-1" x2="2" y2="-1"/><line x1="-2" y1="1" x2="2" y2="1"/>
  </g>
  ${line(-1, -1, 0, 0, BLUE)}${line(1, -1, 0, 0, BLUE)}${line(-1, 1, 0, 0, BLUE)}${line(0, 1, 1, 0, TEAL)}
  <circle r="0.27" fill="${BOARD}" stroke="${INK}" stroke-width="0.045"/>
  <text y="0.02" font-family="system-ui, 'Segoe UI', Roboto, sans-serif" font-size="0.36" font-weight="650"
    text-anchor="middle" dominant-baseline="middle" fill="${INK}">3</text>
</svg>`;
}

makeAppIcon(resolve(import.meta.dirname, '..'), svg, BOARD);
