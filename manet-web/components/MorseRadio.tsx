'use client';

import { useCallback, useRef, useState } from 'react';
import {
  buildSchedule,
  MAX_MESSAGE_LENGTH,
  textToMorse,
  validateInput,
  wpmToUnitMs,
  type ScheduleSegment,
} from '@/lib/morse';

const FREQ_HZ = 700;
const WPM_MIN = 5;
const WPM_MAX = 25;
const DEFAULT_WPM = 15;

export default function MorseRadio() {
  const [message, setMessage] = useState('');
  const [morse, setMorse] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [signalOn, setSignalOn] = useState(false);
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sanitizeAndUpdateMorse = useCallback((raw: string) => {
    const capped = raw.slice(0, MAX_MESSAGE_LENGTH);
    const result = validateInput(capped);
    if (result.valid) {
      setMorse(textToMorse(result.sanitized));
      return result.sanitized;
    }
    setMorse('');
    return capped;
  }, []);

  const initAudioContext = useCallback((): AudioContext | null => {
    if (audioContextRef.current) return audioContextRef.current;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new Ctx();
      return audioContextRef.current;
    } catch {
      setStatus('Audio not supported');
      setStatusError(true);
      return null;
    }
  }, []);

  const playTone = useCallback(
    (ctx: AudioContext, startTime: number, durationMs: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = FREQ_HZ;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gain.gain.setValueAtTime(0.2, startTime + durationMs / 1000 - 0.01);
      gain.gain.linearRampToValueAtTime(0, startTime + durationMs / 1000);
      osc.start(startTime);
      osc.stop(startTime + durationMs / 1000);
    },
    []
  );

  const runSchedule = useCallback(
    (schedule: ScheduleSegment[], soundOn: boolean, onDone: () => void) => {
      if (schedule.length === 0) {
        onDone();
        return;
      }
      const ctx = soundOn ? initAudioContext() : null;
      if (ctx?.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const t0 = ctx ? ctx.currentTime : 0;
      let cumulMs = 0;
      for (let i = 0; i < schedule.length; i++) {
        if (schedule[i].type === 'on' && ctx) {
          playTone(ctx, t0 + cumulMs / 1000, schedule[i].duration);
        }
        cumulMs += schedule[i].duration;
      }
      let idx = 0;
      const runNext = () => {
        if (idx >= schedule.length) {
          setSignalOn(false);
          setIsPlaying(false);
          setStatus('Done.');
          onDone();
          return;
        }
        const seg = schedule[idx];
        idx += 1;
        setSignalOn(seg.type === 'on');
        timeoutsRef.current.push(setTimeout(runNext, seg.duration));
      };
      runNext();
    },
    [initAudioContext, playTone]
  );

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setSignalOn(false);
      setIsPlaying(false);
      audioContextRef.current?.suspend().catch(() => {});
      return;
    }
    const result = validateInput(message, MAX_MESSAGE_LENGTH);
    if (!result.valid) {
      setStatus('Enter a message (letters, numbers, spaces only).');
      setStatusError(true);
      return;
    }
    const morseStr = textToMorse(result.sanitized);
    if (!morseStr) {
      setStatus('No valid characters to send.');
      setStatusError(true);
      return;
    }
    setMorse(morseStr);
    setStatus('Sending…');
    setStatusError(false);
    setIsPlaying(true);
    const unitMs = wpmToUnitMs(wpm);
    const schedule = buildSchedule(morseStr, unitMs);
    runSchedule(schedule, soundEnabled, () => {});
  }, [message, wpm, soundEnabled, isPlaying, runSchedule]);

  const handleCopy = useCallback(() => {
    if (!morse) {
      setStatus('Nothing to copy. Convert a message first.');
      setStatusError(true);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(morse)
        .then(() => {
          setStatus('Morse code copied.');
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
  }, [morse]);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;
      const capped = sanitizeAndUpdateMorse(raw);
      setMessage(capped);
    },
    [sanitizeAndUpdateMorse]
  );

  return (
    <section className="send-section">
      <h2 className="section-heading">Send</h2>
      <p className="section-desc">
        Encode a message to Morse and play it as radio signals.
      </p>
      <div className="input-section">
        <label htmlFor="message-input">Message</label>
        <textarea
          id="message-input"
          name="message"
          rows={4}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Enter your message (A–Z, 0–9, spaces only)"
          aria-describedby="message-hint"
          value={message}
          onChange={handleMessageChange}
        />
        <p id="message-hint" className="hint">
          Max {MAX_MESSAGE_LENGTH} characters. Only letters, numbers, and
          spaces are transmitted.
        </p>
      </div>

      <section className="controls">
        <div className="control-group">
          <label htmlFor="sound-toggle">Sound</label>
          <input
            type="checkbox"
            id="sound-toggle"
            name="sound"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            aria-label="Enable sound for Morse code"
          />
        </div>
        <div className="control-group">
          <label htmlFor="wpm-slider">Speed (WPM)</label>
          <input
            type="range"
            id="wpm-slider"
            name="wpm"
            min={WPM_MIN}
            max={WPM_MAX}
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            aria-label="Words per minute"
          />
          <span id="wpm-value" aria-live="polite">
            {wpm}
          </span>{' '}
          WPM
        </div>
        <button
          type="button"
          onClick={handlePlay}
          className="btn btn-primary"
          disabled={false}
        >
          {isPlaying ? 'Stop' : 'Play as radio'}
        </button>
        <button type="button" onClick={handleCopy} className="btn btn-secondary">
          Copy Morse
        </button>
      </section>

      <section className="output-section">
        <div className="signal-container">
          <span className="signal-label">Signal</span>
          <div
            className={`signal-indicator ${signalOn ? 'signal-on' : ''}`}
            role="status"
            aria-live="polite"
            aria-label="Radio signal indicator"
          />
        </div>
      </section>

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
