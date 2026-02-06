/**
 * MANET Morse Radio – app logic: validation, playback (audio + visual), copy.
 * Uses textContent for user-derived output; no innerHTML with user data.
 */

(function () {
  'use strict';

  var FREQ_HZ = 700;
  var DEFAULT_WPM = 15;
  var WPM_MIN = 5;
  var WPM_MAX = 25;

  var messageInput = document.getElementById('message-input');
  var soundToggle = document.getElementById('sound-toggle');
  var wpmSlider = document.getElementById('wpm-slider');
  var wpmValue = document.getElementById('wpm-value');
  var playBtn = document.getElementById('play-btn');
  var copyBtn = document.getElementById('copy-btn');
  var copyMorseBtn = document.getElementById('copy-morse-btn');
  var signalIndicator = document.getElementById('signal-indicator');
  var morseOutput = document.getElementById('morse-output');
  var statusEl = document.getElementById('status');

  var audioContext = null;
  var isPlaying = false;
  var playTimeouts = [];

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'status' + (isError ? ' error' : '');
  }

  function getWpm() {
    var val = parseInt(wpmSlider.value, 10);
    return isNaN(val) ? DEFAULT_WPM : Math.max(WPM_MIN, Math.min(WPM_MAX, val));
  }

  function updateWpmDisplay() {
    if (wpmValue) wpmValue.textContent = getWpm();
  }

  function initAudioContext() {
    if (audioContext) return audioContext;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      setStatus('Audio not supported', true);
      return null;
    }
    return audioContext;
  }

  function playTone(startTime, durationMs) {
    if (!audioContext) return;
    var osc = audioContext.createOscillator();
    var gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = FREQ_HZ;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.setValueAtTime(0.2, startTime + durationMs / 1000 - 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + durationMs / 1000);
    osc.start(startTime);
    osc.stop(startTime + durationMs / 1000);
  }

  function runSchedule(schedule, soundEnabled, onDone) {
    if (!schedule || schedule.length === 0) {
      if (onDone) onDone();
      return;
    }
    var ctx = soundEnabled ? initAudioContext() : null;
    var t0 = ctx ? ctx.currentTime : 0;
    var cumulMs = 0;
    var i;
    for (i = 0; i < schedule.length; i++) {
      if (schedule[i].type === 'on' && ctx) {
        playTone(t0 + cumulMs / 1000, schedule[i].duration);
      }
      cumulMs += schedule[i].duration;
    }
    var idx = 0;
    function runNext() {
      if (idx >= schedule.length) {
        if (signalIndicator) signalIndicator.classList.remove('signal-on');
        isPlaying = false;
        if (playBtn) playBtn.disabled = false;
        if (onDone) onDone();
        return;
      }
      var seg = schedule[idx];
      idx += 1;
      if (seg.type === 'on') {
        if (signalIndicator) signalIndicator.classList.add('signal-on');
      } else {
        if (signalIndicator) signalIndicator.classList.remove('signal-on');
      }
      playTimeouts.push(setTimeout(runNext, seg.duration));
    }
    runNext();
  }

  function cancelPlayback() {
    playTimeouts.forEach(function (id) { clearTimeout(id); });
    playTimeouts.length = 0;
    if (signalIndicator) signalIndicator.classList.remove('signal-on');
    isPlaying = false;
    if (playBtn) playBtn.disabled = false;
  }

  function onPlay() {
    if (isPlaying) return;
    var raw = messageInput ? messageInput.value : '';
    var result = window.MORSE.validateInput(raw, window.MORSE.MAX_MESSAGE_LENGTH);
    if (!result.valid) {
      setStatus('Enter a message (letters, numbers, spaces only).', true);
      return;
    }
    var morse = window.MORSE.textToMorse(result.sanitized);
    if (!morse) {
      setStatus('No valid characters to send.', true);
      return;
    }
    if (morseOutput) morseOutput.textContent = morse;
    setStatus('Sending…');
    isPlaying = true;
    if (playBtn) playBtn.disabled = true;
    var wpm = getWpm();
    var unitMs = window.MORSE.wpmToUnitMs(wpm);
    var schedule = window.MORSE.buildSchedule(morse, unitMs);
    var soundOn = soundToggle && soundToggle.checked === true;
    runSchedule(schedule, soundOn, function () {
      setStatus('Done.');
    });
  }

  function copyMorseToClipboard() {
    var text = morseOutput ? morseOutput.textContent : '';
    if (!text) {
      setStatus('Nothing to copy. Convert a message first.', true);
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus('Clipboard not available', true);
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () { setStatus('Morse code copied.'); },
      function () { setStatus('Copy failed.', true); }
    );
  }

  playBtn.addEventListener('click', function () {
    if (isPlaying) cancelPlayback();
    else onPlay();
  });

  if (copyBtn) copyBtn.addEventListener('click', copyMorseToClipboard);
  if (copyMorseBtn) copyMorseBtn.addEventListener('click', copyMorseToClipboard);

  wpmSlider.addEventListener('input', updateWpmDisplay);

  messageInput.addEventListener('input', function () {
    var raw = messageInput.value;
    var result = window.MORSE.validateInput(raw, window.MORSE.MAX_MESSAGE_LENGTH);
    if (result.sanitized.length > 0) {
      var morse = window.MORSE.textToMorse(result.sanitized);
      if (morseOutput) morseOutput.textContent = morse;
    } else {
      if (morseOutput) morseOutput.textContent = '';
    }
  });

  updateWpmDisplay();
})();
