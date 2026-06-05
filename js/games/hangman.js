import { createAudioCtx, playTone, playSuccessChime, playFailBuzz } from './gameAudio.js';

// ==========================================
// 🎨 1. الستايلات البصرية المدمجة ديناميكياً (CSS-in-JS)
// ==========================================
const STYLE_ID = 'eea-hangman-premium-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    /* الحاوية الأساسية للعبة بتصميم متناسق مع ثيمات الموقع */
    .hm-premium-container {
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
      transition: all 0.3s ease;
    }

    /* تأثير اهتزاز الشاشة عند الخطأ */
    @keyframes hm-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
      20%, 40%, 60%, 80% { transform: translateX(6px); }
    }
    .hm-shake-active {
      animation: hm-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    }

    /* وميض أحمر جانبي عند الخطأ */
    .hm-premium-container::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 24px;
      box-shadow: inset 0 0 40px rgba(239, 68, 68, 0);
      pointer-events: none;
      transition: box-shadow 0.2s ease;
      z-index: 10;
    }
    .hm-flash-danger::before {
      box-shadow: inset 0 0 40px rgba(239, 68, 68, 0.65);
    }

    /* ترويسة اللعبة */
    .hm-premium-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 12px;
    }
    .hm-premium-badge {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    .hm-premium-score {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hm-premium-score strong {
      font-size: 1.4rem;
      color: var(--accent);
      text-shadow: 0 0 10px var(--accent-glow);
    }
    .hm-premium-lives {
      display: flex;
      gap: 6px;
    }
    .hm-premium-heart {
      font-size: 1.3rem;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .hm-premium-heart.lost {
      transform: scale(0.6);
      filter: grayscale(1) opacity(0.3);
    }
    .hm-premium-heart.active {
      animation: hm-heartbeat 1.5s infinite alternate;
    }
    @keyframes hm-heartbeat {
      0% { transform: scale(1); }
      100% { transform: scale(1.15); }
    }

    /* التوزيع الأساسي للعبة */
    .hm-premium-body {
      display: grid;
      grid-template-columns: 1.1fr 1.3fr;
      gap: 28px;
      width: 100%;
      align-items: center;
    }
    @media (max-width: 768px) {
      .hm-premium-body {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }

    /* منطقة المشنقة والرسم التفاعلي */
    .hm-canvas-panel {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    .hm-svg-view {
      width: 100%;
      max-width: 240px;
      height: 250px;
      overflow: visible;
    }

    /* حركة تأرجح المشنوق بنعومة في الرياح */
    @keyframes hm-wind-swaying {
      0% { transform: rotate(-2deg); }
      100% { transform: rotate(2deg); }
    }
    .hm-sway-group {
      transform-origin: 160px 50px;
      animation: hm-wind-swaying 3.5s ease-in-out infinite alternate;
    }

    /* أنيميشن رفرفة العينين وتعبيرات الوجه */
    @keyframes hm-blinking {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    .hm-eye-part {
      transform-origin: center;
      animation: hm-blinking 4s infinite;
    }

    /* أزرار التلميحات الفاخرة */
    .hm-hint-action-btn {
      width: 100%;
      margin-top: 14px;
      padding: 12px 18px;
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-muted);
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hm-hint-action-btn:hover:not(:disabled) {
      color: var(--text-main);
      border-color: var(--primary);
      box-shadow: 0 0 15px var(--primary-glow);
      transform: translateY(-2px);
    }
    .hm-hint-action-btn.revealed {
      border-color: var(--success);
      color: var(--success);
      background: var(--success-glow);
      cursor: default;
      opacity: 1 !important;
    }
    .hm-hint-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* منطقة عرض الكلمة */
    .hm-word-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 100%;
      text-align: center;
    }
    .hm-word-slots {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .hm-letter-slot {
      position: relative;
      width: 38px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
      text-transform: uppercase;
      perspective: 600px;
    }
    .hm-letter-char {
      opacity: 0;
      transform: translateY(12px) rotateX(-90deg);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .hm-letter-slot.revealed .hm-letter-char {
      opacity: 1;
      transform: translateY(0) rotateX(0);
      color: var(--primary);
      text-shadow: 0 0 12px var(--primary-glow);
    }
    .hm-letter-underline {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--border-color);
      border-radius: 2px;
      transition: background 0.3s ease;
    }
    .hm-letter-slot.revealed .hm-letter-underline {
      background: linear-gradient(90deg, var(--primary), var(--secondary));
    }

    /* الكيبورد الميكانيكي ثلاثي الأبعاد */
    .hm-mech-keyboard {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      margin-top: 14px;
    }
    .hm-mech-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .hm-mech-key {
      position: relative;
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-main);
      font-size: 1.1rem;
      font-weight: 700;
      width: 38px;
      height: 42px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
      box-shadow: 0 4px 0 var(--shadow-solid-secondary),
                  0 5px 8px rgba(0,0,0,0.15);
      transition: all 0.1s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .hm-mech-key:active, .hm-mech-key.active-press {
      transform: translateY(3px);
      box-shadow: 0 1px 0 var(--shadow-solid-secondary),
                  0 2px 4px rgba(0,0,0,0.1);
    }
    .hm-mech-key.correct {
      background: linear-gradient(180deg, var(--success) 0%, var(--shadow-solid-success) 100%);
      box-shadow: 0 4px 0 var(--shadow-solid-success), 0 6px 10px var(--success-glow);
      color: #fff;
      cursor: not-allowed;
      border-color: var(--success);
    }
    .hm-mech-key.correct:active {
      transform: none;
      box-shadow: 0 4px 0 var(--shadow-solid-success), 0 6px 10px var(--success-glow);
    }
    .hm-mech-key.wrong {
      background: linear-gradient(180deg, var(--error) 0%, var(--shadow-solid-danger) 100%);
      box-shadow: 0 4px 0 var(--shadow-solid-danger), 0 6px 10px var(--error-glow);
      color: #fff;
      cursor: not-allowed;
      opacity: 0.65;
      border-color: var(--error);
    }
    .hm-mech-key.wrong:active {
      transform: none;
      box-shadow: 0 4px 0 var(--shadow-solid-danger), 0 6px 10px var(--error-glow);
    }
    .hm-mech-key:disabled {
      pointer-events: none;
    }

    @media (max-width: 500px) {
      .hm-mech-keyboard {
        gap: 6px;
      }
      .hm-mech-row {
        gap: 4px;
      }
      .hm-mech-key {
        width: 30px;
        height: 36px;
        font-size: 0.92rem;
        box-shadow: 0 3px 0 var(--shadow-solid-secondary), 0 3px 6px rgba(0,0,0,0.15);
      }
      .hm-mech-key:active, .hm-mech-key.active-press {
        transform: translateY(2px);
        box-shadow: 0 1px 0 var(--shadow-solid-secondary), 0 1px 2px rgba(0,0,0,0.1);
      }
      .hm-mech-key.correct {
        box-shadow: 0 3px 0 var(--shadow-solid-success), 0 4px 6px var(--success-glow);
      }
      .hm-mech-key.wrong {
        box-shadow: 0 3px 0 var(--shadow-solid-danger), 0 4px 6px var(--error-glow);
      }
    }

    /* لفافة البردي لتعليمات اللعبة */
    .hm-parchment-scroll {
      background: #fcf6e4;
      border: 3px double #b4975a;
      border-radius: 12px;
      color: #2c2518;
      padding: 16px;
      margin-bottom: 18px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), inset 0 0 30px rgba(180, 151, 90, 0.15);
      font-size: 0.9rem;
      line-height: 1.6;
      width: 100%;
      text-align: right;
      direction: rtl;
    }
    .hm-parchment-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #7c2d12;
      margin-bottom: 6px;
      border-bottom: 1px dashed #b4975a;
      padding-bottom: 4px;
    }

    /* تراكبات النتائج الفوز والخسارة */
    .hm-premium-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: hm-overlay-fade 0.3s ease-out;
      padding: 20px;
    }
    @keyframes hm-overlay-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .hm-result-window {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: 24px;
      padding: 30px;
      width: 100%;
      max-width: 480px;
      text-align: center;
      box-shadow: var(--card-shadow-3d);
      animation: hm-card-zoom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes hm-card-zoom {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .hm-res-badge {
      font-size: 3.5rem;
      margin-bottom: 10px;
      animation: hm-bounce 1s infinite alternate;
    }
    @keyframes hm-bounce {
      from { transform: translateY(0); }
      to { transform: translateY(-10px); }
    }
    .hm-res-title {
      font-size: 1.7rem;
      font-weight: 800;
      margin-bottom: 12px;
    }
    .hm-res-title.win {
      background: linear-gradient(90deg, var(--success), #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hm-res-title.lose {
      background: linear-gradient(90deg, var(--error), #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hm-res-word-reveal {
      font-size: 1.1rem;
      color: var(--text-muted);
      margin-bottom: 18px;
    }
    .hm-res-word-reveal strong {
      font-size: 1.5rem;
      color: var(--primary);
      letter-spacing: 1px;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 2px;
      margin: 0 6px;
    }
    .hm-res-stats {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .hm-stat-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hm-stat-box label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .hm-stat-box span {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .hm-stat-box.total span {
      color: var(--accent);
    }
    .hm-action-row {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    /* جزيئات الكانفاس لتأثيرات الفوز والخسارة */
    .hm-particle-canvas {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 5;
    }
  `;
  document.head.appendChild(styleEl);
}

// ==========================================
// 🎨 2. مكونات رسومات الـ SVG للمشنقة والشخصية
// ==========================================
const SVG_TEMPLATES = {
  // القاعدة الخشبية
  scaffold: `
    <!-- التظليل العام -->
    <defs>
      <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#854d0e" />
        <stop offset="50%" stop-color="#713f12" />
        <stop offset="100%" stop-color="#422006" />
      </linearGradient>
      <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#d97706" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>
      <!-- تدرج سطحي لقبعة التخرج -->
      <linearGradient id="surfaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#000000" />
      </linearGradient>
    </defs>
    <!-- قاعدة المشنقة الأرضية -->
    <rect x="10" y="225" width="160" height="12" rx="4" fill="url(#woodGrad)" />
    <rect x="15" y="237" width="150" height="6" rx="2" fill="#422006" opacity="0.4" />
    <!-- العمود الرأسي -->
    <path d="M 65 225 L 77 225 L 77 20 L 65 20 Z" fill="url(#woodGrad)" />
    <!-- العارضة الأفقية -->
    <path d="M 65 20 L 175 20 L 175 32 L 65 32 Z" fill="url(#woodGrad)" />
    <!-- عارضة التدعيم المائلة -->
    <path d="M 65 65 L 110 20 L 120 20 L 65 75 Z" fill="url(#woodGrad)" />
    <!-- مسمار التثبيت -->
    <circle cx="115" cy="26" r="3" fill="var(--text-muted)" />
    <circle cx="71" cy="70" r="3" fill="var(--text-muted)" />
  `,
  // حبل المشنقة
  rope: `
    <line x1="160" y1="32" x2="160" y2="70" stroke="url(#ropeGrad)" stroke-width="4.5" stroke-linecap="round" />
    <circle cx="160" cy="70" r="5.5" fill="#d97706" stroke="#451a03" stroke-width="1.5" />
  `
};

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// ==========================================
// 🎨 3. إدارة حالة اللعب والمنطق
// ==========================================
let state = {};
let _physicalKeyListener = null;
let _canvasAnimFrame = null;

function resetState(wordObj, difficulty, hangmanMode) {
  const maxWrongs = { easy: 8, medium: 6, hard: 4 };
  const maxWrong = maxWrongs[difficulty] || 6;
  const mode = hangmanMode || 'words';
  
  let rawText = '';
  let arabicHint = '';
  
  if (mode === 'words') {
    rawText = wordObj.english || wordObj.word || '';
    rawText = rawText.toUpperCase().replace(/[^A-Z]/g, '');
    arabicHint = wordObj.arabic || wordObj.translation || '';
  } else {
    rawText = wordObj.sentence || wordObj.english || wordObj.word || '';
    rawText = rawText.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
    arabicHint = wordObj.translation || wordObj.arabic || '';
  }

  state = {
    word: rawText,
    arabicHint: arabicHint,
    guessed: new Set(),
    wrong: 0,
    maxWrong,
    phase: 'playing',
    hintUsed: false,
    startTime: Date.now(),
    score: 0,
    difficulty,
    roundNum: 0,
    totalScore: 0,
    hangmanMode: mode
  };

  if (mode === 'sentences') {
    state.guessed.add(' ');
  }
}

export function playHangman(mount, { vocabPool, sentencePool, onWin, difficulty, hangmanMode }) {
  injectStyles();
  
  // تسجيل دالة تنظيف اللعبة لإيقافها فوراً عند الخروج
  window.eea_game_cleanup = () => {
    if (_physicalKeyListener) {
      document.removeEventListener('keydown', _physicalKeyListener);
      _physicalKeyListener = null;
    }
    stopParticleSystem();
  };

  const mode = hangmanMode || 'words';
  const pool = mode === 'words' ? (vocabPool || []) : (sentencePool || []);

  if (pool.length === 0) {
    mount.innerHTML = `
      <div class="gc-error" style="font-family:'Tajawal', sans-serif;">
        ⚠️ لا توجد محتويات متاحة في الدروس المحددة للعب بهذا النمط.
      </div>`;
    return;
  }
  const diff = difficulty || 'medium';
  startRound(mount, pool, onWin, 0, 0, diff, mode);
}

function startRound(mount, pool, onWin, roundNum, totalScore, difficulty, hangmanMode) {
  const mode = hangmanMode || 'words';
  const eligible = pool.filter(v => {
    if (mode === 'words') {
      const text = v.english || v.word || '';
      const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
      return clean.length >= 3 && clean.length <= 14;
    } else {
      const text = v.sentence || v.english || v.word || '';
      const clean = text.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
      return clean.length >= 5 && clean.length <= 35;
    }
  });

  if (eligible.length === 0) {
    mount.innerHTML = `
      <div class="gc-error" style="font-family:'Tajawal', sans-serif;">
        ⚠️ لا توجد جمل أو كلمات مطابقة للشروط في الدروس المحددة.
      </div>`;
    return;
  }

  // اختيار كلمة عشوائية
  const wordObj = eligible[Math.floor(Math.random() * eligible.length)];
  resetState(wordObj, difficulty, mode);
  state.roundNum = roundNum;
  state.totalScore = totalScore;

  renderGameLayout(mount, pool, onWin);
  initParticleSystem(mount);
}

// ==========================================
// 🎨 4. بناء هيكل الواجهة وحقنها
// ==========================================
function renderGameLayout(mount, pool, onWin) {
  const hintCostHTML = state.difficulty === 'easy' ? 'مجاني' : '-5 نقاط';
  const isHard = state.difficulty === 'hard';
  const isSentence = state.hangmanMode === 'sentences';

  mount.innerHTML = `
    <div class="hm-premium-container" id="hm-premium-root">
      <!-- كانفاس الجزيئات لتأثيرات الفوز والخسارة -->
      <canvas class="hm-particle-canvas" id="hm-particle-canvas"></canvas>

      <!-- الترويسة العلوية -->
      <div class="hm-premium-header">
        <div class="hm-premium-badge">الجولة ${state.roundNum + 1} • ${state.difficulty.toUpperCase()}</div>
        <div class="hm-premium-score">
          <span>النقاط:</span>
          <strong id="hm-score-val">${state.totalScore}</strong>
        </div>
        <div class="hm-premium-lives" id="hm-lives-container">
          ${renderHearts()}
        </div>
      </div>

      <!-- لفافة البردي للمساعدة والتعليمات -->
      <div class="hm-parchment-scroll">
        <div class="hm-parchment-title">📜 دليل الصمود اللغوي:</div>
        تم اختيار ${isSentence ? 'جملة كاملة' : 'كلمة مفردة'} باللغة الإنجليزية من دروسك. خمن الحروف لتنقذ صديقك! الإجابة السريعة والخالية من الأخطاء تمنحك نقاطاً مضاعفة.
      </div>

      <!-- الجسم الأساسي المقسم لعمودين -->
      <div class="hm-premium-body">
        <!-- العمود الأيسر: رسم المشنقة والـ SVG والتلميحات -->
        <div class="hm-canvas-panel">
          <svg class="hm-svg-view" viewBox="0 0 240 250" xmlns="http://www.w3.org/2000/svg" id="hm-premium-svg">
            ${renderSVGScaffold()}
          </svg>

          <!-- زر التلميح المتطور -->
          ${isHard ? `
            <div class="hm-hint-action-btn" style="cursor: default;" disabled>
              🔒 لا تلميحات في المستوى الصعب
            </div>
          ` : `
            <button class="hm-hint-action-btn" id="hm-premium-hint-btn">
              <span>💡 ${isSentence ? 'طلب ترجمة الجملة بالعربية' : 'طلب تلميح مرادف بالعربية'}</span>
              <span style="font-size:0.8rem; background:var(--bg-primary); padding:2px 8px; border-radius:6px; margin-right:6px; color:var(--text-muted); border:1px solid var(--border-color);">(${hintCostHTML})</span>
            </button>
          `}
        </div>

        <!-- العمود الأيمن: الكلمة والـ Keyboard -->
        <div class="hm-word-panel">
          <div class="hm-word-slots" id="hm-slots-container" style="width: 100%; display: flex; flex-wrap: wrap; justify-content: center;">
            ${renderWordSlots()}
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:-4px;">
            يتكون اللغز من <strong>${state.word.length}</strong> ${isSentence ? 'حرفاً ورمزاً (Characters)' : 'حروف (Letters)'}
          </p>

          <!-- الكيبورد الميكانيكي -->
          <div class="hm-mech-keyboard" id="hm-premium-keyboard">
            ${KEYBOARD_ROWS.map(row => `
              <div class="hm-mech-row">
                ${row.map(letter => {
                  const isGuessed = state.guessed.has(letter);
                  const isCorrect = isGuessed && state.word.includes(letter);
                  const isWrong = isGuessed && !state.word.includes(letter);
                  const cls = isCorrect ? 'correct' : isWrong ? 'wrong' : '';
                  return `
                    <button class="hm-mech-key ${cls}" data-letter="${letter}" id="hm-kkey-${letter}" ${isGuessed ? 'disabled' : ''}>
                      ${letter}
                    </button>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- حاوية التراكب المنسدل للنتيجة -->
      <div class="hm-premium-overlay" id="hm-premium-overlay" style="display:none"></div>
    </div>
  `;

  attachEventListeners(mount, pool, onWin);
  bindPhysicalKeyboard(mount, pool, onWin);
}

// ==========================================
// 🎨 5. رسومات الـ SVG المدمجة حسب عدد الأخطاء
// ==========================================
// ── الرسم الشرطي لأجزاء الدمية الأكاديمية الجديدة ──────────────────────────
function renderCharacter(partsToShow) {
  let characterSVG = '';
  const isDead = partsToShow.includes('deadEyes');
  const isSad = partsToShow.includes('sadMouth');

  // 1. الرأس وقبعة التخرج
  if (partsToShow.includes('head')) {
    let eyes = '';
    let mouth = '';

    if (isDead) {
      // أعين ميتة X X حمراء
      eyes = `
        <path d="M 148 86 L 156 94 M 156 86 L 148 94" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
        <path d="M 164 86 L 172 94 M 172 86 L 164 94" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
      `;
      // فم عابس مستقيم
      mouth = `<path d="M 152 101 Q 160 97 168 101" stroke="#ef4444" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
    } else if (isSad) {
      // أعين حزينة ترمش
      eyes = `
        <ellipse cx="152" cy="89" rx="2.5" ry="3.5" fill="#1e293b" class="hm-eye-part" />
        <ellipse cx="168" cy="89" rx="2.5" ry="3.5" fill="#1e293b" class="hm-eye-part" />
        <circle cx="151.2" cy="87.8" r="0.8" fill="#fff" />
        <circle cx="167.2" cy="87.8" r="0.8" fill="#fff" />
      `;
      // فم حزين مقلوب
      mouth = `<path d="M 152 102 Q 160 95 168 102" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
    } else {
      // أعين طبيعية تبتسم وترمش
      eyes = `
        <ellipse cx="152" cy="89" rx="3.2" ry="4" fill="#1e293b" class="hm-eye-part" />
        <ellipse cx="168" cy="89" rx="3.2" ry="4" fill="#1e293b" class="hm-eye-part" />
        <circle cx="150.8" cy="86.8" r="1" fill="#fff" />
        <circle cx="166.8" cy="86.8" r="1" fill="#fff" />
      `;
      // فم يبتسم بسعادة
      mouth = `<path d="M 152 98 Q 160 105 168 98" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
    }

    characterSVG += `
      <!-- الرأس ككل -->
      <circle cx="160" cy="90" r="18" fill="#fed7aa" stroke="#7c2d12" stroke-width="2.5" />
      <!-- خدود وردية لطيفة -->
      <circle cx="147" cy="95" r="3" fill="#fca5a5" opacity="0.8" />
      <circle cx="173" cy="95" r="3" fill="#fca5a5" opacity="0.8" />
      ${eyes}
      ${mouth}
      
      <!-- قبعة التخرج الفاخرة (Graduation Cap) -->
      <!-- قاعدة قبعة التخرج -->
      <path d="M 144 76 Q 160 70 176 76 L 173 70 Q 160 65 147 70 Z" fill="#0f172a" stroke="#1e293b" stroke-width="1" />
      <!-- المظلة العلوية الماسية الشكل ثلاثية الأبعاد -->
      <polygon points="160,56 186,68 160,78 134,68" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
      <polygon points="160,56 186,68 160,78 134,68" fill="url(#surfaceGradient)" opacity="0.15" />
      <!-- الشرابة والزر في المنتصف -->
      <circle cx="160" cy="67" r="2" fill="#fbbf24" />
      <!-- خيط متدل مع شرابة ذهبية في نهايتها -->
      <path d="M 160 67 L 140 76 L 138 84" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="138" cy="84" r="2.5" fill="#f59e0b" />
    `;
  }

  // 2. الجسد (العباءة الأكاديمية والوشاح)
  if (partsToShow.includes('torso')) {
    characterSVG += `
      <!-- عباءة التخرج الزرقاء الداكنة -->
      <rect x="144" y="108" width="32" height="50" rx="8" fill="#1e1b4b" stroke="#0f172a" stroke-width="2.5" />
      <!-- ياقة قميص بيضاء أكاديمية بالمنتصف -->
      <polygon points="154,108 166,108 160,116" fill="#fff" />
      <!-- وشاح تخرج أحمر فخم منسدل (Sash) -->
      <path d="M 148 108 L 152 150 M 172 108 L 168 150" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
      <!-- أوسمة/أزرار ذهبية تفصيلية -->
      <circle cx="160" cy="126" r="2.5" fill="#fbbf24" />
      <circle cx="160" cy="140" r="2.5" fill="#fbbf24" />
    `;
  }

  // 3. الذراع اليسرى بأكمام واسعة
  if (partsToShow.includes('leftArm')) {
    characterSVG += `
      <!-- أكمام واسعة للعباءة -->
      <path d="M 144 114 L 122 135" stroke="#1e1b4b" stroke-width="7.5" stroke-linecap="round" />
      <!-- كف اليد بلون الوجه -->
      <circle cx="122" cy="135" r="4.5" fill="#fed7aa" stroke="#7c2d12" stroke-width="1.5" />
    `;
  }

  // 4. الذراع اليمنى بأكمام واسعة
  if (partsToShow.includes('rightArm')) {
    characterSVG += `
      <path d="M 176 114 L 198 135" stroke="#1e1b4b" stroke-width="7.5" stroke-linecap="round" />
      <circle cx="198" cy="135" r="4.5" fill="#fed7aa" stroke="#7c2d12" stroke-width="1.5" />
    `;
  }

  // 5. الرجل اليسرى (بنطال وحذاء أسود لامع)
  if (partsToShow.includes('leftLeg')) {
    characterSVG += `
      <!-- بنطال رمادي -->
      <path d="M 149 158 L 140 205" stroke="#475569" stroke-width="7" stroke-linecap="round" />
      <!-- حذاء تخرج أسود -->
      <path d="M 140 205 Q 135 210 128 207 L 142 201 Z" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    `;
  }

  // 6. الرجل اليمنى (بنطال وحذاء أسود لامع)
  if (partsToShow.includes('rightLeg')) {
    characterSVG += `
      <path d="M 171 158 L 180 205" stroke="#475569" stroke-width="7" stroke-linecap="round" />
      <path d="M 180 205 Q 185 210 192 207 L 178 201 Z" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    `;
  }

  return characterSVG;
}

function renderSVGScaffold() {
  let output = SVG_TEMPLATES.scaffold;

  // الحبل يظهر دائماً
  output += SVG_TEMPLATES.rope;

  // عدد الأخطاء يحدد ما يظهر من المشنوق
  const w = state.wrong;

  let partsToShow = [];
  if (state.maxWrong === 8) {
    if (w >= 1) partsToShow.push('head');
    if (w >= 2) partsToShow.push('sadMouth');
    if (w >= 3) partsToShow.push('torso');
    if (w >= 4) partsToShow.push('leftArm');
    if (w >= 5) partsToShow.push('rightArm');
    if (w >= 6) partsToShow.push('leftLeg');
    if (w >= 7) partsToShow.push('rightLeg');
    if (w >= 8) partsToShow.push('deadEyes');
  } else if (state.maxWrong === 4) {
    if (w >= 1) partsToShow.push('head');
    if (w >= 2) { partsToShow.push('torso'); partsToShow.push('sadMouth'); }
    if (w >= 3) { partsToShow.push('leftArm'); partsToShow.push('rightArm'); }
    if (w >= 4) { partsToShow.push('leftLeg'); partsToShow.push('rightLeg'); partsToShow.push('deadEyes'); }
  } else {
    if (w >= 1) partsToShow.push('head');
    if (w >= 2) { partsToShow.push('torso'); partsToShow.push('sadMouth'); }
    if (w >= 3) partsToShow.push('leftArm');
    if (w >= 4) partsToShow.push('rightArm');
    if (w >= 5) partsToShow.push('leftLeg');
    if (w >= 6) { partsToShow.push('rightLeg'); partsToShow.push('deadEyes'); }
  }

  const characterSVG = renderCharacter(partsToShow);

  if (characterSVG) {
    output += `<g class="hm-sway-group">${characterSVG}</g>`;
  }

  return output;
}

// ==========================================
// 🎨 6. توليد وتحديث الواجهات الفرعية
// ==========================================
function renderHearts() {
  return Array.from({ length: state.maxWrong }, (_, i) => {
    const isLost = i >= (state.maxWrong - state.wrong);
    const cls = isLost ? 'lost' : (state.maxWrong - state.wrong <= 2 ? 'active' : '');
    return `<span class="hm-premium-heart ${cls}">❤️</span>`;
  }).join('');
}

function renderWordSlots() {
  if (state.hangmanMode === 'sentences') {
    const wordsArray = state.word.split(' ');
    return wordsArray.map(word => {
      return `
        <div class="hm-word-group" style="display: inline-flex; gap: 6px; margin: 4px 6px; flex-wrap: nowrap;">
          ${word.split('').map(letter => {
            const isRevealed = state.guessed.has(letter);
            return `
              <span class="hm-letter-slot ${isRevealed ? 'revealed' : ''}" style="width: 26px; height: 36px; font-size: 1.25rem;">
                <span class="hm-letter-char">${letter}</span>
                <span class="hm-letter-underline" style="height: 2px;"></span>
              </span>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  } else {
    return state.word.split('').map(letter => {
      const isRevealed = state.guessed.has(letter);
      return `
        <span class="hm-letter-slot ${isRevealed ? 'revealed' : ''}">
          <span class="hm-letter-char">${letter}</span>
          <span class="hm-letter-underline"></span>
        </span>
      `;
    }).join('');
  }
}

// ==========================================
// 🎨 7. ربط المستمعين للوحة المفاتيح والأزرار
// ==========================================
function attachEventListeners(mount, pool, onWin) {
  // كيبورد النقر الافتراضي
  mount.querySelectorAll('.hm-mech-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const letter = btn.dataset.letter;
      if (!state.guessed.has(letter) && state.phase === 'playing') {
        handleGuessLetter(letter, mount, pool, onWin);
      }
    });
  });

  // زر التلميحات المتميز
  const hintBtn = mount.querySelector('#hm-premium-hint-btn');
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      if (state.hintUsed || state.difficulty === 'hard') return;

      state.hintUsed = true;
      // خصم النقاط للمستويات غير السهلة
      if (state.difficulty !== 'easy') {
        state.totalScore = Math.max(0, state.totalScore - 5);
        const valEl = mount.querySelector('#hm-score-val');
        if (valEl) valEl.textContent = state.totalScore;
      }

      // تحويل شكل الزر لعرض التلميح مباشرة دون إعادة رندر كاملة للحفاظ على استمرارية اللعب
      hintBtn.classList.add('revealed');
      hintBtn.innerHTML = `💡 المعنى بالعربية: <strong style="font-size:1.05rem; color:var(--text-main); margin-right:6px;">${state.arabicHint}</strong>`;
      hintBtn.disabled = true;

      playTone(440, 0.15, 'sine', 0.2); // نغمة المساعدة
    });
  }
}

function bindPhysicalKeyboard(mount, pool, onWin) {
  if (_physicalKeyListener) {
    document.removeEventListener('keydown', _physicalKeyListener);
  }

  _physicalKeyListener = (e) => {
    if (state.phase !== 'playing') return;
    const letter = e.key.toUpperCase();

    // التحقق من أنه حرف إنجليزي فقط
    if (/^[A-Z]$/.test(letter) && !state.guessed.has(letter)) {
      // إحداث تأثير بصري سريع على زر الكيبورد الافتراضي
      const btn = mount.querySelector(`#hm-kkey-${letter}`);
      if (btn) {
        btn.classList.add('active-press');
        setTimeout(() => btn.classList.remove('active-press'), 120);
      }
      handleGuessLetter(letter, mount, pool, onWin);
    }
  };

  document.addEventListener('keydown', _physicalKeyListener);
}

// ==========================================
// 🎨 8. منطق التخمين وحساب النقاط
// ==========================================
function handleGuessLetter(letter, mount, pool, onWin) {
  if (state.phase !== 'playing') return;

  state.guessed.add(letter);
  createAudioCtx();

  // تعطيل الزر فوراً
  const btn = mount.querySelector(`#hm-kkey-${letter}`);
  if (btn) {
    btn.disabled = true;
  }

  if (state.word.includes(letter)) {
    // إجابة صحيحة
    if (btn) btn.classList.add('correct');
    playTone(587.33, 0.12, 'sine', 0.25); // D5 chime

    // التحقق من كشف كامل الكلمة
    const allRevealed = state.word.split('').every(l => state.guessed.has(l));
    if (allRevealed) {
      const elapsed = (Date.now() - state.startTime) / 1000;
      const timeBonus = Math.max(0, Math.floor(60 - elapsed));
      const penalty = state.wrong * 15;
      const hintPenalty = (state.hintUsed && state.difficulty !== 'easy') ? 15 : 0;
      const baseRoundScore = 150 + timeBonus - penalty - hintPenalty;

      state.score = Math.max(20, baseRoundScore);
      state.totalScore += state.score;
      state.phase = 'won';
    }
  } else {
    // إجابة خاطئة
    if (btn) btn.classList.add('wrong');
    playFailBuzz();
    state.wrong++;

    // إحداث تأثيرات الاهتزاز والوميض الفاخرة
    triggerFlashEffects(mount);

    if (state.wrong >= state.maxWrong) {
      state.phase = 'lost';
    }
  }

  // تحديث المكونات بمرونة بدون إعادة رندر الصفحة كاملة
  updateSVGDisplay(mount);
  updateWordSlotsDisplay(mount);
  updateHeartsDisplay(mount);

  if (state.phase === 'won') {
    setTimeout(() => showWinOverlay(mount, pool, onWin), 600);
  } else if (state.phase === 'lost') {
    setTimeout(() => showLoseOverlay(mount, pool, onWin), 600);
  }
}

// تفعيل تأثيرات الفلاش والاهتزاز للمخطأ
function triggerFlashEffects(mount) {
  const root = mount.querySelector('#hm-premium-root');
  if (!root) return;

  root.classList.add('hm-shake-active', 'hm-flash-danger');
  setTimeout(() => {
    root.classList.remove('hm-shake-active', 'hm-flash-danger');
  }, 450);
}

// تحديث الـ SVG الجزئي
function updateSVGDisplay(mount) {
  const svg = mount.querySelector('#hm-premium-svg');
  if (svg) {
    svg.innerHTML = renderSVGScaffold();
  }
}

// تحديث الكلمة الجزئي
function updateWordSlotsDisplay(mount) {
  const slots = mount.querySelector('#hm-slots-container');
  if (slots) {
    slots.innerHTML = renderWordSlots();
  }
}

// تحديث القلوب الجزئي
function updateHeartsDisplay(mount) {
  const hearts = mount.querySelector('#hm-lives-container');
  if (hearts) {
    hearts.innerHTML = renderHearts();
  }
}

// ==========================================
// 🎨 9. لوحات النتيجة النهائية (الفوز والخسارة)
// ==========================================
function showWinOverlay(mount, pool, onWin) {
  playSuccessChime();
  if (_physicalKeyListener) {
    document.removeEventListener('keydown', _physicalKeyListener);
  }

  // استدعاء جائزة النقاط للتابع الرئيسي
  onWin(state.score);

  // تفعيل محرك الجزيئات الاحتفالي
  triggerParticles('win');

  const overlay = mount.querySelector('#hm-premium-overlay');
  if (!overlay) return;

  const isSentence = state.hangmanMode === 'sentences';

  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-window">
      <div class="hm-res-badge">🎉</div>
      <h2 class="hm-res-title win">أحسنت! إجابة صحيحة</h2>
      <p class="hm-res-word-reveal">${isSentence ? 'الجملة المكتشفة هي' : 'الكلمة المكتشفة هي'}: <strong>${state.word}</strong></p>
      
      <div style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); border-radius:12px; padding:12px; margin-bottom:18px;">
        <span style="color:var(--text-muted); font-size:0.85rem; display:block; margin-bottom:4px;">الترجمة والرديف بالعربية:</span>
        <strong style="color:var(--success); font-size:1.2rem;">${state.arabicHint}</strong>
      </div>

      <div class="hm-res-stats">
        <div class="hm-stat-box">
          <label>نقاط الجولة</label>
          <span>+${state.score}</span>
        </div>
        <div class="hm-stat-box total">
          <label>المجموع الكلي</label>
          <span>${state.totalScore}</span>
        </div>
      </div>

      <div class="hm-action-row">
        <button class="btn btn-primary" id="hm-next-round-btn" style="padding:10px 24px; font-weight:700;">
          ${isSentence ? 'الجملة التالية ←' : 'الكلمة التالية →'}
        </button>
        <button class="btn btn-secondary" id="hm-quit-btn" style="padding:10px 20px;">
          خروج للألعاب
        </button>
      </div>
    </div>
  `;

  // ربط الأزرار
  overlay.querySelector('#hm-next-round-btn').addEventListener('click', () => {
    stopParticleSystem();
    startRound(mount, pool, onWin, state.roundNum + 1, state.totalScore, state.difficulty, state.hangmanMode);
  });
  overlay.querySelector('#hm-quit-btn').addEventListener('click', () => {
    stopParticleSystem();
    document.querySelector('#gc-back-btn')?.click();
  });
}

function showLoseOverlay(mount, pool, onWin) {
  if (_physicalKeyListener) {
    document.removeEventListener('keydown', _physicalKeyListener);
  }

  // تفعيل محرك جزيئات رمادي متساقط
  triggerParticles('lose');

  const overlay = mount.querySelector('#hm-premium-overlay');
  if (!overlay) return;

  const isSentence = state.hangmanMode === 'sentences';

  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="hm-result-window">
      <div class="hm-res-badge">💀</div>
      <h2 class="hm-res-title lose">حظ أوفر! لم تنجح</h2>
      <p class="hm-res-word-reveal">${isSentence ? 'الجملة الصحيحة كانت' : 'الكلمة الصحيحة كانت'}: <strong>${state.word}</strong></p>
      
      <div style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); border-radius:12px; padding:12px; margin-bottom:18px;">
        <span style="color:var(--text-muted); font-size:0.85rem; display:block; margin-bottom:4px;">الترجمة الصحيحة:</span>
        <strong style="color:var(--error); font-size:1.2rem;">${state.arabicHint}</strong>
      </div>

      <div class="hm-res-stats">
        <div class="hm-stat-box" style="grid-column: span 2;">
          <label>النقاط الإجمالية المكتسبة</label>
          <span style="color:var(--accent); font-size:1.5rem;">${state.totalScore}</span>
        </div>
      </div>

      <div class="hm-action-row">
        <button class="btn btn-primary" id="hm-retry-round-btn" style="padding:10px 24px; font-weight:700; background:#ef4444; border-color:#ef4444; box-shadow:0 4px 14px rgba(239, 68, 68, 0.4);">
          إعادة المحاولة ⚡
        </button>
        <button class="btn btn-secondary" id="hm-quit-btn2" style="padding:10px 20px;">
          خروج للألعاب
        </button>
      </div>
    </div>
  `;

  overlay.querySelector('#hm-retry-round-btn').addEventListener('click', () => {
    stopParticleSystem();
    // تصفير جولة الخسارة والبدء من جديد بنفس النقاط
    startRound(mount, pool, onWin, state.roundNum, state.totalScore, state.difficulty, state.hangmanMode);
  });
  overlay.querySelector('#hm-quit-btn2').addEventListener('click', () => {
    stopParticleSystem();
    document.querySelector('#gc-back-btn')?.click();
  });
}

// ==========================================
// 🎨 10. محرك نظام الجزيئات المتقدم (Canvas Particles)
// ==========================================
let particles = [];
let particleCtx = null;
let particleCanvas = null;

function initParticleSystem(mount) {
  particleCanvas = mount.querySelector('#hm-particle-canvas');
  if (!particleCanvas) return;

  particleCtx = particleCanvas.getContext('2d');
  resizeParticleCanvas();

  window.addEventListener('resize', resizeParticleCanvas);
}

function resizeParticleCanvas() {
  if (!particleCanvas) return;
  const rect = particleCanvas.parentElement.getBoundingClientRect();
  particleCanvas.width = rect.width;
  particleCanvas.height = rect.height;
}

function stopParticleSystem() {
  if (_canvasAnimFrame) {
    cancelAnimationFrame(_canvasAnimFrame);
    _canvasAnimFrame = null;
  }
  particles = [];
  if (particleCtx && particleCanvas) {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  }
}

function triggerParticles(type) {
  if (!particleCtx || !particleCanvas) return;

  stopParticleSystem();
  particles = [];

  const count = type === 'win' ? 120 : 60;
  const colors = type === 'win' 
    ? ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'] 
    : ['#475569', '#64748b', '#334155', '#1e293b'];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: type === 'win' ? particleCanvas.width / 2 : Math.random() * particleCanvas.width,
      y: type === 'win' ? particleCanvas.height / 2 + 50 : -20,
      vx: (Math.random() - 0.5) * (type === 'win' ? 10 : 2),
      vy: type === 'win' ? (Math.random() - 0.7) * 12 : Math.random() * 4 + 2,
      radius: Math.random() * 4 + (type === 'win' ? 2 : 1.5),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.015 + 0.005,
      gravity: type === 'win' ? 0.25 : 0.05
    });
  }

  animateParticles();
}

function animateParticles() {
  if (!particleCtx || !particleCanvas) return;

  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  let active = false;

  particles.forEach(p => {
    if (p.alpha <= 0) return;

    active = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.alpha -= p.decay;

    particleCtx.save();
    particleCtx.globalAlpha = p.alpha;
    particleCtx.fillStyle = p.color;
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    particleCtx.fill();
    particleCtx.restore();
  });

  if (active) {
    _canvasAnimFrame = requestAnimationFrame(animateParticles);
  }
}
