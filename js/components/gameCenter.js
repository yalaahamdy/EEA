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
export function buildVocabPool() {
  const pool = [];
  (levelData.curriculum || []).forEach(lesson => {
    (lesson.vocabulary || []).forEach(v => {
      // Support both field name conventions
      const english = v.word || v.english;
      const arabic  = v.translation || v.arabic;
      if (english && arabic) {
        pool.push({ english, arabic, lessonId: lesson.id });
      }
    });
  });
  return pool;
}

// ── Extract dialogues / sentences from curriculum ──────────────────────────
export function buildSentencePool() {
  const pool = [];
  (levelData.curriculum || []).forEach(lesson => {
    // dialogue.lines or dialogue.exchanges
    const dialogueLines = lesson.dialogue?.lines || lesson.dialogue?.exchanges || [];
    dialogueLines.forEach(line => {
      const text = line.english || line.en || line.line;
      if (text && text.split(' ').length >= 4) {
        pool.push({ sentence: text, lessonId: lesson.id });
      }
    });
    // practice exercises
    const exercises = lesson.practice?.exercises || [];
    exercises.forEach(ex => {
      if (ex.sentence && ex.sentence.split(' ').length >= 4) {
        pool.push({ sentence: ex.sentence, lessonId: lesson.id });
      }
      if (ex.question && ex.question.split(' ').length >= 4) {
        pool.push({ sentence: ex.question, lessonId: lesson.id });
      }
    });
  });
  return pool;
}

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
    description: 'Translate 10 words against a ticking clock. Score multipliers for fast answers. Can you beat the high score?',
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

  // If a specific game is requested via ?game=xxx
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

  // Attach click listeners
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

// ── Game Launcher ──────────────────────────────────────────────────────────
function launchGame(game, container) {
  container.innerHTML = `
    <div class="gc-game-wrapper" id="gc-game-wrapper">
      <button class="gc-back-btn" id="gc-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Back to Game Center
      </button>
      <div id="gc-game-mount"></div>
    </div>
  `;

  document.getElementById('gc-back-btn').addEventListener('click', () => {
    renderHub(container);
  });

  const mount = document.getElementById('gc-game-mount');
  game.launch(mount, {
    vocabPool: buildVocabPool(),
    sentencePool: buildSentencePool(),
    onWin: (score) => {
      saveGameScore(game.id, score);
      const xpAmount = Math.min(80, Math.max(10, Math.floor(score * 1.5)));
      addXP(xpAmount);
    },
  });
}
