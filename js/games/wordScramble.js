import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playClick } from './gameAudio.js';

const ROUNDS = 8;

let ws = {};

export function playWordScramble(mount, { vocabPool, onWin, difficulty }) {
  if (!vocabPool || vocabPool.length < 3) {
    mount.innerHTML = `<div class="gc-error">⚠️ Need at least 3 words in selected lessons to play Word Scramble.</div>`;
    return;
  }
  const diff = difficulty || 'medium';
  startGame(mount, vocabPool, onWin, diff);
}

function startGame(mount, pool, onWin, difficulty) {
  const times = { easy: 30, medium: 20, hard: 12 };
  const timePerWord = times[difficulty] || 20;

  const eligible = pool.filter(v => {
    const w = v.english.replace(/[^a-zA-Z]/g, '');
    return w.length >= 3 && w.length <= 12;
  });

  if (eligible.length === 0) {
    mount.innerHTML = `<div class="gc-error">⚠️ No suitable words found in selected lessons.</div>`;
    return;
  }

  const chosen = [...eligible].sort(() => Math.random() - 0.5).slice(0, ROUNDS);

  ws = {
    pool: eligible,
    words: chosen,
    round: 0,
    score: 0,
    streak: 0,
    onWin,
    timePerWord,
    timeLeft: timePerWord,
    timerInterval: null,
    answered: false,
    hintCount: difficulty === 'easy' ? 4 : difficulty === 'hard' ? 1 : 3,
    difficulty,
  };

  nextRound(mount);
}

function nextRound(mount) {
  clearInterval(ws.timerInterval);
  if (ws.round >= ws.words.length) { showResults(mount); return; }

  const wordObj = ws.words[ws.round];
  const clean   = wordObj.english.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const scrambled = scrambleWord(clean);

  ws.current    = { word: clean, hint: wordObj.arabic, scrambled };
  ws.answered   = false;
  ws.timeLeft   = ws.timePerWord;
  ws.selected   = [];
  ws.remaining  = scrambled.split('').map((l, i) => ({ letter: l, idx: i, used: false }));

  renderRound(mount);
  startTimer(mount);
}

function scrambleWord(word) {
  let arr = word.split('');
  let attempts = 0;
  do {
    arr = arr.sort(() => Math.random() - 0.5);
    attempts++;
  } while (arr.join('') === word && attempts < 20);
  return arr.join('');
}

function renderRound(mount) {
  const progress = (ws.round / ws.words.length) * 100;

  mount.innerHTML = `
    <div class="wsc-root" id="wsc-root">
      <div class="wsc-hud" style="font-family:'Tajawal',sans-serif">
        <div class="wsc-hud-item">
          <span>الجولة</span><strong>${ws.round + 1}/${ws.words.length}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>النقاط</span><strong id="wsc-score">${ws.score}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>المتتالي 🔥</span><strong id="wsc-streak">${ws.streak}</strong>
        </div>
        <div class="wsc-hud-item">
          <span>المساعدات 💡</span><strong id="wsc-hints">${ws.hintCount}</strong>
        </div>
      </div>

      <div class="wsc-progress-wrap">
        <div class="wsc-progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="wsc-timer-row">
        <div class="wsc-timer-track">
          <div class="wsc-timer-bar" id="wsc-timer-bar"
               style="width:100%;transition:width ${ws.timeLeft}s linear"></div>
        </div>
        <span class="wsc-timer-num" id="wsc-timer">${ws.timeLeft}s</span>
      </div>

      <div class="wsc-hint-card" style="font-family:'Tajawal',sans-serif">
        <div class="wsc-hint-label">💡 المعنى بالعربية:</div>
        <div class="wsc-hint-value wsc-ar-text">${ws.current.hint}</div>
        <div class="wsc-hint-letters">الكلمة تتكون من <strong>${ws.current.word.length}</strong> حروف</div>
      </div>

      <div class="wsc-answer-slots" id="wsc-answer-slots">
        ${ws.current.word.split('').map((_, i) => `
          <div class="wsc-slot" data-slot="${i}" id="wsc-slot-${i}">
            <span class="wsc-slot-letter" id="wsc-slot-letter-${i}"></span>
          </div>
        `).join('')}
      </div>

      <div class="wsc-letter-pool" id="wsc-letter-pool">
        ${ws.remaining.map(item => `
          <button class="wsc-tile" data-tile-idx="${item.idx}" id="wsc-tile-${item.idx}">
            ${item.letter}
          </button>
        `).join('')}
      </div>

      <div class="wsc-actions" style="font-family:'Tajawal',sans-serif">
        <button class="wsc-action-btn wsc-clear-btn" id="wsc-clear">⌫ مسح الكل</button>
        <button class="wsc-action-btn wsc-hint-btn" id="wsc-hint-use" ${ws.hintCount <= 0 ? 'disabled' : ''}>💡 مساعدة</button>
        <button class="wsc-action-btn wsc-submit-btn" id="wsc-submit">✓ إرسال الحل</button>
      </div>

      <div class="wsc-feedback" id="wsc-feedback"></div>
    </div>
  `;

  attachWSListeners(mount);
  bindKeyboardInput(mount);

  requestAnimationFrame(() => {
    const bar = document.getElementById('wsc-timer-bar');
    if (bar) bar.style.width = '0%';
  });
}

let _scrambleKeyListener = null;

function bindKeyboardInput(mount) {
  if (_scrambleKeyListener) document.removeEventListener('keydown', _scrambleKeyListener);

  _scrambleKeyListener = (e) => {
    if (ws.answered) return;
    const key = e.key.toUpperCase();

    if (/^[A-Z]$/.test(key)) {
      // Find an unused tile with this letter
      const item = ws.remaining.find(r => r.letter === key && !r.used);
      if (item) {
        selectTile(item.idx, mount);
      }
    } else if (e.key === 'Backspace') {
      // Deselect last slot
      if (ws.selected.length > 0) {
        deselectSlot(ws.selected.length - 1, mount);
      }
    } else if (e.key === 'Enter') {
      submitAnswer(mount);
    }
  };

  document.addEventListener('keydown', _scrambleKeyListener);
}

function attachWSListeners(mount) {
  mount.querySelectorAll('.wsc-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (ws.answered || btn.disabled) return;
      const idx = parseInt(btn.dataset.tileIdx);
      selectTile(idx, mount);
    });
  });

  mount.querySelectorAll('.wsc-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      if (ws.answered) return;
      const slotIdx = parseInt(slot.dataset.slot);
      if (ws.selected[slotIdx] !== undefined) deselectSlot(slotIdx, mount);
    });
  });

  document.getElementById('wsc-clear').addEventListener('click', () => clearAll(mount));
  document.getElementById('wsc-hint-use').addEventListener('click', () => useHint(mount));
  document.getElementById('wsc-submit').addEventListener('click', () => submitAnswer(mount));
}

function selectTile(tileIdx, mount) {
  createAudioCtx();
  playClick();

  const item = ws.remaining.find(r => r.idx === tileIdx);
  if (!item || item.used) return;

  const nextSlot = ws.selected.length;
  if (nextSlot >= ws.current.word.length) return;

  item.used = true;
  ws.selected.push({ tileIdx, letter: item.letter });

  const tile = document.getElementById(`wsc-tile-${tileIdx}`);
  if (tile) { tile.disabled = true; tile.classList.add('used'); }

  const slotLetter = document.getElementById(`wsc-slot-letter-${nextSlot}`);
  const slot = document.getElementById(`wsc-slot-${nextSlot}`);
  if (slotLetter) slotLetter.textContent = item.letter;
  if (slot) slot.classList.add('filled');

  if (ws.selected.length === ws.current.word.length) {
    setTimeout(() => submitAnswer(mount), 300);
  }
}

function deselectSlot(slotIdx, mount) {
  const entry = ws.selected[slotIdx];
  if (!entry) return;

  const tile = document.getElementById(`wsc-tile-${entry.tileIdx}`);
  if (tile) { tile.disabled = false; tile.classList.remove('used'); }

  ws.selected.splice(slotIdx, 1);
  ws.remaining.find(r => r.idx === entry.tileIdx).used = false;

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

  const nextSlotIdx = ws.selected.length;
  if (nextSlotIdx >= ws.current.word.length) return;
  const correctLetter = ws.current.word[nextSlotIdx];

  const tileItem = ws.remaining.find(r => r.letter === correctLetter && !r.used);
  if (tileItem) selectTile(tileItem.idx, mount);
}

function submitAnswer(mount) {
  if (ws.answered) return;
  if (ws.selected.length === 0) return;
  clearInterval(ws.timerInterval);
  ws.answered = true;

  if (_scrambleKeyListener) document.removeEventListener('keydown', _scrambleKeyListener);

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

    for (let i = 0; i < ws.current.word.length; i++) {
      document.getElementById(`wsc-slot-${i}`)?.classList.add('slot-correct');
    }
    showFeedback(mount, `✅ إجابة صحيحة! +${pts} نقطة`, 'fb-correct');
  } else {
    playFailBuzz();
    ws.streak = 0;

    for (let i = 0; i < ws.current.word.length; i++) {
      const sl = document.getElementById(`wsc-slot-letter-${i}`);
      const slEl = document.getElementById(`wsc-slot-${i}`);
      if (sl) sl.textContent = ws.current.word[i];
      if (slEl) slEl.classList.add('slot-wrong');
    }
    showFeedback(mount, `❌ إجابة خاطئة! الكلمة: ${ws.current.word}`, 'fb-wrong');
  }

  document.getElementById('wsc-score').textContent = ws.score;
  document.getElementById('wsc-streak').textContent = ws.streak;

  ws.round++;
  setTimeout(() => nextRound(mount), 1800);
}

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
      if (_scrambleKeyListener) document.removeEventListener('keydown', _scrambleKeyListener);
      showFeedback(mount, `⏱ انتهى الوقت! الكلمة هي: ${ws.current.word}`, 'fb-wrong');
      for (let i = 0; i < ws.current.word.length; i++) {
        const sl = document.getElementById(`wsc-slot-letter-${i}`);
        const slEl = document.getElementById(`wsc-slot-${i}`);
        if (sl) sl.textContent = ws.current.word[i];
        if (slEl) slEl.classList.add('slot-wrong');
      }
      ws.round++;
      setTimeout(() => nextRound(mount), 1800);
    }
  }, 1000);
}

function showFeedback(mount, msg, cls) {
  const fb = document.getElementById('wsc-feedback');
  if (fb) { fb.textContent = msg; fb.className = `wsc-feedback ${cls}`; }
}

function showResults(mount) {
  clearInterval(ws.timerInterval);
  if (_scrambleKeyListener) document.removeEventListener('keydown', _scrambleKeyListener);
  playSuccessChime();
  ws.onWin(ws.score);

  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="sp-results" style="font-family:'Tajawal',sans-serif">
      <div class="sp-results-grade" style="color:#f59e0b;border-color:#f59e0b">🔤</div>
      <h2>اكتمل بعثرة الكلمات! Complete</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>النقاط النهائية</span><strong>${ws.score}</strong></div>
        <div class="sp-result-item"><span>عدد الكلمات</span><strong>${ROUNDS}</strong></div>
        <div class="sp-result-item"><span>المساعدات المستخدمة</span><strong>${(ws.difficulty === 'easy' ? 4 : ws.difficulty === 'hard' ? 1 : 3) - ws.hintCount}</strong></div>
        <div class="sp-result-item"><span>أعلى متتالي</span><strong>🔥 ${ws.streak}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="wsc-replay">العب مجدداً ⚡</button>
        <button class="gc-back-small-btn" id="wsc-hub">رجوع للألعاب</button>
      </div>
    </div>
  `;
  mount.querySelector('#wsc-replay').addEventListener('click', () => startGame(mount, ws.pool, ws.onWin, ws.difficulty));
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

