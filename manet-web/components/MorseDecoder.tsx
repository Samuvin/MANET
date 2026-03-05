'use client';

import { useCallback, useState } from 'react';
import { morseToText, validateMorseInput } from '@/lib/morse';

export default function MorseDecoder() {
  const [morseInput, setMorseInput] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);

  const handleDecode = useCallback(() => {
    const result = validateMorseInput(morseInput);
    if (!result.valid) {
      setStatus('Enter Morse code (dots, dashes, spaces only).');
      setStatusError(true);
      setDecodedText('');
      return;
    }
    const text = morseToText(result.sanitized);
    setDecodedText(text);
    setStatus(text.length > 0 ? 'Decoded.' : 'No valid Morse to decode.');
    setStatusError(false);
  }, [morseInput]);

  const handleCopyText = useCallback(() => {
    if (!decodedText) {
      setStatus('Nothing to copy. Decode first.');
      setStatusError(true);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(decodedText)
        .then(() => {
          setStatus('Text copied.');
          setStatusError(false);
        })
        .catch(() => {
          setStatus('Copy failed.');
          setStatusError(true);
        });
    } else {
      setStatus('Clipboard not available');
      setStatusError(true);
    }
  }, [decodedText]);

  return (
    <section className="receive-section">
      <h2 className="section-heading">Receive</h2>
      <p className="section-desc">Paste Morse code to decode to text. Copy the decoded message.</p>
      <label htmlFor="morse-input">Morse code</label>
      <textarea
        id="morse-input"
        name="morse"
        rows={2}
        placeholder="e.g. .... ..-- . ..-- -.--"
        aria-describedby="morse-hint"
        value={morseInput}
        onChange={(e) => setMorseInput(e.target.value)}
        className="morse-input"
      />
      <p id="morse-hint" className="hint">
        Use dots (.), dashes (-), and spaces. Words separated by 3+ spaces.
      </p>
      <div className="receive-actions">
        <button
          type="button"
          onClick={handleDecode}
          className="btn btn-primary"
        >
          Decode to text
        </button>
        <button
          type="button"
          onClick={handleCopyText}
          className="btn btn-secondary"
          disabled={!decodedText}
        >
          Copy text
        </button>
      </div>
      <label htmlFor="decoded-output">Decoded text</label>
      <output
        id="decoded-output"
        htmlFor="morse-input"
        className="decoded-output"
      >
        {decodedText || '\u00a0'}
      </output>
      {status && (
        <p
          className={`status ${statusError ? 'error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </section>
  );
}
