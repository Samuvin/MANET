/**
 * Morse code mapping and conversion for MANET radio signals.
 * Static mapping only; no user input in dynamic code generation.
 */

(function (global) {
  'use strict';

  /** Dot and dash symbols. */
  var DOT = '.';
  var DASH = '-';

  /** Standard Morse code: letter/digit -> sequence of dots and dashes. */
  var MORSE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',     'F': '..-.',
    'G': '--.',   'H': '....',  'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',  'Q': '--.-',  'R': '.-.',
    'S': '...',   'T': '-',     'U': '..-',   'V': '...-', 'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };

  /** Allowed characters: A-Z, a-z, 0-9, space. Used for validation. */
  var ALLOWED_PATTERN = /^[A-Za-z0-9\s]*$/;

  /**
   * Converts a single character to its Morse sequence, or empty string if unsupported.
   * @param {string} char - Single character.
   * @returns {string} Morse sequence (dots and dashes) or ''.
   */
  function charToMorse(char) {
    var upper = char.toUpperCase();
    return MORSE_MAP[upper] !== undefined ? MORSE_MAP[upper] : '';
  }

  /**
   * Converts plain text to Morse code string (dots, dashes, spaces).
   * Letters separated by single space; words separated by triple space (per standard).
   * Unsupported characters are skipped.
   * @param {string} text - Input text (should be pre-validated/sanitized).
   * @returns {string} Morse string (e.g. '... --- ...').
   */
  function textToMorse(text) {
    var morseParts = [];

    if (!text || typeof text !== 'string') {
      return '';
    }

    var trimmed = text.trim();
    if (trimmed.length === 0) {
      return '';
    }

    var words = trimmed.split(/\s+/);
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      for (var i = 0; i < word.length; i++) {
        var seq = charToMorse(word[i]);
        if (seq.length > 0) {
          morseParts.push(seq);
          if (i < word.length - 1) {
            morseParts.push(' ');
          }
        }
      }
      if (w < words.length - 1) {
        morseParts.push('   ');
      }
    }

    return morseParts.join('');
  }

  /**
   * Builds a playback schedule (on/off segments) with given unit duration in ms.
   * Standard timing: dot=1, dash=3, intra-letter gap=1, inter-letter=3, inter-word=7.
   * @param {string} morse - Morse string (dots, dashes, spaces).
   * @param {number} unitMs - Duration of one "unit" in milliseconds.
   * @returns {Array<{type: string, duration: number}>}
   */
  function buildSchedule(morse, unitMs) {
    if (!morse || typeof unitMs !== 'number' || unitMs <= 0) {
      return [];
    }
    var schedule = [];
    var i = 0;
    while (i < morse.length) {
      var ch = morse[i];
      if (ch === DOT) {
        schedule.push({ type: 'on', duration: 1 * unitMs });
        schedule.push({ type: 'off', duration: 1 * unitMs });
        i += 1;
      } else if (ch === DASH) {
        schedule.push({ type: 'on', duration: 3 * unitMs });
        schedule.push({ type: 'off', duration: 1 * unitMs });
        i += 1;
      } else if (ch === ' ') {
        var spaces = 0;
        while (i < morse.length && morse[i] === ' ') {
          spaces += 1;
          i += 1;
        }
        if (spaces >= 3) {
          schedule.push({ type: 'off', duration: 7 * unitMs });
        } else {
          schedule.push({ type: 'off', duration: 3 * unitMs });
        }
      } else {
        i += 1;
      }
    }
    return schedule;
  }

  /**
   * WPM to unit duration in ms. Standard: 50 units per word (PARIS = 50 units), so 1 WPM = 50 units per word.
   * 1 word per minute = 60s / 50 = 1.2s per unit -> 1200ms per unit (very slow).
   * Common formula: unit = 1200 / wpm (ms).
   * @param {number} wpm - Words per minute (e.g. 15).
   * @returns {number} Unit duration in milliseconds.
   */
  function wpmToUnitMs(wpm) {
    var safe = Math.max(5, Math.min(40, Number(wpm)));
    return Math.round(1200 / safe);
  }

  /**
   * Validates and sanitizes user input: trim, max length, allowed chars only.
   * @param {string} input - Raw user input.
   * @param {number} maxLength - Maximum allowed length.
   * @returns {{ valid: boolean, sanitized: string }}
   */
  function validateInput(input, maxLength) {
    var MAX_LEN = typeof maxLength === 'number' && maxLength > 0 ? maxLength : 500;
    if (typeof input !== 'string') {
      return { valid: false, sanitized: '' };
    }
    var trimmed = input.trim();
    if (trimmed.length === 0) {
      return { valid: false, sanitized: '' };
    }
    if (trimmed.length > MAX_LEN) {
      trimmed = trimmed.slice(0, MAX_LEN);
    }
    var sanitized = trimmed.replace(/[^A-Za-z0-9\s]/g, '');
    if (sanitized.length === 0) {
      return { valid: false, sanitized: trimmed };
    }
    return { valid: true, sanitized: sanitized };
  }

  global.MORSE = {
    textToMorse: textToMorse,
    buildSchedule: buildSchedule,
    wpmToUnitMs: wpmToUnitMs,
    validateInput: validateInput,
    MAX_MESSAGE_LENGTH: 500,
    ALLOWED_PATTERN: ALLOWED_PATTERN
  };
})(typeof window !== 'undefined' ? window : this);
