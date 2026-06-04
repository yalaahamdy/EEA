/**
 * Word Scramble Game — Premium Edition
 * Egyptian English Academy
 * Features: Tactile 3D wooden letter tiles, physical scatter rotation animations, custom Drag & Drop listeners, neon slots, parchment help scroll.
 */

import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playClick } from './gameAudio.js';

// ==========================================
// 🎨 1. الستايلات البصرية المدمجة ديناميكياً (CSS-in-JS)
// ==========================================
const STYLE_ID = 'eea-word-scramble-premium-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    .wsc-premium-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 950px;
      margin: 0 auto;
      padding: 24px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      box-shadow: var(--card-shadow-3d);
      color: var(--text-main);
      font-family: 'Tajawal', 'Outfit', sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* شريط الحالة والـ HUD */
    .wsc-premium-hud {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    @media (max-width: 600px) {
      .wsc-premium-hud {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
    }
    .wsc-hud-box {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .wsc-hud-box label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .wsc-hud-box span {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .wsc-hud-box span.streak {
      color: var(--accent);
    }

    /* مؤقت التقدم الأفقي */
    .wsc-timer-track-bar {
      width: 100%;
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
      position: relative;
    }
    .wsc-timer-fill-bar {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, var(--success), var(--accent), var(--error));
      background-size: 200% 100%;
      transition: width 1s linear;
    }

    /* كرت المساعدة للمفردة */
    .wsc-vocabulary-card {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 20px;
      width: 100%;
      max-width: 680px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .wsc-vocab-hint-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .wsc-vocab-hint-txt {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--accent);
      font-family: 'Tajawal', sans-serif;
      margin-bottom: 8px;
    }

    /* قوالب استقبال الحروف النيونية */
    .wsc-slots-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 28px;
      width: 100%;
      min-height: 64px;
      padding: 6px;
    }
    .wsc-slot-target {
      width: 52px;
      height: 52px;
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
    }
    .wsc-slot-target.active-glow {
      border-color: var(--primary);
      background: var(--primary-glow);
      box-shadow: 0 0 12px var(--primary-glow);
    }
    .wsc-slot-target.filled {
      border-style: solid;
      border-color: var(--border-color);
    }
    .wsc-slot-target.slot-correct {
      border-color: var(--success);
      background: var(--success-glow);
    }
    .wsc-slot-target.slot-wrong {
      border-color: var(--error);
      background: var(--error-glow);
    }

    /* بلاطات الحروف ثلاثية الأبعاد خشبية */
    .wsc-tiles-pool {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
      margin-bottom: 28px;
      width: 100%;
      min-height: 64px;
    }
    .wsc-wood-tile {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
      border: 1px solid #78350f;
      border-radius: 10px;
      color: #fff;
      font-size: 1.5rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 5px 0 #78350f,
                  0 6px 12px rgba(0,0,0,0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .wsc-wood-tile:hover {
      filter: brightness(1.1);
    }
    .wsc-wood-tile:active, .wsc-wood-tile.active-touch {
      transform: translateY(4px);
      box-shadow: 0 1px 0 #78350f,
                  0 2px 4px rgba(0,0,0,0.2);
    }
    .wsc-wood-tile.used {
      opacity: 0.25;
      pointer-events: none;
      transform: translateY(4px);
      box-shadow: none;
    }

    @media (max-width: 500px) {
      .wsc-slots-container {
        gap: 6px;
      }
      .wsc-slot-target {
        width: 38px;
        height: 38px;
        border-radius: 8px;
      }
      .wsc-slot-target span {
        font-size: 1.15rem !important;
      }
      .wsc-tiles-pool {
        gap: 8px;
      }
      .wsc-wood-tile {
        width: 36px;
        height: 36px;
        font-size: 1.15rem;
        border-radius: 8px;
        box-shadow: 0 3px 0 #78350f, 0 4px 6px rgba(0,0,0,0.25);
      }
      .wsc-wood-tile:active, .wsc-wood-tile.active-touch {
        transform: translateY(2px);
        box-shadow: 0 1px 0 #78350f, 0 1px 2px rgba(0,0,0,0.1);
      }
      .wsc-wood-tile.used {
        transform: translateY(2px);
      }
    }

    /* قوالب الإجراءات */
    .wsc-actions-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      width: 100%;
      max-width: 600px;
      margin-top: 10px;
    }
    .wsc-control-btn {
      flex-grow: 1;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid var(--border-color);
      transition: all 0.25s ease;
    }
    .wsc-btn-clear {
      background: var(--surface-gradient), var(--bg-tertiary);
      color: var(--text-muted);
    }
    .wsc-btn-clear:hover {
      color: var(--text-main);
      border-color: var(--primary);
    }
    .wsc-btn-hint {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: var(--accent);
    }
    .wsc-btn-hint:hover:not(:disabled) {
      background: var(--accent);
      color: #fff;
    }
    .wsc-btn-hint:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .wsc-btn-submit {
      background: linear-gradient(135deg, var(--success) 0%, var(--shadow-solid-success) 100%);
      color: #fff;
      box-shadow: 0 4px 12px var(--success-glow);
    }
    .wsc-btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    /* التغذية الراجعة والومضات */
    .wsc-notify-bar {
      margin-top: 18px;
      font-size: 1.05rem;
      font-weight: 700;
      text-align: center;
      min-height: 24px;
      transition: all 0.3s ease;
    }
    .wsc-notify-bar.correct { color: var(--success); }
    .wsc-notify-bar.wrong { color: var(--error); }
  `;
  document.head.appendChild(styleEl);
}

// ─── State ───────────────────────────────────────────────────────────────────
let ws = {};
const ROUNDS = 8;
let _scrambleKeyListener = null;

// ==========================================
// 🎨 2. الدخول الرئيسي للعبة
// ==========================================
export function playWordScramble(mount, { vocabPool, onWin, difficulty }) {
  injectStyles();
  
  // خطاف تنظيف اللعبة لإيقاف المؤقتات ومستمعي المفاتيح فور الخروج
  window.eea_game_cleanup = () => {
    if (ws.timerInterval) {
      clearInterval(ws.timerInterval);
      ws.timerInterval = null;
    }
    if (_scrambleKeyListener) {
      document.removeEventListener('keydown', _scrambleKeyListener);
      _scrambleKeyListener = null;
    }
    if (ws.roundTimeout) {
      clearTimeout(ws.roundTimeout);
      ws.roundTimeout = null;
    }
  };

  if (!vocabPool || vocabPool.length < 3) {
    mount.innerHTML = `
      <div class="gc-error" style="font-family:'Tajawal',sans-serif">
        ⚠️ تحتاج إلى 3 كلمات على الأقل في الدروس المحددة للعب Word Scramble.
      </div>`;
    return;
  }
  const diff = difficulty || 'medium';
  startGame(mount, vocabPool, onWin, diff);
}

// ==========================================
// 🎨 3. تهيئة وبدء اللعبة
// ==========================================
function startGame(mount, pool, onWin, difficulty) {
  const times = { easy: 30, medium: 20, hard: 12 };
  const timePerWord = times[difficulty] || 20;

  const eligible = pool.filter(v => {
    const w = v.english.replace(/[^a-zA-Z]/g, '');
    return w.length >= 3 && w.length <= 12;
  });

  if (eligible.length === 0) {
    mount.innerHTML = `
      <div class="gc-error" style="font-family:'Tajawal',sans-serif">
        ⚠️ لا توجد كلمات مطابقة للشروط في الدروس المحددة للعب.
      </div>`;
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

// ==========================================
// 🎨 4. بدء جولة جديدة وعقد البعثرة
// ==========================================
function nextRound(mount) {
  clearInterval(ws.timerInterval);
  if (ws.round >= ws.words.length) {
    showResults(mount);
    return;
  }

  const wordObj = ws.words[ws.round];
  const clean = wordObj.english.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const scrambled = scrambleWord(clean);

  ws.current = { word: clean, hint: wordObj.arabic, scrambled };
  ws.answered = false;
  ws.timeLeft = ws.timePerWord;
  ws.selected = [];
  
  // حفظ زوايا الدوران العشوائية الفيزيائية الطفيفة لكل بلاطة
  ws.remaining = scrambled.split('').map((l, i) => {
    const rotation = (Math.random() - 0.5) * 14; // زاوية دوران عشوائية بين -7 و 7 درجات
    return { letter: l, idx: i, used: false, rotation };
  });

  renderRoundLayout(mount);
  bindKeyboardInput(mount);
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

// ==========================================
// 🎨 5. بناء واجهة اللعب للبعثرة
// ==========================================
function renderRoundLayout(mount) {
  const progress = (ws.round / ws.words.length) * 100;

  mount.innerHTML = `
    <div class="wsc-premium-container" id="wsc-premium-root">
      
      <!-- شريط الـ HUD -->
      <div class="wsc-premium-hud">
        <div class="wsc-hud-box">
          <label>الجولة الحالية</label>
          <span>${ws.round + 1} / ${ws.words.length}</span>
        </div>
        <div class="wsc-hud-box">
          <label>نقاطك</label>
          <span id="wsc-hud-score-val">${ws.score}</span>
        </div>
        <div class="wsc-hud-box">
          <label>المتتالي 🔥</label>
          <span class="streak" id="wsc-hud-streak-val">${ws.streak}</span>
        </div>
        <div class="wsc-hud-box">
          <label>المساعدات المتاحة 💡</label>
          <span id="wsc-hud-hints-val" style="color:var(--accent);">${ws.hintCount}</span>
        </div>
      </div>

      <!-- مؤقت شريط التقدم الفخم -->
      <div class="wsc-timer-track-bar">
        <div class="wsc-timer-fill-bar" id="wsc-timer-fill-el"></div>
      </div>

      <!-- لفافة البردي لتعليمات اللعبة -->
      <div class="hm-parchment-scroll" style="margin-bottom:16px;">
        <div class="hm-parchment-title">📜 قواعد فك البعثرة:</div>
        أعد ترتيب الحروف المبعثرة بالأسفل لتطابق الترجمة العربية. انقر على البلاطات الخشبية أو استخدم كيبورد جهازك مباشرة!
      </div>

      <!-- كرت المساعدة للمفردة -->
      <div class="wsc-vocabulary-card">
        <div class="wsc-vocab-hint-label">💡 المعنى بالعربية:</div>
        <div class="wsc-vocab-hint-txt">${ws.current.hint}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          الكلمة تتكون من <strong>${ws.current.word.length}</strong> حروف
        </div>
      </div>

      <!-- قوالب استقبال الكلمة المفتوحة -->
      <div class="wsc-slots-container" id="wsc-slots-box">
        ${ws.current.word.split('').map((_, i) => `
          <div class="wsc-slot-target" data-slot="${i}" id="wsc-slot-el-${i}">
            <!-- الحرف المستقر -->
            <span style="font-size:1.5rem; font-weight:800; text-transform:uppercase;"></span>
          </div>
        `).join('')}
      </div>

      <!-- بلاطات الحروف الخشبية المبعثرة -->
      <div class="wsc-tiles-pool" id="wsc-tiles-box">
        ${ws.remaining.map(item => `
          <button class="wsc-wood-tile" data-tile-idx="${item.idx}" id="wsc-wood-tile-el-${item.idx}" style="transform: rotate(${item.rotation}deg);">
            ${item.letter}
          </button>
        `).join('')}
      </div>

      <!-- لوحة التحكم والأزرار -->
      <div class="wsc-actions-row">
        <button class="wsc-control-btn wsc-btn-clear" id="wsc-clear-action-btn">⌫ مسح الحل</button>
        <button class="wsc-control-btn wsc-btn-hint" id="wsc-hint-action-btn" ${ws.hintCount <= 0 ? 'disabled' : ''}>💡 كشف حرف</button>
        <button class="wsc-control-btn wsc-btn-submit" id="wsc-submit-action-btn">✓ إرسال الحل</button>
      </div>

      <div class="wsc-notify-bar" id="wsc-notify-bar-val"></div>
    </div>
  `;

  attachWSListeners(mount);
  updateTimerVisual();
}

// ==========================================
// 🎨 6. إدخال لوحة المفاتيح والتحكم
// ==========================================
function bindKeyboardInput(mount) {
  if (_scrambleKeyListener) {
    document.removeEventListener('keydown', _scrambleKeyListener);
  }

  _scrambleKeyListener = (e) => {
    if (ws.answered) return;
    const key = e.key.toUpperCase();

    if (/^[A-Z]$/.test(key)) {
      // البحث عن بلاطة غير مستخدمة تحمل هذا الحرف
      const item = ws.remaining.find(r => r.letter === key && !r.used);
      if (item) {
        selectLetterTile(item.idx, mount);
      }
    } else if (e.key === 'Backspace') {
      if (ws.selected.length > 0) {
        deselectLastSlot(mount);
      }
    } else if (e.key === 'Enter') {
      submitAnswerScramble(mount);
    }
  };

  document.addEventListener('keydown', _scrambleKeyListener);
}

function attachWSListeners(mount) {
  // النقر على البلاطات الخشبية
  mount.querySelectorAll('.wsc-wood-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (ws.answered || btn.disabled) return;
      const idx = parseInt(btn.dataset.tileIdx);
      selectLetterTile(idx, mount);
    });
  });

  // النقر على الفتحات لإلغاء الاختيار
  mount.querySelectorAll('.wsc-slot-target').forEach(slot => {
    slot.addEventListener('click', () => {
      if (ws.answered) return;
      const slotIdx = parseInt(slot.dataset.slot);
      if (ws.selected[slotIdx] !== undefined) {
        deselectSlotAt(slotIdx, mount);
      }
    });
  });

  mount.querySelector('#wsc-clear-action-btn').addEventListener('click', () => clearAllTiles(mount));
  mount.querySelector('#wsc-hint-action-btn').addEventListener('click', () => useHintScramble(mount));
  mount.querySelector('#wsc-submit-action-btn').addEventListener('click', () => submitAnswerScramble(mount));
}

// ==========================================
// 🎨 7. منطق ترتيب الحروف واختيار البلاطات
// ==========================================
function selectLetterTile(tileIdx, mount) {
  createAudioCtx();
  playClick();

  const item = ws.remaining.find(r => r.idx === tileIdx);
  if (!item || item.used) return;

  const nextSlot = ws.selected.length;
  if (nextSlot >= ws.current.word.length) return;

  item.used = true;
  ws.selected.push({ tileIdx, letter: item.letter });

  // تحديث حالة البلاطة
  const tileEl = mount.querySelector(`#wsc-wood-tile-el-${tileIdx}`);
  if (tileEl) {
    tileEl.classList.add('used');
    tileEl.disabled = true;
  }

  // وضع الحرف في قالب الإسقاط
  const slotEl = mount.querySelector(`#wsc-slot-el-${nextSlot}`);
  if (slotEl) {
    slotEl.classList.add('filled');
    const txtEl = slotEl.querySelector('span');
    if (txtEl) {
      txtEl.textContent = item.letter;
      txtEl.style.transform = 'scale(0.8)';
      setTimeout(() => { txtEl.style.transform = 'scale(1)'; }, 50);
    }
  }

  // إرسال تلقائي عند ملء جميع الفتحات
  if (ws.selected.length === ws.current.word.length) {
    setTimeout(() => submitAnswerScramble(mount), 350);
  }
}

function deselectSlotAt(slotIdx, mount) {
  // إزالة الحرف من هذا القالب وإرجاع البلاطة للخدمة
  const entry = ws.selected[slotIdx];
  if (!entry) return;

  const tileEl = mount.querySelector(`#wsc-wood-tile-el-${entry.tileIdx}`);
  if (tileEl) {
    tileEl.classList.remove('used');
    tileEl.disabled = false;
  }

  // حذف المدخل وإعادة ترتيب الكروت المختارة
  ws.selected.splice(slotIdx, 1);
  ws.remaining.find(r => r.idx === entry.tileIdx).used = false;

  // إعادة رندر الفتحات
  ws.selected.forEach((s, i) => {
    const sl = mount.querySelector(`#wsc-slot-el-${i}`);
    if (sl) {
      sl.classList.add('filled');
      const span = sl.querySelector('span');
      if (span) span.textContent = s.letter;
    }
  });

  for (let i = ws.selected.length; i < ws.current.word.length; i++) {
    const sl = mount.querySelector(`#wsc-slot-el-${i}`);
    if (sl) {
      sl.classList.remove('filled');
      const span = sl.querySelector('span');
      if (span) span.textContent = '';
    }
  }
}

function deselectLastSlot(mount) {
  if (ws.selected.length > 0) {
    deselectSlotAt(ws.selected.length - 1, mount);
  }
}

function clearAllTiles(mount) {
  ws.selected = [];
  ws.remaining.forEach(r => { r.used = false; });

  ws.remaining.forEach(item => {
    const tileEl = mount.querySelector(`#wsc-wood-tile-el-${item.idx}`);
    if (tileEl) {
      tileEl.classList.remove('used');
      tileEl.disabled = false;
    }
  });

  for (let i = 0; i < ws.current.word.length; i++) {
    const sl = mount.querySelector(`#wsc-slot-el-${i}`);
    if (sl) {
      sl.classList.remove('filled');
      const span = sl.querySelector('span');
      if (span) span.textContent = '';
    }
  }
}

// ==========================================
// 🎨 8. التلميحات والتحقق من المؤقت
// ==========================================
function useHintScramble(mount) {
  if (ws.hintCount <= 0 || ws.answered) return;

  const nextSlotIdx = ws.selected.length;
  if (nextSlotIdx >= ws.current.word.length) return;

  ws.hintCount--;
  const hudVal = mount.querySelector('#wsc-hud-hints-val');
  if (hudVal) hudVal.textContent = ws.hintCount;

  const correctLetter = ws.current.word[nextSlotIdx];

  // البحث عن بلاطة تطابق الحرف ولم تُستخدم
  const tileItem = ws.remaining.find(r => r.letter === correctLetter && !r.used);
  if (tileItem) {
    selectLetterTile(tileItem.idx, mount);
  }
}

function startTimer(mount) {
  ws.timerInterval = setInterval(() => {
    ws.timeLeft--;
    updateTimerVisual();

    if (ws.timeLeft <= 0 && !ws.answered) {
      clearInterval(ws.timerInterval);
      ws.answered = true;
      ws.streak = 0;
      playFailBuzz();

      if (_scrambleKeyListener) {
        document.removeEventListener('keydown', _scrambleKeyListener);
      }

      showFeedbackScramble(mount, `⏱ انتهى وقت الجولة! الكلمة هي: ${ws.current.word}`, 'wrong');

      for (let i = 0; i < ws.current.word.length; i++) {
        const sl = mount.querySelector(`#wsc-slot-el-${i}`);
        if (sl) {
          sl.classList.add('slot-wrong');
          const span = sl.querySelector('span');
          if (span) span.textContent = ws.current.word[i];
        }
      }

      ws.round++;
      ws.roundTimeout = setTimeout(() => nextRound(mount), 2000);
    }
  }, 1000);
}

function updateTimerVisual() {
  const el = document.getElementById('wsc-timer-fill-el');
  if (el) {
    const percent = (ws.timeLeft / ws.timePerWord) * 100;
    el.style.width = `${percent}%`;
  }
}

// ==========================================
// 🎨 9. التحقق من صحة الكلمة وتجميع الدرجات
// ==========================================
function submitAnswerScramble(mount) {
  if (ws.answered) return;
  if (ws.selected.length === 0) return;

  clearInterval(ws.timerInterval);
  ws.answered = true;

  if (_scrambleKeyListener) {
    document.removeEventListener('keydown', _scrambleKeyListener);
  }

  const typed = ws.selected.map(s => s.letter).join('');
  const isCorrect = (typed === ws.current.word);
  createAudioCtx();

  if (isCorrect) {
    playSuccessChime();
    ws.streak++;
    const timeBonus = ws.timeLeft * 4;
    const streakBonus = Math.min(5, ws.streak) * 20;
    const gained = 100 + timeBonus + streakBonus;
    ws.score += gained;

    for (let i = 0; i < ws.current.word.length; i++) {
      const sl = mount.querySelector(`#wsc-slot-el-${i}`);
      if (sl) sl.classList.add('slot-correct');
    }
    showFeedbackScramble(mount, `✅ مذهل! إجابة صحيحة +${gained} نقطة`, 'correct');
  } else {
    playFailBuzz();
    ws.streak = 0;

    for (let i = 0; i < ws.current.word.length; i++) {
      const sl = mount.querySelector(`#wsc-slot-el-${i}`);
      if (sl) {
        sl.classList.add('slot-wrong');
        const span = sl.querySelector('span');
        if (span) span.textContent = ws.current.word[i];
      }
    }
    showFeedbackScramble(mount, `❌ خطأ! الكلمة الصحيحة: ${ws.current.word}`, 'wrong');
  }

  // تحديث القيم في الـ HUD
  const scoreVal = mount.querySelector('#wsc-hud-score-val');
  const streakVal = mount.querySelector('#wsc-hud-streak-val');
  if (scoreVal) scoreVal.textContent = ws.score;
  if (streakVal) streakVal.textContent = ws.streak;

  ws.round++;
  ws.roundTimeout = setTimeout(() => nextRound(mount), 2000);
}

function showFeedbackScramble(mount, msg, cls) {
  const fb = mount.querySelector('#wsc-notify-bar-val');
  if (fb) {
    fb.textContent = msg;
    fb.className = `wsc-notify-bar ${cls}`;
  }
}

// ==========================================
// 🎨 10. نتائج اللعب والاحتفال
// ==========================================
function showResults(mount) {
  clearInterval(ws.timerInterval);
  if (_scrambleKeyListener) {
    document.removeEventListener('keydown', _scrambleKeyListener);
  }

  playSuccessChime();
  ws.onWin(ws.score);
  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="wsc-premium-container" style="font-family:'Tajawal',sans-serif">
      <div style="font-size:3.5rem; margin-bottom:12px;">🏆</div>
      <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:6px;">مكتشف الكلمات متميز!</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">لقد أنهيت بنجاح بعثرة الكلمات الثمانية بالكامل!</p>

      <div class="hm-res-stats" style="grid-template-columns: repeat(2, 1fr); width:100%; max-width:600px;">
        <div class="hm-stat-box">
          <label>النقاط الإجمالية</label>
          <span>${ws.score}</span>
        </div>
        <div class="hm-stat-box">
          <label>إجمالي الكلمات</label>
          <span>${ROUNDS}</span>
        </div>
        <div class="hm-stat-box">
          <label>مساعدات مستخدمة</label>
          <span>${(ws.difficulty === 'easy' ? 4 : ws.difficulty === 'hard' ? 1 : 3) - ws.hintCount}</span>
        </div>
        <div class="hm-stat-box total">
          <label>أعلى متتالية</label>
          <span>🔥 ${ws.streak}</span>
        </div>
      </div>

      <div class="hm-action-row" style="margin-top:12px;">
        <button class="btn btn-primary" id="wsc-replay-btn" style="padding:10px 24px; font-weight:700;">
          تحدي جديد ⚡
        </button>
        <button class="btn btn-secondary" id="wsc-hub-btn" style="padding:10px 20px;">
          رجوع للألعاب
        </button>
      </div>
    </div>
  `;

  mount.querySelector('#wsc-replay-btn').addEventListener('click', () => {
    startGame(mount, ws.pool, ws.onWin, ws.difficulty);
  });
  mount.querySelector('#wsc-hub-btn').addEventListener('click', () => {
    document.querySelector('#gc-back-btn')?.click();
  });
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  const container = mount.querySelector('.wsc-premium-container') || mount;
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}
