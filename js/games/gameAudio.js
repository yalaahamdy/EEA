/**
 * Game Audio Engine — Web Audio API (no external files)
 * Egyptian English Academy
 */

let _ctx = null;
let _soundEnabled = localStorage.getItem('eea_games_sound') !== 'false';

export function createAudioCtx() {
  if (!_soundEnabled) return null;
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function isSoundEnabled() {
  return _soundEnabled;
}

export function setSoundEnabled(enabled) {
  _soundEnabled = !!enabled;
  localStorage.setItem('eea_games_sound', _soundEnabled ? 'true' : 'false');
  if (!_soundEnabled && _ctx) {
    try { _ctx.close(); } catch(e) {}
    _ctx = null;
  }
}

export function playTone(frequency, duration = 0.15, type = 'sine', volume = 0.3) {
  if (!_soundEnabled) return;
  const ctx = createAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playSuccessChime() {
  if (!_soundEnabled) return;
  const ctx = createAudioCtx();
  if (!ctx) return;
  const notes = [523, 659, 784, 1047]; // C E G C (major chord)
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.25), i * 100);
  });
}

export function playFailBuzz() {
  if (!_soundEnabled) return;
  const ctx = createAudioCtx();
  if (!ctx) return;
  playTone(150, 0.3, 'sawtooth', 0.15);
}

export function playClick() {
  if (!_soundEnabled) return;
  playTone(800, 0.06, 'sine', 0.1);
}

export function playFlip() {
  if (!_soundEnabled) return;
  playTone(440, 0.08, 'triangle', 0.12);
}

export function playMatch() {
  if (!_soundEnabled) return;
  playTone(660, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(880, 0.15, 'sine', 0.2), 100);
}

export function playCountdown() {
  if (!_soundEnabled) return;
  playTone(300, 0.12, 'square', 0.1);
}

export function playTimeUp() {
  if (!_soundEnabled) return;
  [200, 180, 160].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sawtooth', 0.2), i * 150));
}

