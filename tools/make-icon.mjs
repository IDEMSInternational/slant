// Draws Slant's app icon: a "3" clue with three blue lines meeting at it and
// a teal line beside it, on the board, in the game's own colours. Renders
// the source images for `npm run app-images` (assets/app) and the web
// favicon (public/favicon.ico) with headless Edge.
//
// Usage: node tools/make-icon.mjs   (then: npm run app-images)
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EDGE = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'assets/app');

// Colours from theme.scss and slant-board.scss.
const BOARD = '#fffdf8';
const GRID = '#d9d3c5';
const INK = '#22252b';
const BLUE = '#4a7fc1';
const TEAL = '#2a9187';

/** The icon in board units around the clue point at (0, 0), showing `half` squares each way. */
function svg(half) {
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

const work = mkdtempSync(join(tmpdir(), 'slant-icon-'));
/** Renders an SVG to a square PNG of `size` pixels. */
function render(svgText, size, file) {
  const page = join(work, 'icon.html');
  writeFileSync(page, `<html><body style="margin:0">${svgText.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    `--user-data-dir=${join(work, 'profile')}`, '--default-background-color=00000000',
    `--window-size=${size},${size}`, `--screenshot=${file}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
}

mkdirSync(out, { recursive: true });
// Older launchers show the whole square (rounding its corners): the close-up.
render(svg(0.62), 1024, join(out, 'icon-only.png'));
// Adaptive icons show only the middle two thirds of the layer, masked to a
// shape: draw 1.5 times wider, so the same close-up is what shows.
render(svg(0.93), 1024, join(out, 'icon-foreground.png'));
render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${BOARD}"/></svg>`, 1024, join(out, 'icon-background.png'));
// Android launch screen before Android 12: the studio's, shared by every game.
copyFileSync(join(root, 'games-common-core/assets/app/splash.png'), join(out, 'splash.png'));

// Favicon: an .ico holding 32 and 48 pixel PNGs.
const pngs = [32, 48].map((size) => {
  const file = join(work, `favicon-${size}.png`);
  render(svg(0.62), size, file);
  return { size, data: readFileSync(file) };
});
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach(({ size, data }, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4); // colour planes
  header.writeUInt16LE(32, entry + 6); // bits per pixel
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([header, ...pngs.map((p) => p.data)]));

rmSync(work, { recursive: true, force: true });
console.log('Wrote assets/app/*.png and public/favicon.ico. Next: npm run app-images');
