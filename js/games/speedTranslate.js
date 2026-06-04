/**
 * Speed Translate Game — Premium Edition
 * Egyptian English Academy
 * Features: Circular gauge speedometer timer, screen vignette flashes, glassmorphic button inputs, dynamic powerups, full CSS-in-JS.
 */

import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playCountdown, playTimeUp } from './gameAudio.js';

// ==========================================
// 🎨 1. الستايلات البصرية المدمجة ديناميكياً (CSS-in-JS)
// ==========================================
const STYLE_ID = 'eea-speed-translate-premium-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    .st-premium-container {
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

    /* وميض فلاش حواف الشاشة للإجابة الصحيحة أو الخاطئة */
    .st-premium-container::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 24px;
      box-shadow: inset 0 0 50px rgba(0,0,0,0);
      pointer-events: none;
      transition: box-shadow 0.25s ease;
      z-index: 10;
    }
    .st-flash-correct::before {
      box-shadow: inset 0 0 50px var(--success-glow);
    }
    .st-flash-wrong::before {
      box-shadow: inset 0 0 50px var(--error-glow);
    }

    /* شريط الحالة والـ HUD علوي */
    .st-premium-hud {
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
    .st-hud-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .st-counter-badge {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .st-progress-track {
      width: 100px;
      height: 6px;
      background: var(--bg-primary);
      border-radius: 3px;
      overflow: hidden;
    }
    .st-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      transition: width 0.3s ease;
    }

    /* لوحة قيادة الوقت والعداد الدائري */
    .st-timer-dashboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 10px 0;
      position: relative;
    }
    .st-gauge-svg {
      width: 130px;
      height: 130px;
      overflow: visible;
    }
    .st-gauge-needle {
      transform-origin: 50px 50px;
      transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
      stroke: var(--text-main);
    }
    .st-gauge-num {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -20%);
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
      text-shadow: 0 0 10px rgba(255,255,255,0.1);
    }
    .st-gauge-num.danger {
      color: var(--error);
      animation: st-timer-pulse 0.5s infinite alternate;
    }
    .st-gauge-num.frozen {
      color: #0ea5e9;
    }
    @keyframes st-timer-pulse {
      from { transform: translate(-50%, -20%) scale(1); }
      to { transform: translate(-50%, -20%) scale(1.15); }
    }

    /* كرت السؤال زجاجي */
    .st-question-card {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 680px;
      text-align: center;
      margin: 12px 0 20px 0;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    .st-question-lang {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }
    .st-question-txt {
      font-size: 2.1rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 10px 0;
    }
    .st-question-txt.ar-txt {
      font-family: 'Tajawal', sans-serif;
      color: var(--accent);
    }

    /* شبكة أزرار الاختيارات الزجاجية */
    .st-choices-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
      max-width: 680px;
    }
    @media (max-width: 520px) {
      .st-choices-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
    .st-choice-button {
      background: var(--surface-gradient), var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 16px 20px;
      color: var(--text-main);
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: right;
      direction: rtl;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .st-choice-button:hover:not(:disabled) {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-3d-hover);
    }
    .st-choice-badge {
      background: var(--bg-primary);
      border-radius: 8px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-muted);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .st-choice-button:hover .st-choice-badge {
      background: var(--primary);
      color: #fff;
    }
    .st-choice-txt {
      flex-grow: 1;
    }
    .st-choice-button.correct {
      background: linear-gradient(135deg, var(--success-glow) 0%, var(--bg-secondary) 100%);
      border-color: var(--success);
      color: var(--success);
      box-shadow: 0 0 15px var(--success-glow);
    }
    .st-choice-button.correct .st-choice-badge {
      background: var(--success);
      color: #fff;
    }
    .st-choice-button.wrong {
      background: linear-gradient(135deg, var(--error-glow) 0%, var(--bg-secondary) 100%);
      border-color: var(--error);
      color: var(--error);
      opacity: 0.8;
      box-shadow: 0 0 15px var(--error-glow);
    }
    .st-choice-button.wrong .st-choice-badge {
      background: var(--error);
      color: #fff;
    }

    /* لوحة المساعدات الاستراتيج */
    .st-lifelines-bar {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 20px;
      width: 100%;
    }
    .st-life-action-btn {
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 10px 16px;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }
    .st-life-action-btn:hover:not(:disabled) {
      color: var(--text-main);
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .st-life-action-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      transform: none !important;
    }

    @media (max-width: 480px) {
      .st-lifelines-bar {
        gap: 6px;
      }
      .st-life-action-btn {
        padding: 8px 10px;
        font-size: 0.75rem;
        gap: 4px;
      }
    }

    /* شاشة الاختيار الأولية للوضع */
    .st-mode-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      width: 100%;
      max-width: 500px;
      text-align: center;
      padding: 20px 0;
    }
    .st-mode-btn {
      width: 100%;
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 16px;
      color: var(--text-main);
      font-size: 1.15rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }
    .st-mode-btn:hover {
      border-color: var(--primary);
      transform: translateY(-3px) scale(1.02);
      box-shadow: var(--card-shadow-3d-hover);
    }

    /* منطقة الرسائل الفورية */
    .st-feedback-bar {
      margin-top: 14px;
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      transition: all 0.3s ease;
      min-height: 24px;
    }
    .st-feedback-bar.correct { color: var(--success); }
    .st-feedback-bar.wrong { color: var(--error); }
  `;
  document.head.appendChild(styleEl);
}

// ─── State ───────────────────────────────────────────────────────────────────
let st = {};
const TOTAL_QUESTIONS = 10;

// ==========================================
// 🎨 2. الدخول الرئيسي للعبة
// ==========================================
export function playSpeedTranslate(mount, { vocabPool, onWin, difficulty }) {
  injectStyles();
  
  // خطاف تنظيف اللعبة لإيقاف المؤقتات فور الخروج
  window.eea_game_cleanup = () => {
    if (st.timerInterval) {
      clearInterval(st.timerInterval);
      st.timerInterval = null;
    }
    if (st.nextQuestionTimeout) {
      clearTimeout(st.nextQuestionTimeout);
      st.nextQuestionTimeout = null;
    }
  };

  if (!vocabPool || vocabPool.length < 4) {
    mount.innerHTML = `
      <div class="gc-error" style="font-family:'Tajawal',sans-serif">
        ⚠️ تحتاج إلى 4 كلمات على الأقل في الدروس المحددة للعب Speed Translate.
      </div>`;
    return;
  }
  const diff = difficulty || 'medium';
  showIntroScreen(mount, vocabPool, onWin, diff);
}

// ==========================================
// 🎨 3. شاشة إعداد الوضع والبداية
// ==========================================
function showIntroScreen(mount, pool, onWin, difficulty) {
  const times = { easy: 12, medium: 8, hard: 5 };
  const baseTime = times[difficulty] || 8;

  mount.innerHTML = `
    <div class="st-premium-container" style="font-family:'Tajawal',sans-serif">
      <div style="font-size:3.5rem; margin-bottom:12px; animation: st-timer-pulse 1s infinite alternate;">⚡</div>
      <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:8px;">ترجمة السرعة Speed Translate</h2>
      <p style="color:var(--text-muted); max-width:550px; text-align:center; font-size:0.92rem; line-height:1.6; margin-bottom:20px;">
        أجب عن 10 أسئلة متتالية بأسرع ما يمكن. لديك <strong>${baseTime} ثوانٍ</strong> لكل كلمة. اختر الترجمة الصحيحة بدقة وتجنب فوات الأوان!
      </p>

      <div class="st-mode-panel">
        <button class="st-mode-btn" data-mode="en2ar">
          <span>🇬🇧 إنجليزي ← عربي 🇪🇬</span>
        </button>
        <button class="st-mode-btn" data-mode="ar2en">
          <span>🇪🇬 عربي ← إنجليزي 🇬🇧</span>
        </button>
      </div>

      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:20px;">
        💡 تلميح: النقاط تتضاعف كلما كانت إجابتك أسرع مع استمرار المتتاليات الصحيحة.
      </p>
    </div>
  `;

  mount.querySelectorAll('.st-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startGame(mount, pool, onWin, btn.dataset.mode, difficulty);
    });
  });
}

// ==========================================
// 🎨 4. تهيئة الجولة والمنطق
// ==========================================
function startGame(mount, pool, onWin, mode, difficulty) {
  const times = { easy: 12, medium: 8, hard: 5 };
  const baseTime = times[difficulty] || 8;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const questionsCount = Math.min(TOTAL_QUESTIONS, pool.length);
  const questions = shuffled.slice(0, questionsCount);

  st = {
    mode,
    questions,
    questionsCount,
    pool,
    currentQ: 0,
    score: 0,
    combo: 0,
    correctCount: 0,
    answers: [],
    baseTime,
    timeLeft: baseTime,
    timerInterval: null,
    answered: false,
    onWin,
    difficulty,
    frozenTimeLeft: 0,
    lifelines: {
      half: true,
      freeze: true,
      skip: true
    }
  };

  renderQuestion(mount);
}

// ==========================================
// 🎨 5. رندر السؤال والعداد الدائري
// ==========================================
function renderQuestion(mount) {
  clearInterval(st.timerInterval);
  st.answered = false;
  st.timeLeft = st.baseTime;
  st.frozenTimeLeft = 0;

  if (st.currentQ >= st.questionsCount) {
    showResults(mount);
    return;
  }

  const q = st.questions[st.currentQ];
  const choices = buildChoices(q, st.pool, st.mode);

  const questionText = st.mode === 'en2ar' ? q.english : q.arabic;
  const progress = st.currentQ / st.questionsCount;

  mount.innerHTML = `
    <div class="st-premium-container" id="st-premium-root">
      
      <!-- شريط الـ HUD والتقدم -->
      <div class="st-premium-hud">
        <div class="st-hud-section">
          <span class="st-counter-badge">سؤال ${st.currentQ + 1} / ${st.questionsCount}</span>
          <div class="st-progress-track">
            <div class="st-progress-bar" style="width:${progress * 100}%"></div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:1.15rem; font-weight:700; color:var(--success);">
            نقاطك: <strong id="st-score-hud-val" style="font-size:1.35rem;">${st.score}</strong>
          </div>
          <div style="font-size:1rem; font-weight:800; color:var(--accent); background:var(--accent-glow); padding:4px 10px; border-radius:8px;">
            🔥 x${st.combo + 1}
          </div>
        </div>
      </div>

      <!-- لفافة البردي لتعليمات اللعبة -->
      <div class="hm-parchment-scroll" style="margin-bottom:12px;">
        <div class="hm-parchment-title">📜 المؤقت الدائري الذكي:</div>
        تأمل مؤشر العداد بالأسفل. كلما سارعت بالاختيار، حصلت على درجات إضافية. استخدم المساعدات المتاحة بحكمة!
      </div>

      <!-- لوحة العداد الدائري (Gauge Dashboard) -->
      <div class="st-timer-dashboard">
        <svg class="st-gauge-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6" />
          <!-- عداد النيون التفاعلي -->
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--success)" stroke-width="6"
            stroke-dasharray="251.2"
            stroke-dashoffset="0"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            id="st-gauge-ring"
            style="transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease;" />
          <!-- عقرب العداد -->
          <line x1="50" y1="50" x2="50" y2="18" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round" class="st-gauge-needle" id="st-gauge-needle" />
          <circle cx="50" cy="50" r="5" fill="#f1f5f9" />
        </svg>
        <span class="st-gauge-num" id="st-gauge-number-val">${st.baseTime}</span>
      </div>

      <!-- كرت السؤال الزجاجي -->
      <div class="st-question-card" id="st-question-frame">
        <div class="st-question-lang">${st.mode === 'en2ar' ? '🇬🇧 English Word' : '🇪🇬 الكلمة بالعربية'}</div>
        <div class="st-question-txt ${st.mode === 'ar2en' ? 'ar-txt' : ''}">
          ${questionText}
        </div>
      </div>

      <!-- شبكة أزرار الاختيارات -->
      <div class="st-choices-grid" id="st-choices-box">
        ${choices.map((c, i) => `
          <button class="st-choice-button" data-idx="${i}" id="st-choice-btn-${i}">
            <span class="st-choice-badge">${String.fromCharCode(65 + i)}</span>
            <span class="st-choice-txt ${st.mode === 'en2ar' ? 'ar-txt' : ''}">${c.text}</span>
          </button>
        `).join('')}
      </div>

      <!-- لوحة المساعدات الاستراتيجية ثلاثية الأبعاد -->
      <div class="st-lifelines-bar">
        <button class="st-life-action-btn" id="st-life-5050" ${!st.lifelines.half ? 'disabled' : ''}>
          <span>🌓 50:50</span>
        </button>
        <button class="st-life-action-btn" id="st-life-freeze" ${!st.lifelines.freeze ? 'disabled' : ''}>
          <span>❄️ تجميد العداد</span>
        </button>
        <button class="st-life-action-btn" id="st-life-skip" ${!st.lifelines.skip ? 'disabled' : ''}>
          <span>⏭ تخطي السؤال</span>
        </button>
      </div>

      <!-- رسائل التغذية الراجعة الفورية -->
      <div class="st-feedback-bar" id="st-feedback-bar-val"></div>
    </div>
  `;

  attachChoiceListeners(mount, choices);
  attachLifelineListeners(mount, choices);
  startTimer(mount, choices);
}

// ==========================================
// 🎨 6. بناء مصفوفة الاختيارات
// ==========================================
function buildChoices(correctItem, pool, mode) {
  const correctText = mode === 'en2ar' ? correctItem.arabic : correctItem.english;
  const wrongs = pool
    .filter(v => (mode === 'en2ar' ? v.arabic : v.english) !== correctText)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(v => ({ text: mode === 'en2ar' ? v.arabic : v.english, correct: false }));

  while (wrongs.length < 3) {
    wrongs.push({ text: mode === 'en2ar' ? 'كلمة خاطئة' : 'Incorrect Word', correct: false });
  }

  const all = [{ text: correctText, correct: true }, ...wrongs].sort(() => Math.random() - 0.5);
  return all;
}

// ==========================================
// 🎨 7. إدارة المؤقت الدائري وحركة العقرب
// ==========================================
function startTimer(mount, choices) {
  createAudioCtx();
  const ring = mount.querySelector('#st-gauge-ring');
  const needle = mount.querySelector('#st-gauge-needle');
  const numVal = mount.querySelector('#st-gauge-number-val');

  // دورة كاملة للمؤشر تعادل 360 درجة، سنبدأ من -120 درجة إلى 120 درجة مثلاً
  st.timerInterval = setInterval(() => {
    if (st.frozenTimeLeft > 0) {
      st.frozenTimeLeft--;
      if (numVal) {
        numVal.textContent = `❄️ ${st.frozenTimeLeft}`;
        numVal.className = 'st-gauge-num frozen';
      }
      if (st.frozenTimeLeft === 0) {
        if (ring) ring.style.stroke = 'var(--success)';
        if (numVal) {
          numVal.textContent = st.timeLeft;
          numVal.className = 'st-gauge-num';
        }
      }
      return;
    }

    st.timeLeft--;
    if (numVal) numVal.textContent = st.timeLeft;

    // تحديث نسبة الدائرة (251.2 هي محيط الدائرة r=40)
    const frac = st.timeLeft / st.baseTime;
    if (ring) {
      ring.style.strokeDashoffset = 251.2 * (1 - frac);
    }

    // دوران عقرب القياس
    // 0٪ وقت تعني دوران كامل، سنربطها ديناميكياً
    const angle = -120 + (1 - frac) * 240;
    if (needle) {
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // التحذير اللوني للمؤقت
    if (st.timeLeft <= 3) {
      if (ring) ring.style.stroke = 'var(--error)';
      if (numVal) numVal.className = 'st-gauge-num danger';
      playCountdown();
    } else if (st.timeLeft <= 5) {
      if (ring) ring.style.stroke = 'var(--accent)';
    }

    if (st.timeLeft <= 0) {
      clearInterval(st.timerInterval);
      if (!st.answered) {
        playTimeUp();
        handleAnswerSubmit(mount, -1, choices);
      }
    }
  }, 1000);
}

// ==========================================
// 🎨 8. أحداث النقر واختيار الإجابة
// ==========================================
function attachChoiceListeners(mount, choices) {
  mount.querySelectorAll('.st-choice-button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (st.answered) return;
      handleAnswerSubmit(mount, parseInt(btn.dataset.idx), choices);
    });
  });
}

function attachLifelineListeners(mount, choices) {
  const halfBtn = mount.querySelector('#st-life-5050');
  const freezeBtn = mount.querySelector('#st-life-freeze');
  const skipBtn = mount.querySelector('#st-life-skip');

  // المساعدة 1: حذف خيارين خاطئين
  if (halfBtn) {
    halfBtn.addEventListener('click', () => {
      if (!st.lifelines.half || st.answered) return;
      st.lifelines.half = false;
      halfBtn.disabled = true;

      let hiddenCount = 0;
      choices.forEach((c, idx) => {
        if (!c.correct && hiddenCount < 2) {
          const btn = mount.querySelector(`#st-choice-btn-${idx}`);
          if (btn) {
            btn.style.opacity = '0.15';
            btn.disabled = true;
          }
          hiddenCount++;
        }
      });
      playTone(600, 0.1, 'sine', 0.2);
    });
  }

  // المساعدة 2: تجميد المؤقت لمدة 5 ثوانٍ
  if (freezeBtn) {
    freezeBtn.addEventListener('click', () => {
      if (!st.lifelines.freeze || st.answered) return;
      st.lifelines.freeze = false;
      freezeBtn.disabled = true;

      st.frozenTimeLeft = 5;
      const ring = mount.querySelector('#st-gauge-ring');
      if (ring) ring.style.stroke = '#0ea5e9';
      playTone(880, 0.15, 'sine', 0.25);
    });
  }

  // المساعدة 3: تخطي السؤال مباشرة
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!st.lifelines.skip || st.answered) return;
      st.lifelines.skip = false;
      skipBtn.disabled = true;

      clearInterval(st.timerInterval);
      st.answered = true;
      showFeedbackPanel(mount, `⏭ تم تخطي السؤال بنجاح`, 'correct');
      playTone(400, 0.15, 'triangle', 0.2);

      st.nextQuestionTimeout = setTimeout(() => {
        st.currentQ++;
        renderQuestion(mount);
      }, 1100);
    });
  }
}

// ==========================================
// 🎨 9. التحقق من الإجابة واحتساب النقاط
// ==========================================
function handleAnswerSubmit(mount, selectedIdx, choices) {
  clearInterval(st.timerInterval);
  if (st.answered) return;
  st.answered = true;

  const isCorrect = selectedIdx >= 0 && choices[selectedIdx].correct;
  const correctIdx = choices.findIndex(c => c.correct);

  // تحديث شكل الأزرار لعرض الحل
  choices.forEach((c, i) => {
    const btn = mount.querySelector(`#st-choice-btn-${i}`);
    if (!btn) return;
    if (c.correct) btn.classList.add('correct');
    else if (i === selectedIdx && !c.correct) btn.classList.add('wrong');
    btn.disabled = true;
  });

  const root = mount.querySelector('#st-premium-root');

  if (isCorrect) {
    playTone(523.25, 0.1, 'sine', 0.3); // C5
    st.combo++;
    st.correctCount++;
    const timeBonus = Math.floor(st.timeLeft * 12);
    const comboBonus = Math.min(4, st.combo) * 25;
    const gained = 60 + timeBonus + comboBonus;
    st.score += gained;

    if (root) root.classList.add('st-flash-correct');
    showFeedbackPanel(mount, `✅ إجابة صحيحة! +${gained} نقطة`, 'correct');
  } else {
    playFailBuzz();
    st.combo = 0;
    if (root) root.classList.add('st-flash-wrong');
    const answerText = choices[correctIdx] ? choices[correctIdx].text : '';
    showFeedbackPanel(mount, `❌ ${selectedIdx === -1 ? 'انتهى الوقت!' : 'خاطئ!'} الإجابة الصحيحة: ${answerText}`, 'wrong');
  }

  st.answers.push({ correct: isCorrect, timeLeft: st.timeLeft });

  // تنظيف تأثير الفلاش بعد الجولة
  st.nextQuestionTimeout = setTimeout(() => {
    if (root) {
      root.classList.remove('st-flash-correct', 'st-flash-wrong');
    }
    st.currentQ++;
    renderQuestion(mount);
  }, 1600);
}

function showFeedbackPanel(mount, msg, cls) {
  const fb = mount.querySelector('#st-feedback-bar-val');
  if (fb) {
    fb.textContent = msg;
    fb.className = `st-feedback-bar ${cls}`;
  }
  const scoreVal = mount.querySelector('#st-score-hud-val');
  if (scoreVal) scoreVal.textContent = st.score;
}

// ==========================================
// 🎨 10. شاشة النتيجة الإجمالية للفوز
// ==========================================
function showResults(mount) {
  playSuccessChime();
  if (st.correctCount >= Math.floor(st.questionsCount * 0.8)) {
    spawnConfetti(mount);
  }
  st.onWin(st.score);

  const accuracy = Math.round((st.correctCount / st.questionsCount) * 100);
  const grade = accuracy >= 90 ? '🏆 S' : accuracy >= 75 ? '⭐ A' : accuracy >= 60 ? '✨ B' : accuracy >= 40 ? '📈 C' : '💀 D';
  
  const getGradeColor = (g) => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      const gc = { '🏆 S': 'var(--accent)', '⭐ A': 'var(--success)', '✨ B': 'var(--primary)', '📈 C': '#0284c7', '💀 D': 'var(--error)' };
      return gc[g] || 'var(--text-main)';
    } else {
      const gc = { '🏆 S': '#fbbf24', '⭐ A': '#34d399', '✨ B': '#818cf8', '📈 C': '#38bdf8', '💀 D': '#f87171' };
      return gc[g] || '#fff';
    }
  };
  const gradeColor = getGradeColor(grade);

  mount.innerHTML = `
    <div class="st-premium-container" style="font-family:'Tajawal',sans-serif">
      <div style="font-size:3rem; color:${gradeColor}; font-weight:800; border:4px solid ${gradeColor}; border-radius:50%; width:100px; height:100px; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
        ${grade.split(' ')[0]}
      </div>
      <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:6px; color:var(--text-main);">اكتمل التحدي! Complete</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">التقدير اللغوي النهائي للجولة: <strong>${grade}</strong></p>

      <div class="hm-res-stats" style="grid-template-columns: repeat(2, 1fr); width:100%; max-width:600px;">
        <div class="hm-stat-box">
          <label>النقاط النهائية</label>
          <span>${st.score}</span>
        </div>
        <div class="hm-stat-box">
          <label>إجابات صحيحة</label>
          <span>${st.correctCount} / ${st.questionsCount}</span>
        </div>
        <div class="hm-stat-box">
          <label>نسبة الدقة</label>
          <span style="color:var(--primary);">${accuracy}%</span>
        </div>
        <div class="hm-stat-box">
          <label>وضع الترجمة</label>
          <span style="font-size:1.05rem; color:var(--accent);">${st.mode === 'en2ar' ? 'EN → AR' : 'AR → EN'}</span>
        </div>
      </div>

      <!-- شريط الدوائر الملونة لسجل الإجابات -->
      <div style="display:flex; gap:8px; margin-bottom:24px; justify-content:center;">
        ${st.answers.map(a => `
          <span style="width:14px; height:14px; border-radius:50%; background:${a.correct ? 'var(--success)' : 'var(--error)'}; display:inline-block; box-shadow:0 0 6px ${a.correct ? 'var(--success)' : 'var(--error)'};"></span>
        `).join('')}
      </div>

      <div class="hm-action-row">
        <button class="btn btn-primary" id="st-replay-btn" style="padding:10px 24px; font-weight:700;">
          تحدي جديد ⚡
        </button>
        <button class="btn btn-secondary" id="st-change-mode-btn" style="padding:10px 18px;">
          تغيير الاتجاه
        </button>
        <button class="btn btn-secondary" id="st-hub-btn" style="padding:10px 18px;">
          رجوع للألعاب
        </button>
      </div>
    </div>
  `;

  mount.querySelector('#st-replay-btn').addEventListener('click', () => {
    startGame(mount, st.pool, st.onWin, st.mode, st.difficulty);
  });
  mount.querySelector('#st-change-mode-btn').addEventListener('click', () => {
    showIntroScreen(mount, st.pool, st.onWin, st.difficulty);
  });
  mount.querySelector('#st-hub-btn').addEventListener('click', () => {
    document.querySelector('#gc-back-btn')?.click();
  });
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  const container = mount.querySelector('.st-premium-container') || mount;
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
}
