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

export const MAX_MESSAGE_LENGTH = 500;

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
        .map((ch) => charToMorse(ch))
        .filter((s) => s.length > 0)
        .join(' ')
    )
    .join('   ');
}

export type ScheduleSegment = { type: 'on' | 'off'; duration: number };

export function buildSchedule(
  morse: string | null | undefined,
  unitMs: number
): ScheduleSegment[] {
  if (!morse || typeof unitMs !== 'number' || unitMs <= 0) return [];
  const schedule: ScheduleSegment[] = [];
  let i = 0;
  while (i < morse.length) {
    const ch = morse[i];
    if (ch === DOT) {
      schedule.push({ type: 'on', duration: unitMs });
      schedule.push({ type: 'off', duration: unitMs });
      i += 1;
    } else if (ch === DASH) {
      schedule.push({ type: 'on', duration: 3 * unitMs });
      schedule.push({ type: 'off', duration: unitMs });
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
    } else {
      i += 1;
    }
  }
  return schedule;
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
