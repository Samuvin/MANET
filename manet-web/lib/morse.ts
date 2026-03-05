/**
 * Morse code mapping and conversion for MANET radio signals.
 * Static mapping only; no user input in dynamic code generation.
 */

const DOT = '.';
const DASH = '-';

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

/** Reverse map: Morse code sequence -> character (for decoding). */
export const MORSE_TO_CHAR: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [char, code] of Object.entries(MORSE_MAP)) {
    out[code] = char;
  }
  return out;
})();

/** Marker in Morse stream meaning "next letter is lowercase". Enables exact casing. */
const LOWER_MARKER = '..--';

export const MAX_MESSAGE_LENGTH = 500;

/** Max length for Morse input when decoding (avoid huge inputs). */
export const MAX_MORSE_INPUT_LENGTH = 2000;

export function charToMorse(c: string): string {
  return MORSE_MAP[c.toUpperCase()] ?? '';
}

export function textToMorse(text: string | null | undefined): string {
  if (text == null || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed.length === 0) return '';
  const words = trimmed.split(/\s+/);
  return words
    .map((word) =>
      word
        .split('')
        .flatMap((ch) => {
          const code = charToMorse(ch);
          if (!code) return [];
          const isLower = /[a-z]/.test(ch);
          return isLower ? [LOWER_MARKER, code] : [code];
        })
        .join(' ')
    )
    .join('   ');
}

export type ScheduleSegment = { type: 'on' | 'off'; duration: number };

export function buildSchedule(
  morse: string | null | undefined,
  unitMs: number
): ScheduleSegment[] {
  const result = buildScheduleWithIndices(morse, unitMs);
  return result.schedule;
}

/**
 * Build schedule and a parallel array: for each segment index, the index in the Morse string
 * that is being played (for 'on' segments), or -1 for 'off'/gap. Used for playback visual.
 */
export function buildScheduleWithIndices(
  morse: string | null | undefined,
  unitMs: number
): { schedule: ScheduleSegment[]; morseIndexBySegment: number[] } {
  if (!morse || typeof unitMs !== 'number' || unitMs <= 0) {
    return { schedule: [], morseIndexBySegment: [] };
  }
  const schedule: ScheduleSegment[] = [];
  const morseIndexBySegment: number[] = [];
  let i = 0;
  while (i < morse.length) {
    const ch = morse[i];
    if (ch === DOT) {
      schedule.push({ type: 'on', duration: unitMs });
      morseIndexBySegment.push(i);
      schedule.push({ type: 'off', duration: unitMs });
      morseIndexBySegment.push(-1);
      i += 1;
    } else if (ch === DASH) {
      schedule.push({ type: 'on', duration: 3 * unitMs });
      morseIndexBySegment.push(i);
      schedule.push({ type: 'off', duration: unitMs });
      morseIndexBySegment.push(-1);
      i += 1;
    } else if (ch === ' ') {
      let spaces = 0;
      while (i < morse.length && morse[i] === ' ') {
        spaces += 1;
        i += 1;
      }
      schedule.push({
        type: 'off',
        duration: spaces >= 3 ? 7 * unitMs : 3 * unitMs,
      });
      morseIndexBySegment.push(-1);
    } else {
      i += 1;
    }
  }
  return { schedule, morseIndexBySegment };
}

export function wpmToUnitMs(wpm: number): number {
  const safe = Math.max(5, Math.min(40, Number(wpm)));
  return Math.round(1200 / safe);
}

export type ValidationResult =
  | { valid: true; sanitized: string }
  | { valid: false; sanitized: string };

export function validateInput(
  input: string | null | undefined,
  maxLength: number = MAX_MESSAGE_LENGTH
): ValidationResult {
  const maxLen = maxLength > 0 ? maxLength : MAX_MESSAGE_LENGTH;
  if (typeof input !== 'string') return { valid: false, sanitized: '' };
  const trimmed = input.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '' };
  const capped = trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
  const sanitized = capped.replace(/[^A-Za-z0-9\s]/g, '');
  if (sanitized.length === 0) return { valid: false, sanitized: capped };
  return { valid: true, sanitized };
}

export type MorseValidationResult =
  | { valid: true; sanitized: string }
  | { valid: false; sanitized: string };

/**
 * Validates Morse decoder input: trim, allow only dots, dashes, spaces; optional max length.
 */
export function validateMorseInput(
  raw: string | null | undefined,
  maxLength: number = MAX_MORSE_INPUT_LENGTH
): MorseValidationResult {
  const maxLen = maxLength > 0 ? maxLength : MAX_MORSE_INPUT_LENGTH;
  if (typeof raw !== 'string') return { valid: false, sanitized: '' };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { valid: false, sanitized: '' };
  const capped = trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
  const sanitized = capped.replace(/[^.\-\s]/g, '');
  if (sanitized.length === 0) return { valid: false, sanitized: '' };
  return { valid: true, sanitized };
}

/**
 * Decodes a Morse string to plain text.
 * Letters separated by single space; words by three or more spaces.
 * "..--" means next letter is lowercase (exact casing). Unknown codes -> '?'.
 */
export function morseToText(morse: string | null | undefined): string {
  if (morse == null || typeof morse !== 'string') return '';
  const trimmed = morse.trim();
  if (trimmed.length === 0) return '';
  const words = trimmed.split(/\s{3,}/);
  return words
    .map((word) => {
      const codes = word.split(/\s+/).filter((c) => c.length > 0);
      let nextLower = false;
      return codes
        .map((code) => {
          if (code === LOWER_MARKER) {
            nextLower = true;
            return '';
          }
          const char = MORSE_TO_CHAR[code];
          if (char === undefined) {
            nextLower = false;
            return '?';
          }
          const out = nextLower ? char.toLowerCase() : char;
          nextLower = false;
          return out;
        })
        .join('');
    })
    .join(' ');
}
