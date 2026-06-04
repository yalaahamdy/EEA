/**
 * Sentence Builder Game — Professional Edition
 * Egyptian English Academy
 * Features: tap-to-build sentences from lesson dialogues, animated slots, scoring
 */

import { createAudioCtx, playClick, playSuccessChime, playFailBuzz, playTone } from './gameAudio.js';

const ROUNDS = 6;
const TIME_PER_SENTENCE = 30;

let sb = {};

// ─── Fallback sentence pool if dialogue pool is small ─────────────────────────
const FALLBACK_SENTENCES = [
  { sentence: 'She is reading a very good book' },
  { sentence: 'I would like to order some coffee' },
  { sentence: 'The weather today is quite beautiful' },
  { sentence: 'Can you help me find the library' },
  { sentence: 'He speaks English very fluently' },
  { sentence: 'We are going to the market tomorrow' },
  { sentence: 'They finished their homework before dinner' },
  { sentence: 'My sister works at a big hospital' },
];

// ─── Public API ────────────────────────────────────────────────────────────────
export function playSentenceBuilder(mount, { sentencePool, onWin }) {
  let pool = (sentencePool || []).filter(s => {
    const words = s.sentence.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    return words.length >= 4 && words.length <= 10;
  });

  if (pool.length < ROUNDS) pool = [...pool, ...FALLBACK_SENTENCES];
  pool = pool.sort(() => Math.random() - 0.5);

  startGame(mount, pool, onWin);
}

// ─── Start ─────────────────────────────────────────────────────────────────────
function startGame(mount, pool, onWin) {
  sb = {
    pool,
    rounds: pool.slice(0, ROUNDS),
    round: 0,
    score: 0,
    streak: 0,
    onWin,
    timerInterval: null,
    timeLeft: TIME_PER_SENTENCE,
    answered: false,
  };
  nextRound(mount);
}

// ─── Round ─────────────────────────────────────────────────────────────────────
function nextRound(mount) {
  clearInterval(sb.timerInterval);
  if (sb.round >= ROUNDS) { showResults(mount); return; }

  const item = sb.rounds[sb.round];
  const cleaned = item.sentence.replace(/[^a-zA-Z\s']/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  // Ensure shuffled ≠ original
  let attempts = 0;
  let sh = shuffled;
  while (sh.join(' ') === words.join(' ') && attempts < 10) {
    sh = [...words].sort(() => Math.random() - 0.5);
    attempts++;
  }

  sb.current = { words, shuffled: sh, answer: [] };
  sb.answered = false;
  sb.timeLeft = TIME_PER_SENTENCE;

  renderRound(mount);
  startTimer(mount);
}

// ─── Render ────────────────────────────────────────────────────────────────────
function renderRound(mount) {
  const progress = (sb.round / ROUNDS) * 100;

  mount.innerHTML = `
    <div class="sbn-root" id="sbn-root">

      <!-- HUD -->
      <div class="sbn-hud">
        <div class="sbn-hud-item">
          <span>Sentence</span><strong>${sb.round + 1}/${ROUNDS}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>Score</span><strong id="sbn-score">${sb.score}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>Streak 🔥</span><strong id="sbn-streak">${sb.streak}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>Time</span><strong id="sbn-timer">${sb.timeLeft}s</strong>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="wsc-progress-wrap">
        <div class="wsc-progress-fill" style="width:${progress}%"></div>
      </div>

      <!-- Timer bar -->
      <div class="wsc-timer-row">
        <div class="wsc-timer-track">
          <div class="wsc-timer-bar" id="sbn-timer-bar"
               style="width:100%;transition:width ${TIME_PER_SENTENCE}s linear;background:var(--primary)"></div>
        </div>
      </div>

      <!-- Instruction -->
      <div class="sbn-instruction">
        <p>🧩 Tap the words below in the correct order to build a proper English sentence.</p>
      </div>

      <!-- Answer area -->
      <div class="sbn-answer-area" id="sbn-answer-area">
        <div class="sbn-answer-label">Your sentence:</div>
        <div class="sbn-answer-slots" id="sbn-answer-slots">
          ${sb.current.answer.length === 0
            ? '<span class="sbn-placeholder">Tap words below to start building...</span>'
            : sb.current.answer.map((w, i) => `
                <button class="sbn-answer-word" data-answer-idx="${i}">${w}
                  <span class="sbn-remove-hint">✕</span>
                </button>
              `).join('')
          }
        </div>
      </div>

      <!-- Word pool -->
      <div class="sbn-word-pool" id="sbn-word-pool">
        ${sb.current.shuffled.map((w, i) => {
          const used = sb.current.answer.filter(a => a === w).length >
                       sb.current.shuffled.slice(0, i).filter(x => x === w).length;
          return `
            <button class="sbn-word-tile ${used ? 'used' : ''}"
                    data-pool-idx="${i}"
                    data-word="${w}"
                    ${used ? 'disabled' : ''}>
              ${w}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Actions -->
      <div class="wsc-actions">
        <button class="wsc-action-btn wsc-clear-btn" id="sbn-clear">⌫ Clear</button>
        <button class="wsc-action-btn wsc-submit-btn" id="sbn-submit">✓ Submit</button>
      </div>

      <div class="wsc-feedback" id="sbn-feedback"></div>
    </div>
  `;

  // Kick timer bar
  requestAnimationFrame(() => {
    const bar = document.getElementById('sbn-timer-bar');
    if (bar) bar.style.width = '0%';
  });

  attachSBListeners(mount);
}

// ─── Listeners ─────────────────────────────────────────────────────────────────
function attachSBListeners(mount) {
  mount.querySelectorAll('.sbn-word-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered || btn.disabled) return;
      selectWord(btn.dataset.word, parseInt(btn.dataset.poolIdx), mount);
    });
  });

  mount.querySelectorAll('.sbn-answer-word').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered) return;
      removeWord(parseInt(btn.dataset.answerIdx), mount);
    });
  });

  document.getElementById('sbn-clear')?.addEventListener('click', () => {
    sb.current.answer = [];
    renderRound(mount);
    startTimer(mount);
  });

  document.getElementById('sbn-submit')?.addEventListener('click', () => submitAnswer(mount));
}

function selectWord(word, poolIdx, mount) {
  createAudioCtx();
  playClick();
  sb.current.answer.push(word);
  refreshAnswerArea(mount);
  refreshWordPool(mount);

  if (sb.current.answer.length === sb.current.words.length) {
    setTimeout(() => submitAnswer(mount), 200);
  }
}

function removeWord(answerIdx, mount) {
  sb.current.answer.splice(answerIdx, 1);
  refreshAnswerArea(mount);
  refreshWordPool(mount);
}

function refreshAnswerArea(mount) {
  const slots = document.getElementById('sbn-answer-slots');
  if (!slots) return;
  slots.innerHTML = sb.current.answer.length === 0
    ? '<span class="sbn-placeholder">Tap words below to start building...</span>'
    : sb.current.answer.map((w, i) => `
        <button class="sbn-answer-word" data-answer-idx="${i}">${w}
          <span class="sbn-remove-hint">✕</span>
        </button>
      `).join('');

  slots.querySelectorAll('.sbn-answer-word').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered) return;
      removeWord(parseInt(btn.dataset.answerIdx), mount);
    });
  });
}

function refreshWordPool(mount) {
  const pool = document.getElementById('sbn-word-pool');
  if (!pool) return;
  const usedCounts = {};
  sb.current.answer.forEach(w => { usedCounts[w] = (usedCounts[w] || 0) + 1; });

  sb.current.shuffled.forEach((w, i) => {
    const tile = pool.querySelector(`[data-pool-idx="${i}"]`);
    if (!tile) return;
    const totalInShuffled = sb.current.shuffled.slice(0, i + 1).filter(x => x === w).length;
    const used = (usedCounts[w] || 0) >= totalInShuffled;
    tile.disabled = used;
    if (used) tile.classList.add('used');
    else tile.classList.remove('used');
  });
}

// ─── Submit ────────────────────────────────────────────────────────────────────
function submitAnswer(mount) {
  if (sb.answered) return;
  clearInterval(sb.timerInterval);
  sb.answered = true;
  createAudioCtx();

  const typed    = sb.current.answer.join(' ').toLowerCase();
  const correct  = sb.current.words.join(' ').toLowerCase();
  const isCorrect = typed === correct;

  if (isCorrect) {
    playSuccessChime();
    sb.streak++;
    const timePts   = sb.timeLeft * 2;
    const streakPts = Math.min(5, sb.streak) * 30;
    const pts       = 150 + timePts + streakPts;
    sb.score += pts;
    showFeedback(mount, `✅ Perfect! +${pts} pts`, 'fb-correct');
  } else {
    playFailBuzz();
    sb.streak = 0;
    showFeedback(mount, `❌ Correct: "${sb.current.words.join(' ')}"`, 'fb-wrong');
  }

  document.getElementById('sbn-score').textContent = sb.score;
  document.getElementById('sbn-streak').textContent = sb.streak;

  sb.round++;
  setTimeout(() => nextRound(mount), 2000);
}

// ─── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(mount) {
  clearInterval(sb.timerInterval);
  sb.timerInterval = setInterval(() => {
    sb.timeLeft--;
    const el = document.getElementById('sbn-timer');
    if (el) el.textContent = `${sb.timeLeft}s`;

    if (sb.timeLeft <= 0 && !sb.answered) {
      clearInterval(sb.timerInterval);
      sb.answered = true;
      sb.streak = 0;
      playFailBuzz();
      showFeedback(mount, `⏱ Time's up! Answer: "${sb.current.words.join(' ')}"`, 'fb-wrong');
      sb.round++;
      setTimeout(() => nextRound(mount), 2000);
    }
  }, 1000);
}

function showFeedback(mount, msg, cls) {
  const fb = document.getElementById('sbn-feedback');
  if (fb) { fb.textContent = msg; fb.className = `wsc-feedback ${cls}`; }
}

// ─── Results ───────────────────────────────────────────────────────────────────
function showResults(mount) {
  clearInterval(sb.timerInterval);
  playSuccessChime();
  sb.onWin(sb.score);
  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="sp-results">
      <div class="sp-results-grade" style="color:#0ea5e9;border-color:#0ea5e9">🧩</div>
      <h2>Sentence Builder Complete!</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>Final Score</span><strong>${sb.score} pts</strong></div>
        <div class="sp-result-item"><span>Sentences</span><strong>${ROUNDS}</strong></div>
        <div class="sp-result-item"><span>Best Streak</span><strong>🔥 ${sb.streak}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="sbn-replay">Play Again</button>
        <button class="gc-back-small-btn" id="sbn-hub">Back to Games</button>
      </div>
    </div>
  `;
  mount.querySelector('#sbn-replay').addEventListener('click', () => startGame(mount, sb.pool, sb.onWin));
  mount.querySelector('#sbn-hub').addEventListener('click', () => document.querySelector('#gc-back-btn')?.click());
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#0ea5e9'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    mount.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}
