/**
 * Word Scramble Game — Professional Edition
 * Egyptian English Academy
 * Features: letter tiles, animated input, hints, countdown, streaks, XP scaling
 */

import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playClick } from './gameAudio.js';

const ROUNDS = 8;
const TIME_PER_WORD = 20;

let ws = {};

// ─── Public API ────────────────────────────────────────────────────────────────
export function playWordScramble(mount, { vocabPool, onWin }) {
  if (!vocabPool || vocabPool.length < 5) {
    mount.innerHTML = `<div class="gc-error">⚠️ Not enough vocabulary. Complete more lessons!</div>`;
    return;
  }
  startGame(mount, vocabPool, onWin);
}

// ─── Start ─────────────────────────────────────────────────────────────────────
function startGame(mount, pool, onWin) {
  const eligible = pool.filter(v => {
    const w = v.english.replace(/[^a-zA-Z]/g, '');
    return w.length >= 4 && w.length <= 12;
  });
  const chosen = [...eligible].sort(() => Math.random() - 0.5).slice(0, ROUNDS);

  ws = {
    pool: eligible,
    words: chosen,
    round: 0,
    score: 0,
    streak: 0,
    onWin,
    timerInterval: null,
    timeLeft: TIME_PER_WORD,
    answered: false,
    hintCount: 3,
  };

  nextRound(mount);
}

// ─── Round logic ───────────────────────────────────────────────────────────────
function nextRound(mount) {
  clearInterval(ws.timerInterval);
  if (ws.round >= ROUNDS) { showResults(mount); return; }

  const wordObj = ws.words[ws.round];
  const clean   = wordObj.english.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const scrambled = scrambleWord(clean);

  ws.current    = { word: clean, hint: wordObj.arabic, scrambled };
  ws.answered   = false;
  ws.timeLeft   = TIME_PER_WORD;
  ws.selected   = []; // indices from scrambled letters that user picked
  ws.remaining  = scrambled.split('').map((l, i) => ({ letter: l, idx: i, used: false }));

  renderRound(mount);
  startTimer(mount);
}

// ─── Scramble ──────────────────────────────────────────────────────────────────
function scrambleWord(word) {
  let arr = word.split('');
  let attempts = 0;
  do {
    arr = arr.sort(() => Math.random() - 0.5);
    attempts++;
  } while (arr.join('') === word && attempts < 20);
  return arr.join('');
}

// ─── Render ────────────────────────────────────────────────────────────────────
function renderRound(mount) {
  const progress = (ws.round / ROUNDS) * 100;

  mount.innerHTML = `
    <div class="wsc-root" id="wsc-root">

      <!-- HUD -->
      <div class="wsc-hud">
        <div class="wsc-hud-item">
          <span>Round</span><strong>${ws.round + 1}/${ROUNDS}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>Score</span><strong id="wsc-score">${ws.score}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>Streak 🔥</span><strong id="wsc-streak">${ws.streak}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>Hints 💡</span><strong id="wsc-hints">${ws.hintCount}</strong>
        </div>
      </div>

      <!-- Progress -->
      <div class="wsc-progress-wrap">
        <div class="wsc-progress-fill" style="width:${progress}%"></div>
      </div>

      <!-- Timer + Hint -->
      <div class="wsc-timer-row">
        <div class="wsc-timer-track">
          <div class="wsc-timer-bar" id="wsc-timer-bar"
               style="width:100%;transition:width ${TIME_PER_WORD}s linear"></div>
        </div>
        <span class="wsc-timer-num" id="wsc-timer">${ws.timeLeft}s</span>
      </div>

      <!-- Hint area -->
      <div class="wsc-hint-card">
        <div class="wsc-hint-label">💡 Arabic Meaning:</div>
        <div class="wsc-hint-value wsc-ar-text">${ws.current.hint}</div>
        <div class="wsc-hint-letters">Word has <strong>${ws.current.word.length}</strong> letters</div>
      </div>

      <!-- Answer slots -->
      <div class="wsc-answer-slots" id="wsc-answer-slots">
        ${ws.current.word.split('').map((_, i) => `
          <div class="wsc-slot" data-slot="${i}" id="wsc-slot-${i}">
            <span class="wsc-slot-letter" id="wsc-slot-letter-${i}"></span>
          </div>
        `).join('')}
      </div>

      <!-- Scrambled letters -->
      <div class="wsc-letter-pool" id="wsc-letter-pool">
        ${ws.remaining.map(item => `
          <button class="wsc-tile" data-tile-idx="${item.idx}" id="wsc-tile-${item.idx}">
            ${item.letter}
          </button>
        `).join('')}
      </div>

      <!-- Actions -->
      <div class="wsc-actions">
        <button class="wsc-action-btn wsc-clear-btn" id="wsc-clear">⌫ Clear</button>
        <button class="wsc-action-btn wsc-hint-btn" id="wsc-hint-use" ${ws.hintCount <= 0 ? 'disabled' : ''}>💡 Hint</button>
        <button class="wsc-action-btn wsc-submit-btn" id="wsc-submit">✓ Submit</button>
      </div>

      <div class="wsc-feedback" id="wsc-feedback"></div>
    </div>
  `;

  attachWSListeners(mount);
  // Kick timer bar animation
  requestAnimationFrame(() => {
    const bar = document.getElementById('wsc-timer-bar');
    if (bar) bar.style.width = '0%';
  });
}

// ─── Listeners ─────────────────────────────────────────────────────────────────
function attachWSListeners(mount) {
  // Tile selection
  mount.querySelectorAll('.wsc-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (ws.answered || btn.disabled) return;
      const idx = parseInt(btn.dataset.tileIdx);
      selectTile(idx, mount);
    });
  });

  // Answer slots (click to deselect)
  mount.querySelectorAll('.wsc-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (ws.answered) return;
      const slotIdx = parseInt(slot.dataset.slot);
      if (ws.selected[slotIdx] !== undefined) deselectSlot(slotIdx, mount);
    });
  });

  // Controls
  document.getElementById('wsc-clear').addEventListener('click', () => clearAll(mount));
  document.getElementById('wsc-hint-use').addEventListener('click', () => useHint(mount));
  document.getElementById('wsc-submit').addEventListener('click', () => submitAnswer(mount));
}

// ─── Selection logic ───────────────────────────────────────────────────────────
function selectTile(tileIdx, mount) {
  createAudioCtx();
  playClick();

  const item = ws.remaining.find(r => r.idx === tileIdx);
  if (!item || item.used) return;

  const nextSlot = ws.selected.length;
  if (nextSlot >= ws.current.word.length) return;

  item.used = true;
  ws.selected.push({ tileIdx, letter: item.letter });

  // Update tile
  const tile = document.getElementById(`wsc-tile-${tileIdx}`);
  if (tile) { tile.disabled = true; tile.classList.add('used'); }

  // Update slot
  const slotLetter = document.getElementById(`wsc-slot-letter-${nextSlot}`);
  const slot = document.getElementById(`wsc-slot-${nextSlot}`);
  if (slotLetter) slotLetter.textContent = item.letter;
  if (slot) slot.classList.add('filled');

  // Auto-check if all slots filled
  if (ws.selected.length === ws.current.word.length) {
    setTimeout(() => submitAnswer(mount), 300);
  }
}

function deselectSlot(slotIdx, mount) {
  const entry = ws.selected[slotIdx];
  if (!entry) return;

  // Re-enable tile
  const tile = document.getElementById(`wsc-tile-${entry.tileIdx}`);
  if (tile) { tile.disabled = false; tile.classList.remove('used'); }

  // Shift remaining selected entries left
  ws.selected.splice(slotIdx, 1);
  ws.remaining.find(r => r.idx === entry.tileIdx).used = false;

  // Re-render slots from slotIdx onwards
  ws.selected.forEach((s, i) => {
    const sl = document.getElementById(`wsc-slot-letter-${i}`);
    const slEl = document.getElementById(`wsc-slot-${i}`);
    if (sl) sl.textContent = s.letter;
    if (slEl) slEl.classList.add('filled');
  });
  for (let i = ws.selected.length; i < ws.current.word.length; i++) {
    const sl = document.getElementById(`wsc-slot-letter-${i}`);
    const slEl = document.getElementById(`wsc-slot-${i}`);
    if (sl) sl.textContent = '';
    if (slEl) slEl.classList.remove('filled');
  }
}

function clearAll(mount) {
  ws.selected = [];
  ws.remaining.forEach(r => { r.used = false; });

  ws.remaining.forEach(item => {
    const tile = document.getElementById(`wsc-tile-${item.idx}`);
    if (tile) { tile.disabled = false; tile.classList.remove('used'); }
  });
  for (let i = 0; i < ws.current.word.length; i++) {
    const sl = document.getElementById(`wsc-slot-letter-${i}`);
    const slEl = document.getElementById(`wsc-slot-${i}`);
    if (sl) sl.textContent = '';
    if (slEl) slEl.classList.remove('filled');
  }
}

function useHint(mount) {
  if (ws.hintCount <= 0 || ws.answered) return;
  ws.hintCount--;
  document.getElementById('wsc-hints').textContent = ws.hintCount;

  // Reveal the next unfilled correct letter
  const nextSlotIdx = ws.selected.length;
  if (nextSlotIdx >= ws.current.word.length) return;
  const correctLetter = ws.current.word[nextSlotIdx];

  // Find an unused tile with this letter
  const tileItem = ws.remaining.find(r => r.letter === correctLetter && !r.used);
  if (tileItem) selectTile(tileItem.idx, mount);
}

// ─── Submit ────────────────────────────────────────────────────────────────────
function submitAnswer(mount) {
  if (ws.answered) return;
  if (ws.selected.length === 0) return;
  clearInterval(ws.timerInterval);
  ws.answered = true;

  const typed = ws.selected.map(s => s.letter).join('');
  const isCorrect = typed === ws.current.word;
  createAudioCtx();

  if (isCorrect) {
    playSuccessChime();
    ws.streak++;
    const timePts  = ws.timeLeft * 3;
    const streakPts = Math.min(5, ws.streak) * 20;
    const pts = 100 + timePts + streakPts;
    ws.score += pts;

    // Highlight slots green
    for (let i = 0; i < ws.current.word.length; i++) {
      document.getElementById(`wsc-slot-${i}`)?.classList.add('slot-correct');
    }
    showFeedback(mount, `✅ Correct! +${pts} pts`, 'fb-correct');
  } else {
    playFailBuzz();
    ws.streak = 0;

    // Show correct word in slots
    for (let i = 0; i < ws.current.word.length; i++) {
      const sl = document.getElementById(`wsc-slot-letter-${i}`);
      const slEl = document.getElementById(`wsc-slot-${i}`);
      if (sl) sl.textContent = ws.current.word[i];
      if (slEl) slEl.classList.add('slot-wrong');
    }
    showFeedback(mount, `❌ Correct: ${ws.current.word}`, 'fb-wrong');
  }

  document.getElementById('wsc-score').textContent = ws.score;
  document.getElementById('wsc-streak').textContent = ws.streak;

  ws.round++;
  setTimeout(() => nextRound(mount), 1500);
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(mount) {
  ws.timerInterval = setInterval(() => {
    ws.timeLeft--;
    const el = document.getElementById('wsc-timer');
    if (el) el.textContent = `${ws.timeLeft}s`;
    if (ws.timeLeft <= 0 && !ws.answered) {
      clearInterval(ws.timerInterval);
      ws.answered = true;
      ws.streak = 0;
      playFailBuzz();
      showFeedback(mount, `⏱ Time's up! Answer: ${ws.current.word}`, 'fb-wrong');
      for (let i = 0; i < ws.current.word.length; i++) {
        const sl = document.getElementById(`wsc-slot-letter-${i}`);
        const slEl = document.getElementById(`wsc-slot-${i}`);
        if (sl) sl.textContent = ws.current.word[i];
        if (slEl) slEl.classList.add('slot-wrong');
      }
      ws.round++;
      setTimeout(() => nextRound(mount), 1600);
    }
  }, 1000);
}

function showFeedback(mount, msg, cls) {
  const fb = document.getElementById('wsc-feedback');
  if (fb) { fb.textContent = msg; fb.className = `wsc-feedback ${cls}`; }
}

// ─── Results ───────────────────────────────────────────────────────────────────
function showResults(mount) {
  clearInterval(ws.timerInterval);
  playSuccessChime();
  ws.onWin(ws.score);

  const acc = Math.round((ws.score / (ROUNDS * 120)) * 100);
  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="sp-results">
      <div class="sp-results-grade" style="color:#f59e0b;border-color:#f59e0b">🔤</div>
      <h2>Word Scramble Complete!</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>Final Score</span><strong>${ws.score} pts</strong></div>
        <div class="sp-result-item"><span>Rounds</span><strong>${ROUNDS}</strong></div>
        <div class="sp-result-item"><span>Hints Used</span><strong>${3 - ws.hintCount}</strong></div>
        <div class="sp-result-item"><span>Best Streak</span><strong>🔥 ${ws.streak}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="wsc-replay">Play Again</button>
        <button class="gc-back-small-btn" id="wsc-hub">Back to Games</button>
      </div>
    </div>
  `;
  mount.querySelector('#wsc-replay').addEventListener('click', () => startGame(mount, ws.pool, ws.onWin));
  mount.querySelector('#wsc-hub').addEventListener('click', () => document.querySelector('#gc-back-btn')?.click());
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    mount.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}
