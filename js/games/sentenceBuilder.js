/**
 * Sentence Builder Game — Professional Edition
 * Egyptian English Academy
 * Features: tap-to-build sentences from lesson dialogues, animated slots, scoring
 */

import { createAudioCtx, playClick, playSuccessChime, playFailBuzz, playTone } from './gameAudio.js';

const ROUNDS = 6;

let sb = {};

const FALLBACK_SENTENCES = [
  { sentence: 'She is reading a very good book', tip: 'الصفة (good) تسبق الاسم الموصوف (book) دائماً في اللغة الإنجليزية.' },
  { sentence: 'I would like to order some coffee', tip: 'التعبير (would like) طريقة مهذبة للغاية لطلب الأشياء وتعني (أود أن).' },
  { sentence: 'The weather today is quite beautiful', tip: 'نضع الفعل المساعد (is) قبل الصفة (beautiful) لربط الجملة الاسمية.' },
  { sentence: 'Can you help me find the library', tip: 'السؤال بـ (Can you) هو الأسلوب الشائع لطلب المساعدة من الآخرين بطريقة ودية.' },
  { sentence: 'He speaks English very fluently', tip: 'الحال (fluently) ينتهي بـ ly ويأتي بعد الفعل ليصف طريقة التحدث.' },
  { sentence: 'We are going to the market tomorrow', tip: 'التركيب (are going to) يستخدم للتعبير عن ترتيبات وخطط مستقبلية مؤكدة.' },
  { sentence: 'They finished their homework before dinner', tip: 'الفعل (finished) في الماضي البسيط يعبر عن حدث انتهى تماماً في الماضي.' },
  { sentence: 'My sister works at a big hospital', tip: 'حرف الجر (at) يستخدم للتعبير عن التواجد داخل مؤسسة أو مكان عمل محدد.' },
];

function getGrammarTip(sentence) {
  const lower = sentence.toLowerCase();
  if (lower.includes('is reading') || lower.includes('are going') || lower.includes('is working')) {
    return 'ملاحظة قواعدية: زمن المضارع المستمر (Verb + ing) يعبر عن حدث مستمر يقع الآن.';
  }
  if (lower.includes('would like')) {
    return 'ملاحظة قواعدية: التركيب (would like) يستخدم لطلب الأشياء بأدب ورقي.';
  }
  if (lower.includes('yesterday') || lower.includes('last week') || lower.endsWith('ed')) {
    return 'ملاحظة قواعدية: زمن الماضي البسيط يعبر عن حدث بدأ وانتهى في الماضي.';
  }
  if (lower.includes('can you')) {
    return 'ملاحظة قواعدية: التركيب (Can you...) يستخدم لطلب المساعدة بشكل مهذب.';
  }
  if (lower.includes('want to')) {
    return 'ملاحظة قواعدية: الفعل (want) يتبعه دائماً حرف الجر to ثم الفعل في المصدر (want to do).';
  }
  return 'ملاحظة قواعدية: ترتيب الجملة الإنجليزية يبدأ بالفاعل (Subject) ثم الفعل (Verb) ثم المفعول أو التكملة.';
}

export function playSentenceBuilder(mount, { sentencePool, onWin, difficulty }) {
  const diff = difficulty || 'medium';
  let pool = (sentencePool || []).filter(s => {
    const words = s.sentence.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    return words.length >= 4 && words.length <= 10;
  });

  if (pool.length < ROUNDS) pool = [...pool, ...FALLBACK_SENTENCES];
  
  pool.forEach(item => {
    if (!item.tip) {
      item.tip = getGrammarTip(item.sentence);
    }
  });

  pool = pool.sort(() => Math.random() - 0.5);

  startGame(mount, pool, onWin, diff);
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

function nextRound(mount) {
  clearInterval(sb.timerInterval);
  if (sb.round >= ROUNDS) { showResults(mount); return; }

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

  renderRound(mount);
  startTimer(mount);
}

function renderRound(mount) {
  const progress = (sb.round / ROUNDS) * 100;
  const isEasy = sb.difficulty === 'easy';

  mount.innerHTML = `
    <div class="sbn-root" id="sbn-root">
      <div class="sbn-hud" style="font-family:'Tajawal',sans-serif">
        <div class="sbn-hud-item">
          <span>الجملة</span><strong>${sb.round + 1}/${ROUNDS}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>النقاط</span><strong id="sbn-score">${sb.score}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>المتتالي 🔥</span><strong id="sbn-streak">${sb.streak}</strong>
        </div>
        <div class="sbn-hud-item">
          <span>الوقت المتبقي</span><strong id="sbn-timer">${sb.timeLeft}s</strong>
        </div>
      </div>

      <div class="wsc-progress-wrap">
        <div class="wsc-progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="wsc-timer-row">
        <div class="wsc-timer-track">
          <div class="wsc-timer-bar" id="sbn-timer-bar"
               style="width:100%;transition:width ${sb.timePerSentence}s linear;background:var(--primary)"></div>
        </div>
      </div>

      <div class="sbn-instruction" style="font-family:'Tajawal',sans-serif">
        <p>🧩 انقر على الكلمات المبعثرة بالترتيب الصحيح لتكوين الجملة الإنجليزية المطلوبة:</p>
      </div>

      ${(isEasy && sb.current.tip) ? `
        <div class="sbn-translation-hint" style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:10px; padding:12px; margin-bottom:12px; font-family:'Tajawal',sans-serif; text-align:right; font-size:0.87rem; color:var(--success);">
          💡 تلميح قواعدي للمساعدة: <strong>${sb.current.tip}</strong>
        </div>
      ` : ''}

      <div class="sbn-answer-area" id="sbn-answer-area">
        <div class="sbn-answer-label">جملتك الحالية:</div>
        <div class="sbn-answer-slots" id="sbn-answer-slots">
          ${sb.current.answer.length === 0
            ? '<span class="sbn-placeholder">انقر على الكلمات بالأسفل لبناء الجملة...</span>'
            : sb.current.answer.map((w, i) => `
                <button class="sbn-answer-word" data-answer-idx="${i}">${w}
                  <span class="sbn-remove-hint">✕</span>
                </button>
              `).join('')
          }
        </div>
      </div>

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

      <div class="wsc-actions" style="font-family:'Tajawal',sans-serif">
        <button class="wsc-action-btn wsc-clear-btn" id="sbn-clear">⌫ مسح الجملة</button>
        <button class="wsc-action-btn wsc-submit-btn" id="sbn-submit">✓ تحقق من الحل</button>
      </div>

      <div class="wsc-feedback" id="sbn-feedback"></div>
    </div>
  `;

  requestAnimationFrame(() => {
    const bar = document.getElementById('sbn-timer-bar');
    if (bar) bar.style.width = '0%';
  });

  attachSBListeners(mount);
}

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
    ? '<span class="sbn-placeholder">انقر على الكلمات بالأسفل لبناء الجملة...</span>'
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
    
    showFeedback(mount, `✅ ممتاز! +${pts} نقطة \n ${sb.current.tip}`, 'fb-correct');
  } else {
    playFailBuzz();
    sb.streak = 0;
    showFeedback(mount, `❌ خاطئ! الحل: "${sb.current.words.join(' ')}" \n ${sb.current.tip}`, 'fb-wrong');
  }

  document.getElementById('sbn-score').textContent = sb.score;
  document.getElementById('sbn-streak').textContent = sb.streak;

  sb.round++;
  setTimeout(() => nextRound(mount), 3800);
}

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
      showFeedback(mount, `⏱ انتهى الوقت! الحل: "${sb.current.words.join(' ')}" \n ${sb.current.tip}`, 'fb-wrong');
      sb.round++;
      setTimeout(() => nextRound(mount), 3800);
    }
  }, 1000);
}

function showFeedback(mount, msg, cls) {
  const fb = document.getElementById('sbn-feedback');
  if (fb) {
    fb.innerHTML = msg.replace(/\n/g, '<br/>');
    fb.className = `wsc-feedback ${cls}`;
    fb.style.fontFamily = "'Tajawal', sans-serif";
    fb.style.lineHeight = "1.6";
  }
}

function showResults(mount) {
  clearInterval(sb.timerInterval);
  playSuccessChime();
  sb.onWin(sb.score);
  spawnConfetti(mount);

  mount.innerHTML = `
    <div class="sp-results" style="font-family:'Tajawal',sans-serif">
      <div class="sp-results-grade" style="color:#0ea5e9;border-color:#0ea5e9">🧩</div>
      <h2>اكتمل بناء الجمل! Complete</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>النقاط النهائية</span><strong>${sb.score}</strong></div>
        <div class="sp-result-item"><span>عدد الجمل</span><strong>${ROUNDS}</strong></div>
        <div class="sp-result-item"><span>أعلى متتالي</span><strong>🔥 ${sb.streak}</strong></div>
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="sbn-replay">العب مجدداً ⚡</button>
        <button class="gc-back-small-btn" id="sbn-hub">رجوع للألعاب</button>
      </div>
    </div>
  `;
  mount.querySelector('#sbn-replay').addEventListener('click', () => startGame(mount, sb.pool, sb.onWin, sb.difficulty));
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
