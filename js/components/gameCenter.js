import { levelData } from '../levelManager.js';
import { addXP, getProgress } from '../storage.js';
import { playHangman } from '../games/hangman.js';
import { playMemoryMatch } from '../games/memoryMatch.js';
import { playSpeedTranslate } from '../games/speedTranslate.js';
import { playWordScramble } from '../games/wordScramble.js';
import { playSentenceBuilder } from '../games/sentenceBuilder.js';
import { isSoundEnabled, setSoundEnabled } from '../games/gameAudio.js';

const GAME_SCORES_KEY = 'eea_game_scores';

export function getGameScores() {
  try {
    return JSON.parse(localStorage.getItem(GAME_SCORES_KEY)) || {};
  } catch { return {}; }
}

export function saveGameScore(gameId, score) {
  const scores = getGameScores();
  if (!scores[gameId] || score > scores[gameId]) {
    scores[gameId] = score;
    localStorage.setItem(GAME_SCORES_KEY, JSON.stringify(scores));
  }
}

// ── Extract vocab pool from curriculum ─────────────────────────────────────
export function buildVocabPool(lessonIds = null) {
  const pool = [];
  (levelData.curriculum || []).forEach(lesson => {
    if (lessonIds && !lessonIds.includes(lesson.id)) return;
    (lesson.vocabulary || []).forEach(v => {
      const english = v.word || v.english;
      const arabic  = v.translation || v.arabic;
      if (english && arabic) {
        pool.push({ english, arabic, lessonId: lesson.id, unitId: lesson.unitId });
      }
    });
  });
  return pool;
}

// ── Extract dialogues / sentences from curriculum ──────────────────────────
export function buildSentencePool(lessonIds = null) {
  const pool = [];
  (levelData.curriculum || []).forEach(lesson => {
    if (lessonIds && !lessonIds.includes(lesson.id)) return;
    
    // 1. Dialogue lines
    const dialogueLines = lesson.dialogue?.lines || lesson.dialogue?.exchanges || [];
    dialogueLines.forEach(line => {
      const text = line.text || line.english || line.en || line.line;
      if (text) {
        const cleanedText = text.trim();
        if (cleanedText.split(' ').length >= 4) {
          pool.push({ sentence: cleanedText, lessonId: lesson.id, unitId: lesson.unitId });
        }
      }
    });

    // 2. Practice exercises (general, listening, speaking)
    const practice = lesson.practice || {};
    const exercisesList = [
      ...(practice.exercises || []),
      ...(practice.listening || []),
      ...(practice.speaking || [])
    ];
    
    exercisesList.forEach(ex => {
      const text = ex.sentence || ex.question || ex.text;
      if (text) {
        const cleanedText = text.replace(/[.?]/g, '').trim();
        if (cleanedText.split(' ').length >= 4) {
          pool.push({ sentence: cleanedText, lessonId: lesson.id, unitId: lesson.unitId });
        }
      }
    });
  });
  return pool;
}

// ── Game requirements for playability validation ──────────────────────────
const GAME_REQS = {
  hangman: { vocab: 3, sentences: 0, label: '3 كلمات إنجليزية' },
  memory: { vocab: 6, sentences: 0, label: '6 كلمات مفردات' },
  speed: { vocab: 4, sentences: 0, label: '4 كلمات مفردات' },
  scramble: { vocab: 3, sentences: 0, label: '3 كلمات مفردات' },
  sentence: { vocab: 0, sentences: 2, label: 'جملتين كاملتين' }
};

// ── Game definitions ───────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'hangman',
    title: 'Word Hangman',
    icon: '🎯',
    description: 'خمن الكلمة الإنجليزية المخفية حرفاً بحرف قبل انتهاء المحاولات ورسم المشنقة. تعتمد على كلمات دروسك المحددة.',
    skills: ['Vocabulary', 'Spelling'],
    xpReward: '10–50 XP',
    difficulty: 'Medium',
    launch: playHangman,
  },
  {
    id: 'memory',
    title: 'Memory Match',
    icon: '🎴',
    description: 'اقلب البطاقات وطابق الكلمات الإنجليزية بترجمتها العربية الصحيحة لتدريب ذاكرتك البصرية الفائقة.',
    skills: ['Vocabulary', 'Memory'],
    xpReward: '20–60 XP',
    difficulty: 'Easy',
    launch: playMemoryMatch,
  },
  {
    id: 'speed',
    title: 'Speed Translate',
    icon: '⚡',
    description: 'ترجم أكبر عدد من الكلمات ضد عقارب الساعة قبل نفاد الوقت. تحصل على نقاط مضاعفة للسرعة الدقيقة.',
    skills: ['Vocabulary', 'Speed'],
    xpReward: '5–80 XP',
    difficulty: 'Hard',
    launch: playSpeedTranslate,
  },
  {
    id: 'scramble',
    title: 'Word Scramble',
    icon: '🔤',
    description: 'أعد ترتيب الحروف المبعثرة بشكل صحيح لتكشف الكلمة الإنجليزية المطلوبة. التلميحات متاحة عند الحاجة.',
    skills: ['Spelling', 'Vocabulary'],
    xpReward: '10–40 XP',
    difficulty: 'Medium',
    launch: playWordScramble,
  },
  {
    id: 'sentence',
    title: 'Sentence Builder',
    icon: '🧩',
    description: 'رتب كتل الكلمات المنزلقة بالترتيب الصحيح لتكوين جمل إنجليزية مفيدة مأخوذة مباشرة من حواراتك الدراسية.',
    skills: ['Grammar', 'Writing'],
    xpReward: '15–60 XP',
    difficulty: 'Hard',
    launch: playSentenceBuilder,
  },
];

// ── Main render ────────────────────────────────────────────────────────────
export function initGameCenter(params = {}) {
  const container = document.getElementById('game-center-section');
  if (!container) return;

  if (params.game) {
    const game = GAMES.find(g => g.id === params.game);
    if (game) { launchGame(game, container); return; }
  }

  renderHub(container);
}

function renderHub(container) {
  const scores = getGameScores();
  const totalGamesPlayed = Object.values(scores).filter(s => s > 0).length;

  container.innerHTML = `
    <!-- Rebuilt header to match Dashboard welcome banner 100% -->
    <div class="welcome-banner">
      <div class="welcome-text">
        <h1>🎮 Academy Game Center</h1>
        <div class="tutor-arabic-card dashboard-welcome-banner-tutor">
          <p class="ar-text">مرحباً بك في مركز الألعاب الأكاديمي! هنا يمكنك ممارسة وتدريب لغتك الإنجليزية من خلال 5 ألعاب تفاعلية مبهرة. العب، واجمع نقاط الـ XP، وحقق أرقاماً قياسية جديدة!</p>
        </div>
        <div class="gc-stats-strip" style="display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">🔓 ألعاب تم لعبها: <strong style="color: var(--primary);">${totalGamesPlayed}</strong></span>
          <span style="font-size: 0.85rem; color: var(--text-muted);">📚 الكلمات المتوفرة: <strong style="color: var(--primary);">${buildVocabPool().length}</strong></span>
          <span style="font-size: 0.85rem; color: var(--text-muted);">🏆 نقاط XP المتاحة: <strong style="color: var(--primary);">250+ XP</strong></span>
        </div>
      </div>
      <div>
        <img class="welcome-image-mock" src="icon/welcome_hero.webp" alt="EE Academy Logo" fetchpriority="high">
      </div>
    </div>

    <!-- Rebuilt grid to match Dashboard panels layout 100% -->
    <div class="dashboard-details-grid" style="margin-top: 24px;">
      ${GAMES.map(game => renderGameCard(game, scores[game.id])).join('')}
    </div>
  `;

  GAMES.forEach(game => {
    const btn = container.querySelector(`#gc-launch-${game.id}`);
    if (btn) btn.addEventListener('click', () => launchGame(game, container));
  });
}

function renderGameCard(game, bestScore) {
  const diffColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
  const diffColor = diffColors[game.difficulty] || '#6366f1';

  return `
    <div class="dashboard-panel" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div style="font-size: 2.2rem; line-height: 1;">${game.icon}</div>
          <div style="display: flex; gap: 8px;">
            <span class="badge" style="color: ${diffColor}; background: ${diffColor}22; font-weight: 700; border-radius: 999px; padding: 4px 10px; font-size: 0.75rem;">${game.difficulty}</span>
            <span class="badge" style="color: var(--accent); background: var(--accent-glow); font-weight: 700; border-radius: 999px; padding: 4px 10px; font-size: 0.75rem;">⭐ ${game.xpReward}</span>
          </div>
        </div>
        <h3 class="panel-title" style="margin-bottom: 10px; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.25rem;">${game.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.6; margin-bottom: 15px;">${game.description}</p>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 15px;">
          ${game.skills.map(s => `<span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-muted); font-weight: 600;">${s}</span>`).join('')}
        </div>
      </div>
      <div>
        ${bestScore ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; border-top: 1px dashed var(--border-color); padding-top: 8px;">🏆 أفضل مجموع نقاط: <strong style="color: var(--accent); font-family: 'Outfit';">${bestScore}</strong></div>` : ''}
        <button id="gc-launch-${game.id}" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>ابدأ التحدي (Play)</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </div>
    </div>
  `;
}

// ── Game Setup / Customization Launcher (Styled 100% like EEA components) ───
function launchGame(game, container) {
  let setupState = {
    scope: 'unlocked', 
    selectedUnits: levelData.units.map(u => u.id),
    selectedLessons: levelData.curriculum.map(l => l.id),
    difficulty: game.difficulty.toLowerCase(),
    sound: isSoundEnabled()
  };

  function updateSetupUI() {
    const mainMount = document.getElementById('gc-game-mount');
    if (!mainMount) return;

    let lessonIds = null;
    if (setupState.scope === 'unit') {
      const ids = [];
      levelData.curriculum.forEach(l => {
        if (setupState.selectedUnits.includes(l.unitId)) ids.push(l.id);
      });
      lessonIds = ids;
    } else if (setupState.scope === 'lesson') {
      lessonIds = setupState.selectedLessons;
    } else if (setupState.scope === 'unlocked') {
      const progress = getProgress();
      lessonIds = levelData.curriculum
        .filter(lesson => lesson.id === 1 || (progress.completedLessons && progress.completedLessons.includes(lesson.id - 1)))
        .map(lesson => lesson.id);
    }

    const vocabPool = buildVocabPool(lessonIds);
    const sentencePool = buildSentencePool(lessonIds);

    const isVocabGame = GAME_REQS[game.id].vocab > 0;
    const poolSize = isVocabGame ? vocabPool.length : sentencePool.length;
    const reqSize = isVocabGame ? GAME_REQS[game.id].vocab : GAME_REQS[game.id].sentences;
    const isValid = poolSize >= reqSize;

    const tabHTML = `
      <div class="gc-setup-tabs">
        <button class="gc-setup-tab ${setupState.scope === 'unlocked' ? 'active' : ''}" data-scope="unlocked">الدروس المفتوحة فقط</button>
        <button class="gc-setup-tab ${setupState.scope === 'all' ? 'active' : ''}" data-scope="all">كامل المنهج</button>
        <button class="gc-setup-tab ${setupState.scope === 'unit' ? 'active' : ''}" data-scope="unit">تحديد الوحدات</button>
        <button class="gc-setup-tab ${setupState.scope === 'lesson' ? 'active' : ''}" data-scope="lesson">تحديد الدروس</button>
      </div>
    `;

    let selectorHTML = '';
    if (setupState.scope === 'unit') {
      selectorHTML = `
        <div class="gc-setup-selection-box">
          <div class="gc-setup-selection-header">
            <span>اختر الوحدات الدراسية:</span>
            <div class="gc-setup-bulk-actions">
              <button id="gc-units-all" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">تحديد الكل</button>
              <button id="gc-units-none" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">إلغاء الكل</button>
            </div>
          </div>
          <div class="gc-setup-grid-chips">
            ${levelData.units.map(unit => {
              const checked = setupState.selectedUnits.includes(unit.id);
              return `
                <div class="gc-setup-chip ${checked ? 'selected' : ''}" data-unit-id="${unit.id}">
                  <span class="gc-chip-check">✓</span>
                  <span>الوحدة ${unit.id}: ${unit.title.split(':')[1] || unit.title}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (setupState.scope === 'lesson') {
      selectorHTML = `
        <div class="gc-setup-selection-box">
          <div class="gc-setup-selection-header">
            <span>اختر الدروس الدراسية:</span>
            <div class="gc-setup-bulk-actions">
              <button id="gc-lessons-all" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">تحديد الكل</button>
              <button id="gc-lessons-none" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">إلغاء الكل</button>
            </div>
          </div>
          <div class="gc-setup-lessons-accordion">
            ${levelData.units.map(unit => {
              const unitLessons = levelData.curriculum.filter(l => l.unitId === unit.id);
              return `
                <div>
                  <div class="gc-setup-unit-group-title">📁 الوحدة ${unit.id}: ${unit.title.split(':')[1] || unit.title}</div>
                  <div class="gc-setup-grid-chips">
                    ${unitLessons.map(l => {
                      const checked = setupState.selectedLessons.includes(l.id);
                      return `
                        <div class="gc-setup-chip lesson-chip ${checked ? 'selected' : ''}" data-lesson-id="${l.id}">
                          <span class="gc-chip-check">✓</span>
                          <span>درس ${l.id}: ${l.title.split(':')[1] || l.title}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (setupState.scope === 'unlocked') {
      const progress = getProgress();
      const unlockedCount = levelData.curriculum.filter(lesson => lesson.id === 1 || (progress.completedLessons && progress.completedLessons.includes(lesson.id - 1))).length;
      selectorHTML = `
        <div class="gc-setup-info-banner" style="border-left-color: var(--accent);">
          <p>سيتم تلقائياً تصفية اللعب ليشمل فقط الدروس المفتوحة والمكتملة حتى الآن للمستوى الحالي (مفتوح حالياً <strong>${unlockedCount} / ${levelData.curriculum.length}</strong> درس).</p>
        </div>
      `;
    } else {
      selectorHTML = `
        <div class="gc-setup-info-banner">
          <p>سيتم جلب جميع المفردات والجمل المنهجية للمستوى الحالي (<strong>${levelData.currentLevel}</strong>) للعب والتدرب عليها بشكل شامل.</p>
        </div>
      `;
    }

    const diffs = [
      { id: 'easy', label: 'سهل (Casual)', desc: 'وقت أطول، تلميحات مجانية، نقاط XP عادية 1.0x', color: '#10b981' },
      { id: 'medium', label: 'متوسط (Standard)', desc: 'وقت متوسط، تلميحات بنقاط، نقاط XP مضاعفة 1.2x', color: '#f59e0b' },
      { id: 'hard', label: 'صعب (Challenger)', desc: 'وقت سريع، محاولات أقل، بدون تلميحات، نقاط XP ممتازة 1.5x', color: '#ef4444' }
    ];

    const difficultyHTML = `
      <div class="gc-setup-difficulty-section">
        <label class="gc-setup-section-lbl">مستوى التحدي والصعوبة:</label>
        <div class="gc-setup-diff-cards">
          ${diffs.map(d => {
            const active = setupState.difficulty === d.id;
            return `
              <div class="gc-setup-diff-card ${active ? 'active' : ''}" data-diff="${d.id}" style="--card-border-color: ${d.color};">
                <div class="gc-diff-dot"></div>
                <div class="gc-diff-details">
                  <span class="gc-diff-name" style="color: ${d.color};">${d.label}</span>
                  <span class="gc-diff-desc">${d.desc}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const soundHTML = `
      <div class="gc-setup-sound-row">
        <span>🔊 تشغيل المؤثرات الصوتية</span>
        <label class="gc-switch">
          <input type="checkbox" id="gc-sound-toggle" ${setupState.sound ? 'checked' : ''}>
          <span class="gc-slider"></span>
        </label>
      </div>
    `;

    const validationHTML = isValid
      ? `<div class="gc-setup-valid-badge">✓ تم اختيار محتوى مناسب: تم تحديد <strong>${poolSize}</strong> ${isVocabGame ? 'كلمة' : 'جملة'} (الحد الأدنى المطلوب ${reqSize}).</div>`
      : `<div class="gc-setup-invalid-badge">⚠️ محتوى غير كافٍ للعب: يحتوي النطاق المختار على <strong>${poolSize}</strong> فقط، بينما تتطلب اللعبة ${GAME_REQS[game.id].label} كحد أدنى. الرجاء تحديد المزيد من الدروس.</div>`;

    mainMount.innerHTML = `
      <div class="gc-setup-container">
        <div class="gc-setup-header">
          <div class="gc-setup-game-icon">${game.icon}</div>
          <div class="gc-setup-game-info">
            <h2>إعداد اللعبة: ${game.title}</h2>
            <p>تخصيص النطاق الجغرافي وقواعد اللعب للدرس</p>
          </div>
        </div>

        ${tabHTML}
        ${selectorHTML}
        ${difficultyHTML}
        ${soundHTML}
        ${validationHTML}

        <div class="gc-setup-actions">
          <button id="gc-start-match-btn" class="btn btn-primary" ${!isValid ? 'disabled' : ''}>
            ابدأ التحدي الآن ⚡
          </button>
        </div>
      </div>
    `;

    // Bind setup control listeners
    mainMount.querySelectorAll('.gc-setup-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setupState.scope = tab.dataset.scope;
        updateSetupUI();
      });
    });

    mainMount.querySelectorAll('.gc-setup-chip[data-unit-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        const uId = parseInt(chip.dataset.unitId);
        if (setupState.selectedUnits.includes(uId)) {
          setupState.selectedUnits = setupState.selectedUnits.filter(id => id !== uId);
        } else {
          setupState.selectedUnits.push(uId);
        }
        updateSetupUI();
      });
    });

    mainMount.querySelectorAll('.gc-setup-chip[data-lesson-id]').forEach(chip => {
      chip.addEventListener('click', () => {
        const lId = parseInt(chip.dataset.lessonId);
        if (setupState.selectedLessons.includes(lId)) {
          setupState.selectedLessons = setupState.selectedLessons.filter(id => id !== lId);
        } else {
          setupState.selectedLessons.push(lId);
        }
        updateSetupUI();
      });
    });

    const unitAllBtn = document.getElementById('gc-units-all');
    if (unitAllBtn) {
      unitAllBtn.addEventListener('click', () => {
        setupState.selectedUnits = levelData.units.map(u => u.id);
        updateSetupUI();
      });
    }
    const unitNoneBtn = document.getElementById('gc-units-none');
    if (unitNoneBtn) {
      unitNoneBtn.addEventListener('click', () => {
        setupState.selectedUnits = [];
        updateSetupUI();
      });
    }

    const lessonAllBtn = document.getElementById('gc-lessons-all');
    if (lessonAllBtn) {
      lessonAllBtn.addEventListener('click', () => {
        setupState.selectedLessons = levelData.curriculum.map(l => l.id);
        updateSetupUI();
      });
    }
    const lessonNoneBtn = document.getElementById('gc-lessons-none');
    if (lessonNoneBtn) {
      lessonNoneBtn.addEventListener('click', () => {
        setupState.selectedLessons = [];
        updateSetupUI();
      });
    }

    mainMount.querySelectorAll('.gc-setup-diff-card').forEach(card => {
      card.addEventListener('click', () => {
        setupState.difficulty = card.dataset.diff;
        updateSetupUI();
      });
    });

    const soundToggle = document.getElementById('gc-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        setupState.sound = e.target.checked;
        setSoundEnabled(setupState.sound);
      });
    }

    const startBtn = document.getElementById('gc-start-match-btn');
    if (startBtn && isValid) {
      startBtn.addEventListener('click', () => {
        mainMount.innerHTML = `<div id="gc-game-actual-mount"></div>`;
        const actualMount = document.getElementById('gc-game-actual-mount');
        game.launch(actualMount, {
          vocabPool,
          sentencePool,
          difficulty: setupState.difficulty,
          onWin: (score) => {
            saveGameScore(game.id, score);
            const mults = { easy: 1.0, medium: 1.2, hard: 1.5 };
            const mult = mults[setupState.difficulty] || 1.2;
            const xpAmount = Math.min(100, Math.max(10, Math.floor(score * 1.5 * mult)));
            addXP(xpAmount);
          }
        });
      });
    }
  }

  container.innerHTML = `
    <div style="position: relative;">
      <button class="btn btn-secondary" id="gc-back-btn" style="margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        رجوع لمركز الألعاب (Back)
      </button>
      <div id="gc-game-mount"></div>
    </div>
  `;

  document.getElementById('gc-back-btn').addEventListener('click', () => {
    if (typeof window.eea_game_cleanup === 'function') {
      try {
        window.eea_game_cleanup();
      } catch (err) {
        console.warn('Cleanup failed:', err);
      }
      window.eea_game_cleanup = null;
    }
    renderHub(container);
  });

  updateSetupUI();
}
