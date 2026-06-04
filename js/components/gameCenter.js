/**
 * Game Center Hub Component
 * Egyptian English Academy
 * Routes to all mini-games and displays scores/XP rewards.
 */

import { levelData } from '../levelManager.js';
import { addXP } from '../storage.js';
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
    const dialogueLines = lesson.dialogue?.lines || lesson.dialogue?.exchanges || [];
    dialogueLines.forEach(line => {
      const text = line.english || line.en || line.line;
      if (text && text.split(' ').length >= 4) {
        pool.push({ sentence: text, lessonId: lesson.id, unitId: lesson.unitId });
      }
    });
    const exercises = lesson.practice?.exercises || [];
    exercises.forEach(ex => {
      if (ex.sentence && ex.sentence.split(' ').length >= 4) {
        pool.push({ sentence: ex.sentence, lessonId: lesson.id, unitId: lesson.unitId });
      }
      if (ex.question && ex.question.split(' ').length >= 4) {
        pool.push({ sentence: ex.question, lessonId: lesson.id, unitId: lesson.unitId });
      }
    });
  });
  return pool;
}

// ── Game requirements for playability validation ──────────────────────────
const GAME_REQS = {
  hangman: { vocab: 3, sentences: 0, label: '3 English Words' },
  memory: { vocab: 6, sentences: 0, label: '6 Vocabulary words' },
  speed: { vocab: 4, sentences: 0, label: '4 Vocabulary words' },
  scramble: { vocab: 3, sentences: 0, label: '3 Vocabulary words' },
  sentence: { vocab: 0, sentences: 2, label: '2 Sentences' }
};

// ── Game definitions ───────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'hangman',
    title: 'Word Hangman',
    icon: '🎯',
    description: 'Guess the hidden English word letter by letter before the hangman is drawn. Uses vocabulary from your lessons.',
    skills: ['Vocabulary', 'Spelling'],
    xpReward: '10–50 XP',
    difficulty: 'Medium',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    launch: playHangman,
  },
  {
    id: 'memory',
    title: 'Memory Match',
    icon: '🎴',
    description: 'Flip cards and match each English word to its Arabic translation. Train your visual memory.',
    skills: ['Vocabulary', 'Memory'],
    xpReward: '20–60 XP',
    difficulty: 'Easy',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    launch: playMemoryMatch,
  },
  {
    id: 'speed',
    title: 'Speed Translate',
    icon: '⚡',
    description: 'Translate words against a ticking clock. Score multipliers for fast answers. Can you beat the high score?',
    skills: ['Vocabulary', 'Speed'],
    xpReward: '5–80 XP',
    difficulty: 'Hard',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    launch: playSpeedTranslate,
  },
  {
    id: 'scramble',
    title: 'Word Scramble',
    icon: '🔤',
    description: 'Unscramble the jumbled letters to reveal the correct English word. Hints available for tough ones!',
    skills: ['Spelling', 'Vocabulary'],
    xpReward: '10–40 XP',
    difficulty: 'Medium',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    launch: playWordScramble,
  },
  {
    id: 'sentence',
    title: 'Sentence Builder',
    icon: '🧩',
    description: 'Tap shuffled words in the correct order to form a complete English sentence from your dialogues.',
    skills: ['Grammar', 'Writing'],
    xpReward: '15–60 XP',
    difficulty: 'Hard',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
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
    <div class="gc-hero">
      <div class="gc-hero-text">
        <div class="gc-hero-badge">🎮 Game Center</div>
        <h2 class="gc-hero-title">Learn English Through Play</h2>
        <p class="gc-hero-sub">Five professional mini-games built from your lesson vocabulary.
          Play, earn XP, and watch your skills skyrocket!</p>
        <div class="gc-hero-stats">
          <div class="gc-hero-stat">
            <span class="gc-hero-stat-val">${totalGamesPlayed}</span>
            <span class="gc-hero-stat-lbl">Games Unlocked</span>
          </div>
          <div class="gc-hero-stat">
            <span class="gc-hero-stat-val">${buildVocabPool().length}</span>
            <span class="gc-hero-stat-lbl">Words in Pool</span>
          </div>
          <div class="gc-hero-stat">
            <span class="gc-hero-stat-val">250+</span>
            <span class="gc-hero-stat-lbl">XP Available</span>
          </div>
        </div>
      </div>
      <div class="gc-hero-art">
        <div class="gc-hero-orb orb-1"></div>
        <div class="gc-hero-orb orb-2"></div>
        <div class="gc-hero-orb orb-3"></div>
        <div class="gc-hero-emoji">🎮</div>
      </div>
    </div>

    <div class="gc-grid">
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
    <div class="gc-card" style="--card-color:${game.color}; --card-gradient:${game.gradient}">
      <div class="gc-card-header">
        <div class="gc-card-icon">${game.icon}</div>
        <div class="gc-card-badges">
          <span class="gc-badge" style="color:${diffColor};background:${diffColor}22">${game.difficulty}</span>
          <span class="gc-badge" style="color:#a78bfa;background:#a78bfa22">⭐ ${game.xpReward}</span>
        </div>
      </div>
      <h3 class="gc-card-title">${game.title}</h3>
      <p class="gc-card-desc">${game.description}</p>
      <div class="gc-card-skills">
        ${game.skills.map(s => `<span class="gc-skill-tag">${s}</span>`).join('')}
      </div>
      ${bestScore ? `<div class="gc-best-score">🏆 Best Score: <strong>${bestScore}</strong></div>` : ''}
      <button id="gc-launch-${game.id}" class="gc-launch-btn">
        <span>Play Now</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </button>
    </div>
  `;
}

// ── Game Setup / Customization Launcher ─────────────────────────────────────
function launchGame(game, container) {
  // Local state for the customization panel
  let setupState = {
    scope: 'all', // 'all' | 'unit' | 'lesson'
    selectedUnits: levelData.units.map(u => u.id),
    selectedLessons: levelData.curriculum.map(l => l.id),
    difficulty: game.difficulty.toLowerCase(), // 'easy' | 'medium' | 'hard'
    sound: isSoundEnabled()
  };

  function updateSetupUI() {
    const mainMount = document.getElementById('gc-game-mount');
    if (!mainMount) return;

    // Filter pools in real-time
    let lessonIds = null;
    if (setupState.scope === 'unit') {
      const ids = [];
      levelData.curriculum.forEach(l => {
        if (setupState.selectedUnits.includes(l.unitId)) ids.push(l.id);
      });
      lessonIds = ids;
    } else if (setupState.scope === 'lesson') {
      lessonIds = setupState.selectedLessons;
    }

    const vocabPool = buildVocabPool(lessonIds);
    const sentencePool = buildSentencePool(lessonIds);

    const isVocabGame = GAME_REQS[game.id].vocab > 0;
    const poolSize = isVocabGame ? vocabPool.length : sentencePool.length;
    const reqSize = isVocabGame ? GAME_REQS[game.id].vocab : GAME_REQS[game.id].sentences;
    const isValid = poolSize >= reqSize;

    // 1. Scope selection tabs
    const tabHTML = `
      <div class="gc-setup-tabs">
        <button class="gc-setup-tab ${setupState.scope === 'all' ? 'active' : ''}" data-scope="all">كامل المنهج</button>
        <button class="gc-setup-tab ${setupState.scope === 'unit' ? 'active' : ''}" data-scope="unit">بالوحدات</button>
        <button class="gc-setup-tab ${setupState.scope === 'lesson' ? 'active' : ''}" data-scope="lesson">بالدروس</button>
      </div>
    `;

    // 2. Unit/Lesson selection layout
    let selectorHTML = '';
    if (setupState.scope === 'unit') {
      selectorHTML = `
        <div class="gc-setup-selection-box">
          <div class="gc-setup-selection-header">
            <span>اختر الوحدات المراد التدرب عليها:</span>
            <div class="gc-setup-bulk-actions">
              <button id="gc-units-all" class="gc-bulk-btn">تحديد الكل</button>
              <button id="gc-units-none" class="gc-bulk-btn">إلغاء الكل</button>
            </div>
          </div>
          <div class="gc-setup-grid-chips">
            ${levelData.units.map(unit => {
              const checked = setupState.selectedUnits.includes(unit.id);
              return `
                <div class="gc-setup-chip ${checked ? 'selected' : ''}" data-unit-id="${unit.id}">
                  <span class="gc-chip-check">✓</span>
                  <span class="gc-chip-text">الوحدة ${unit.id}: ${unit.title.split(':')[1] || unit.title}</span>
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
            <span>اختر الدروس المراد التدرب عليها:</span>
            <div class="gc-setup-bulk-actions">
              <button id="gc-lessons-all" class="gc-bulk-btn">تحديد الكل</button>
              <button id="gc-lessons-none" class="gc-bulk-btn">إلغاء الكل</button>
            </div>
          </div>
          <div class="gc-setup-lessons-accordion">
            ${levelData.units.map(unit => {
              const unitLessons = levelData.curriculum.filter(l => l.unitId === unit.id);
              return `
                <div class="gc-setup-unit-group">
                  <div class="gc-setup-unit-group-title">📁 الوحدة ${unit.id}: ${unit.title.split(':')[1] || unit.title}</div>
                  <div class="gc-setup-grid-chips">
                    ${unitLessons.map(l => {
                      const checked = setupState.selectedLessons.includes(l.id);
                      return `
                        <div class="gc-setup-chip lesson-chip ${checked ? 'selected' : ''}" data-lesson-id="${l.id}">
                          <span class="gc-chip-check">✓</span>
                          <span class="gc-chip-text">درس ${l.id}: ${l.title.split(':')[1] || l.title}</span>
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
    } else {
      selectorHTML = `
        <div class="gc-setup-info-banner">
          <p>سيتم استخدام جميع الكلمات والجمل المتاحة في المستوى الحالي (<strong>${levelData.currentLevel}</strong>) للعب.</p>
        </div>
      `;
    }

    // 3. Difficulty radios HTML
    const diffs = [
      { id: 'easy', label: 'سهل (Casual)', desc: 'وقت أطول، تلميحات مجانية، XP عادي 1.0x', color: '#10b981' },
      { id: 'medium', label: 'متوسط (Standard)', desc: 'وقت متوسط، تلميحات بنقاط، XP مضاعف 1.2x', color: '#f59e0b' },
      { id: 'hard', label: 'صعب (Challenger)', desc: 'وقت سريع، أرواح أقل، بدون تلميحات، XP ممتاز 1.5x', color: '#ef4444' }
    ];
    const difficultyHTML = `
      <div class="gc-setup-difficulty-section">
        <label class="gc-setup-section-lbl">مستوى الصعوبة والتحدي:</label>
        <div class="gc-setup-diff-cards">
          ${diffs.map(d => {
            const active = setupState.difficulty === d.id;
            return `
              <div class="gc-setup-diff-card ${active ? 'active' : ''}" data-diff="${d.id}" style="--card-border-color: ${d.color}">
                <div class="gc-diff-dot"></div>
                <div class="gc-diff-details">
                  <span class="gc-diff-name" style="color: ${d.color}">${d.label}</span>
                  <span class="gc-diff-desc">${d.desc}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 4. Sound and Validation Banner
    const soundHTML = `
      <div class="gc-setup-sound-row">
        <span>🔊 المؤثرات الصوتية للألعاب</span>
        <label class="gc-switch">
          <input type="checkbox" id="gc-sound-toggle" ${setupState.sound ? 'checked' : ''}>
          <span class="gc-slider"></span>
        </label>
      </div>
    `;

    const validationHTML = isValid
      ? `<div class="gc-setup-valid-badge">✓ محتوى جاهز: تم تحديد <strong>${poolSize}</strong> ${isVocabGame ? 'كلمة' : 'جملة'} (الحد الأدنى للعب هو ${reqSize})</div>`
      : `<div class="gc-setup-invalid-badge">⚠️ محتوى غير كافٍ: يحتوي اختيارك على <strong>${poolSize}</strong> ${isVocabGame ? 'كلمة فقط' : 'جملة فقط'} بينما تتطلب اللعبة ${GAME_REQS[game.id].label} كحد أدنى. الرجاء تحديد المزيد من الدروس!</div>`;

    mainMount.innerHTML = `
      <div class="gc-setup-container">
        <div class="gc-setup-header">
          <span class="gc-setup-game-icon">${game.icon}</span>
          <div class="gc-setup-game-info">
            <h2>إعداد اللعبة: ${game.title}</h2>
            <p>${game.description}</p>
          </div>
        </div>

        ${tabHTML}
        ${selectorHTML}
        ${difficultyHTML}
        ${soundHTML}
        ${validationHTML}

        <div class="gc-setup-actions">
          <button id="gc-start-match-btn" class="gc-start-btn" ${!isValid ? 'disabled' : ''}>
            ابدأ اللعب الآن ⚡
          </button>
        </div>
      </div>
    `;

    // Attach internal setup listeners
    // Tab toggle
    mainMount.querySelectorAll('.gc-setup-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setupState.scope = tab.dataset.scope;
        updateSetupUI();
      });
    });

    // Unit toggle chips
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

    // Lesson toggle chips
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

    // Unit bulk actions
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

    // Lesson bulk actions
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

    // Difficulty cards click
    mainMount.querySelectorAll('.gc-setup-diff-card').forEach(card => {
      card.addEventListener('click', () => {
        setupState.difficulty = card.dataset.diff;
        updateSetupUI();
      });
    });

    // Sound toggle change
    const soundToggle = document.getElementById('gc-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        setupState.sound = e.target.checked;
        setSoundEnabled(setupState.sound);
      });
    }

    // Start button
    const startBtn = document.getElementById('gc-start-match-btn');
    if (startBtn && isValid) {
      startBtn.addEventListener('click', () => {
        // Launch actual game!
        mainMount.innerHTML = `<div id="gc-game-actual-mount" class="gc-game-actual-mount"></div>`;
        const actualMount = document.getElementById('gc-game-actual-mount');
        game.launch(actualMount, {
          vocabPool,
          sentencePool,
          difficulty: setupState.difficulty,
          onWin: (score) => {
            saveGameScore(game.id, score);
            // XP calculations with difficulty multipliers
            const mults = { easy: 1.0, medium: 1.2, hard: 1.5 };
            const mult = mults[setupState.difficulty] || 1.2;
            const xpAmount = Math.min(100, Math.max(10, Math.floor(score * 1.5 * mult)));
            addXP(xpAmount);
          }
        });
      });
    }
  }

  // Renders container layout with back button and setup mount
  container.innerHTML = `
    <div class="gc-game-wrapper" id="gc-game-wrapper">
      <button class="gc-back-btn" id="gc-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        رجوع لمركز الألعاب (Back)
      </button>
      <div id="gc-game-mount"></div>
    </div>
  `;

  document.getElementById('gc-back-btn').addEventListener('click', () => {
    renderHub(container);
  });

  updateSetupUI();
}

