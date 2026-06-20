/**
 * Practice Engine Component
 * Egyptian English Academy
 * Strictly English UI, isolated Egyptian Arabic tutoring content.
 * Integrates Synthesized Sound Effects (SFX).
 */

import { speakText } from './lessonViewer.js';
import { addXP, completePractice } from '../storage.js';
import { sfx } from '../audioEffects.js';
import { getLessonExercises } from '../data/questionGenerator.js';

let currentLesson = null;
let currentSkill = 'listening'; // listening, speaking, reading, writing

// State for exercises
let listeningIndex = 0;
let speakingIndex = 0;
let readingIndex = 0;
let writingIndex = 0;

let currentLessonExercises = {
  listening: [],
  speaking: [],
  reading: [],
  writing: []
};

// Scramble writing state
let scrambleSelectedWords = [];
let sentenceTypedText = "";

// Speech recognition module state
let isRecording = false;
let recognition = null;

export function initPractice(lesson) {
  currentLesson = lesson;
  currentSkill = 'listening';
  listeningIndex = 0;
  speakingIndex = 0;
  readingIndex = 0;
  writingIndex = 0;
  scrambleSelectedWords = [];
  sentenceTypedText = "";
  
  // Cache generated 10 questions per skill
  currentLessonExercises.listening = getLessonExercises(lesson, 'listening');
  currentLessonExercises.speaking = getLessonExercises(lesson, 'speaking');
  currentLessonExercises.reading = getLessonExercises(lesson, 'reading');
  currentLessonExercises.writing = getLessonExercises(lesson, 'writing');
  
  renderPracticeFrame();
}

function renderPracticeFrame() {
  const root = document.getElementById("practice-engine-root");
  if (!root) return;

  const isSpeakingDisabled = localStorage.getItem("academy_speaking_disabled") === "true";
  
  root.innerHTML = `
    <div class="practice-layout">
      <!-- Skill Tabs Selector (Strictly English UI) -->
      <div class="practice-menu">
        <button class="practice-menu-btn ${currentSkill === 'listening' ? 'active' : ''}" onclick="window.changeSkill('listening')">
          <span class="skill-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
          </span>
          <span>Listening</span>
        </button>
        ${isSpeakingDisabled ? '' : `
        <button class="practice-menu-btn ${currentSkill === 'speaking' ? 'active' : ''}" onclick="window.changeSkill('speaking')">
          <span class="skill-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"></path></svg>
          </span>
          <span>Speaking</span>
        </button>
        `}
        <button class="practice-menu-btn ${currentSkill === 'reading' ? 'active' : ''}" onclick="window.changeSkill('reading')">
          <span class="skill-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </span>
          <span>Reading</span>
        </button>
        <button class="practice-menu-btn ${currentSkill === 'writing' ? 'active' : ''}" onclick="window.changeSkill('writing')">
          <span class="skill-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </span>
          <span>Writing</span>
        </button>
      </div>

      <!-- Skill Panels Container -->
      <div id="listening-panel" class="practice-panel ${currentSkill === 'listening' ? 'active' : ''}"></div>
      ${isSpeakingDisabled ? '' : '<div id="speaking-panel" class="practice-panel ' + (currentSkill === 'speaking' ? 'active' : '') + '"></div>'}
      <div id="reading-panel" class="practice-panel ${currentSkill === 'reading' ? 'active' : ''}"></div>
      <div id="writing-panel" class="practice-panel ${currentSkill === 'writing' ? 'active' : ''}"></div>
    </div>
  `;

  updateActivePanel();
}

function updateActivePanel() {
  document.querySelectorAll('.practice-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.practice-menu-btn').forEach(b => b.classList.remove('active'));
  
  const activePanel = document.getElementById(`${currentSkill}-panel`);
  if (activePanel) activePanel.classList.add('active');
  
  const tabIndex = ['listening', 'speaking', 'reading', 'writing'].indexOf(currentSkill);
  const tabs = document.querySelectorAll('.practice-menu-btn');
  if (tabs[tabIndex]) tabs[tabIndex].classList.add('active');

  if (currentSkill === 'listening') {
    renderListeningExercise();
  } else if (currentSkill === 'speaking') {
    renderSpeakingExercise();
  } else if (currentSkill === 'reading') {
    renderReadingExercise();
  } else if (currentSkill === 'writing') {
    renderWritingExercise();
  }
}

window.changeSkill = function(skill) {
  currentSkill = skill;
  scrambleSelectedWords = [];
  sentenceTypedText = "";
  updateActivePanel();
};

/* ==========================================================================
   1. Listening Section Logic
   ========================================================================== */
function renderListeningExercise() {
  const panel = document.getElementById("listening-panel");
  if (!panel) return;

  const exercises = currentLessonExercises.listening;
  if (!exercises || exercises.length === 0) {
    panel.innerHTML = `<p>No listening exercises available for this lesson.</p>`;
    return;
  }

  const ex = exercises[listeningIndex];

  panel.innerHTML = `
    <div class="practice-title-wrapper">
      <h3 class="practice-panel-title">Exercise ${listeningIndex + 1} of ${exercises.length}: Listen & Match</h3>
      <p class="practice-desc-text">Click the audio speaker icon to listen, then select the matching word you hear.</p>
      
      <div class="tutor-arabic-card practice-tutor-wrapper">
        <p class="ar-text practice-tutor-text">اسمع النطق كويس واختار الكلمة اللي سمعتها!</p>
      </div>
    </div>

    <div class="listening-body">
      <!-- Giant Speaker Button -->
      <button class="listen-main-btn" onclick="speakText('${ex.text.replace(/'/g, "\\'")}')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      </button>
      
      <!-- Options List -->
      <div class="listen-options-grid">
        ${ex.options.map((opt, idx) => `
          <button class="listen-option-card" onclick="window.checkListeningAnswer(${idx})">${opt}</button>
        `).join('')}
      </div>

      <div id="listening-feedback" class="practice-feedback-bar"></div>

      <div class="section-nav-footer practice-nav-footer">
        <button class="btn btn-secondary" onclick="window.prevListening()" ${listeningIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary btn-next-svg-adjust" id="btn-next-listening" onclick="window.nextListening()">
          <span>Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;
}

window.checkListeningAnswer = function(idx) {
  const exercises = currentLessonExercises.listening;
  const ex = exercises[listeningIndex];
  const selectedOption = ex.options[idx];
  const feedback = document.getElementById("listening-feedback");
  const nextBtn = document.getElementById("btn-next-listening");
  
  if (!feedback) return;

  document.querySelectorAll('.listen-option-card').forEach((btn, bIdx) => {
    btn.disabled = true;
    if (bIdx === idx) {
      btn.classList.add('selected');
    }
  });

  if (selectedOption === ex.answer) {
    addXP(10);
    feedback.className = "practice-feedback-bar correct";
    feedback.innerHTML = `
      <h4 class="feedback-title-correct">Correct Answer! +10 XP</h4>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">الله ينور يا بطل! إجابة صحيحة وسماحك مية مية.</p>
      </div>
    `;
  } else {
    sfx.playIncorrect();
    feedback.className = "practice-feedback-bar incorrect";
    feedback.innerHTML = `
      <h4 class="feedback-title-incorrect">Incorrect. Try Again!</h4>
      <div class="tutor-arabic-card practice-tutor-incorrect-feedback">
        <p class="ar-text practice-tutor-text">تلميح المدرس: ${ex.hint}</p>
      </div>
    `;
  }
  
  if (nextBtn) nextBtn.disabled = false;
};

window.nextListening = function() {
  const exercises = currentLessonExercises.listening;
  if (listeningIndex < exercises.length - 1) {
    listeningIndex++;
    renderListeningExercise();
  } else {
    if (localStorage.getItem("academy_speaking_disabled") === "true") {
      window.changeSkill('reading');
    } else {
      window.changeSkill('speaking');
    }
  }
};

window.prevListening = function() {
  if (listeningIndex > 0) {
    listeningIndex--;
    renderListeningExercise();
  }
};

/* ==========================================================================
   2. Speaking Section Logic
   ========================================================================== */
function renderSpeakingExercise() {
  const panel = document.getElementById("speaking-panel");
  if (!panel) return;

  const exercises = currentLessonExercises.speaking;
  if (!exercises || exercises.length === 0) {
    panel.innerHTML = `<p>No speaking exercises available for this lesson.</p>`;
    return;
  }

  const ex = exercises[speakingIndex];

  panel.innerHTML = `
    <div class="practice-title-wrapper">
      <h3 class="practice-panel-title">Exercise ${speakingIndex + 1} of ${exercises.length}: Speech Training</h3>
      <p class="practice-desc-text">Look at the Arabic dialogue line, translate it, and speak the English equivalent clearly.</p>
      
      <div class="tutor-arabic-card practice-tutor-wrapper">
        <p class="ar-text practice-tutor-text">اقرأ الجملة العربية، وسمّع الترجمة الإنجليزية المقابلة ليها في المايك!</p>
      </div>
    </div>

    <div class="speaking-body">
      <div class="speak-prompt-card">
        <!-- Display ONLY the Arabic translation to test the user's recall -->
        <div class="speak-target-phrase practice-writing-prompt">
          "${ex.translation}"
        </div>
        
        <!-- Toggle button to show the English phrase hint if the user gets stuck -->
        <div id="speaking-hint-container" class="vocab-input-wrapper">
          <button class="btn btn-secondary btn-sm-padding btn-hint-svg-adjust" id="btn-show-speaking-hint" onclick="window.showSpeakingHint()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Show English Hint</span>
          </button>
          <div id="speaking-english-hint" class="practice-speaking-hint">
            ${ex.text}
          </div>
        </div>

      </div>

      <!-- Microphone Section -->
      <div class="mic-section">
        <button class="speak-btn" onclick="speakText('${ex.text.replace(/'/g, "\\'")}')" title="Listen Example">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>

        <button class="mic-btn" id="speaking-mic-button" onclick="window.toggleSpeechRecognition()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </button>
        <div class="speech-waves-visualizer">
          <div class="speech-wave-bar"></div>
          <div class="speech-wave-bar"></div>
          <div class="speech-wave-bar"></div>
          <div class="speech-wave-bar"></div>
          <div class="speech-wave-bar"></div>
        </div>
      </div>
      
        <p id="speaking-status-text" class="practice-speaking-status">Click mic to speak</p>

      <!-- Fallback Input Option -->
      <div class="practice-separator-box">
        <p class="practice-separator-text">
          *If mic is unavailable, listen and type the phrase below to verify spelling:*
        </p>
        <input type="text" id="speaking-text-fallback" class="speaking-fallback-input" placeholder="Type what you hear..." oninput="window.checkSpeakingFallback(this.value)">
      </div>

      <div id="speaking-feedback" class="practice-feedback-bar"></div>

      <div class="section-nav-footer practice-nav-footer">
        <button class="btn btn-secondary" onclick="window.prevSpeaking()" ${speakingIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary btn-next-svg-adjust" id="btn-next-speaking" onclick="window.nextSpeaking()">
          <span>Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;
}

window.showSpeakingHint = function() {
  const hintEl = document.getElementById("speaking-english-hint");
  const btn = document.getElementById("btn-show-speaking-hint");
  if (hintEl && btn) {
    const isActive = hintEl.classList.toggle("active");
    btn.innerHTML = isActive 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> <span>Hide English Hint</span>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>Show English Hint</span>`;
  }
};

window.toggleSpeechRecognition = function() {
  const micBtn = document.getElementById("speaking-mic-button");
  const statusTxt = document.getElementById("speaking-status-text");
  const feedback = document.getElementById("speaking-feedback");
  const nextBtn = document.getElementById("btn-next-speaking");
  
  if (!micBtn || !statusTxt) return;

  const targetPhrase = currentLessonExercises.speaking[speakingIndex].text;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    statusTxt.innerText = "Speech Recognition not supported in this browser. Use typing fallback below!";
    return;
  }

  if (isRecording) {
    if (recognition) recognition.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
    statusTxt.innerText = "Analyzing speech...";
    return;
  }

  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
      isRecording = true;
      micBtn.classList.add('recording');
      statusTxt.innerText = "Listening... Speak now!";
    };

    recognition.onerror = function(event) {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        statusTxt.innerText = "Microphone permission denied. Please enable mic access in your browser settings!";
      } else {
        statusTxt.innerText = "Microphone error: " + event.error + ". Try typing below!";
      }
      isRecording = false;
      micBtn.classList.remove('recording');
    };

    recognition.onend = function() {
      isRecording = false;
      micBtn.classList.remove('recording');
    };

    recognition.onresult = function(event) {
      const result = event.results[0][0].transcript;
      statusTxt.innerHTML = `You said: <strong>"${result}"</strong>`;
      
      const cleanTarget = targetPhrase.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const cleanResult = result.toLowerCase().replace(/[^\w\s]/g, "").trim();
      
      const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
      const resultWords = cleanResult.split(/\s+/).filter(Boolean);
      
      let matchCount = 0;
      targetWords.forEach(tWord => {
        const found = resultWords.some(rWord => {
          if (rWord === tWord) return true;
          if (tWord.length > 3 && rWord.length > 3) {
            return rWord.startsWith(tWord.substring(0, tWord.length - 1)) || 
                   tWord.startsWith(rWord.substring(0, rWord.length - 1));
          }
          return false;
        });
        if (found) matchCount++;
      });
      
      const matchRatio = matchCount / targetWords.length;
      const lengthRatio = resultWords.length / targetWords.length;
      const isMatch = cleanResult === cleanTarget || (matchRatio >= 1 && lengthRatio >= 0.7 && lengthRatio <= 1.4);
      
      if (isMatch) {
        sfx.playCorrect();
        feedback.className = "practice-feedback-bar correct";
        feedback.innerHTML = `
          <h4 class="feedback-title-correct">Excellent Pronunciation! +15 XP</h4>
          <div class="tutor-arabic-card practice-tutor-inline-card">
            <p class="ar-text practice-tutor-text">يا واد يا لعيب! نطقك ممتاز جداً وزي الأجانب بالظبط.</p>
          </div>
        `;
        addXP(15);
      } else {
        sfx.playIncorrect();
        feedback.className = "practice-feedback-bar incorrect";
        feedback.innerHTML = `
          <h4 class="feedback-title-incorrect">Pronunciation differs. Try again!</h4>
          <div class="tutor-arabic-card practice-tutor-inline-card">
            <p class="ar-text practice-tutor-text">اسمع نطق المعلم فوق تاني وقلده بالظبط عشان تظبط مخارج الحروف.</p>
          </div>
        `;
      }
      if (nextBtn) nextBtn.disabled = false;
    };

    recognition.start();

  } catch (e) {
    console.error(e);
    statusTxt.innerText = "Failed to launch voice module.";
  }
};

window.checkSpeakingFallback = function(val) {
  const targetPhrase = currentLessonExercises.speaking[speakingIndex].text;
  const feedback = document.getElementById("speaking-feedback");
  const nextBtn = document.getElementById("btn-next-speaking");
  if (!feedback) return;

  const cleanTarget = targetPhrase.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const cleanInput = val.toLowerCase().replace(/[^\w\s]/g, "").trim();

  if (cleanInput === cleanTarget) {
    sfx.playCorrect();
    feedback.className = "practice-feedback-bar correct";
    feedback.innerHTML = `
      <h4 class="feedback-title-correct">Correct spelling! +10 XP</h4>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">الله ينور! كتبتها صحيحة ومية مية.</p>
      </div>
    `;
    addXP(10);
    if (nextBtn) nextBtn.disabled = false;
  } else {
    feedback.className = "practice-feedback-bar hidden"; // Using class instead of inline styles
  }
};

window.nextSpeaking = function() {
  const exercises = currentLessonExercises.speaking;
  if (speakingIndex < exercises.length - 1) {
    speakingIndex++;
    renderSpeakingExercise();
  } else {
    window.changeSkill('reading');
  }
};

window.prevSpeaking = function() {
  if (speakingIndex > 0) {
    speakingIndex--;
    renderSpeakingExercise();
  }
};

/* ==========================================================================
   3. Reading Section Logic
   ========================================================================== */
function renderReadingExercise() {
  const panel = document.getElementById("reading-panel");
  if (!panel) return;

  const exercises = currentLessonExercises.reading;
  if (!exercises || exercises.length === 0) {
    panel.innerHTML = `<p>No reading comprehension available for this lesson.</p>`;
    return;
  }

  const ex = exercises[readingIndex];

  panel.innerHTML = `
    <div class="practice-title-wrapper">
      <h3 class="practice-panel-title">Exercise ${readingIndex + 1} of ${exercises.length}: Reading Comprehension</h3>
      <p class="practice-desc-text">Read the passage on the left, then select the correct answer to the question on the right.</p>
      
      <div class="tutor-arabic-card practice-tutor-wrapper">
        <p class="ar-text practice-tutor-text">اقرأ النص كويس، وجاوب على السؤال اللي على اليمين!</p>
      </div>
    </div>

    <div class="reading-body">
      <!-- Left side: Text Passage -->
      <div class="reading-passage-box" style="margin-bottom: 0;">
        ${ex.passage || ""}
      </div>

      <!-- Right side: Active Question & Options -->
      <div class="reading-questions-box">
        <div class="reading-q-card">
          <h4 class="practice-reading-question-title" style="direction: ltr; text-align: left;">
            ${ex.q}
          </h4>
          <div class="reading-options-list">
            ${ex.options.map((opt, idx) => `
              <button class="reading-option-btn" id="reading-opt-${idx}" 
                      onclick="window.selectReadingAnswer(${idx})">
                ${opt}
              </button>
            `).join('')}
          </div>
          <div class="practice-feedback-bar" id="reading-feedback"></div>
        </div>
      </div>
    </div>

    <div class="section-nav-footer practice-nav-footer">
      <button class="btn btn-secondary" onclick="window.prevReading()" ${readingIndex === 0 ? 'disabled' : ''}>Previous</button>
      <button class="btn btn-primary btn-next-svg-adjust" id="btn-next-reading" onclick="window.nextReading()">
        <span>Next</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </div>
  `;
}

window.selectReadingAnswer = function(oIdx) {
  const exercises = currentLessonExercises.reading;
  const ex = exercises[readingIndex];
  const opt = ex.options[oIdx];
  const feedback = document.getElementById("reading-feedback");
  const nextBtn = document.getElementById("btn-next-reading");
  
  if (!feedback) return;

  document.querySelectorAll('.reading-option-btn').forEach((btn, bIdx) => {
    btn.disabled = true;
    if (bIdx === oIdx) {
      btn.classList.add('selected');
    }
  });

  if (opt === ex.answer) {
    sfx.playCorrect();
    feedback.className = "practice-feedback-bar correct";
    feedback.innerHTML = `
      <h5 class="feedback-title-correct">Correct! +10 XP</h5>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">صح يا بطل! الشرح: ${ex.explanation || `الإجابة هي "${ex.answer}"`}</p>
      </div>
    `;
    addXP(10);
  } else {
    sfx.playIncorrect();
    feedback.className = "practice-feedback-bar incorrect";
    feedback.innerHTML = `
      <h5 class="feedback-title-incorrect">Incorrect</h5>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">الإجابة غير صحيحة. الشرح: ${ex.explanation || `الإجابة الصحيحة هي "${ex.answer}"`}</p>
      </div>
    `;
  }

  if (nextBtn) {
    nextBtn.disabled = false;
  }
};

window.nextReading = function() {
  const exercises = currentLessonExercises.reading;
  if (readingIndex < exercises.length - 1) {
    readingIndex++;
    renderReadingExercise();
  } else {
    window.changeSkill('writing');
  }
};

window.prevReading = function() {
  if (readingIndex > 0) {
    readingIndex--;
    renderReadingExercise();
  }
};

/* ==========================================================================
   4. Writing Section Logic
   ========================================================================== */
function renderWritingExercise() {
  const panel = document.getElementById("writing-panel");
  if (!panel) return;

  const exercises = currentLessonExercises.writing;
  if (!exercises || exercises.length === 0) {
    panel.innerHTML = `<p>No writing exercises available.</p>`;
    return;
  }

  const ex = exercises[writingIndex];

  if (ex.words || ex.correct) {
    renderScrambleWriting(ex, panel, exercises.length);
  } else {
    renderFillBlanksWriting(ex, panel, exercises.length);
  }
}

function generateSentenceSlots(typedText, correctSentence) {
  let result = '';
  for (let i = 0; i < correctSentence.length; i++) {
    const tc = correctSentence[i];
    if (tc === ' ') {
      result += '<span class="slot-letter-space">&nbsp;</span>';
    } else if (/[a-zA-Z0-9]/.test(tc)) {
      if (i < typedText.length) {
        result += `<span class="slot-letter typed">${typedText[i]}</span>`;
      } else {
        result += `<span class="slot-letter empty">-</span>`;
      }
    } else {
      // Punctuation
      result += `<span class="slot-letter punctuation">${tc}</span>`;
    }
  }
  return result;
}

function getWordSpellingFeedback(inputWord, targetWord) {
  if (!inputWord) {
    return "اكتب الكلمة!";
  }

  let diffIndex = -1;
  const minLen = Math.min(inputWord.length, targetWord.length);
  for (let i = 0; i < minLen; i++) {
    if (inputWord[i] !== targetWord[i]) {
      diffIndex = i;
      break;
    }
  }

  const ordinalsAr = {
    1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
    6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر",
    11: "الحادي عشر", 12: "الثاني عشر", 13: "الثالث عشر", 14: "الرابع عشر"
  };
  const getOrdinal = (n) => ordinalsAr[n] || `الـ ${n}`;

  if (diffIndex === -1 && inputWord.length < targetWord.length) {
    return `ناقصة! الحرف ${getOrdinal(inputWord.length + 1)} ناقص في الكلمة دي.`;
  }

  if (diffIndex === -1 && inputWord.length > targetWord.length) {
    return `فيها حروف زيادة! شيل الحروف اللي بعد الحرف ${getOrdinal(targetWord.length)}.`;
  }

  const pos = diffIndex + 1;
  if (inputWord.length === targetWord.length) {
    return `الحرف ${getOrdinal(pos)} خطأ! (كتبت "${inputWord[diffIndex]}" والمفروض يكون حرف تاني)`;
  }

  const inputRest = inputWord.substring(diffIndex);
  const targetRestWithSkip = targetWord.substring(diffIndex + 1);
  if (inputRest === targetRestWithSkip || targetRestWithSkip.startsWith(inputRest)) {
    return `الحرف ${getOrdinal(pos)} ناقص في نص الكلمة!`;
  }

  const inputRestWithSkip = inputWord.substring(diffIndex + 1);
  const targetRest = targetWord.substring(diffIndex);
  if (inputRestWithSkip === targetRest || targetRest.startsWith(inputRestWithSkip)) {
    return `الحرف ${getOrdinal(pos)} زيادة! (في حرف زيادة في النص: "${inputWord[diffIndex]}")`;
  }

  return `الحرف ${getOrdinal(pos)} خطأ!`;
}

function getSentenceSpellingFeedback(inputSentence, targetSentence) {
  const cleanInput = inputSentence.trim();
  const cleanTarget = targetSentence.trim();

  if (!cleanInput) {
    return "اكتب الجملة يا بطل!";
  }

  const cleanWord = (w) => w.toLowerCase().replace(/[^\w]/g, '').trim();
  const targetWords = cleanTarget.split(/\s+/).map(cleanWord).filter(Boolean);
  const inputWords = cleanInput.split(/\s+/).map(cleanWord).filter(Boolean);

  const wordOrdinalsAr = {
    1: "الأولى", 2: "الثانية", 3: "الثالثة", 4: "الرابعة", 5: "الخامسة",
    6: "السادسة", 7: "السابعة", 8: "الثامنة", 9: "التاسعة", 10: "العاشرة"
  };
  const getWordOrdinal = (n) => wordOrdinalsAr[n] || `الـ ${n}`;

  for (let i = 0; i < targetWords.length; i++) {
    const tWord = targetWords[i];
    const iWord = inputWords[i];

    if (!iWord) {
      return `أكمل الجملة يا بطل! الكلمة ${getWordOrdinal(i + 1)} ناقصة.`;
    }

    if (iWord !== tWord) {
      const wordErrorDetails = getWordSpellingFeedback(iWord, tWord);
      return `الكلمة ${getWordOrdinal(i + 1)} ("${iWord}") فيها خطأ: ${wordErrorDetails}`;
    }
  }

  if (inputWords.length > targetWords.length) {
    return `الجملة فيها كلمات زيادة في الآخر!`;
  }

  if (cleanInput.toLowerCase().replace(/[^\w\s]/g, '') !== cleanTarget.toLowerCase().replace(/[^\w\s]/g, '')) {
    return `تأكد من كتابة الكلمات بالترتيب الصحيح وبنفس الأحرف!`;
  }

  return null;
}

function findSentenceTranslation(correctSentence) {
  const norm = (s) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const targetNorm = norm(correctSentence);

  const checkMatch = (text) => {
    const textNorm = norm(text);
    return textNorm === targetNorm || textNorm.startsWith(targetNorm) || targetNorm.startsWith(textNorm);
  };

  // 1. Look in speaking practice
  if (currentLesson && currentLesson.practice && currentLesson.practice.speaking) {
    const speakEx = currentLesson.practice.speaking.find(s => checkMatch(s.text));
    if (speakEx && speakEx.translation) {
      return speakEx.translation;
    }
  }

  // 2. Look in dialogue
  if (currentLesson && currentLesson.dialogue && currentLesson.dialogue.lines) {
    const dialLine = currentLesson.dialogue.lines.find(l => checkMatch(l.text));
    if (dialLine && dialLine.translation) {
      return dialLine.translation;
    }
  }

  return null;
}

function renderScrambleWriting(ex, panel, total) {
  const correctSentence = ex.correct.join(' ');

  let arabicTranslation = "";
  const parenMatch = ex.prompt.match(/\(([^)]+)\)/);
  if (parenMatch) {
    arabicTranslation = parenMatch[1];
  } else {
    const found = findSentenceTranslation(correctSentence);
    if (found) {
      arabicTranslation = found;
    } else {
      if (ex.prompt && !ex.prompt.includes("رتب الكلمات")) {
        arabicTranslation = ex.prompt;
      } else {
        arabicTranslation = "اكتب الجملة بالإنجليزية:";
      }
    }
  }

  panel.innerHTML = `
    <div class="practice-title-wrapper">
      <h3 class="practice-panel-title">Exercise ${writingIndex + 1} of ${total}: Sentence Writer</h3>
      <p class="practice-desc-text">Type the English sentence. Pay attention to the word lengths shown below.</p>
      
      <div class="tutor-arabic-card practice-tutor-wrapper">
        <p class="ar-text practice-tutor-text">اكتب الجملة كاملة بالإنجليزية المطابقة للشرح العربي بالأسفل!</p>
      </div>
    </div>

    <div class="writing-body">
      <div class="writing-prompt ar-text practice-writing-prompt">${arabicTranslation}</div>

      <!-- Slots display -->
      <div class="sentence-slots-container" id="sentence-slots-tray">
        ${generateSentenceSlots(sentenceTypedText, correctSentence)}
      </div>

      <!-- Input box -->
      <input type="text" id="sentence-input-field" class="speaking-fallback-input practice-sentence-input" 
             placeholder="Type the sentence here..." autocomplete="off" 
             autocorrect="off" autocapitalize="off" spellcheck="false"
             value="${sentenceTypedText.replace(/"/g, '&quot;')}"
             oninput="window.onSentenceInput(this.value)"
             onkeydown="if(event.key==='Enter') window.checkScrambleAnswer()">

      <div class="practice-margin-top-lg">
        <button class="btn btn-accent btn-next-svg-adjust" onclick="window.checkScrambleAnswer()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Check Answer</span>
        </button>
      </div>

      <div id="writing-feedback" class="practice-feedback-bar"></div>

      <div class="section-nav-footer practice-nav-footer">
        <button class="btn btn-secondary" onclick="window.prevWriting()" ${writingIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary btn-next-svg-adjust" id="btn-next-writing" onclick="window.nextWriting()">
          <span>Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const inputField = document.getElementById("sentence-input-field");
    if (inputField) inputField.focus();
  }, 100);
}

window.onSentenceInput = function(val) {
  const ex = currentLessonExercises.writing[writingIndex];
  const correctSentence = ex.correct.join(' ');
  
  if (val.length > correctSentence.length) {
    val = val.substring(0, correctSentence.length);
    const inputField = document.getElementById("sentence-input-field");
    if (inputField) inputField.value = val;
  }
  
  sentenceTypedText = val;
  
  const slotsTray = document.getElementById("sentence-slots-tray");
  if (slotsTray) {
    slotsTray.innerHTML = generateSentenceSlots(sentenceTypedText, correctSentence);
  }
};

window.checkScrambleAnswer = function() {
  const ex = currentLessonExercises.writing[writingIndex];
  const correctSentence = ex.correct.join(' ');
  const feedback = document.getElementById("writing-feedback");
  const nextBtn = document.getElementById("btn-next-writing");
  if (!feedback) return;

  const targetClean = correctSentence.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const inputClean = sentenceTypedText.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

  const isCorrect = inputClean === targetClean;

  if (isCorrect) {
    sfx.playCorrect();
    feedback.className = "practice-feedback-bar correct";
    feedback.innerHTML = `
      <h4 class="feedback-title-correct">Great job! Correct Sentence! +15 XP</h4>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">عاش يا بطل! كتبتها صحيحة ومية مية.</p>
      </div>
    `;
    addXP(15);
    if (nextBtn) nextBtn.disabled = false;
    
    const inputField = document.getElementById("sentence-input-field");
    if (inputField) {
      inputField.disabled = true;
      inputField.classList.add("correct-input-border");
    }
  } else {
    sfx.playIncorrect();
    const hint = getSentenceSpellingFeedback(sentenceTypedText, correctSentence);
    feedback.className = "practice-feedback-bar incorrect";
    feedback.innerHTML = `
      <h4 class="feedback-title-incorrect">Spelling Mismatch. Try again!</h4>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">تلميح المدرس: ${hint}</p>
      </div>
    `;
    const inputField = document.getElementById("sentence-input-field");
    if (inputField) {
      inputField.classList.add("shake-animation");
      setTimeout(() => inputField.classList.remove("shake-animation"), 500);
    }
  }
};

function renderFillBlanksWriting(ex, panel, total) {
  const parts = ex.prompt.split(':');
  const instruction = parts[0].trim();
  const sentence = parts.length > 1 ? parts.slice(1).join(':').trim() : ex.prompt;
  
  const inputHtml = `<input type="text" id="blank-input-field" class="speaking-fallback-input practice-blank-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="..." oninput="window.checkBlankText(this.value)">`;
  const sentenceHtml = sentence.includes('___') ? sentence.replace('___', inputHtml) : sentence + ' ' + inputHtml;

  panel.innerHTML = `
    <div class="practice-title-wrapper">
      <h3 class="practice-panel-title">Exercise ${writingIndex + 1} of ${total}: Fill in the Blanks</h3>
      <p class="practice-desc-text">Type the correct missing word to complete the sentence structure.</p>
      
      <div class="tutor-arabic-card practice-tutor-wrapper">
        <p class="ar-text practice-tutor-text">${instruction}</p>
      </div>
    </div>

    <div class="writing-body">
      <div class="practice-blank-sentence-display">
        ${sentenceHtml}
      </div>

      <div id="writing-feedback" class="practice-feedback-bar"></div>

      <div class="section-nav-footer practice-nav-footer">
        <button class="btn btn-secondary" onclick="window.prevWriting()" ${writingIndex === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn btn-primary btn-next-svg-adjust" id="btn-next-writing" onclick="window.nextWriting()">
          <span>Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;
}

window.checkBlankText = function(val) {
  const ex = currentLessonExercises.writing[writingIndex];
  const feedback = document.getElementById("writing-feedback");
  const nextBtn = document.getElementById("btn-next-writing");
  if (!feedback) return;

  const cleanInput = val.toLowerCase().trim();
  const cleanAnswer = ex.answer.toLowerCase().trim();

  if (cleanInput === cleanAnswer) {
    sfx.playCorrect();
    feedback.className = "practice-feedback-bar correct";
    feedback.innerHTML = `
      <h4 class="feedback-title-correct">Correct! +10 XP</h4>
      <div class="tutor-arabic-card practice-tutor-inline-card">
        <p class="ar-text practice-tutor-text">الله ينور! كلمة صحيحة وقواعد مظبوطة ومية مية.</p>
      </div>
    `;
    addXP(10);
    if (nextBtn) nextBtn.disabled = false;
    
    const inputField = document.getElementById("blank-input-field");
    if (inputField) {
      inputField.disabled = true;
      inputField.classList.add("correct-input-border");
    }
  } else {
    feedback.className = "practice-feedback-bar hidden";
  }
};

window.nextWriting = function() {
  const exercises = currentLessonExercises.writing;
  if (writingIndex < exercises.length - 1) {
    writingIndex++;
    scrambleSelectedWords = [];
    sentenceTypedText = "";
    renderWritingExercise();
  } else {
    scrambleSelectedWords = [];
    sentenceTypedText = "";
    showPracticeFinishedCard();
  }
};

window.prevWriting = function() {
  if (writingIndex > 0) {
    writingIndex--;
    scrambleSelectedWords = [];
    sentenceTypedText = "";
    renderWritingExercise();
  }
};

function showPracticeFinishedCard() {
  const panel = document.getElementById("writing-panel");
  if (!panel) return;

  completePractice(currentLesson.id);

  sfx.playCelebration();
  panel.innerHTML = `
    <div class="quiz-results-card">
      <div class="results-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path></svg>
      </div>
      <h2 class="practice-finished-title">Practice Complete!</h2>
      
      <div class="tutor-arabic-card practice-finished-tutor">
        <p class="ar-text practice-finished-tutor-text">
          مجهود جبار يا وحش! إنت مارست الأربع مهارات الأساسية: الاستماع والنطق والقراءة والكتابة للدرس ده. دلوقتي إنت جاهز تخوض الكويز الصغير عشان تثبت معلوماتك تماماً!
        </p>
      </div>
      
      <div>
        <a href="#lesson-viewer?id=${currentLesson.id}&tab=quiz" class="btn btn-primary btn-next-svg-adjust">
          <span>Take Lesson Quiz</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </a>
      </div>
    </div>
  `;
}
