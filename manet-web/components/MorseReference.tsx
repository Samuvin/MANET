'use client';

import { useState } from 'react';
import { MORSE_MAP } from '@/lib/morse';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

export default function MorseReference() {
  const [open, setOpen] = useState(false);
  return (
    <section className="morse-reference-section" aria-labelledby="morse-ref-heading">
      <button
        type="button"
        className="morse-reference-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="morse-ref-content"
        id="morse-ref-heading"
      >
        {open ? 'Hide' : 'Show'} Morse code reference
      </button>
      <div id="morse-ref-content" className="morse-reference-content" hidden={!open}>
        <p className="morse-reference-desc">Letters and numbers with their Morse code (dot = ., dash = -).</p>
        <div className="morse-reference-tables">
          <div className="morse-reference-table-wrap">
            <span className="morse-reference-table-label">A–Z</span>
            <div className="morse-reference-table" role="table">
              {LETTERS.map((char) => (
                <div key={char} className="morse-reference-cell" role="row">
                  <span className="morse-ref-char" role="cell">{char}</span>
                  <span className="morse-ref-code" role="cell">{MORSE_MAP[char] ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="morse-reference-table-wrap">
            <span className="morse-reference-table-label">0–9</span>
            <div className="morse-reference-table" role="table">
              {DIGITS.map((char) => (
                <div key={char} className="morse-reference-cell" role="row">
                  <span className="morse-ref-char" role="cell">{char}</span>
                  <span className="morse-ref-code" role="cell">{MORSE_MAP[char] ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
