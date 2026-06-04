/**
 * Memory Match Game — Professional Edition
 * Egyptian English Academy
 * Features: Animated card flip (CSS 3D), timer, combo multiplier, difficulty levels, best time.
 */

import { createAudioCtx, playFlip, playMatch, playSuccessChime, playFailBuzz } from './gameAudio.js';

const DIFFICULTY = {
  easy:   { pairs: 6,  cols: 4, label: 'Easy (12 cards)' },
  medium: { pairs: 10, cols: 5, label: 'Medium (20 cards)' },
  hard:   { pairs: 15, cols: 6, label: 'Hard (30 cards)' },
};

const BEST_TIME_KEY = 'eea_memory_best';

function getBestTimes() {
  try { return JSON.parse(localStorage.getItem(BEST_TIME_KEY)) || {}; }
  catch { return {}; }
}
function saveBestTime(diff, seconds) {
  const t = getBestTimes();
  if (!t[diff] || seconds < t[diff]) {
    t[diff] = seconds;
    localStorage.setItem(BEST_TIME_KEY, JSON.stringify(t));
  }
}

// ─── State ───────────────────────────────────────────────────────────────────
let mm = {};

function buildCards(pool, numPairs) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, numPairs);
  const cards = [];
  shuffled.forEach((v, i) => {
    cards.push({ id: i * 2,     pairId: i, type: 'en', text: v.english, matched: false, flipped: false });
    cards.push({ id: i * 2 + 1, pairId: i, type: 'ar', text: v.arabic,  matched: false, flipped: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function playMemoryMatch(mount, { vocabPool, onWin }) {
  if (!vocabPool || vocabPool.length < 6) {
    mount.innerHTML = `<div class="gc-error">⚠️ Not enough vocabulary. Complete more lessons first!</div>`;
    return;
  }
  showDifficultyScreen(mount, vocabPool, onWin);
}

// ─── Difficulty selector ──────────────────────────────────────────────────────
function showDifficultyScreen(mount, pool, onWin) {
  const best = getBestTimes();
  mount.innerHTML = `
    <div class="mm-difficulty-screen">
      <div class="mm-diff-header">
        <div class="mm-diff-icon">🎴</div>
        <h2>Memory Match</h2>
        <p>Match each English word with its Arabic translation. Flip two cards at a time!</p>
      </div>
      <div class="mm-diff-cards">
        ${Object.entries(DIFFICULTY).map(([key, cfg]) => `
          <button class="mm-diff-btn" data-diff="${key}">
            <span class="mm-diff-label">${cfg.label}</span>
            ${best[key] ? `<span class="mm-diff-best">🏆 Best: ${formatTime(best[key])}</span>` : '<span class="mm-diff-best">No record yet</span>'}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  mount.querySelectorAll('.mm-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(mount, pool, onWin, btn.dataset.diff));
  });
}

// ─── Start game ───────────────────────────────────────────────────────────────
function startGame(mount, pool, onWin, difficulty) {
  const cfg = DIFFICULTY[difficulty];
  const maxPairs = Math.min(cfg.pairs, Math.floor(pool.length));
  mm = {
    cards: buildCards(pool, maxPairs),
    flipped: [],
    matched: 0,
    totalPairs: maxPairs,
    moves: 0,
    locked: false,
    timer: 0,
    timerInterval: null,
    difficulty,
    cols: cfg.cols,
    combo: 0,
    score: 0,
    startTime: Date.now(),
  };

  renderGame(mount, pool, onWin);

  mm.timerInterval = setInterval(() => {
    mm.timer++;
    const el = document.getElementById('mm-timer');
    if (el) el.textContent = formatTime(mm.timer);
  }, 1000);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderGame(mount, pool, onWin) {
  mount.innerHTML = `
    <div class="mm-root" id="mm-root">
      <div class="mm-hud">
        <div class="mm-hud-item">
          <span class="mm-hud-label">Time</span>
          <span class="mm-hud-val" id="mm-timer">0:00</span>
        </div>
        <div class="mm-hud-item">
          <span class="mm-hud-label">Moves</span>
          <span class="mm-hud-val" id="mm-moves">0</span>
        </div>
        <div class="mm-hud-item">
          <span class="mm-hud-label">Pairs</span>
          <span class="mm-hud-val" id="mm-pairs">${mm.matched}/${mm.totalPairs}</span>
        </div>
        <div class="mm-hud-item">
          <span class="mm-hud-label">Combo</span>
          <span class="mm-hud-val combo" id="mm-combo">x${mm.combo + 1}</span>
        </div>
        <div class="mm-hud-item">
          <span class="mm-hud-label">Score</span>
          <span class="mm-hud-val score" id="mm-score">${mm.score}</span>
        </div>
      </div>

      <div class="mm-board" id="mm-board"
           style="grid-template-columns: repeat(${mm.cols}, 1fr);">
        ${mm.cards.map(card => renderCard(card)).join('')}
      </div>

      <div class="mm-overlay" id="mm-overlay" style="display:none"></div>
    </div>
  `;

  mount.querySelectorAll('.mm-card').forEach(el => {
    el.addEventListener('click', () => handleCardClick(parseInt(el.dataset.id), mount, pool, onWin));
  });
}

function renderCard(card) {
  const cls = [
    'mm-card',
    card.flipped ? 'flipped' : '',
    card.matched ? 'matched' : '',
    card.type === 'en' ? 'mm-card-en' : 'mm-card-ar',
  ].filter(Boolean).join(' ');

  return `
    <div class="${cls}" data-id="${card.id}" data-pair="${card.pairId}">
      <div class="mm-card-inner">
        <div class="mm-card-front">
          <span class="mm-card-front-icon">${card.type === 'en' ? '🔤' : '📖'}</span>
        </div>
        <div class="mm-card-back">
          <span class="mm-card-text">${card.text}</span>
          <span class="mm-card-lang">${card.type === 'en' ? 'English' : 'Arabic'}</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Card Click Logic ─────────────────────────────────────────────────────────
function handleCardClick(cardId, mount, pool, onWin) {
  if (mm.locked) return;
  const card = mm.cards.find(c => c.id === cardId);
  if (!card || card.flipped || card.matched) return;
  if (mm.flipped.length === 1 && mm.flipped[0].id === cardId) return;

  createAudioCtx();
  playFlip();

  card.flipped = true;
  mm.flipped.push(card);

  // Animate flip
  const el = mount.querySelector(`[data-id="${cardId}"]`);
  if (el) el.classList.add('flipped');

  if (mm.flipped.length === 2) {
    mm.moves++;
    document.getElementById('mm-moves').textContent = mm.moves;
    mm.locked = true;

    const [a, b] = mm.flipped;
    if (a.pairId === b.pairId && a.type !== b.type) {
      // Match!
      setTimeout(() => {
        playMatch();
        [a, b].forEach(c => {
          c.matched = true;
          const el2 = mount.querySelector(`[data-id="${c.id}"]`);
          if (el2) el2.classList.add('matched');
        });
        mm.combo++;
        mm.matched++;
        const comboMult = Math.min(5, mm.combo);
        mm.score += 100 * comboMult;

        document.getElementById('mm-combo').textContent = `x${mm.combo + 1}`;
        document.getElementById('mm-pairs').textContent = `${mm.matched}/${mm.totalPairs}`;
        document.getElementById('mm-score').textContent = mm.score;

        mm.flipped = [];
        mm.locked = false;

        if (mm.matched === mm.totalPairs) {
          clearInterval(mm.timerInterval);
          saveBestTime(mm.difficulty, mm.timer);
          onWin(mm.score);
          setTimeout(() => showWinScreen(mount, pool, onWin), 500);
        }
      }, 300);
    } else {
      // No match
      setTimeout(() => {
        playFailBuzz();
        mm.combo = 0;
        document.getElementById('mm-combo').textContent = `x1`;
        [a, b].forEach(c => {
          c.flipped = false;
          const el2 = mount.querySelector(`[data-id="${c.id}"]`);
          if (el2) el2.classList.remove('flipped');
        });
        mm.flipped = [];
        mm.locked = false;
      }, 900);
    }
  }
}

// ─── Win Screen ───────────────────────────────────────────────────────────────
function showWinScreen(mount, pool, onWin) {
  playSuccessChime();
  spawnConfetti(mount.querySelector('#mm-root'));

  const best = getBestTimes()[mm.difficulty];
  const isNewRecord = best === mm.timer;
  const efficiency = Math.max(0, Math.round(100 - (mm.moves - mm.totalPairs) * 3));

  const overlay = document.getElementById('mm-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-card hm-win-card">
      <div class="hm-result-icon">${isNewRecord ? '🏆' : '🎉'}</div>
      <h2 class="hm-result-title">${isNewRecord ? 'New Record!' : 'Board Cleared!'}</h2>
      <div class="hm-result-scores">
        <div class="hm-rscore-item"><span>Time</span><strong>${formatTime(mm.timer)}</strong></div>
        <div class="hm-rscore-item"><span>Moves</span><strong>${mm.moves}</strong></div>
        <div class="hm-rscore-item"><span>Efficiency</span><strong>${efficiency}%</strong></div>
        <div class="hm-rscore-item accent"><span>Score</span><strong>${mm.score} pts</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="mm-replay-btn">Play Again</button>
        <button class="gc-back-small-btn" id="mm-diff-btn">Change Difficulty</button>
      </div>
    </div>
  `;

  overlay.querySelector('#mm-replay-btn').addEventListener('click', () => startGame(mount, pool, onWin, mm.difficulty));
  overlay.querySelector('#mm-diff-btn').addEventListener('click', () => showDifficultyScreen(mount, pool, onWin));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
  return `${Math.floor(s/60)}:${String(s % 60).padStart(2, '0')}`;
}

function spawnConfetti(root) {
  if (!root) return;
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}
