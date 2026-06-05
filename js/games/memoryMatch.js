/**
 * Memory Match Game — Premium Edition
 * Egyptian English Academy
 * Features: 3D interactive tarot cards, Canvas particle explosion engine, floaty combo scores, premium scroll instructions.
 */

import { createAudioCtx, playFlip, playMatch, playSuccessChime, playFailBuzz } from './gameAudio.js';

// ==========================================
// 🎨 1. الستايلات البصرية المدمجة ديناميكياً (CSS-in-JS)
// ==========================================
const STYLE_ID = 'eea-memory-match-premium-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    .mm-premium-container {
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

    /* شريط المعلومات التفاعلي الـ HUD */
    .mm-premium-hud {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    @media (max-width: 640px) {
      .mm-premium-hud {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
    }
    .mm-hud-card {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .mm-hud-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .mm-hud-card label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .mm-hud-card span {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--primary);
    }
    .mm-hud-card span.combo-val {
      color: var(--accent);
      text-shadow: 0 0 8px var(--accent-glow);
    }
    .mm-hud-card span.score-val {
      color: var(--success);
      text-shadow: 0 0 8px var(--success-glow);
    }

    /* لوحة شبكة اللعب للبطاقات */
    .mm-board-wrapper {
      position: relative;
      width: 100%;
      min-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-primary);
      border-radius: 20px;
      padding: 20px;
      box-shadow: inset 0 4px 20px rgba(0,0,0,0.15);
    }
    .mm-cards-grid {
      display: grid;
      gap: 16px;
      width: 100%;
      max-width: 800px;
      perspective: 1000px;
    }

    /* تصميم البطاقات ثلاثية الأبعاد الفاخرة */
    .mm-tarot-card {
      position: relative;
      aspect-ratio: 3 / 4;
      cursor: pointer;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .mm-tarot-card:hover {
      box-shadow: 0 10px 25px var(--primary-glow);
    }
    .mm-tarot-card.flipped {
      transform: rotateY(180deg);
    }
    .mm-tarot-card.matched {
      animation: mm-pulse-match 0.5s ease-out;
      pointer-events: none;
    }
    @keyframes mm-pulse-match {
      0% { transform: scale(1) rotateY(180deg); }
      50% { transform: scale(1.1) rotateY(180deg); filter: brightness(1.2); }
      100% { transform: scale(1) rotateY(180deg); }
    }

    /* أوجه البطاقة */
    .mm-card-face {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      overflow: hidden;
    }

    /* الوجه الخلفي (الغطاء المغلق بنقش ذهبي فاخر) */
    .mm-card-back-side {
      background: radial-gradient(circle, var(--bg-tertiary) 0%, var(--bg-primary) 100%);
      border: 3px solid #b4975a;
      position: relative;
    }
    .mm-card-back-side::before {
      content: '';
      position: absolute;
      top: 6px; left: 6px; right: 6px; bottom: 6px;
      border: 1px solid rgba(180, 151, 90, 0.4);
      border-radius: 10px;
      pointer-events: none;
    }
    .mm-card-back-side .deco-pattern {
      font-size: 2.2rem;
      color: #b4975a;
      text-shadow: 0 0 10px rgba(180, 151, 90, 0.4);
      animation: mm-float-pattern 3s ease-in-out infinite alternate;
    }
    @keyframes mm-float-pattern {
      from { transform: scale(1) rotate(0deg); }
      to { transform: scale(1.08) rotate(5deg); }
    }

    /* الوجه الأمامي الكاشف للمحتوى */
    .mm-card-front-side {
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 2px solid var(--border-color);
      transform: rotateY(180deg);
      text-align: center;
    }
    .mm-tarot-card.matched .mm-card-front-side {
      border-color: var(--success);
      background: linear-gradient(135deg, var(--success-glow) 0%, var(--bg-secondary) 100%);
    }
    .mm-card-txt-val {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.4;
      color: var(--text-main);
      margin-bottom: 6px;
      word-break: break-word;
    }
    .mm-card-lang-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      background: var(--bg-primary);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .mm-tarot-card.matched .mm-card-lang-tag {
      color: var(--success);
      background: var(--success-glow);
    }

    /* كرت الفوز المنسدل وتراكب المعاينة */
    .mm-canvas-canvas {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    .mm-preview-hud-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.8);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
    }
    .mm-preview-content {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      max-width: 380px;
      text-align: center;
      box-shadow: var(--card-shadow-3d);
    }
    .mm-preview-timer-circle {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 4px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--accent);
      margin: 14px auto;
      text-shadow: 0 0 10px var(--accent-glow);
    }

    /* نصوص النقاط الطائرة العائمة */
    .mm-floating-text {
      position: absolute;
      color: var(--accent);
      font-weight: 800;
      font-size: 1.4rem;
      pointer-events: none;
      animation: mm-float-up 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      z-index: 60;
      text-shadow: 0 0 8px rgba(0,0,0,0.8), 0 0 12px var(--accent-glow);
    }
    @keyframes mm-float-up {
      0% { transform: translateY(0) scale(0.8); opacity: 0; }
      15% { transform: translateY(-20px) scale(1.2); opacity: 1; }
      100% { transform: translateY(-90px) scale(0.9); opacity: 0; }
    }

    @media (max-width: 500px) {
      .mm-premium-container {
        padding: 12px;
        border-radius: 16px;
      }
      .mm-cards-grid {
        gap: 8px;
        grid-template-columns: repeat(4, 1fr) !important;
      }
      .mm-card-face {
        padding: 6px;
        border-radius: 10px;
      }
      .mm-card-txt-val {
        font-size: 0.8rem;
        margin-bottom: 2px;
      }
      .mm-card-lang-tag {
        font-size: 0.62rem;
        padding: 1px 4px;
      }
      .mm-card-back-side .deco-pattern {
        font-size: 1.5rem;
      }
      .mm-hud-card {
        padding: 6px;
        border-radius: 10px;
      }
      .mm-hud-card label {
        font-size: 0.7rem;
      }
      .mm-hud-card span {
        font-size: 0.95rem;
      }
      .mm-board-wrapper {
        min-height: 280px;
        padding: 8px;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// ─── State ───────────────────────────────────────────────────────────────────
let mm = {};
let _canvasAnimFrame = null;
let _resizeListener = null;

const BEST_TIME_KEY = 'eea_memory_best_v2';

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

function buildCards(pool, numPairs) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, numPairs);
  const cards = [];
  shuffled.forEach((v, i) => {
    cards.push({ id: i * 2, pairId: i, type: 'en', text: v.english, matched: false, flipped: false });
    cards.push({ id: i * 2 + 1, pairId: i, type: 'ar', text: v.arabic, matched: false, flipped: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

// ==========================================
// 🎨 2. الدخول الرئيسي للعبة
// ==========================================
export function playMemoryMatch(mount, { vocabPool, onWin, difficulty }) {
  injectStyles();
  
  // تسجيل دالة تنظيف اللعبة لإيقافها فوراً عند الخروج
  window.eea_game_cleanup = () => {
    stopParticles();
  };

  const diff = difficulty || 'medium';
  const cfg = {
    easy: { pairs: 6, cols: 4, previewTime: 4 },
    medium: { pairs: 8, cols: 4, previewTime: 3 },
    hard: { pairs: 12, cols: 6, previewTime: 2 }
  }[diff];

  if (!vocabPool || vocabPool.length < cfg.pairs) {
    const availablePairs = Math.floor(vocabPool.length);
    if (availablePairs < 4) {
      mount.innerHTML = `
        <div class="gc-error" style="font-family:'Tajawal',sans-serif">
          ⚠️ عدد المفردات في الدروس المحددة قليل جداً (أقل من 4 كلمات). الرجاء اختيار دروس إضافية للعب Memory Match.
        </div>`;
      return;
    }
  }

  startGame(mount, vocabPool, onWin, diff);
}

// ==========================================
// 🎨 3. تهيئة وبدء اللعبة
// ==========================================
function startGame(mount, pool, onWin, difficulty) {
  const cfg = {
    easy: { pairs: 6, cols: 4, previewTime: 4 },
    medium: { pairs: 8, cols: 4, previewTime: 3 },
    hard: { pairs: 12, cols: 6, previewTime: 2 }
  }[difficulty];

  const maxPairs = Math.min(cfg.pairs, Math.floor(pool.length));
  
  mm = {
    cards: buildCards(pool, maxPairs),
    flipped: [],
    matched: 0,
    totalPairs: maxPairs,
    moves: 0,
    locked: true,
    timer: 0,
    timerInterval: null,
    difficulty,
    cols: maxPairs <= 6 ? 4 : (maxPairs === 8 ? 4 : 6),
    combo: 0,
    score: 0,
    previewCount: cfg.previewTime,
    startTime: Date.now(),
    particles: [],
    canvas: null,
    ctx: null,
    onWin
  };

  // كشف جميع البطاقات للمعاينة المؤقتة
  mm.cards.forEach(c => c.flipped = true);

  renderGameLayout(mount, pool, onWin);
  initCanvasParticles(mount);
  runPreviewCountdown(mount, pool, onWin);
}

// ==========================================
// 🎨 4. العد التنازلي للمعاينة
// ==========================================
function runPreviewCountdown(mount, pool, onWin) {
  const overlay = mount.querySelector('#mm-preview-overlay-screen');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="mm-preview-content" style="font-family:'Tajawal',sans-serif">
      <h3 style="font-size:1.3rem; font-weight:800; color:var(--text-main); margin-bottom:6px;">تجهّز! Memorize</h3>
      <p style="color:var(--text-muted); font-size:0.88rem;">احفظ مواقع الكلمات الإنجليزية والرديف العربي!</p>
      <div class="mm-preview-timer-circle" id="mm-countdown-num">${mm.previewCount}</div>
      <span style="font-size:0.8rem; color:var(--text-muted);">ستُغطى البطاقات قريباً للبدء...</span>
    </div>
  `;

  const interval = setInterval(() => {
    mm.previewCount--;
    const numEl = mount.querySelector('#mm-countdown-num');
    if (numEl) numEl.textContent = mm.previewCount;

    if (mm.previewCount <= 0) {
      clearInterval(interval);
      overlay.style.display = 'none';
      
      // إغلاق الكروت مجدداً
      mm.cards.forEach(c => {
        c.flipped = false;
        const el = mount.querySelector(`[data-id="${c.id}"]`);
        if (el) el.classList.remove('flipped');
      });

      // فك قفل اللعب وبدء المؤقت
      mm.locked = false;
      mm.timerInterval = setInterval(() => {
        mm.timer++;
        const el = document.getElementById('mm-timer-val');
        if (el) el.textContent = formatTime(mm.timer);
      }, 1000);
    }
  }, 1000);
}

// ==========================================
// 🎨 5. بناء واجهة اللعب الأساسية
// ==========================================
function renderGameLayout(mount, pool, onWin) {
  const best = getBestTimes()[mm.difficulty] || 0;
  const bestText = best ? formatTime(best) : '--:--';

  mount.innerHTML = `
    <div class="mm-premium-container" id="mm-premium-root">
      <!-- شريط المعلومات HUD -->
      <div class="mm-premium-hud">
        <div class="mm-hud-card">
          <label>الوقت الجاري</label>
          <span id="mm-timer-val">0:00</span>
        </div>
        <div class="mm-hud-card">
          <label>أفضل وقت</label>
          <span style="color:#a78bfa;">${bestText}</span>
        </div>
        <div class="mm-hud-card">
          <label>المحاولات</label>
          <span id="mm-moves-val">0</span>
        </div>
        <div class="mm-hud-card">
          <label>مضاعف الـ Combo</label>
          <span class="combo-val" id="mm-combo-val">x1</span>
        </div>
        <div class="mm-hud-card">
          <label>النقاط</label>
          <span class="score-val" id="mm-score-val">0</span>
        </div>
      </div>

      <!-- لفافة البردي لتعليمات اللعبة -->
      <div class="hm-parchment-scroll">
        <div class="hm-parchment-title">📜 قواعد التطابق الذهبي:</div>
        جد الكلمة الإنجليزية وما يطابقها من ترجمة عربية. التكرار المتتالي السريع يمنحك مضاعف نقاط Combo متفجر!
      </div>

      <!-- منطقة اللعب والكانفاس -->
      <div class="mm-board-wrapper">
        <canvas class="mm-canvas-canvas" id="mm-particle-canvas"></canvas>

        <div class="mm-cards-grid" id="mm-cards-grid" style="grid-template-columns: repeat(${mm.cols}, 1fr);">
          ${mm.cards.map(card => renderCard(card)).join('')}
        </div>

        <!-- شاشة تراكب المعاينة -->
        <div class="mm-preview-hud-overlay" id="mm-preview-overlay-screen" style="display:none"></div>
      </div>

      <!-- شاشة تراكب النتيجة النهائية -->
      <div class="hm-premium-overlay" id="mm-result-overlay" style="display:none"></div>
    </div>
  `;

  // ربط أحداث النقر للبطاقات
  mount.querySelectorAll('.mm-tarot-card').forEach(el => {
    el.addEventListener('click', () => {
      handleCardClick(parseInt(el.dataset.id), mount, pool, onWin);
    });
  });
}

function renderCard(card) {
  const cls = [
    'mm-tarot-card',
    card.flipped ? 'flipped' : '',
    card.matched ? 'matched' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${cls}" data-id="${card.id}" data-pair="${card.pairId}" id="mm-card-${card.id}">
      <div class="mm-card-face mm-card-back-side">
        <!-- الزخرفة الأثرية الفاخرة للظهر -->
        <div class="deco-pattern">⚜️</div>
        <div style="font-size:0.7rem; color:#b4975a; font-weight:700; margin-top:6px; letter-spacing:1px;">EEA</div>
      </div>
      <div class="mm-card-face mm-card-front-side">
        <!-- الرمز القومي للغة -->
        <div style="font-size: 1.3rem; margin-bottom: 8px;">
          ${card.type === 'en' ? '🇬🇧' : '🇪🇬'}
        </div>
        <div class="mm-card-txt-val">${card.text}</div>
        <div class="mm-card-lang-tag">${card.type === 'en' ? 'English' : 'العربية'}</div>
      </div>
    </div>
  `;
}

// ==========================================
// 🎨 6. تفاعل النقر وتطابق الكروت
// ==========================================
function handleCardClick(cardId, mount, pool, onWin) {
  if (mm.locked) return;

  const card = mm.cards.find(c => c.id === cardId);
  if (!card || card.flipped || card.matched) return;

  // تجنب نقر نفس الكرت المفتوح مرتين
  if (mm.flipped.length === 1 && mm.flipped[0].id === cardId) return;

  createAudioCtx();
  playFlip();

  card.flipped = true;
  mm.flipped.push(card);

  const el = mount.querySelector(`#mm-card-${cardId}`);
  if (el) el.classList.add('flipped');

  if (mm.flipped.length === 2) {
    mm.moves++;
    const movesEl = mount.querySelector('#mm-moves-val');
    if (movesEl) movesEl.textContent = mm.moves;

    mm.locked = true;

    const [cardA, cardB] = mm.flipped;
    
    // التحقق من التطابق (نفس الـ pairId ونوعين مختلفين EN و AR)
    const isMatched = (cardA.pairId === cardB.pairId && cardA.type !== cardB.type);

    if (isMatched) {
      setTimeout(() => {
        playMatch();

        [cardA, cardB].forEach(c => {
          c.matched = true;
          const cardEl = mount.querySelector(`#mm-card-${c.id}`);
          if (cardEl) cardEl.classList.add('matched');
        });

        // زيادة الكومبو وحساب النقاط
        mm.combo++;
        mm.matched++;
        const multiplier = Math.min(5, mm.combo);
        const gainedPoints = 100 * multiplier;
        mm.score += gainedPoints;

        // إطلاق الجزيئات الطائرة من مركز الكارتين
        triggerMatchBurst(cardA.id, cardB.id, mount);

        // إظهار النص الطائر العائم
        showFloatingText(`+${gainedPoints} 🔥`, cardB.id, mount);

        // تحديث شريط الـ HUD
        const comboEl = mount.querySelector('#mm-combo-val');
        const scoreEl = mount.querySelector('#mm-score-val');
        if (comboEl) comboEl.textContent = `x${mm.combo + 1}`;
        if (scoreEl) scoreEl.textContent = mm.score;

        mm.flipped = [];
        mm.locked = false;

        // التحقق من فوز اللعبة
        if (mm.matched === mm.totalPairs) {
          clearInterval(mm.timerInterval);
          saveBestTime(mm.difficulty, mm.timer);
          mm.onWin(mm.score);
          setTimeout(() => showWinScreen(mount, pool, onWin), 600);
        }
      }, 400);
    } else {
      // فشل التطابق
      setTimeout(() => {
        playFailBuzz();
        mm.combo = 0;
        
        const comboEl = mount.querySelector('#mm-combo-val');
        if (comboEl) comboEl.textContent = `x1`;

        // إغلاق الكروت مجدداً
        [cardA, cardB].forEach(c => {
          c.flipped = false;
          const cardEl = mount.querySelector(`#mm-card-${c.id}`);
          if (cardEl) cardEl.classList.remove('flipped');
        });

        mm.flipped = [];
        mm.locked = false;
      }, 1000);
    }
  }
}

// إظهار نصوص النقاط الطائرة ديناميكياً
function showFloatingText(text, cardId, mount) {
  const cardEl = mount.querySelector(`#mm-card-${cardId}`);
  const root = mount.querySelector('#mm-premium-root');
  if (!cardEl || !root) return;

  const rect = cardEl.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();

  const x = rect.left - rootRect.left + rect.width / 2;
  const y = rect.top - rootRect.top;

  const el = document.createElement('div');
  el.className = 'mm-floating-text';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.textContent = text;

  root.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ==========================================
// 🎨 7. نظام الجزيئات المتفجر (Canvas)
// ==========================================
function initCanvasParticles(mount) {
  mm.canvas = mount.querySelector('#mm-particle-canvas');
  if (!mm.canvas) return;

  mm.ctx = mm.canvas.getContext('2d');
  resizeCanvas();

  _resizeListener = () => resizeCanvas();
  window.addEventListener('resize', _resizeListener);

  animateParticles();
}

function resizeCanvas() {
  if (!mm.canvas) return;
  const rect = mm.canvas.parentElement.getBoundingClientRect();
  mm.canvas.width = rect.width;
  mm.canvas.height = rect.height;
}

function triggerMatchBurst(cardIdA, cardIdB, mount) {
  if (!mm.canvas || !mm.ctx) return;

  const cardA = mount.querySelector(`#mm-card-${cardIdA}`);
  const cardB = mount.querySelector(`#mm-card-${cardIdB}`);
  if (!cardA || !cardB) return;

  const rectA = cardA.getBoundingClientRect();
  const rectB = cardB.getBoundingClientRect();
  const canvasRect = mm.canvas.getBoundingClientRect();

  const points = [
    { x: rectA.left - canvasRect.left + rectA.width/2, y: rectA.top - canvasRect.top + rectA.height/2 },
    { x: rectB.left - canvasRect.left + rectB.width/2, y: rectB.top - canvasRect.top + rectB.height/2 }
  ];

  const colors = ['#fbbf24', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa'];

  points.forEach(pt => {
    for (let i = 0; i < 40; i++) {
      mm.particles.push({
        x: pt.x,
        y: pt.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        radius: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  });
}

function animateParticles() {
  if (!mm.ctx || !mm.canvas) return;

  mm.ctx.clearRect(0, 0, mm.canvas.width, mm.canvas.height);

  mm.particles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      mm.particles.splice(idx, 1);
      return;
    }

    mm.ctx.save();
    mm.ctx.globalAlpha = p.alpha;
    mm.ctx.fillStyle = p.color;
    mm.ctx.shadowBlur = 10;
    mm.ctx.shadowColor = p.color;
    mm.ctx.beginPath();
    mm.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    mm.ctx.fill();
    mm.ctx.restore();
  });

  _canvasAnimFrame = requestAnimationFrame(animateParticles);
}

function stopParticles() {
  if (_canvasAnimFrame) {
    cancelAnimationFrame(_canvasAnimFrame);
    _canvasAnimFrame = null;
  }
  if (_resizeListener) {
    window.removeEventListener('resize', _resizeListener);
    _resizeListener = null;
  }
  if (mm.timerInterval) {
    clearInterval(mm.timerInterval);
  }
  mm.particles = [];
}

// ==========================================
// 🎨 8. شاشة الفوز النهائية
// ==========================================
function showWinScreen(mount, pool, onWin) {
  playSuccessChime();
  stopParticles();

  // تفعيل انفجار جزيئات كبير جداً على كامل الكانفاس
  if (mm.canvas) {
    for (let i = 0; i < 150; i++) {
      mm.particles.push({
        x: mm.canvas.width / 2,
        y: mm.canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        radius: Math.random() * 4 + 2,
        color: ['#fbbf24', '#f59e0b', '#10b981', '#6366f1', '#ec4899'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008
      });
    }
    animateParticles();
  }

  const best = getBestTimes()[mm.difficulty];
  const isNewRecord = best === mm.timer;
  const efficiency = Math.max(10, Math.round(100 - (mm.moves - mm.totalPairs) * 5));

  const overlay = mount.querySelector('#mm-result-overlay');
  if (!overlay) return;

  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-window" style="font-family:'Tajawal',sans-serif">
      <div class="hm-res-badge">${isNewRecord ? '🏆' : '🎉'}</div>
      <h2 class="hm-res-title win">${isNewRecord ? 'رقم قياسي جديد!' : 'تم مسح اللوحة بنجاح!'}</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:18px;">
        لقد أتقنت مطابقة كافة الكلمات الخاصة بهذه الوحدات!
      </p>

      <div class="hm-res-stats" style="grid-template-columns: repeat(2, 1fr);">
        <div class="hm-stat-box">
          <label>الوقت المستغرق</label>
          <span>${formatTime(mm.timer)}</span>
        </div>
        <div class="hm-stat-box">
          <label>المحاولات</label>
          <span>${mm.moves}</span>
        </div>
        <div class="hm-stat-box">
          <label>الدقة اللغوية</label>
          <span style="color:#a78bfa;">${efficiency}%</span>
        </div>
        <div class="hm-stat-box total">
          <label>النقاط النهائية</label>
          <span>${mm.score}</span>
        </div>
      </div>

      <div class="hm-action-row">
        <button class="btn btn-primary" id="mm-replay-btn" style="padding:10px 24px; font-weight:700;">
          العب مجدداً ⚡
        </button>
        <button class="btn btn-secondary" id="mm-hub-btn" style="padding:10px 20px;">
          رجوع للألعاب
        </button>
      </div>
    </div>
  `;

  overlay.querySelector('#mm-replay-btn').addEventListener('click', () => {
    stopParticles();
    startGame(mount, pool, onWin, mm.difficulty);
  });
  overlay.querySelector('#mm-hub-btn').addEventListener('click', () => {
    stopParticles();
    document.querySelector('#gc-back-btn')?.click();
  });
}

function formatTime(s) {
  return `${Math.floor(s/60)}:${String(s % 60).padStart(2, '0')}`;
}
