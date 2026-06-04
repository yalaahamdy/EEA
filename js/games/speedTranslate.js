import { createAudioCtx, playTone, playSuccessChime, playFailBuzz, playCountdown, playTimeUp } from './gameAudio.js';

const TOTAL_QUESTIONS = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * 40; // r=40

let st = {};

export function playSpeedTranslate(mount, { vocabPool, onWin, difficulty }) {
  if (!vocabPool || vocabPool.length < 4) {
    mount.innerHTML = `<div class="gc-error">⚠️ Need at least 4 words in selected lessons to play.</div>`;
    return;
  }
  const diff = difficulty || 'medium';
  showIntroScreen(mount, vocabPool, onWin, diff);
}

function showIntroScreen(mount, pool, onWin, difficulty) {
  const times = { easy: 12, medium: 8, hard: 5 };
  const baseTime = times[difficulty] || 8;

  mount.innerHTML = `
    <div class="sp-intro" style="font-family:'Tajawal',sans-serif">
      <div class="sp-intro-icon">⚡</div>
      <h2>ترجمة السرعة Speed Translate</h2>
      <p>أجب عن 10 أسئلة. لديك <strong>${baseTime} ثوانٍ</strong> لكل كلمة. اختر الترجمة الصحيحة بأسرع ما يمكن!</p>
      <div class="sp-mode-row">
        <button class="sp-mode-btn" data-mode="en2ar">🇬🇧 إنجليزي ← عربي 🇪🇬</button>
        <button class="sp-mode-btn" data-mode="ar2en">🇪🇬 عربي ← إنجليزي 🇧🇬</button>
      </div>
      <p class="sp-tip">💡 الإجابة السريعة تمنحك نقاطاً مضاعفة!</p>
    </div>
  `;
  mount.querySelectorAll('.sp-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(mount, pool, onWin, btn.dataset.mode, difficulty));
  });
}

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
    <div class="sp-root" id="sp-root">
      <div class="sp-hud" style="font-family:'Tajawal',sans-serif">
        <div class="sp-hud-left">
          <span class="sp-q-counter">${st.currentQ + 1} / ${st.questionsCount}</span>
          <div class="sp-progress-bar">
            <div class="sp-progress-fill" style="width:${progress * 100}%"></div>
          </div>
        </div>
        <div class="sp-score-display">
          <span class="sp-score-val" id="sp-score">${st.score}</span>
          <span class="sp-score-lbl">نقطة</span>
        </div>
        <div class="sp-combo-badge ${st.combo >= 2 ? 'active' : ''}">
          🔥 x${st.combo + 1}
        </div>
      </div>

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
        <span class="sp-timer-num" id="sp-timer">${st.baseTime}</span>
      </div>

      <div class="sp-question-card" id="sp-question-card">
        <div class="sp-question-lang">${st.mode === 'en2ar' ? '🇬🇧 English' : '🇪🇬 العربية'}</div>
        <div class="sp-question-text ${st.mode === 'ar2en' ? 'sp-ar-text' : ''}" id="sp-question-text">
          ${questionText}
        </div>
      </div>

      <div class="sp-choices" id="sp-choices">
        ${choices.map((c, i) => `
          <button class="sp-choice-btn" data-idx="${i}" id="sp-choice-${i}">
            <span class="sp-choice-label">${String.fromCharCode(65 + i)}</span>
            <span class="sp-choice-text ${st.mode === 'en2ar' ? 'sp-ar-text' : ''}">${c.text}</span>
          </button>
        `).join('')}
      </div>

      <div class="sp-lifelines-container" style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
        <button class="sp-life-btn" id="sp-life-half" ${!st.lifelines.half ? 'disabled' : ''} style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:10px 14px; font-family:'Tajawal',sans-serif; font-size:0.85rem; font-weight:700; cursor:pointer;">
          🌓 50:50
        </button>
        <button class="sp-life-btn" id="sp-life-freeze" ${!st.lifelines.freeze ? 'disabled' : ''} style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:10px 14px; font-family:'Tajawal',sans-serif; font-size:0.85rem; font-weight:700; cursor:pointer;">
          ❄️ تجميد
        </button>
        <button class="sp-life-btn" id="sp-life-skip" ${!st.lifelines.skip ? 'disabled' : ''} style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:10px 14px; font-family:'Tajawal',sans-serif; font-size:0.85rem; font-weight:700; cursor:pointer;">
          ⏭ تخطي
        </button>
      </div>

      <div id="sp-feedback" class="sp-feedback-area"></div>
    </div>
  `;

  attachChoiceListeners(mount, choices);
  attachLifelineListeners(mount, choices);
  startTimer(mount, choices);
}

function buildChoices(correctItem, pool, mode) {
  const correctText = mode === 'en2ar' ? correctItem.arabic : correctItem.english;
  const wrongs = pool
    .filter(v => (mode === 'en2ar' ? v.arabic : v.english) !== correctText)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(v => ({ text: mode === 'en2ar' ? v.arabic : v.english, correct: false }));

  while (wrongs.length < 3) {
    wrongs.push({ text: mode === 'en2ar' ? 'كلمة خاطئة' : 'Incorrect word', correct: false });
  }

  const all = [{ text: correctText, correct: true }, ...wrongs].sort(() => Math.random() - 0.5);
  return all;
}

function startTimer(mount, choices) {
  createAudioCtx();
  const ring = document.getElementById('sp-ring');
  const timerEl = document.getElementById('sp-timer');

  st.timerInterval = setInterval(() => {
    if (st.frozenTimeLeft > 0) {
      st.frozenTimeLeft--;
      if (timerEl) timerEl.textContent = `❄️ ${st.frozenTimeLeft}`;
      if (st.frozenTimeLeft === 0) {
        if (ring) ring.style.stroke = 'var(--primary)';
        if (timerEl) timerEl.textContent = st.timeLeft;
      }
      return;
    }

    st.timeLeft--;
    if (timerEl) timerEl.textContent = st.timeLeft;

    const frac = st.timeLeft / st.baseTime;
    if (ring) ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - frac);

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
        handleAnswer(mount, -1, choices);
      }
    }
  }, 1000);
}

function attachChoiceListeners(mount, choices) {
  mount.querySelectorAll('.sp-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (st.answered) return;
      handleAnswer(mount, parseInt(btn.dataset.idx), choices);
    });
  });
}

function attachLifelineListeners(mount, choices) {
  const halfBtn = document.getElementById('sp-life-half');
  if (halfBtn) {
    halfBtn.addEventListener('click', () => {
      if (!st.lifelines.half || st.answered) return;
      st.lifelines.half = false;
      halfBtn.disabled = true;
      
      let hiddenCount = 0;
      choices.forEach((c, idx) => {
        if (!c.correct && hiddenCount < 2) {
          const btn = document.getElementById(`sp-choice-${idx}`);
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

  const freezeBtn = document.getElementById('sp-life-freeze');
  if (freezeBtn) {
    freezeBtn.addEventListener('click', () => {
      if (!st.lifelines.freeze || st.answered) return;
      st.lifelines.freeze = false;
      freezeBtn.disabled = true;
      
      st.frozenTimeLeft = 5;
      const ring = document.getElementById('sp-ring');
      if (ring) ring.style.stroke = '#0ea5e9';
      playTone(880, 0.15, 'sine', 0.25);
    });
  }

  const skipBtn = document.getElementById('sp-life-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!st.lifelines.skip || st.answered) return;
      st.lifelines.skip = false;
      skipBtn.disabled = true;
      
      clearInterval(st.timerInterval);
      st.answered = true;
      showFeedback(mount, `⏭ تم التخطي Skip`, 'sp-fb-correct');
      playTone(400, 0.15, 'triangle', 0.2);

      setTimeout(() => {
        st.currentQ++;
        renderQuestion(mount);
      }, 1000);
    });
  }
}

function handleAnswer(mount, selectedIdx, choices) {
  clearInterval(st.timerInterval);
  if (st.answered) return;
  st.answered = true;

  const isCorrect = selectedIdx >= 0 && choices[selectedIdx].correct;
  const correctIdx = choices.findIndex(c => c.correct);

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
    const timePts = Math.floor(st.timeLeft * 10);
    const comboPts = Math.min(4, st.combo) * 20;
    const gained = 50 + timePts + comboPts;
    st.score += gained;

    showFeedback(mount, `✅ إجابة صحيحة! +${gained} نقطة`, 'sp-fb-correct');
  } else {
    playFailBuzz();
    st.combo = 0;
    showFeedback(mount, `❌ ${selectedIdx === -1 ? 'انتهى الوقت!' : 'خاطئ!'} الإجابة: ${choices[correctIdx].text}`, 'sp-fb-wrong');
  }

  st.answers.push({ correct: isCorrect, timeLeft: st.timeLeft });

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

function showResults(mount) {
  clearInterval(st.timerInterval);
  playSuccessChime();
  if (st.correctCount >= Math.floor(st.questionsCount * 0.8)) spawnConfetti(mount);
  st.onWin(st.score);

  const accuracy = Math.round((st.correctCount / st.questionsCount) * 100);
  const grade = accuracy >= 90 ? 'S' : accuracy >= 75 ? 'A' : accuracy >= 60 ? 'B' : accuracy >= 40 ? 'C' : 'D';
  const gradeColors = { S:'#f59e0b', A:'#10b981', B:'#6366f1', C:'#0ea5e9', D:'#ef4444' };

  mount.innerHTML = `
    <div class="sp-results" style="font-family:'Tajawal',sans-serif">
      <div class="sp-results-grade" style="color:${gradeColors[grade]};border-color:${gradeColors[grade]}">${grade}</div>
      <h2>اكتملت الجولة! Complete</h2>
      <div class="sp-results-grid">
        <div class="sp-result-item"><span>النقاط</span><strong>${st.score}</strong></div>
        <div class="sp-result-item"><span>إجابات صحيحة</span><strong>${st.correctCount} / ${st.questionsCount}</strong></div>
        <div class="sp-result-item"><span>الدقة (Accuracy)</span><strong>${accuracy}%</strong></div>
        <div class="sp-result-item"><span>الوضع (Mode)</span><strong>${st.mode === 'en2ar' ? 'EN→AR' : 'AR→EN'}</strong></div>
      </div>
      <div class="sp-answer-trail">
        ${st.answers.map((a, i) => `<span class="sp-dot ${a.correct ? 'ok' : 'bad'}"></span>`).join('')}
      </div>
      <div class="hm-result-actions">
        <button class="gc-launch-btn" id="sp-replay-btn">العب مجدداً ⚡</button>
        <button class="gc-back-small-btn" id="sp-mode-btn">تغيير الوضع</button>
        <button class="gc-back-small-btn" id="sp-hub-btn">رجوع للألعاب</button>
      </div>
    </div>
  `;

  mount.querySelector('#sp-replay-btn').addEventListener('click', () => startGame(mount, st.pool, st.onWin, st.mode, st.difficulty));
  mount.querySelector('#sp-mode-btn').addEventListener('click', () => showIntroScreen(mount, st.pool, st.onWin, st.difficulty));
  mount.querySelector('#sp-hub-btn').addEventListener('click', () => document.querySelector('#gc-back-btn')?.click());
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
