/**
 * Speed Translate Game — Professional Edition
 * Egyptian English Academy
 * Features: 10-word rounds, animated timer ring, 4 choices, combo multiplier, XP scaling
 */

import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playCountdown, playTimeUp } from './gameAudio.js';

const TOTAL_QUESTIONS = 10;
const BASE_TIME       = 8; // seconds per question
const RING_CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

// ─── State ────────────────────────────────────────────────────────────────────
let st = {};

// ─── Public API ───────────────────────────────────────────────────────────────
export function playSpeedTranslate(mount, { vocabPool, onWin }) {
  if (!vocabPool || vocabPool.length < 10) {
    mount.innerHTML = `<div class="gc-error">⚠️ Need at least 10 words. Complete more lessons!</div>`;
    return;
  }
  showIntroScreen(mount, vocabPool, onWin);
}

// ─── Intro / Mode select ──────────────────────────────────────────────────────
function showIntroScreen(mount, pool, onWin) {
  mount.innerHTML = `
    <div class="sp-intro">
      <div class="sp-intro-icon">⚡</div>
      <h2>Speed Translate</h2>
      <p>10 questions. ${BASE_TIME} seconds each. Choose the correct Arabic meaning as fast as possible!</p>
      <div class="sp-mode-row">
        <button class="sp-mode-btn" data-mode="en2ar">English → Arabic</button>
        <button class="sp-mode-btn" data-mode="ar2en">Arabic → English</button>
      </div>
      <p class="sp-tip">💡 Faster answers = More XP points!</p>
    </div>
  `;
  mount.querySelectorAll('.sp-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(mount, pool, onWin, btn.dataset.mode));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
function startGame(mount, pool, onWin, mode) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const questions = shuffled.slice(0, TOTAL_QUESTIONS);

  st = {
    mode,
    questions,
    pool,
    currentQ: 0,
    score: 0,
    combo: 0,
    correctCount: 0,
    answers: [],
    timeLeft: BASE_TIME,
    timerInterval: null,
    answered: false,
    onWin,
  };

  renderQuestion(mount);
}

// ─── Render question ──────────────────────────────────────────────────────────
function renderQuestion(mount) {
  clearInterval(st.timerInterval);
  st.answered = false;
  st.timeLeft = BASE_TIME;

  if (st.currentQ >= TOTAL_QUESTIONS) {
    showResults(mount);
    return;
  }

  const q = st.questions[st.currentQ];
  const choices = buildChoices(q, st.pool, st.mode);

  const questionText = st.mode === 'en2ar' ? q.english : q.arabic;
  const progress = st.currentQ / TOTAL_QUESTIONS;

  mount.innerHTML = `
    <div class="sp-root" id="sp-root">

      <!-- HUD -->
      <div class="sp-hud">
        <div class="sp-hud-left">
          <span class="sp-q-counter">${st.currentQ + 1} / ${TOTAL_QUESTIONS}</span>
          <div class="sp-progress-bar">
            <div class="sp-progress-fill" style="width:${progress * 100}%"></div>
          </div>
        </div>
        <div class="sp-score-display">
          <span class="sp-score-val" id="sp-score">${st.score}</span>
          <span class="sp-score-lbl">pts</span>
        </div>
        <div class="sp-combo-badge ${st.combo >= 2 ? 'active' : ''}">
          🔥 x${st.combo + 1}
        </div>
      </div>

      <!-- Timer ring -->
      <div class="sp-timer-wrapper">
        <svg class="sp-timer-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" stroke-width="6"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--primary)" stroke-width="6"
            stroke-dasharray="${RING_CIRCUMFERENCE}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            id="sp-ring"/>
        </svg>
        <span class="sp-timer-num" id="sp-timer">${BASE_TIME}</span>
      </div>

      <!-- Question -->
      <div class="sp-question-card" id="sp-question-card">
        <div class="sp-question-lang">${st.mode === 'en2ar' ? '🇬🇧 English' : '🇪🇬 Arabic'}</div>
        <div class="sp-question-text ${st.mode === 'ar2en' ? 'sp-ar-text' : ''}" id="sp-question-text">
          ${questionText}
        </div>
      </div>

      <!-- Choices -->
      <div class="sp-choices" id="sp-choices">
        ${choices.map((c, i) => `
          <button class="sp-choice-btn" data-idx="${i}" id="sp-choice-${i}">
            <span class="sp-choice-label">${String.fromCharCode(65 + i)}</span>
            <span class="sp-choice-text ${st.mode === 'en2ar' ? 'sp-ar-text' : ''}">${c.text}</span>
          </button>
        `).join('')}
      </div>
      <div id="sp-feedback" class="sp-feedback-area"></div>
    </div>
  `;

  attachChoiceListeners(mount, choices);
  startTimer(mount, choices);
}

// ─── Build multiple choice ────────────────────────────────────────────────────
function buildChoices(correctItem, pool, mode) {
  const correctText = mode === 'en2ar' ? correctItem.arabic : correctItem.english;
  const wrongs = pool
    .filter(v => (mode === 'en2ar' ? v.arabic : v.english) !== correctText)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(v => ({ text: mode === 'en2ar' ? v.arabic : v.english, correct: false }));

  const all = [{ text: correctText, correct: true }, ...wrongs].sort(() => Math.random() - 0.5);
  return all;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer(mount, choices) {
  createAudioCtx();
  const ring = document.getElementById('sp-ring');
  const timerEl = document.getElementById('sp-timer');

  st.timerInterval = setInterval(() => {
    st.timeLeft--;
    if (timerEl) timerEl.textContent = st.timeLeft;

    const frac = st.timeLeft / BASE_TIME;
    if (ring) ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - frac);

    // Color shift
    if (st.timeLeft <= 3 && ring) {
      ring.style.stroke = '#ef4444';
      playCountdown();
    } else if (st.timeLeft <= 5 && ring) {
      ring.style.stroke = '#f59e0b';
    }

    if (st.timeLeft <= 0) {
      clearInterval(st.timerInterval);
      if (!st.answered) {
        playTimeUp();
        handleAnswer(mount, -1, choices); // -1 = timed out
      }
    }
  }, 1000);
}

// ─── Answer handling ──────────────────────────────────────────────────────────
function attachChoiceListeners(mount, choices) {
  mount.querySelectorAll('.sp-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (st.answered) return;
      handleAnswer(mount, parseInt(btn.dataset.idx), choices);
    });
  });
}

function handleAnswer(mount, selectedIdx, choices) {
  clearInterval(st.timerInterval);
  if (st.answered) return;
  st.answered = true;

  const isCorrect = selectedIdx >= 0 && choices[selectedIdx].correct;
  const correctIdx = choices.findIndex(c => c.correct);

  // Mark buttons
  choices.forEach((c, i) => {
    const btn = document.getElementById(`sp-choice-${i}`);
    if (!btn) return;
    if (c.correct) btn.classList.add('correct');
    else if (i === selectedIdx && !c.correct) btn.classList.add('wrong');
    btn.disabled = true;
  });

  if (isCorrect) {
    playTone(523, 0.1, 'sine', 0.3);
    st.combo++;
    st.correctCount++;
    const timePts = Math.floor(st.timeLeft * 10); // up to 80 bonus pts
    const comboPts = Math.min(4, st.combo) * 25;
    const gained = 50 + timePts + comboPts;
    st.score += gained;

    showFeedback(mount, `✅ Correct! +${gained} pts`, 'sp-fb-correct');
  } else {
    playFailBuzz();
    st.combo = 0;
    showFeedback(mount, `❌ ${selectedIdx === -1 ? "Time's up!" : 'Wrong!'} Correct: ${choices[correctIdx].text}`, 'sp-fb-wrong');
  }

  st.answers.push({ correct: isCorrect, timeLeft: st.timeLeft });

  // Animate question card
  const card = document.getElementById('sp-question-card');
  if (card) card.classList.add(isCorrect ? 'sp-card-correct' : 'sp-card-wrong');

  setTimeout(() => {
    st.currentQ++;
    renderQuestion(mount);
  }, 1300);
}

function showFeedback(mount, msg, cls) {
  const fb = document.getElementById('sp-feedback');
  if (fb) { fb.textContent = msg; fb.className = `sp-feedback-area ${cls}`; }
  const scoreEl = document.getElementById('sp-score');
  if (scoreEl) scoreEl.textContent = st.score;
}

// ─── Results ──────────────────────────────────────────────────────────────────
function showResults(mount) {
  clearInterval(st.timerInterval);
  playSuccessChime();
  if (st.correctCount >= 8) spawnConfetti(mount);
  st.onWin(st.score);

  const accuracy = Math.round((st.correctCount / TOTAL_QUESTIONS) * 100);
  const grade = accuracy >= 90 ? 'S' : accuracy >= 75 ? 'A' : accuracy >= 60 ? 'B' : accuracy >= 40 ? 'C' : 'D';
  const gradeColors = { S:'#f59e0b', A:'#10b981', B:'#6366f1', C:'#0ea5e9', D:'#ef4444' };

  mount.innerHTML = `
    <div class="sp-results">
      <div class="sp-results-grade" style="color:${gradeColors[grade]};border-color:${gradeColors[grade]}">${grade}</div>
      <h2>Round Complete!</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>Score</span><strong>${st.score} pts</strong></div>
        <div class="sp-result-item"><span>Correct</span><strong>${st.correctCount} / ${TOTAL_QUESTIONS}</strong></div>
        <div class="sp-result-item"><span>Accuracy</span><strong>${accuracy}%</strong></div>
        <div class="sp-result-item"><span>Mode</span><strong>${st.mode === 'en2ar' ? 'EN→AR' : 'AR→EN'}</strong></div>
      </div>
      <div class="sp-answer-trail">
        ${st.answers.map((a, i) => `<span class="sp-dot ${a.correct ? 'ok' : 'bad'}"></span>`).join('')}
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="sp-replay-btn">Play Again</button>
        <button class="gc-back-small-btn" id="sp-mode-btn">Switch Mode</button>
      </div>
    </div>
  `;

  mount.querySelector('#sp-replay-btn').addEventListener('click', () => startGame(mount, st.pool, st.onWin, st.mode));
  mount.querySelector('#sp-mode-btn').addEventListener('click', () => showIntroScreen(mount, st.pool, st.onWin));
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    mount.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}
