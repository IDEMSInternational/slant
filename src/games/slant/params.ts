import { DailySchedule } from '@studio/engine/daily';
import { CustomField, Preset } from '@studio/engine/puzzle-game';

export const EASY = 0;
export const HARD = 1;
export const DIFFICULTIES = ['Easy', 'Hard'];
/** One-letter codes for each difficulty in the text form, as in the original. */
const DIFFICULTY_CODES = 'eh';

/** Smallest and largest grid sides offered to players. */
const MIN_SIDE = 4;
const MAX_SIDE = 15; // 20×20 Hard takes ~1 s on a PC, several on a phone

export interface SlantParams {
  /** Size in squares; the clue points form a (w+1) × (h+1) grid. */
  w: number;
  h: number;
  difficulty: number;
}

export function defaultParams(): SlantParams {
  return { w: 6, h: 6, difficulty: EASY };
}

export function presets(): Preset<SlantParams>[] {
  const sizes = [[5, 5], [6, 6], [7, 7], [8, 8], [10, 10], [10, 12]];
  return sizes.map(([w, h]) => ({
    name: `${w}×${h}`,
    params: { w, h, difficulty: EASY },
  }));
}

/**
 * The daily puzzles: the three largest sizes, Easy from Monday to
 * Wednesday and Hard from Thursday, ending with 10×12 Hard on Sunday.
 * Changing this changes the daily puzzles for everyone (see daily.ts in
 * the engine).
 */
export const daily: DailySchedule<SlantParams> = {
  firstDay: '2026-10-26',
  week: [
    { w: 8, h: 8, difficulty: EASY },
    { w: 10, h: 10, difficulty: EASY },
    { w: 10, h: 12, difficulty: EASY },
    { w: 8, h: 8, difficulty: HARD },
    { w: 10, h: 10, difficulty: HARD },
    { w: 10, h: 10, difficulty: HARD },
    { w: 10, h: 12, difficulty: HARD },
  ],
};

/** Text form, compatible with the original: "8x8de", "10x10dh". */
export function encodeParams(params: SlantParams): string {
  return `${params.w}x${params.h}d${DIFFICULTY_CODES[params.difficulty]}`;
}

export function decodeParams(text: string): SlantParams {
  const params = defaultParams();
  const match = /^(\d*)(?:x(\d*))?(?:d(.?))?/.exec(text);
  if (!match) return params;
  const [, w, h, difficulty] = match;
  params.w = params.h = parseInt(w, 10) || 0;
  if (h !== undefined) params.h = parseInt(h, 10) || 0;
  const code = difficulty ? DIFFICULTY_CODES.indexOf(difficulty) : -1;
  if (code >= 0) params.difficulty = code;
  return params;
}

export function validateParams(params: SlantParams): string | null {
  if (params.w < 2 || params.h < 2) return 'Width and height must both be at least two';
  if (params.w * params.h > 10000) return 'Width times height must not be unreasonably large';
  return null;
}

export function customFields(params: SlantParams): CustomField[] {
  return [
    { key: 'w', label: 'Width', min: MIN_SIDE, max: MAX_SIDE, value: params.w },
    { key: 'h', label: 'Height', min: MIN_SIDE, max: MAX_SIDE, value: params.h },
  ];
}

export function customParams(values: Readonly<Record<string, number>>): SlantParams {
  return { ...defaultParams(), w: values['w'], h: values['h'] };
}
