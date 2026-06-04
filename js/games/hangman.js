/**
 * Hangman Game — Professional Edition
 * Egyptian English Academy
 * Features: SVG animated scaffold, keyboard, hints, sound, streaks, XP multiplier
 */

import { createAudioCtx, playTone, playSuccessChime, playFailBuzz } from './gameAudio.js';

const MAX_WRONG = 6;

// ─── SVG Parts ──────────────────────────────────────────────────────────────
const SVG_PARTS = [
  // 0: Gallows base
  `<line x1="20" y1="230" x2="180" y2="230" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-0"/>`,
  // 1: Pole
  `<line x1="80" y1="230" x2="80" y2="20" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-1"/>`,
  // 2: Top bar
  `<line x1="80" y1="20" x2="160" y2="20" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-2"/>`,
  // 3: Rope
  `<line x1="160" y1="20" x2="160" y2="50" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-3"/>`,
  // 4: Head
  `<circle cx="160" cy="68" r="18" stroke="var(--hm-ink)" fill="none" stroke-width="4" class="hm-part hm-part-4"/>`,
  // 5: Body
  `<line x1="160" y1="86" x2="160" y2="150" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-5"/>`,
  // 6: Left arm
  `<line x1="160" y1="100" x2="130" y2="130" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-6"/>`,
  // 7: Right arm
  `<line x1="160" y1="100" x2="190" y2="130" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-7"/>`,
  // 8: Left leg
  `<line x1="160" y1="150" x2="130" y2="190" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-8"/>`,
  // 9: Right leg
  `<line x1="160" y1="150" x2="190" y2="190" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-9"/>`,
];

// Show parts 0-3 always (gallows), parts 4-9 on each wrong guess (6 parts = 6 lives)
const ALWAYS_SHOW = [0, 1, 2, 3];
const BODY_PARTS  = [4, 5, 6, 7, 8, 9]; // index = wrong guess count - 1

// ─── Keyboard layout ────────────────────────────────────────────────────────
const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// ─── State ───────────────────────────────────────────────────────────────────
let state = {};

function resetState(wordObj) {
  state = {
    word: wordObj.english.toUpperCase().replace(/[^A-Z]/g, ''),
    hint: wordObj.arabic,
    guessed: new Set(),
    wrong: 0,
    phase: 'playing', // 'playing' | 'won' | 'lost'
    hintUsed: false,
    startTime: Date.now(),
    score: 0,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function playHangman(mount, { vocabPool, onWin }) {
  if (!vocabPool || vocabPool.length === 0) {
    mount.innerHTML = `<div class="gc-error">⚠️ No vocabulary found. Complete at least one lesson first!</div>`;
    return;
  }
  startRound(mount, vocabPool, onWin, 0, 0);
}

function startRound(mount, pool, onWin, roundNum, totalScore) {
  const eligible = pool.filter(v => {
    const clean = v.english.toUpperCase().replace(/[^A-Z]/g, '');
    return clean.length >= 3 && clean.length <= 14;
  });
  const wordObj = eligible[Math.floor(Math.random() * eligible.length)];
  resetState(wordObj);
  state.roundNum = roundNum;
  state.totalScore = totalScore;

  renderGame(mount, pool, onWin);
}

// ─── Render ──────────────────────────────────────────────────────────────────
function renderGame(mount, pool, onWin) {
  mount.innerHTML = `
    <div class="hm-container" id="hm-root">

      <!-- Header bar -->
      <div class="hm-header">
        <div class="hm-round-badge">Round ${state.roundNum + 1}</div>
        <div class="hm-score-display">Score: <strong id="hm-score-val">${state.totalScore}</strong></div>
        <div class="hm-lives-display">
          ${Array.from({length: MAX_WRONG}, (_, i) =>
            `<span class="hm-heart ${i < (MAX_WRONG - state.wrong) ? 'active' : 'lost'}">❤️</span>`
          ).join('')}
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="hm-layout">

        <!-- Left: SVG Scaffold -->
        <div class="hm-scaffold-col">
          <svg class="hm-svg" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" id="hm-svg">
            ${ALWAYS_SHOW.map(i => SVG_PARTS[i]).join('')}
            ${BODY_PARTS.slice(0, state.wrong).map(i => SVG_PARTS[i]).join('')}
          </svg>
          <button class="hm-hint-btn ${state.hintUsed ? 'used' : ''}" id="hm-hint-btn">
            ${state.hintUsed
              ? `<span class="hm-hint-text">💡 ${state.hint}</span>`
              : `<span>💡 Show Hint</span><span class="hm-hint-cost">(-5 pts)</span>`}
          </button>
        </div>

        <!-- Right: Word + Keyboard -->
        <div class="hm-right-col">
          <div class="hm-word-display" id="hm-word-display">
            ${renderWordSlots()}
          </div>
          <p class="hm-word-length-hint">${state.word.length} letters</p>

          <div class="hm-keyboard" id="hm-keyboard">
            ${KEYBOARD_ROWS.map(row => `
              <div class="hm-keyboard-row">
                ${row.map(letter => `
                  <button class="hm-key ${state.guessed.has(letter) ? (state.word.includes(letter) ? 'correct' : 'wrong') : ''}"
                          data-letter="${letter}" id="hm-key-${letter}"
                          ${state.guessed.has(letter) ? 'disabled' : ''}>
                    ${letter}
                  </button>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Overlay (shown on win/lose) -->
      <div class="hm-overlay" id="hm-overlay" style="display:none"></div>
    </div>
  `;

  attachListeners(mount, pool, onWin);
  bindPhysicalKeyboard(mount, pool, onWin);
}

function renderWordSlots() {
  return state.word.split('').map(letter => `
    <span class="hm-slot ${state.guessed.has(letter) ? 'revealed' : ''}">
      <span class="hm-letter">${state.guessed.has(letter) ? letter : ''}</span>
      <span class="hm-underline"></span>
    </span>
  `).join('');
}

// ─── Listeners ───────────────────────────────────────────────────────────────
let _keyListener = null;

function bindPhysicalKeyboard(mount, pool, onWin) {
  if (_keyListener) document.removeEventListener('keydown', _keyListener);
  _keyListener = (e) => {
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && !state.guessed.has(letter) && state.phase === 'playing') {
      handleGuess(letter, mount, pool, onWin);
    }
  };
  document.addEventListener('keydown', _keyListener);
}

function attachListeners(mount, pool, onWin) {
  // Key buttons
  mount.querySelectorAll('.hm-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const letter = btn.dataset.letter;
      if (!state.guessed.has(letter) && state.phase === 'playing') {
        handleGuess(letter, mount, pool, onWin);
      }
    });
  });

  // Hint button
  const hintBtn = mount.querySelector('#hm-hint-btn');
  if (hintBtn && !state.hintUsed) {
    hintBtn.addEventListener('click', () => {
      state.hintUsed = true;
      state.totalScore = Math.max(0, state.totalScore - 5);
      renderGame(mount, pool, onWin);
    });
  }
}

// ─── Game Logic ───────────────────────────────────────────────────────────────
function handleGuess(letter, mount, pool, onWin) {
  if (state.phase !== 'playing') return;
  state.guessed.add(letter);
  createAudioCtx();

  if (state.word.includes(letter)) {
    playTone(523, 0.1, 'sine'); // C5 - correct
    const allRevealed = state.word.split('').every(l => state.guessed.has(l));
    if (allRevealed) {
      const elapsed = (Date.now() - state.startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor(50 - elapsed));
      const roundScore = 100 + timeBonus - (state.wrong * 10) - (state.hintUsed ? 5 : 0);
      state.score = Math.max(10, roundScore);
      state.totalScore += state.score;
      state.phase = 'won';
    }
  } else {
    playFailBuzz();
    state.wrong++;
    if (state.wrong >= MAX_WRONG) {
      state.phase = 'lost';
    }
  }

  // Update UI without full re-render for performance
  updateKeyButton(letter);
  updateScaffold(mount);
  updateWordDisplay(mount);
  updateLives(mount);

  if (state.phase === 'won') {
    setTimeout(() => showWinOverlay(mount, pool, onWin), 400);
  } else if (state.phase === 'lost') {
    setTimeout(() => showLoseOverlay(mount, pool, onWin), 400);
  }
}

function updateKeyButton(letter) {
  const btn = document.getElementById(`hm-key-${letter}`);
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add(state.word.includes(letter) ? 'correct' : 'wrong');
}

function updateScaffold(mount) {
  const svg = mount.querySelector('#hm-svg');
  if (!svg) return;
  // Remove old body parts and re-draw
  svg.querySelectorAll('.hm-part:not(.hm-part-0):not(.hm-part-1):not(.hm-part-2):not(.hm-part-3)').forEach(el => el.remove());
  BODY_PARTS.slice(0, state.wrong).forEach(i => {
    svg.insertAdjacentHTML('beforeend', SVG_PARTS[i]);
  });
}

function updateWordDisplay(mount) {
  const display = mount.querySelector('#hm-word-display');
  if (display) display.innerHTML = renderWordSlots();
}

function updateLives(mount) {
  const livesEl = mount.querySelector('.hm-lives-display');
  if (!livesEl) return;
  livesEl.innerHTML = Array.from({length: MAX_WRONG}, (_, i) =>
    `<span class="hm-heart ${i < (MAX_WRONG - state.wrong) ? 'active' : 'lost'}">❤️</span>`
  ).join('');
}

// ─── Overlays ────────────────────────────────────────────────────────────────
function showWinOverlay(mount, pool, onWin) {
  playSuccessChime();
  spawnConfetti(mount);
  onWin(state.score);

  const overlay = mount.querySelector('#hm-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-card hm-win-card">
      <div class="hm-result-icon">🎉</div>
      <h2 class="hm-result-title">Excellent!</h2>
      <p class="hm-result-word">The word was: <strong>${state.word}</strong></p>
      <p class="hm-result-meaning">Meaning: <span class="hm-arabic">${state.hint}</span></p>
      <div class="hm-result-scores">
        <div class="hm-rscore-item"><span>Round Score</span><strong>+${state.score} pts</strong></div>
        <div class="hm-rscore-item accent"><span>Total Score</span><strong>${state.totalScore} pts</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="hm-next-btn">Next Word →</button>
        <button class="gc-back-small-btn" id="hm-hub-btn">Back to Games</button>
      </div>
    </div>
  `;
  mount.querySelector('#hm-next-btn').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    startRound(mount, pool, onWin, state.roundNum + 1, state.totalScore);
  });
  mount.querySelector('#hm-hub-btn').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    document.querySelector('#gc-back-btn')?.click();
  });
}

function showLoseOverlay(mount, pool, onWin) {
  const overlay = mount.querySelector('#hm-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-card hm-lose-card">
      <div class="hm-result-icon">💔</div>
      <h2 class="hm-result-title">Don't Give Up!</h2>
      <p class="hm-result-word">The word was: <strong>${state.word}</strong></p>
      <p class="hm-result-meaning">Meaning: <span class="hm-arabic">${state.hint}</span></p>
      <div class="hm-result-scores">
        <div class="hm-rscore-item accent"><span>Total Score</span><strong>${state.totalScore} pts</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="hm-retry-btn">Try Again</button>
        <button class="gc-back-small-btn" id="hm-hub-btn2">Back to Games</button>
      </div>
    </div>
  `;
  mount.querySelector('#hm-retry-btn').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    startRound(mount, pool, onWin, state.roundNum + 1, state.totalScore);
  });
  mount.querySelector('#hm-hub-btn2').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    document.querySelector('#gc-back-btn')?.click();
  });
}

// ─── Confetti ────────────────────────────────────────────────────────────────
function spawnConfetti(mount) {
  const root = mount.querySelector('#hm-root');
  if (!root) return;
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9','#a78bfa'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*0.6}s;
      width:${6 + Math.random()*6}px;
      height:${6 + Math.random()*6}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}
