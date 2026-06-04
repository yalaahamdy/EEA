import { createAudioCtx, playTone, playSuccessChime, playFailBuzz } from './gameAudio.js';

// Gallows + Body Parts
const SVG_PARTS = [
  // 0: Gallows base
  `<line x1="20" y1="230" x2="180" y2="230" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-0" />`,
  // 1: Pole
  `<line x1="80" y1="230" x2="80" y2="20" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-1" />`,
  // 2: Top bar
  `<line x1="80" y1="20" x2="160" y2="20" stroke="var(--hm-ink)" stroke-width="6" stroke-linecap="round" class="hm-part hm-part-2" />`,
  // 3: Rope
  `<line x1="160" y1="20" x2="160" y2="50" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-3" />`,
  // 4: Head
  `<circle cx="160" cy="68" r="18" stroke="var(--hm-ink)" fill="none" stroke-width="4" class="hm-part hm-part-4" />`,
  // 5: Body
  `<line x1="160" y1="86" x2="160" y2="150" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-5" />`,
  // 6: Left arm
  `<line x1="160" y1="100" x2="130" y2="130" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-6" />`,
  // 7: Right arm
  `<line x1="160" y1="100" x2="190" y2="130" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-7" />`,
  // 8: Left leg
  `<line x1="160" y1="150" x2="130" y2="190" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-8" />`,
  // 9: Right leg
  `<line x1="160" y1="150" x2="190" y2="190" stroke="var(--hm-ink)" stroke-width="4" stroke-linecap="round" class="hm-part hm-part-9" />`,
  // Easy Mode Extra parts
  // 10: Left Eye
  `<circle cx="153" cy="64" r="1.5" fill="var(--hm-ink)" class="hm-part hm-part-10" />`,
  // 11: Right Eye
  `<circle cx="167" cy="64" r="1.5" fill="var(--hm-ink)" class="hm-part hm-part-11" />`,
  // 12: Smile
  `<path d="M 153 74 Q 160 79 167 74" stroke="var(--hm-ink)" stroke-width="2" fill="none" stroke-linecap="round" class="hm-part hm-part-12" />`
];

const ALWAYS_SHOW = [0, 1, 2, 3];

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

let state = {};

function resetState(wordObj, difficulty) {
  const maxWrongs = { easy: 8, medium: 6, hard: 4 };
  const maxWrong = maxWrongs[difficulty] || 6;
  state = {
    word: wordObj.english.toUpperCase().replace(/[^A-Z]/g, ''),
    hint: wordObj.arabic,
    guessed: new Set(),
    wrong: 0,
    maxWrong,
    phase: 'playing',
    hintUsed: false,
    startTime: Date.now(),
    score: 0,
    difficulty,
  };
}

export function playHangman(mount, { vocabPool, onWin, difficulty }) {
  if (!vocabPool || vocabPool.length === 0) {
    mount.innerHTML = `<div class="gc-error">⚠️ No vocabulary found in selected lessons. Choose different settings!</div>`;
    return;
  }
  const diff = difficulty || 'medium';
  startRound(mount, vocabPool, onWin, 0, 0, diff);
}

function startRound(mount, pool, onWin, roundNum, totalScore, difficulty) {
  const eligible = pool.filter(v => {
    const clean = v.english.toUpperCase().replace(/[^A-Z]/g, '');
    return clean.length >= 3 && clean.length <= 14;
  });

  if (eligible.length === 0) {
    mount.innerHTML = `<div class="gc-error">⚠️ No matching words in selected lessons.</div>`;
    return;
  }

  const wordObj = eligible[Math.floor(Math.random() * eligible.length)];
  resetState(wordObj, difficulty);
  state.roundNum = roundNum;
  state.totalScore = totalScore;

  renderGame(mount, pool, onWin);
}

function getPartsToDraw() {
  const wrongCount = state.wrong;
  if (state.maxWrong === 8) {
    // Easy mode: Head, Left Eye, Right Eye, Mouth, Body, Left Arm, Right Arm, Legs
    const map = [
      [],
      [4], // Head
      [4, 10], // Left Eye
      [4, 10, 11], // Right Eye
      [4, 10, 11, 12], // Mouth
      [4, 10, 11, 12, 5], // Body
      [4, 10, 11, 12, 5, 6], // Left arm
      [4, 10, 11, 12, 5, 6, 7], // Right arm
      [4, 10, 11, 12, 5, 6, 7, 8, 9] // Legs
    ];
    return map[wrongCount] || [];
  } else if (state.maxWrong === 4) {
    // Hard mode: Head, Body, Both Arms, Both Legs
    const map = [
      [],
      [4], // Head
      [4, 5], // Body
      [4, 5, 6, 7], // Both arms
      [4, 5, 6, 7, 8, 9] // Both legs
    ];
    return map[wrongCount] || [];
  } else {
    // Medium mode: Head, Body, Left Arm, Right Arm, Left Leg, Right Leg
    const map = [
      [],
      [4],
      [4, 5],
      [4, 5, 6],
      [4, 5, 6, 7],
      [4, 5, 6, 7, 8],
      [4, 5, 6, 7, 8, 9]
    ];
    return map[wrongCount] || [];
  }
}

function renderGame(mount, pool, onWin) {
  const parts = getPartsToDraw();
  const hintCostHTML = state.difficulty === 'easy' ? 'مجاني' : '-5 نقاط';
  const isHard = state.difficulty === 'hard';

  mount.innerHTML = `
    <div class="hm-container" id="hm-root">
      <div class="hm-header">
        <div class="hm-round-badge">الجولة ${state.roundNum + 1} (${state.difficulty.toUpperCase()})</div>
        <div class="hm-score-display">النقاط: <strong id="hm-score-val">${state.totalScore}</strong></div>
        <div class="hm-lives-display">
          ${Array.from({length: state.maxWrong}, (_, i) =>
            `<span class="hm-heart ${i < (state.maxWrong - state.wrong) ? 'active' : 'lost'}">❤️</span>`
          ).join('')}
        </div>
      </div>

      <div class="hm-layout">
        <div class="hm-scaffold-col">
          <svg class="hm-svg" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" id="hm-svg" style="filter: drop-shadow(0 0 8px var(--primary-glow));">
            ${ALWAYS_SHOW.map(i => SVG_PARTS[i]).join('')}
            ${parts.map(i => SVG_PARTS[i]).join('')}
          </svg>

          ${isHard ? `
            <div class="hm-hint-btn used" style="font-family:'Tajawal',sans-serif">
              🔒 لا تلميحات في المستوى الصعب
            </div>
          ` : `
            <button class="hm-hint-btn ${state.hintUsed ? 'used' : ''}" id="hm-hint-btn" style="font-family:'Tajawal',sans-serif">
              ${state.hintUsed
                ? `<span class="hm-hint-text">💡 المعنى بالعربية: ${state.hint}</span>`
                : `<span>💡 إظهار التلميح</span><span class="hm-hint-cost">(${hintCostHTML})</span>`}
            </button>
          `}
        </div>

        <div class="hm-right-col">
          <div class="hm-word-display" id="hm-word-display">
            ${renderWordSlots()}
          </div>
          <p class="hm-word-length-hint">${state.word.length} حروف (Letters)</p>

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

let _keyListener = null;

function bindPhysicalKeyboard(mount, pool, onWin) {
  if (_keyListener) document.removeEventListener('keydown', _keyListener);
  _keyListener = (e) => {
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && !state.guessed.has(letter) && state.phase === 'playing') {
      const btn = document.getElementById(`hm-key-${letter}`);
      if (btn) {
        btn.classList.add('active-press');
        setTimeout(() => btn.classList.remove('active-press'), 150);
      }
      handleGuess(letter, mount, pool, onWin);
    }
  };
  document.addEventListener('keydown', _keyListener);
}

function attachListeners(mount, pool, onWin) {
  mount.querySelectorAll('.hm-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const letter = btn.dataset.letter;
      if (!state.guessed.has(letter) && state.phase === 'playing') {
        handleGuess(letter, mount, pool, onWin);
      }
    });
  });

  const hintBtn = mount.querySelector('#hm-hint-btn');
  if (hintBtn && !state.hintUsed && state.difficulty !== 'hard') {
    hintBtn.addEventListener('click', () => {
      state.hintUsed = true;
      if (state.difficulty !== 'easy') {
        state.totalScore = Math.max(0, state.totalScore - 5);
      }
      renderGame(mount, pool, onWin);
    });
  }
}

function handleGuess(letter, mount, pool, onWin) {
  if (state.phase !== 'playing') return;
  state.guessed.add(letter);
  createAudioCtx();

  if (state.word.includes(letter)) {
    playTone(523, 0.1, 'sine', 0.25); // C5
    const allRevealed = state.word.split('').every(l => state.guessed.has(l));
    if (allRevealed) {
      const elapsed = (Date.now() - state.startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor(50 - elapsed));
      const penalty = state.wrong * 12;
      const hintPenalty = (state.hintUsed && state.difficulty !== 'easy') ? 10 : 0;
      const roundScore = 120 + timeBonus - penalty - hintPenalty;
      state.score = Math.max(15, roundScore);
      state.totalScore += state.score;
      state.phase = 'won';
    }
  } else {
    playFailBuzz();
    state.wrong++;
    if (state.wrong >= state.maxWrong) {
      state.phase = 'lost';
    }
  }

  updateKeyButton(letter);
  updateScaffold(mount);
  updateWordDisplay(mount);
  updateLives(mount);

  if (state.phase === 'won') {
    setTimeout(() => showWinOverlay(mount, pool, onWin), 450);
  } else if (state.phase === 'lost') {
    setTimeout(() => showLoseOverlay(mount, pool, onWin), 450);
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
  svg.querySelectorAll('.hm-part:not(.hm-part-0):not(.hm-part-1):not(.hm-part-2):not(.hm-part-3)').forEach(el => el.remove());
  const parts = getPartsToDraw();
  parts.forEach(i => {
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
  livesEl.innerHTML = Array.from({length: state.maxWrong}, (_, i) =>
    `<span class="hm-heart ${i < (state.maxWrong - state.wrong) ? 'active' : 'lost'}">❤️</span>`
  ).join('');
}

function showWinOverlay(mount, pool, onWin) {
  playSuccessChime();
  spawnConfetti(mount);
  onWin(state.score);

  const overlay = mount.querySelector('#hm-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-card hm-win-card" style="font-family:'Tajawal',sans-serif">
      <div class="hm-result-icon">🎉</div>
      <h2 class="hm-result-title" style="font-family:'Outfit',sans-serif">ممتاز! Excellent</h2>
      <p class="hm-result-word">الكلمة هي: <strong>${state.word}</strong></p>
      <p class="hm-result-meaning">الترجمة: <span class="hm-arabic">${state.hint}</span></p>
      <div class="hm-result-scores">
        <div class="hm-rscore-item"><span>نقاط الجولة</span><strong>+${state.score}</strong></div>
        <div class="hm-rscore-item accent"><span>المجموع</span><strong>${state.totalScore}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="hm-next-btn">الكلمة التالية →</button>
        <button class="gc-back-small-btn" id="hm-hub-btn">رجوع للألعاب</button>
      </div>
    </div>
  `;
  mount.querySelector('#hm-next-btn').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    startRound(mount, pool, onWin, state.roundNum + 1, state.totalScore, state.difficulty);
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
    <div class="hm-result-card hm-lose-card" style="font-family:'Tajawal',sans-serif">
      <div class="hm-result-icon">💔</div>
      <h2 class="hm-result-title" style="font-family:'Outfit',sans-serif">حظ أوفر! Game Over</h2>
      <p class="hm-result-word">الكلمة الصحيحة: <strong>${state.word}</strong></p>
      <p class="hm-result-meaning">الترجمة: <span class="hm-arabic">${state.hint}</span></p>
      <div class="hm-result-scores">
        <div class="hm-rscore-item accent"><span>النقاط</span><strong>${state.totalScore}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="hm-retry-btn">حاول مجدداً ⚡</button>
        <button class="gc-back-small-btn" id="hm-hub-btn2">رجوع للألعاب</button>
      </div>
    </div>
  `;
  mount.querySelector('#hm-retry-btn').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    startRound(mount, pool, onWin, state.roundNum + 1, state.totalScore, state.difficulty);
  });
  mount.querySelector('#hm-hub-btn2').addEventListener('click', () => {
    if (_keyListener) document.removeEventListener('keydown', _keyListener);
    document.querySelector('#gc-back-btn')?.click();
  });
}

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

