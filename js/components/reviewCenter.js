/**
 * Smart Daily Review Center Component
 * Egyptian English Academy
 * Dynamically scales and reviews completed vocabulary and skills.
 */

import { getProgress, addXP } from '../storage.js';
import { levelData } from '../levelManager.js';
import { sfx } from '../audioEffects.js';
import { getLessonExercises } from '../data/questionGenerator.js';
import { startSession } from './sessionRunner.js';

// State
let sessionQuestions = [];

export function initReviewCenter() {
  const progress = getProgress();
  const completedIds = progress.completedLessons || [];

  const container = document.getElementById("review-center-section");
  if (!container) return;

  if (completedIds.length === 0) {
    renderLockScreen(container);
    return;
  }

  // Show config panel
  renderConfigPanel(container, completedIds);
}

function renderLockScreen(container) {
  container.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">Smart Daily Review</h1>
      <p class="section-subtitle">Locked: Keep learning to unlock daily reviews!</p>
    </div>

    <div class="review-lock-card">
      <div class="review-lock-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h3 class="review-lock-title">Daily Reviews Locked</h3>
      <p class="review-lock-desc">
        You must complete at least **one full lesson** (pass its quiz AND finish vocabulary recitation) before you can start daily reviews.
      </p>
      <div class="tutor-arabic-card review-lock-arabic">
        <p class="ar-text">
          المراجعة اليومية مقفولة دلوقتي يا بطل! خلص درس واحد على الأقل (حل الكويز بتاعه وسمَّع كلماته) وهتفتحلك المراجعات فوراً عشان تراجع نطق وكتابة وتمارين الكلمات القديمة وماتنسهاش!
        </p>
      </div>
      <a href="#roadmap" class="btn btn-primary btn-next-svg-adjust">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span>Go to Roadmap</span>
      </a>
    </div>
  `;
}

function gatherAvailablePool(completedIds) {
  const vocabPool = [];
  const listeningPool = [];
  const speakingPool = [];
  const readingPool = [];
  const writingPool = [];

  completedIds.forEach(lessonId => {
    const lesson = levelData.curriculum.find(l => l.id === lessonId);
    if (!lesson) return;

    // Vocabulary
    if (lesson.vocabulary) {
      lesson.vocabulary.forEach(v => {
        vocabPool.push({
          ...v,
          lessonId: lesson.id,
          lessonTitle: lesson.title
        });
      });
    }

    // Skills practice via getLessonExercises
    getLessonExercises(lesson, 'listening').forEach(ex => {
      listeningPool.push({ ...ex, lessonId: lesson.id, lessonTitle: lesson.title });
    });
    getLessonExercises(lesson, 'speaking').forEach(ex => {
      speakingPool.push({ ...ex, lessonId: lesson.id, lessonTitle: lesson.title });
    });
    getLessonExercises(lesson, 'reading').forEach(ex => {
      readingPool.push({ ...ex, lessonId: lesson.id, lessonTitle: lesson.title });
    });
    getLessonExercises(lesson, 'writing').forEach(ex => {
      writingPool.push({ ...ex, lessonId: lesson.id, lessonTitle: lesson.title });
    });
  });

  return { vocabPool, listeningPool, speakingPool, readingPool, writingPool };
}

function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function generateReviewSession(completedIds, counts = null) {
  const { vocabPool, listeningPool, speakingPool, readingPool, writingPool } = gatherAvailablePool(completedIds);

  let numVocab, numListening, numSpeaking, numReading, numWriting;

  if (counts) {
    numVocab = counts.vocab;
    numListening = counts.listening;
    numSpeaking = counts.speaking;
    numReading = counts.reading;
    numWriting = counts.writing;
  } else {
    const N = completedIds.length;
    numVocab = Math.min(vocabPool.length, 5 + (N - 1));
    const totalSkills = Math.min(listeningPool.length + speakingPool.length + readingPool.length + writingPool.length, 3 + (N - 1));

    numListening = Math.min(listeningPool.length, Math.ceil(totalSkills / 4));
    numSpeaking = Math.min(speakingPool.length, Math.floor(totalSkills / 4));
    numReading = Math.min(readingPool.length, Math.floor(totalSkills / 4));
    numWriting = Math.min(writingPool.length, Math.max(0, totalSkills - numListening - numSpeaking - numReading));
  }

  const selectedVocab = shuffleArray(vocabPool).slice(0, numVocab);
  const selectedListening = shuffleArray(listeningPool).slice(0, numListening);
  const selectedSpeaking = shuffleArray(speakingPool).slice(0, numSpeaking);
  const selectedReading = shuffleArray(readingPool).slice(0, numReading);
  const selectedWriting = shuffleArray(writingPool).slice(0, numWriting);

  const questions = [];

  selectedVocab.forEach(v => {
    questions.push({
      type: 'vocab',
      vocabMode: Math.random() > 0.4 ? 'spelling' : 'speaking',
      lessonId: v.lessonId,
      lessonTitle: v.lessonTitle,
      data: v
    });
  });

  selectedListening.forEach(ex => {
    questions.push({ type: 'skill', skillType: 'listening', lessonId: ex.lessonId, lessonTitle: ex.lessonTitle, data: ex });
  });
  selectedSpeaking.forEach(ex => {
    questions.push({ type: 'skill', skillType: 'speaking', lessonId: ex.lessonId, lessonTitle: ex.lessonTitle, data: ex });
  });
  selectedReading.forEach(ex => {
    questions.push({ type: 'skill', skillType: 'reading', lessonId: ex.lessonId, lessonTitle: ex.lessonTitle, data: ex });
  });
  selectedWriting.forEach(ex => {
    questions.push({ type: 'skill', skillType: 'writing', lessonId: ex.lessonId, lessonTitle: ex.lessonTitle, data: ex });
  });

  return shuffleArray(questions);
}

function renderConfigPanel(container, completedIds) {
  const { vocabPool, listeningPool, speakingPool, readingPool, writingPool } = gatherAvailablePool(completedIds);

  const maxVocab = vocabPool.length;
  const maxListening = listeningPool.length;
  const maxSpeaking = speakingPool.length;
  const maxReading = readingPool.length;
  const maxWriting = writingPool.length;

  const N = completedIds.length;
  const defaultVocab = Math.min(maxVocab, 5 + (N - 1));
  const totalSkillsTarget = Math.min(maxListening + maxSpeaking + maxReading + maxWriting, 3 + (N - 1));

  const defaultListening = Math.min(maxListening, Math.ceil(totalSkillsTarget / 4));
  const defaultSpeaking = Math.min(maxSpeaking, Math.floor(totalSkillsTarget / 4));
  const defaultReading = Math.min(maxReading, Math.floor(totalSkillsTarget / 4));
  const defaultWriting = Math.min(maxWriting, Math.max(0, totalSkillsTarget - defaultListening - defaultSpeaking - defaultReading));

  const totalDefault = defaultVocab + defaultListening + defaultSpeaking + defaultReading + defaultWriting;

  container.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">Daily Review Setup</h1>
      <p class="section-subtitle">Configure your review session parameters or start the dynamic daily session.</p>
      
      <div class="tutor-arabic-card review-tutor-arabic">
        <p class="ar-text">
          خصص مراجعتك يا بطل! حدد عدد الكلمات والتمارين اللي عاوز تراجعها من كل مهارة عشان تتدرب بشكل مركز على نقاط ضعفك وتلم نقاط XP أكتر!
        </p>
      </div>
    </div>

    <div class="review-config-deck">
      <h3 class="review-config-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        <span>Review Session Parameters</span>
      </h3>

      <div class="review-config-grid">
        <div class="review-config-row">
          <div class="review-config-row-header">
            <span class="review-config-label">Vocabulary Words</span>
            <span class="review-config-value">
              Selected: <strong id="val-vocab">${defaultVocab}</strong> / ${maxVocab}
            </span>
          </div>
          <input type="range" id="slider-vocab" min="0" max="${maxVocab}" value="${defaultVocab}" class="speech-rate-slider"
                 oninput="document.getElementById('val-vocab').innerText = this.value; window.updateReviewXPPreview()">
        </div>

        <div class="review-config-row">
          <div class="review-config-row-header">
            <span class="review-config-label">Listening Exercises</span>
            <span class="review-config-value">
              Selected: <strong id="val-listening">${defaultListening}</strong> / ${maxListening}
            </span>
          </div>
          <input type="range" id="slider-listening" min="0" max="${maxListening}" value="${defaultListening}" class="speech-rate-slider"
                 oninput="document.getElementById('val-listening').innerText = this.value; window.updateReviewXPPreview()">
        </div>

        <div class="review-config-row">
          <div class="review-config-row-header">
            <span class="review-config-label">Speaking Exercises</span>
            <span class="review-config-value">
              Selected: <strong id="val-speaking">${defaultSpeaking}</strong> / ${maxSpeaking}
            </span>
          </div>
          <input type="range" id="slider-speaking" min="0" max="${maxSpeaking}" value="${defaultSpeaking}" class="speech-rate-slider"
                 oninput="document.getElementById('val-speaking').innerText = this.value; window.updateReviewXPPreview()">
        </div>

        <div class="review-config-row">
          <div class="review-config-row-header">
            <span class="review-config-label">Reading Exercises</span>
            <span class="review-config-value">
              Selected: <strong id="val-reading">${defaultReading}</strong> / ${maxReading}
            </span>
          </div>
          <input type="range" id="slider-reading" min="0" max="${maxReading}" value="${defaultReading}" class="speech-rate-slider"
                 oninput="document.getElementById('val-reading').innerText = this.value; window.updateReviewXPPreview()">
        </div>

        <div class="review-config-row">
          <div class="review-config-row-header">
            <span class="review-config-label">Writing Exercises</span>
            <span class="review-config-value">
              Selected: <strong id="val-writing">${defaultWriting}</strong> / ${maxWriting}
            </span>
          </div>
          <input type="range" id="slider-writing" min="0" max="${maxWriting}" value="${defaultWriting}" class="speech-rate-slider"
                 oninput="document.getElementById('val-writing').innerText = this.value; window.updateReviewXPPreview()">
        </div>
      </div>

      <div class="review-summary-box">
        <div>
          <div class="review-summary-label">Total Questions:</div>
          <div class="review-summary-value" id="preview-total-questions">${totalDefault}</div>
        </div>
        <div class="review-summary-right">
          <div class="review-summary-label">Estimated XP Reward:</div>
          <div class="review-summary-xp" id="preview-total-xp">+${totalDefault * 10} XP</div>
        </div>
      </div>

      <div class="review-actions-wrapper">
        <button class="btn btn-secondary btn-next-svg-adjust" onclick="window.startDefaultReviewSession()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span>Quick Start</span>
        </button>
        <button class="btn btn-primary btn-next-svg-adjust" onclick="window.startCustomReviewSession()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          <span>Start Custom Session</span>
        </button>
      </div>
    </div>
  `;

  window.updateReviewXPPreview = function() {
    const vocab = parseInt(document.getElementById('slider-vocab').value) || 0;
    const listening = parseInt(document.getElementById('slider-listening').value) || 0;
    const speaking = parseInt(document.getElementById('slider-speaking').value) || 0;
    const reading = parseInt(document.getElementById('slider-reading').value) || 0;
    const writing = parseInt(document.getElementById('slider-writing').value) || 0;

    const total = vocab + listening + speaking + reading + writing;
    document.getElementById('preview-total-questions').innerText = total;
    document.getElementById('preview-total-xp').innerText = `+${total * 10} XP`;
  };

  window.startDefaultReviewSession = function() {
    sessionQuestions = generateReviewSession(completedIds);
    runReviewSession();
  };

  window.startCustomReviewSession = function() {
    const vocab = parseInt(document.getElementById('slider-vocab').value) || 0;
    const listening = parseInt(document.getElementById('slider-listening').value) || 0;
    const speaking = parseInt(document.getElementById('slider-speaking').value) || 0;
    const reading = parseInt(document.getElementById('slider-reading').value) || 0;
    const writing = parseInt(document.getElementById('slider-writing').value) || 0;

    if (vocab + listening + speaking + reading + writing === 0) {
      alert("Please select at least 1 question to review!");
      return;
    }

    sessionQuestions = generateReviewSession(completedIds, {
      vocab,
      listening,
      speaking,
      reading,
      writing
    });
    runReviewSession();
  };
}

function runReviewSession() {
  startSession(sessionQuestions, {
    mode: 'review',
    containerId: 'review-center-section',
    onComplete: (score, total) => {
      const xpEarned = score * 10;
      renderCompletionScreen(xpEarned, total, score);
    },
    onExit: () => {
      window.location.hash = '#dashboard';
    }
  });
}

function renderCompletionScreen(xpEarned, totalCount, score) {
  sfx.playCelebration();
  addXP(xpEarned);

  const container = document.getElementById("review-center-section");
  if (!container) return;

  const pct = totalCount > 0 ? Math.round((score / totalCount) * 100) : 0;
  const wrongCount = totalCount - score;

  // Determine performance tier
  let tierColor = 'var(--error)';
  let tierLabel = 'Needs Practice';
  let tierAr = 'ذاكر أكتر يا بطل!';
  let svgDashOffset = Math.round(283 * (1 - pct / 100));

  if (pct >= 85) {
    tierColor = 'var(--success)';
    tierLabel = 'Excellent!';
    tierAr = 'الله ينور يا بطل! مراجعتك ممتازة جداً!';
  } else if (pct >= 60) {
    tierColor = 'var(--warning, #f59e0b)';
    tierLabel = 'Good Progress';
    tierAr = 'كويس يا بطل! في شوية غلطات راجع عليها!';
  }

  container.innerHTML = `
    <div class="section-header">
      <h1 class="section-title">Daily Review Complete</h1>
      <p class="section-subtitle">Your performance summary for this session</p>
    </div>

    <div class="quiz-results-card" style="max-width: 520px; margin: 0 auto;">

      <!-- Circular score SVG -->
      <div class="results-icon" style="margin-bottom: 8px; position: relative; display: inline-block;">
        <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="${tierColor}" stroke-width="3" fill="none" opacity="0.12"/>
          <circle cx="50" cy="50" r="45" stroke="${tierColor}" stroke-width="5" fill="none"
            stroke-dasharray="283" stroke-dashoffset="${svgDashOffset}" stroke-linecap="round"
            transform="rotate(-90 50 50)"/>
          <text x="50" y="45" text-anchor="middle" fill="${tierColor}" font-size="20" font-weight="700" font-family="Outfit, sans-serif">${pct}%</text>
          <text x="50" y="61" text-anchor="middle" fill="var(--text-muted)" font-size="9" font-family="Outfit, sans-serif">ACCURACY</text>
        </svg>
      </div>

      <h2 style="font-size: 1.4rem; font-weight: 700; color: ${tierColor}; margin: 4px 0 12px;">${tierLabel}</h2>

      <!-- Stats row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0 20px; text-align: center;">
        <div style="background: var(--bg-tertiary); border-radius: 10px; padding: 12px 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${totalCount}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Total</div>
        </div>
        <div style="background: var(--bg-tertiary); border-radius: 10px; padding: 12px 8px; border: 1px solid rgba(34,197,94,0.3);">
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${score}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Correct</div>
        </div>
        <div style="background: var(--bg-tertiary); border-radius: 10px; padding: 12px 8px; border: 1px solid rgba(239,68,68,0.3);">
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--error);">${wrongCount}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Wrong</div>
        </div>
      </div>

      <!-- XP gained badge -->
      <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 20px; padding: 6px 18px; color: white; font-weight: 700; font-size: 0.95rem; margin-bottom: 16px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        +${xpEarned} XP Earned
      </div>

      <div class="tutor-arabic-card review-complete-arabic" style="margin-bottom: 20px;">
        <p class="ar-text">${tierAr}</p>
      </div>

      <div class="review-complete-actions">
        <button class="btn btn-primary btn-next-svg-adjust" onclick="window.startNewReviewSession()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          <span>New Review Session</span>
        </button>
        <a href="#roadmap" class="btn btn-secondary btn-next-svg-adjust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          <span>Back to Roadmap</span>
        </a>
      </div>
    </div>
  `;

  window.startNewReviewSession = function() {
    initReviewCenter();
  };
}
