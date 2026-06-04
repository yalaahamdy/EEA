/**
 * Sentence Builder Game — Premium Edition
 * Egyptian English Academy
 * Features: Marble slabs with metallic frames, elastic snap animations, live dynamic grammar lines connecting parts of speech, handwritten parchment ledger tutor, full dashboard.
 */

import { createAudioCtx, playClick, playSuccessChime, playFailBuzz, playTone } from './gameAudio.js';

const ROUNDS = 6;

// مصفوفة الجمل الاحتياطية المفصلة لشرح البنية النحوية
const FALLBACK_SENTENCES = [
  { 
    sentence: 'She is reading a very good book', 
    tip: 'الصفة (good) تسبق الاسم الموصوف (book) دائماً في اللغة الإنجليزية، ويسبقها الحال (very) لتقوية المعنى.' 
  },
  { 
    sentence: 'I would like to order some coffee', 
    tip: 'التعبير (would like) طريقة مهذبة للغاية لطلب الأشياء في المطاعم والمقاهي وتعني (أود أن) ويتبعها الفعل بالمصدر.' 
  },
  { 
    sentence: 'The weather today is quite beautiful', 
    tip: 'نضع الفعل المساعد (is) قبل الصفة (beautiful) لربط الجملة الاسمية، ويستخدم الظرف (quite) لتعديل درجة الصفة.' 
  },
  { 
    sentence: 'Can you help me find the library', 
    tip: 'السؤال بـ (Can you) هو الأسلوب الشائع لطلب المساعدة من الآخرين بطريقة ودية، ويتبعه الفعل بالمصدر مجرداً.' 
  },
  { 
    sentence: 'He speaks English very fluently', 
    tip: 'الحال (fluently) ينتهي بـ ly ويأتي بعد الفعل والمفعول ليصف طريقة وأسلوب التحدث بطلاقة.' 
  },
  { 
    sentence: 'We are going to the market tomorrow', 
    tip: 'التركيب (are going to) يستخدم للتعبير عن ترتيبات وخطط مستقبلية مؤكدة بناء على نوايا مسبقة.' 
  },
  { 
    sentence: 'They finished their homework before dinner', 
    tip: 'الفعل (finished) في الماضي البسيط يعبر عن حدث انتهى تماماً في الماضي، ويتبعه حرف الجر الزمني (before).' 
  },
  { 
    sentence: 'My sister works at a big hospital', 
    tip: 'حرف الجر (at) يستخدم للتعبير عن التواجد داخل مؤسسة أو مكان عمل محدد، وتسبق الصفة (big) الاسم الموصوف (hospital).' 
  },
  {
    sentence: 'You must study hard for the exams',
    tip: 'الفعل المساعد (must) يعبر عن الالتزام أو الضرورة القوية، ويأتي بعده الفعل دائماً في المصدر دون إضافات.'
  },
  {
    sentence: 'The train will arrive at five oclock',
    tip: 'نستخدم (will) للتنبؤ أو التعبير عن أحداث مستقبلية، ونستخدم حرف الجر (at) دائماً لتحديد الوقت والساعة.'
  },
  {
    sentence: 'This smartphone is better than my old phone',
    tip: 'في المقارنة بين شيئين، نستخدم صيغة الصفة المقارنة (better) متبوعة بـ (than) لإظهار التفضيل.'
  },
  {
    sentence: 'If it rains we will stay home',
    tip: 'في الحالة الشرطية الأولى (First Conditional)، نستخدم مضارع بسيط في شق الشرط ومستقبل بـ (will) في جواب الشرط.'
  },
  {
    sentence: 'Learning English opens many great opportunities',
    tip: 'الفعل المنتهي بـ ing هنا (Learning) يعمل كاسم (Gerund) ويعتبر فاعل الجملة، والصفة (great) تسبق الموصوف.'
  },
  {
    sentence: 'He is interested in learning new skills',
    tip: 'التعبير (interested in) يأتي بعده دائماً اسم أو فعل منتهي بـ (ing) للتعبير عن الهوايات والاهتمامات.'
  },
  {
    sentence: 'She prefers tea instead of hot coffee',
    tip: 'نستخدم التعبير (instead of) للحديث عن البدائل وتعني (بدلاً من)، ويتبعها الاسم مباشرة.'
  },
  {
    sentence: 'We should protect our environment from pollution',
    tip: 'الفعل المساعد (should) يفيد تقديم النصيحة الأخلاقية أو العامة، ويتبعه المصدر مجرداً من أي لواحق.'
  },
  {
    sentence: 'The children are playing happily in the garden',
    tip: 'صيغة الجمع للاسم الشاذ (children) لا تأخذ حرف s، والحال (happily) يصف طريقة لعب الأطفال بمرح وسعادة.'
  },
  {
    sentence: 'Could you repeat that sentence more slowly please',
    tip: 'الطلب بـ (Could you) يعتبر من أكثر الأساليب أدباً ولباقة في اللغة الإنجليزية للمحادثات الرسمية واليومية.'
  },
  {
    sentence: 'He decided to buy a new laptop for work',
    tip: 'الفعل (decide) يتبعه دائماً حرف الجر (to) ثم الفعل في المصدر (decide to do) للتعبير عن اتخاذ القرار.'
  },
  {
    sentence: 'They went to the museum to see the ancient statues',
    tip: 'نستخدم صيغة المصدر للغرض (Infinitive of Purpose) للتعبير عن سبب الذهاب أو القيام بشيء وتعني (لكي).'
  }
];

// ==========================================
// 🎨 1. الستايلات البصرية المدمجة ديناميكياً (CSS-in-JS)
// ==========================================
const STYLE_ID = 'eea-sentence-builder-premium-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    .sb-premium-container {
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

    /* شريط المعلومات HUD */
    .sb-premium-hud {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    @media (max-width: 600px) {
      .sb-premium-hud {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
    }
    .sb-hud-box {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .sb-hud-box:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
    }
    .sb-hud-box label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .sb-hud-box span {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }
    .sb-hud-box span.streak {
      color: var(--accent);
      text-shadow: 0 0 8px var(--accent-glow);
    }
    .sb-hud-box span.timer {
      color: var(--error);
      text-shadow: 0 0 8px var(--error-glow);
    }

    /* كتل الكلمات كقطع رخامية مصقولة مع إطارات معدنية */
    .sb-answer-workspace {
      background: var(--bg-primary);
      border: 2px dashed var(--border-color);
      border-radius: 20px;
      padding: 28px;
      width: 100%;
      min-height: 110px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      box-shadow: inset 0 4px 12px rgba(0,0,0,0.1);
      position: relative;
    }
    .sb-answer-label {
      position: absolute;
      top: 6px; left: 16px;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* أزرار الرخام المصقول */
    .sb-marble-tile {
      background: var(--surface-gradient), var(--bg-tertiary);
      border: 2px solid var(--border-color);
      color: var(--text-main);
      font-weight: 800;
      font-size: 1.08rem;
      padding: 11px 20px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 0 var(--shadow-solid-secondary),
                  0 6px 12px rgba(0,0,0,0.15);
      transition: all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .sb-marble-tile:hover {
      transform: translateY(-1px);
    }
    .sb-marble-tile:active, .sb-marble-tile.active-snap {
      transform: translateY(3px);
      box-shadow: 0 1px 0 var(--shadow-solid-secondary),
                  0 2px 4px rgba(0,0,0,0.1);
    }
    .sb-marble-tile.used {
      opacity: 0.22;
      pointer-events: none;
      transform: translateY(3px);
      box-shadow: none;
    }

    /* فتحات استقبال الكلمات في الأسفل */
    .sb-pool-workspace {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 14px;
      width: 100%;
      min-height: 75px;
      margin-bottom: 24px;
      padding: 8px;
    }

    /* مخطط الجملة القواعدي البصري (تلوين الحواف لتوضيح القواعد) */
    .sb-marble-tile.pos-noun {
      border-color: var(--primary);
      background: var(--primary-glow);
      color: var(--text-main);
      box-shadow: 0 4px 0 var(--shadow-solid-primary), 0 6px 12px var(--primary-glow);
    }
    .sb-marble-tile.pos-verb {
      border-color: var(--success);
      background: var(--success-glow);
      color: var(--success);
      box-shadow: 0 4px 0 var(--shadow-solid-success), 0 6px 12px var(--success-glow);
    }
    .sb-marble-tile.pos-adj {
      border-color: var(--accent);
      background: var(--accent-glow);
      color: var(--accent);
      box-shadow: 0 4px 0 var(--shadow-solid-accent), 0 6px 12px var(--accent-glow);
    }
    .sb-marble-tile.pos-prep {
      border-color: var(--secondary);
      background: var(--secondary-glow);
      color: var(--secondary);
      box-shadow: 0 4px 0 var(--shadow-solid-secondary), 0 6px 12px var(--secondary-glow);
    }

    @media (max-width: 500px) {
      .sb-marble-tile {
        font-size: 0.9rem;
        padding: 8px 14px;
        border-radius: 8px;
        box-shadow: 0 3px 0 var(--shadow-solid-secondary), 0 4px 8px rgba(0,0,0,0.15);
      }
      .sb-marble-tile:active, .sb-marble-tile.active-snap {
        transform: translateY(2px);
        box-shadow: 0 1px 0 var(--shadow-solid-secondary), 0 1px 2px rgba(0,0,0,0.1);
      }
      .sb-marble-tile.pos-noun {
        box-shadow: 0 3px 0 var(--shadow-solid-primary), 0 4px 6px var(--primary-glow);
      }
      .sb-marble-tile.pos-verb {
        box-shadow: 0 3px 0 var(--shadow-solid-success), 0 4px 6px var(--success-glow);
      }
      .sb-marble-tile.pos-adj {
        box-shadow: 0 3px 0 var(--shadow-solid-accent), 0 4px 6px var(--accent-glow);
      }
      .sb-marble-tile.pos-prep {
        box-shadow: 0 3px 0 var(--shadow-solid-secondary), 0 4px 6px var(--secondary-glow);
      }
      .sb-answer-workspace {
        padding: 16px 12px;
        min-height: 85px;
        gap: 8px;
      }
      .sb-pool-workspace {
        gap: 8px;
        min-height: 60px;
        margin-bottom: 16px;
      }
    }

    /* دفتر الملاحظات الورقي لتعلم التلميحات */
    .sb-ledger-notebook {
      background: #fafaf9;
      border-left: 10px solid #fbbf24;
      border-radius: 12px;
      padding: 18px;
      width: 100%;
      max-width: 720px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15), inset 0 0 10px rgba(0,0,0,0.02);
      color: #292524;
      margin-bottom: 20px;
      font-size: 0.94rem;
      line-height: 1.6;
      text-align: right;
      direction: rtl;
    }
    .sb-ledger-header {
      font-weight: 800;
      color: #b45309;
      border-bottom: 1px dashed #d6d3d1;
      padding-bottom: 6px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* واجهة الإعداد وبدء الجمل */
    .sb-start-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 520px;
      text-align: center;
      padding: 30px 10px;
    }
    .sb-start-btn {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 16px;
      padding: 16px;
      color: #fff;
      font-size: 1.15rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .sb-start-btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
    }

    /* مؤقت التقدم الأفقي */
    .sb-timer-track-bar {
      width: 100%;
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
      position: relative;
    }
    .sb-timer-fill-bar {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, var(--success), var(--accent), var(--error));
      background-size: 200% 100%;
      transition: width 1s linear;
    }

    /* قوالب الإجراءات */
    .sb-actions-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      width: 100%;
      max-width: 600px;
      margin-top: 10px;
    }
    .sb-control-btn {
      flex-grow: 1;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid var(--border-color);
      transition: all 0.25s ease;
    }
    .sb-btn-clear {
      background: var(--surface-gradient), var(--bg-tertiary);
      color: var(--text-muted);
    }
    .sb-btn-clear:hover {
      color: var(--text-main);
      border-color: var(--primary);
    }
    .sb-btn-submit {
      background: linear-gradient(135deg, var(--success) 0%, var(--shadow-solid-success) 100%);
      color: #fff;
      box-shadow: 0 4px 12px var(--success-glow);
    }
    .sb-btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    /* التغذية الراجعة والومضات */
    .sb-notify-bar {
      margin-top: 18px;
      font-size: 1.05rem;
      font-weight: 700;
      text-align: center;
      min-height: 24px;
      transition: all 0.3s ease;
    }
    .sb-notify-bar.correct { color: var(--success); }
    .sb-notify-bar.wrong { color: var(--error); }
  `;
  document.head.appendChild(styleEl);
}

// ─── State ───────────────────────────────────────────────────────────────────
let sb = {};

// دالة لتصنيف الكلمات وتحديد قواعد أجزاء الكلام (Parts of Speech)
function getPOSClass(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  
  const verbs = [
    'is', 'are', 'am', 'was', 'were', 'reading', 'going', 'finished', 
    'works', 'order', 'speaks', 'help', 'find', 'study', 'arrive', 
    'will', 'rains', 'opens', 'learning', 'prefers', 'stay'
  ];
  
  const adjs = [
    'good', 'beautiful', 'quite', 'big', 'fluently', 'very', 'some', 
    'their', 'my', 'hard', 'five', 'better', 'many', 'great', 
    'new', 'hot', 'old', 'this', 'smart'
  ];
  
  const preps = [
    'to', 'at', 'before', 'tomorrow', 'the', 'a', 'instead', 'of', 
    'for', 'in', 'if', 'on', 'under', 'next', 'with', 'by'
  ];

  if (verbs.includes(w)) return 'pos-verb';
  if (adjs.includes(w)) return 'pos-adj';
  if (preps.includes(w)) return 'pos-prep';
  return 'pos-noun'; // فاعل أو مفعول أو غيره
}

// دالة لإنتاج تلميحات قواعدية ذكية تلقائياً
function getGrammarTip(sentence) {
  const s = sentence.toLowerCase();
  if (s.includes('would like')) {
    return 'التعبير (would like) طريقة مهذبة للغاية لطلب الأشياء وتعني (أود أن) ويتبعها الفعل بالمصدر.';
  }
  if (s.includes('going to')) {
    return 'التركيب (be going to) يستخدم للتعبير عن الترتيبات والمستقبل القريب بناء على نية مسبقة.';
  }
  if (s.includes('can you') || s.includes('could you')) {
    return 'الطلب بـ (Can you) أو (Could you) هو الأسلوب المؤدب والشائع لطلب المساعدة من الآخرين.';
  }
  if (s.includes('interested in')) {
    return 'التعبير (interested in) يعني (مهتم بـ) ويأتي بعده دائماً اسم أو فعل منتهي بـ (ing).';
  }
  if (s.includes('should')) {
    return 'الفعل المساعد (should) يستخدم لتقديم النصيحة أو التعبير عن الرأي ويتبعه المصدر مجرداً.';
  }
  if (s.includes('must')) {
    return 'الفعل المساعد (must) يعبر عن الالتزام أو الضرورة القوية، ويأتي بعده الفعل دائماً في المصدر.';
  }
  if (s.includes('will')) {
    return 'نستخدم (will) للتعبير عن أحداث مستقبلية أو قرارات سريعة، ويتبعها المصدر مجرداً.';
  }
  if (s.includes('better than')) {
    return 'في المقارنة بين شيئين، نستخدم صيغة الصفة المقارنة (better) متبوعة بـ (than) لإظهار التفضيل.';
  }
  return 'تأمل ترتيب الكلمات جيداً: نبدأ بالفاعل (Subject) ثم الفعل (Verb) ثم المفعول (Object) أو باقي تفاصيل الجملة.';
}

// ==========================================
// 🎨 2. الدخول الرئيسي للعبة
// ==========================================
export function playSentenceBuilder(mount, { sentencePool, onWin, difficulty }) {
  injectStyles();
  
  // خطاف تنظيف اللعبة لإيقاف المؤقتات ومستمعي لوحة المفاتيح فور الخروج
  window.eea_game_cleanup = () => {
    if (sb.timerInterval) {
      clearInterval(sb.timerInterval);
      sb.timerInterval = null;
    }
    if (sb.roundTimeout) {
      clearTimeout(sb.roundTimeout);
      sb.roundTimeout = null;
    }
  };

  const diff = difficulty || 'medium';
  let pool = (sentencePool || []).filter(s => {
    const words = s.sentence.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    return words.length >= 4 && words.length <= 11;
  });

  if (pool.length < ROUNDS) {
    pool = [...pool, ...FALLBACK_SENTENCES];
  }
  
  pool.forEach(item => {
    if (!item.tip) {
      item.tip = getGrammarTip(item.sentence);
    }
  });

  pool = pool.sort(() => Math.random() - 0.5);

  showIntroScreen(mount, pool, onWin, diff);
}

// ==========================================
// 🎨 3. شاشة الترحيب والإعداد
// ==========================================
function showIntroScreen(mount, pool, onWin, difficulty) {
  mount.innerHTML = `
    <div class="sb-premium-container" style="font-family:'Tajawal', sans-serif;">
      <div class="sb-start-box">
        <div style="font-size:3.5rem; margin-bottom:12px; animation: heartbeat 1.5s infinite alternate;">🧩</div>
        <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:8px;">تركيب الجمل التفاعلي Sentence Builder</h2>
        <p style="color:var(--text-muted); font-size:0.92rem; line-height:1.6; margin-bottom:24px;">
          رتب كتل الرخام المصقول لتكوين جمل إنجليزية مفيدة. سيتم تلوين الكتل ديناميكياً لتوضيح القواعد النحوية، مما يسهل عليك الفهم البصري لتركيب الفاعل والفعل والظرف والاسم.
        </p>

        <button class="sb-start-btn" id="sb-start-action-btn">ابدأ بناء الجمل الآن ⚡</button>
      </div>
    </div>
  `;

  mount.querySelector('#sb-start-action-btn').addEventListener('click', () => {
    startGame(mount, pool, onWin, difficulty);
  });
}

function startGame(mount, pool, onWin, difficulty) {
  const times = { easy: 45, medium: 30, hard: 18 };
  const timePerSentence = times[difficulty] || 30;

  sb = {
    pool,
    rounds: pool.slice(0, ROUNDS),
    round: 0,
    score: 0,
    streak: 0,
    onWin,
    timePerSentence,
    timeLeft: timePerSentence,
    timerInterval: null,
    answered: false,
    difficulty,
  };
  nextRound(mount);
}

// ==========================================
// 🎨 4. الجولة التالية وإدارة التبعثر
// ==========================================
function nextRound(mount) {
  clearInterval(sb.timerInterval);
  if (sb.round >= ROUNDS) {
    showResults(mount);
    return;
  }

  const item = sb.rounds[sb.round];
  const cleaned = item.sentence.replace(/[^a-zA-Z\s']/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const shuffled = [...words].sort(() => Math.random() - 0.5);

  let attempts = 0;
  let sh = shuffled;
  while (sh.join(' ') === words.join(' ') && attempts < 10) {
    sh = [...words].sort(() => Math.random() - 0.5);
    attempts++;
  }

  sb.current = { words, shuffled: sh, answer: [], tip: item.tip, sentence: item.sentence };
  sb.answered = false;
  sb.timeLeft = sb.timePerSentence;

  renderRoundLayout(mount);
  startTimer(mount);
}

// ==========================================
// 🎨 5. بناء واجهة اللعب للتركيب
// ==========================================
function renderRoundLayout(mount) {
  const progress = (sb.round / ROUNDS) * 100;
  const isEasy = sb.difficulty === 'easy';

  mount.innerHTML = `
    <div class="sb-premium-container" id="sb-premium-root">
      
      <!-- شريط الـ HUD المالي -->
      <div class="sb-premium-hud">
        <div class="sb-hud-box">
          <label>الجملة الحالية</label>
          <span>${sb.round + 1} / ${ROUNDS}</span>
        </div>
        <div class="sb-hud-box">
          <label>النقاط الكلية</label>
          <span id="sb-hud-score-val">${sb.score}</span>
        </div>
        <div class="sb-hud-box">
          <label>المتتالي 🔥</label>
          <span class="streak" id="sb-hud-streak-val">${sb.streak}</span>
        </div>
        <div class="sb-hud-box">
          <label>الوقت المتبقي</label>
          <span class="timer" id="sb-hud-timer-val">${sb.timeLeft}s</span>
        </div>
      </div>

      <!-- مؤقت شريط التقدم الفخم -->
      <div class="sb-timer-track-bar">
        <div class="sb-timer-fill-bar" id="sb-timer-fill-el"></div>
      </div>

      <!-- لفافة البردي لتعليمات اللعبة -->
      <div class="hm-parchment-scroll" style="margin-bottom:16px;">
        <div class="hm-parchment-title">📜 قواعد بناء الجمل:</div>
        انقر على كتل الكلمات المبعثرة بالترتيب الصحيح لتكوين الجملة الإنجليزية المطلوبة. الترتيب القواعدي مهم للصمود اللغوي!
      </div>

      <!-- دفتر الملاحظات للمساعدة القواعدية المستمرة (Easy Mode) -->
      ${(isEasy && sb.current.tip) ? `
        <div class="sb-ledger-notebook">
          <div class="sb-ledger-header">💡 مساعدة قواعدية ذكية:</div>
          <div>${sb.current.tip}</div>
        </div>
      ` : ''}

      <!-- مساحة عمل الإجابة (الكتل المستقرة) -->
      <div class="sb-answer-workspace" id="sb-answer-box">
        <div class="sb-answer-label">جملتك الجارية:</div>
        ${sb.current.answer.length === 0
          ? '<span style="color:var(--text-muted); font-size:0.95rem;">انقر على كتل الرخام لبناء الجملة...</span>'
          : sb.current.answer.map((w, i) => {
              const posCls = getPOSClass(w);
              return `
                <button class="sb-marble-tile ${posCls}" data-answer-idx="${i}">
                  <span>${w}</span>
                  <span style="font-size:0.8rem; opacity:0.5; margin-right:6px;">✕</span>
                </button>
              `;
            }).join('')
        }
      </div>

      <!-- مساحة عمل كتل الرخام المبعثرة -->
      <div class="sb-pool-workspace" id="sb-pool-box">
        ${sb.current.shuffled.map((w, i) => {
          const used = sb.current.answer.filter(a => a === w).length >
                       sb.current.shuffled.slice(0, i).filter(x => x === w).length;
          const posCls = getPOSClass(w);
          return `
            <button class="sb-marble-tile ${posCls} ${used ? 'used' : ''}" data-pool-idx="${i}" data-word="${w}" ${used ? 'disabled' : ''}>
              ${w}
            </button>
          `;
        }).join('')}
      </div>

      <!-- لوحة التحكم الإدارية -->
      <div class="sb-actions-row">
        <button class="sb-control-btn sb-btn-clear" id="sb-clear-action-btn">⌫ مسح الجملة</button>
        <button class="sb-control-btn sb-btn-submit" id="sb-submit-action-btn">✓ تحقق من الجملة</button>
      </div>

      <div class="sb-notify-bar" id="sb-notify-bar-val"></div>
    </div>
  `;

  attachSBListeners(mount);
  updateTimerVisual();
}

// ==========================================
// 🎨 6. مستمعي الأحداث والربط
// ==========================================
function attachSBListeners(mount) {
  // اختيار كتلة كلمة من الأسفل
  mount.querySelectorAll('.sb-pool-workspace .sb-marble-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered || btn.disabled) return;
      selectWordTile(btn.dataset.word, parseInt(btn.dataset.poolIdx), mount);
    });
  });

  // إلغاء اختيار كتلة كلمة من الأعلى
  mount.querySelectorAll('.sb-answer-workspace .sb-marble-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered) return;
      deselectWordTile(parseInt(btn.dataset.answerIdx), mount);
    });
  });

  mount.querySelector('#sb-clear-action-btn').addEventListener('click', () => {
    sb.current.answer = [];
    renderRoundLayout(mount);
  });

  mount.querySelector('#sb-submit-action-btn').addEventListener('click', () => submitAnswerSentence(mount));
}

// ==========================================
// 🎨 7. إدارة بناء كتل الجمل والـ Layout
// ==========================================
function selectWordTile(word, poolIdx, mount) {
  createAudioCtx();
  playClick();

  sb.current.answer.push(word);
  
  // إعادة رندر واجهة العمل بشكل جزئي ومرن
  refreshAnswerWorkspace(mount);
  refreshPoolWorkspace(mount);

  // إرسال تلقائي عند تركيب جميع الكلمات
  if (sb.current.answer.length === sb.current.words.length) {
    setTimeout(() => submitAnswerSentence(mount), 250);
  }
}

function deselectWordTile(answerIdx, mount) {
  sb.current.answer.splice(answerIdx, 1);
  refreshAnswerWorkspace(mount);
  refreshPoolWorkspace(mount);
}

function refreshAnswerWorkspace(mount) {
  const box = mount.querySelector('#sb-answer-box');
  if (!box) return;

  if (sb.current.answer.length === 0) {
    box.innerHTML = `
      <div class="sb-answer-label">جملتك الجارية:</div>
      <span style="color:var(--text-muted); font-size:0.95rem;">انقر على كتل الرخام لبناء الجملة...</span>
    `;
    return;
  }

  box.innerHTML = `
    <div class="sb-answer-label">جملتك الجارية:</div>
    ${sb.current.answer.map((w, i) => {
      const posCls = getPOSClass(w);
      return `
        <button class="sb-marble-tile ${posCls}" data-answer-idx="${i}">
          <span>${w}</span>
          <span style="font-size:0.8rem; opacity:0.5; margin-right:6px;">✕</span>
        </button>
      `;
    }).join('')}
  `;

  // إعادة ربط أحداث النقر للفتح الإلغائية
  box.querySelectorAll('.sb-marble-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sb.answered) return;
      deselectWordTile(parseInt(btn.dataset.answerIdx), mount);
    });
  });
}

function refreshPoolWorkspace(mount) {
  const box = mount.querySelector('#sb-pool-box');
  if (!box) return;

  const usedCounts = {};
  sb.current.answer.forEach(w => {
    usedCounts[w] = (usedCounts[w] || 0) + 1;
  });

  sb.current.shuffled.forEach((w, i) => {
    const tile = box.querySelector(`[data-pool-idx="${i}"]`);
    if (!tile) return;

    const totalInShuffled = sb.current.shuffled.slice(0, i + 1).filter(x => x === w).length;
    const used = (usedCounts[w] || 0) >= totalInShuffled;

    tile.disabled = used;
    if (used) tile.classList.add('used');
    else tile.classList.remove('used');
  });
}

// ==========================================
// 🎨 8. إدارة المؤقت التفاعلي
// ==========================================
function startTimer(mount) {
  clearInterval(sb.timerInterval);
  sb.timerInterval = setInterval(() => {
    sb.timeLeft--;
    
    const valEl = mount.querySelector('#sb-hud-timer-val');
    if (valEl) valEl.textContent = `${sb.timeLeft}s`;

    updateTimerVisual();

    if (sb.timeLeft <= 0 && !sb.answered) {
      clearInterval(sb.timerInterval);
      sb.answered = true;
      sb.streak = 0;
      playFailBuzz();

      showFeedbackSentence(mount, `⏱ انتهى الوقت! الحل: "${sb.current.words.join(' ')}" \n ${sb.current.tip}`, 'wrong');
      sb.round++;
      sb.roundTimeout = setTimeout(() => nextRound(mount), 3800);
    }
  }, 1000);
}

function updateTimerVisual() {
  const el = document.getElementById('sb-timer-fill-el');
  if (el) {
    const percent = (sb.timeLeft / sb.timePerSentence) * 100;
    el.style.width = `${percent}%`;
  }
}

// ==========================================
// 🎨 9. مطابقة الحل وإجراء التعليقات القواعدية
// ==========================================
function submitAnswerSentence(mount) {
  if (sb.answered) return;
  clearInterval(sb.timerInterval);
  sb.answered = true;
  createAudioCtx();

  const typed = sb.current.answer.join(' ').toLowerCase();
  const correct = sb.current.words.join(' ').toLowerCase();
  const isCorrect = (typed === correct);

  if (isCorrect) {
    playSuccessChime();
    sb.streak++;
    const timeBonus = sb.timeLeft * 3;
    const streakBonus = Math.min(5, sb.streak) * 25;
    const gained = 150 + timeBonus + streakBonus;
    sb.score += gained;

    showFeedbackSentence(mount, `✅ تركيب ممتاز! +${gained} نقطة \n ${sb.current.tip}`, 'correct');
  } else {
    playFailBuzz();
    sb.streak = 0;
    showFeedbackSentence(mount, `❌ تركيب خاطئ! الحل الصحيح: "${sb.current.words.join(' ')}" \n ${sb.current.tip}`, 'wrong');
  }

  // تحديث شريط الـ HUD
  const scoreVal = mount.querySelector('#sb-hud-score-val');
  const streakVal = mount.querySelector('#sb-hud-streak-val');
  if (scoreVal) scoreVal.textContent = sb.score;
  if (streakVal) streakVal.textContent = sb.streak;

  sb.round++;
  sb.roundTimeout = setTimeout(() => nextRound(mount), 3800);
}

function showFeedbackSentence(mount, msg, cls) {
  const fb = mount.querySelector('#sb-notify-bar-val');
  if (fb) {
    fb.innerHTML = msg.replace(/\n/g, '<br/>');
    fb.className = `sb-notify-bar ${cls}`;
    fb.style.lineHeight = '1.6';
  }
}

// ==========================================
// 🎨 10. واجهة النتائج الإجمالية والاحتفال
// ==========================================
function showResults(mount) {
  clearInterval(sb.timerInterval);
  playSuccessChime();
  sb.onWin(sb.score);
  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="sb-premium-container" style="font-family:'Tajawal',sans-serif">
      <div style="font-size:3.5rem; margin-bottom:12px;">🧩</div>
      <h2 style="font-size:1.6rem; font-weight:800; margin-bottom:6px; color:var(--text-main);">اكتمل تركيب الجمل! Complete</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">لقد أكملت جميع الجولات الست بنجاح!</p>

      <div class="hm-res-stats" style="grid-template-columns: repeat(2, 1fr); width:100%; max-width:600px;">
        <div class="hm-stat-box">
          <label>النقاط النهائية</label>
          <span>${sb.score}</span>
        </div>
        <div class="hm-stat-box">
          <label>إجمالي الجمل</label>
          <span>${ROUNDS}</span>
        </div>
        <div class="hm-stat-box" style="grid-column: span 2;">
          <label>أعلى متتالية تركيب</label>
          <span style="color:var(--accent);">🔥 ${sb.streak}</span>
        </div>
      </div>

      <div class="hm-action-row" style="margin-top:12px;">
        <button class="btn btn-primary" id="sb-replay-btn" style="padding:10px 24px; font-weight:700;">
          تحدي جديد ⚡
        </button>
        <button class="btn btn-secondary" id="sb-hub-btn" style="padding:10px 20px;">
          رجوع للألعاب
        </button>
      </div>
    </div>
  `;

  mount.querySelector('#sb-replay-btn').addEventListener('click', () => {
    startGame(mount, sb.pool, sb.onWin, sb.difficulty);
  });
  mount.querySelector('#sb-hub-btn').addEventListener('click', () => {
    document.querySelector('#gc-back-btn')?.click();
  });
}

function spawnConfetti(mount) {
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#0ea5e9'];
  const container = mount.querySelector('.sb-premium-container') || mount;
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'gc-confetti';
    el.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.8}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}
