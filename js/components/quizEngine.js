/**
 * Quiz Engine Component
 * Egyptian English Academy
 * Strictly English UI, isolated Egyptian Arabic tutoring content.
 * Integrates Synthesized Sound Effects (SFX).
 */

import { saveQuizScore } from '../storage.js';
import { sfx } from '../audioEffects.js';
import { generateLessonQuizQuestions } from '../data/questionGenerator.js';
import { startSession } from './sessionRunner.js';

let currentLesson = null;
let currentQuestions = [];

export function initQuiz(lesson) {
  currentLesson = lesson;
  currentQuestions = generateLessonQuizQuestions(lesson);
  
  startQuizSession();
}

function startQuizSession() {
  startSession(currentQuestions, {
    mode: 'quiz',
    containerId: 'quiz-engine-root',
    onComplete: (score, total) => {
      showQuizResults(score, total);
    },
    onExit: () => {
      window.location.hash = 'roadmap';
    }
  });
}

function showQuizResults(score, total) {
  const root = document.getElementById("quiz-engine-root");
  if (!root) return;

  const passingScore = 14; // Exactly 90% (14 out of 15)
  const passed = score >= passingScore;
  
  saveQuizScore(currentLesson.id, score, total);

  let icon = "";
  let feedbackText = "";
  let actions = "";

  if (passed) {
    sfx.playCelebration();
    icon = `<svg width="88" height="88" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="var(--success)" stroke-width="3" fill="none" opacity="0.12"/>
      <circle cx="50" cy="50" r="44" stroke="var(--success)" stroke-width="4.5" fill="none"
        stroke-dasharray="276" stroke-dashoffset="0" stroke-linecap="round"
        transform="rotate(-90 50 50)" style="animation: dash-in 0.8s ease forwards;"/>
      <path d="M28 50 L43 65 L72 35" stroke="var(--success)" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
    feedbackText = `
      <h3 class="quiz-results-title-passed">Congratulations! You Passed!</h3>
      <div class="tutor-arabic-card quiz-results-tutor-card">
        <p class="ar-text quiz-results-tutor-text">
          أدائك رائع جداً يا بطل! عديت كويز الدرس بنجاح كبير، دلوقتي تقدر تسمّع كلمات الدرس في مركز الكلمات عشان تفتح الدرس الجديد!
        </p>
      </div>
    `;
    actions = `
      <a href="#roadmap" class="btn btn-primary btn-next-svg-adjust">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span>Back to Roadmap</span>
      </a>
      <a href="#vocab-center?lesson=${currentLesson.id}" class="btn btn-secondary btn-next-svg-adjust">
        <span>Recite Words</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </a>
    `;
  } else {
    sfx.playIncorrect();
    icon = `<svg width="88" height="88" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="var(--error)" stroke-width="3" fill="none" opacity="0.12"/>
      <circle cx="50" cy="50" r="44" stroke="var(--error)" stroke-width="4.5" fill="none"
        stroke-dasharray="276" stroke-dashoffset="${Math.round(276 * (1 - score/total))}" stroke-linecap="round"
        transform="rotate(-90 50 50)"/>
      <line x1="34" y1="34" x2="66" y2="66" stroke="var(--error)" stroke-width="6.5" stroke-linecap="round"/>
      <line x1="66" y1="34" x2="34" y2="66" stroke="var(--error)" stroke-width="6.5" stroke-linecap="round"/>
    </svg>`;
    feedbackText = `
      <h3 class="quiz-results-title-failed">Quiz Failed. Keep Learning!</h3>
      <div class="tutor-arabic-card quiz-results-tutor-card">
        <p class="ar-text quiz-results-tutor-text">
          ولا يهمك يا بطل، المحاولة أساس التعلم! محتاج تجيب 14 من 15 على الأقل لتخطي الدرس. راجع الشرح وعيد الكويز تاني!
        </p>
      </div>
    `;
    actions = `
      <button class="btn btn-primary btn-next-svg-adjust" onclick="window.restartQuiz()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        <span>Retry Quiz</span>
      </button>
      <a href="#lesson-viewer?id=${currentLesson.id}&tab=learn" class="btn btn-secondary btn-next-svg-adjust">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <span>Review Lesson</span>
      </a>
    `;
  }

  const xpGained = passed ? "XP +150" : "XP +30";
  const scorePercent = Math.round((score / total) * 100);

  root.innerHTML = `
    <div class="quiz-results-card">
      <div class="results-icon">${icon}</div>
      <div class="results-grade">${score} / ${total}</div>
      <div class="results-xp">${xpGained}</div>
      <div style="font-size:0.85rem; color: var(--text-muted); margin-bottom: 4px;">${scorePercent}% Accuracy</div>
      <div class="results-comment">${feedbackText}</div>
      <div class="quiz-results-actions">
        ${actions}
      </div>
    </div>
  `;

  window.restartQuiz = function() {
    initQuiz(currentLesson);
  };
}
export { showQuizResults };
