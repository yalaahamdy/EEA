/**
 * Vocabulary Recitation Center Component
 * Egyptian English Academy
 * Premium memorization and recitation (pronunciation + writing spelling test).
 */

import { getProgress, completeVocabRecitation } from '../storage.js';
import { levelData } from '../levelManager.js';
import { speakText } from './lessonViewer.js';
import { sfx } from '../audioEffects.js';

let currentLessonId = 1;
let activeTab = 'study'; // 'study' or 'recite' or 'finished'
let reciteIndex = 0; // 0 to 9
let reciteStep = 'speak'; // 'speak' or 'write'
let typedSpelling = "";

// Speech state
let isRecording = false;
let recognition = null;

export function initVocabCenter(urlParams = {}) {
  const progress = getProgress();
  
  if (urlParams.lesson) {
    currentLessonId = parseInt(urlParams.lesson);
  } else {
    const nextIncomplete = levelData.curriculum.find(l => {
      const isQuizPassed = (progress.quizScores[l.id] || 0) >= Math.ceil((l.quiz ? l.quiz.length : 10) * 0.6);
      const isVocabPassed = progress.completedVocabRecitations && progress.completedVocabRecitations.includes(l.id);
      return !isQuizPassed || !isVocabPassed;
    });
    currentLessonId = nextIncomplete ? nextIncomplete.id : 1;
  }

  activeTab = 'study';
  reciteIndex = 0;
  reciteStep = 'speak';
  typedSpelling = "";
  isRecording = false;
  if (recognition) {
    try { recognition.stop(); } catch(e){}
    recognition = null;
  }

  // Bind globals
  window.changeVocabLesson = function(val) {
    currentLessonId = parseInt(val);
    activeTab = 'study';
    reciteIndex = 0;
    reciteStep = 'speak';
    typedSpelling = "";
    renderVocabCenter();
  };

  window.startVocabRecitation = function() {
    activeTab = 'recite';
    reciteIndex = 0;
    reciteStep = 'speak';
    typedSpelling = "";
    sfx.playTap();
    renderVocabCenter();
  };

  window.speakVocabItem = function(word) {
    speakText(word);
  };

  window.toggleVocabSpeech = function() {
    toggleVocabSpeechRecognition();
  };

  window.checkVocabSpelling = function() {
    verifySpellingAnswer();
  };

  window.vocabSkipSpeaking = function() {
    sfx.playTap();
    reciteStep = 'write';
    typedSpelling = "";
    renderVocabCenter();
  };

  window.prevVocabRecite = function() {
    if (reciteIndex > 0) {
      reciteIndex--;
      reciteStep = 'speak';
      typedSpelling = "";
      renderVocabCenter();
    }
  };

  window.onVocabSpellingInput = function(val) {
    const lesson = levelData.curriculum.find(l => l.id === currentLessonId);
    const v = lesson.vocabulary[reciteIndex];
    
    if (val.length > v.word.length) {
      val = val.substring(0, v.word.length);
      const input = document.getElementById("vocab-spelling-input");
      if (input) input.value = val;
    }
    
    typedSpelling = val;
    const slotsTray = document.getElementById("vocab-spelling-slots-tray");
    if (slotsTray) {
      slotsTray.innerHTML = generateWordSlots(typedSpelling, v.word);
    }
  };

  renderVocabCenter();
}

function renderVocabCenter() {
  const container = document.getElementById("vocab-center-section");
  if (!container) return;

  const progress = getProgress();
  const lesson = levelData.curriculum.find(l => l.id === currentLessonId);
  
  if (!lesson) {
    container.innerHTML = `<p>Lesson not found.</p>`;
    return;
  }

  // Check locking: lesson is unlocked if it's lesson 1 or the previous lesson is completed
  const isUnlocked = lesson.id === 1 || progress.completedLessons.includes(lesson.id - 1);
  const isAlreadyRecited = progress.completedVocabRecitations && progress.completedVocabRecitations.includes(lesson.id);

  let html = `
    <div class="section-header">
      <h1 class="section-title">Vocabulary Mastery Center</h1>
      <p class="section-subtitle">Recite and verify your vocabulary words both in speaking and spelling.</p>
      
      <div class="tutor-arabic-card vocab-tutor-card">
        <p class="ar-text vocab-tutor-text">
          مركز تسميع الكلمات - هنا يا بطل هتسمّع كلمات كل درس نطقاً في المايك وكتابة بالسبيلينج المظبوط عشان تقدر تفتح الدرس اللي بعده!
        </p>
      </div>
    </div>

    <div class="vocab-center-layout">
      <!-- Lesson selector dropdown -->
      <div class="vocab-selectors">
        <span class="vocab-selectors-label">Choose Lesson:</span>
        <select class="filter-select" onchange="window.changeVocabLesson(this.value)">
          ${levelData.curriculum.map(l => {
            const isLUnlocked = l.id === 1 || progress.completedLessons.includes(l.id - 1);
            const isLRecited = progress.completedVocabRecitations && progress.completedVocabRecitations.includes(l.id);
            return `
              <option value="${l.id}" ${l.id === currentLessonId ? 'selected' : ''} ${!isLUnlocked ? 'disabled' : ''}>
                Lesson ${l.id}: ${l.title} ${isLRecited ? '✓' : ''} ${!isLUnlocked ? '(Locked)' : ''}
              </option>
            `;
          }).join('')}
        </select>
      </div>
  `;

  if (!isUnlocked) {
    // RENDER LOCK SCREEN
    html += `
      <div class="empty-deck-state empty-deck-padded">
        <div class="empty-deck-icon empty-deck-icon-locked">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-deck-svg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 class="empty-deck-title">Lesson Vocabulary Locked</h3>
        <p class="empty-deck-desc">
          You must pass the quiz and vocabulary recitation of Lesson ${lesson.id - 1} before you can unlock Lesson ${lesson.id}'s words.
        </p>
        <div class="tutor-arabic-card empty-deck-tutor">
          <p class="ar-text empty-deck-tutor-text">
            الدرس ده مقفول يا بطل! ارجع وخلص الدرس اللي قبله وحل الكويز وسمع كلماته وهيفتحلك فوراً.
          </p>
        </div>
        <a href="#roadmap" class="btn btn-primary btn-next-svg-adjust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span>Back to Roadmap</span>
        </a>
      </div>
    `;
    container.innerHTML = html;
    return;
  }

  // RENDER UNLOCKED MODULE
  if (activeTab === 'study') {
    html += renderStudyTab(lesson, isAlreadyRecited);
  } else if (activeTab === 'recite') {
    html += renderReciteTab(lesson);
  } else if (activeTab === 'finished') {
    html += renderFinishedTab(lesson);
  }

  html += `</div>`;
  container.innerHTML = html;
  return;
}

function renderStudyTab(lesson, isAlreadyRecited) {
  return `
    <div class="vocab-card-deck">
      <div class="vocab-tab-header">
        <h3 class="vocab-tab-title">1. Memorize & Listen</h3>
        <span class="badge ${isAlreadyRecited ? 'badge-success' : 'badge-warning'}">
          ${isAlreadyRecited ? 'Recited ✓' : 'Recitation Pending'}
        </span>
      </div>

      <p class="vocab-tab-desc">
        Review the words of <strong>Lesson ${lesson.id}</strong>. Click the audio buttons to hear pronunciation. Study the examples before taking the recitation test!
      </p>

      <div class="dict-cards-grid">
        ${lesson.vocabulary.map((v, idx) => `
          <div class="stat-card dict-card">
            <div>
              <div class="dict-card-header">
                <div class="dict-card-bookmark-section">
                  <span class="dict-card-lesson-tag">Word ${idx + 1}</span>
                </div>
              </div>
              
              <div class="dict-card-word-row">
                <h3 class="dict-card-word audio-example-row" style="cursor: pointer;" onclick="window.speakVocabItem('${v.word.replace(/'/g, "\\'")}')">${v.word}</h3>
              </div>
              
              <div class="tutor-arabic-card dict-card-translation-box">
                <p class="ar-text dict-card-translation">${v.translation}</p>
              </div>
              
              <div class="dict-card-example-section">
                <div class="dict-card-example-row">
                  <span class="audio-example-row" style="cursor: pointer;" onclick="window.speakVocabItem('${v.example.replace(/'/g, "\\'")}')">"${v.example}"</span>
                </div>
                <div class="tutor-arabic-card dict-card-example-translation-box">
                  <p class="ar-text dict-card-example-translation">${v.exampleTranslation}</p>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="vocab-actions-center">
        <button class="btn btn-primary btn-recitation-start btn-next-svg-adjust" onclick="window.startVocabRecitation()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-right"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Start Recitation Test</span>
        </button>
      </div>
    </div>
  `;
}

function renderReciteTab(lesson) {
  const v = lesson.vocabulary[reciteIndex];
  const progressPercent = Math.round((reciteIndex / lesson.vocabulary.length) * 100);

  let stepHtml = '';

  if (reciteStep === 'speak') {
    stepHtml = `
      <div class="vocab-recite-step-box">
        <div class="badge badge-warning vocab-badge-step">Step 1: Pronunciation Recitation</div>
        <h4 class="vocab-recite-label">Speak the English word for:</h4>
        <h2 class="vocab-recite-translation">${v.translation}</h2>

        <!-- Mic Control -->
        <div class="mic-section">
          <button class="mic-btn" id="vocab-mic-btn" onclick="window.toggleVocabSpeech()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <div class="speech-waves-visualizer" id="vocab-waves">
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
          </div>
          <p id="vocab-status-text" class="vocab-status-text">Click mic and say the word in English</p>
        </div>

        <div class="vocab-margin-top-md">
          <button class="btn btn-secondary btn-sm-padding btn-next-svg-adjust" onclick="window.vocabSkipSpeaking()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
            <span>Keyboard Fallback</span>
          </button>
        </div>
      </div>
    `;
  } else if (reciteStep === 'write') {
    stepHtml = `
      <div class="vocab-recite-step-box">
        <div class="badge badge-accent vocab-badge-step">Step 2: Spelling/Writing Recitation</div>
        <h4 class="vocab-recite-label">Type the English spelling for:</h4>
        <h2 class="vocab-recite-translation-spelling">${v.translation}</h2>

        <!-- Slots display for word -->
        <div class="sentence-slots-container" id="vocab-spelling-slots-tray" style="margin: 0 auto 16px auto;">
          ${generateWordSlots(typedSpelling, v.word)}
        </div>

        <div class="vocab-input-wrapper">
          <input type="text" id="vocab-spelling-input" class="speaking-fallback-input" 
                 placeholder="Type here..." autocomplete="off" 
                 autocorrect="off" autocapitalize="off" spellcheck="false"
                 value="${typedSpelling.replace(/"/g, '&quot;')}"
                 oninput="window.onVocabSpellingInput(this.value)"
                 onkeydown="if(event.key==='Enter') window.checkVocabSpelling()">
        </div>

        <button class="btn btn-primary btn-submit-spelling btn-next-svg-adjust" onclick="window.checkVocabSpelling()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-right"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Submit Spelling</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="vocab-card-deck">
      <div class="vocab-tab-header">
        <h3 class="vocab-tab-title">Word ${reciteIndex + 1} of ${lesson.vocabulary.length}</h3>
        <div class="vocab-progress-fill-bg">
          <div class="vocab-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- Main Interaction Area -->
      <div class="recite-body-card">
        ${stepHtml}

        <div id="vocab-recite-feedback" class="practice-feedback-bar"></div>
      </div>

      <!-- Footer navigation -->
      <div class="vocab-footer-nav">
        <button class="btn btn-secondary btn-next-svg-adjust" onclick="window.prevVocabRecite()" ${reciteIndex === 0 ? 'disabled' : ''}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Previous</span>
        </button>
        <span class="vocab-footer-text">Keep going!</span>
      </div>
    </div>
  `;
}

function verifySpellingAnswer() {
  const inputEl = document.getElementById("vocab-spelling-input");
  const feedbackEl = document.getElementById("vocab-recite-feedback");
  if (!inputEl || !feedbackEl) return;

  const lesson = levelData.curriculum.find(l => l.id === currentLessonId);
  const v = lesson.vocabulary[reciteIndex];
  
  const cleanInput = typedSpelling.trim().toLowerCase();
  const cleanTarget = v.word.trim().toLowerCase();

  if (cleanInput === cleanTarget) {
    sfx.playCorrect();
    feedbackEl.className = "practice-feedback-bar correct";
    feedbackEl.innerHTML = `
      <h4 class="feedback-title-correct">Spelling Correct! +10 XP</h4>
      <p class="feedback-sub-text">قوي جداً! السبيلينج مظبوط وحفظك ممتاز للكلمة.</p>
    `;

    inputEl.disabled = true;
    inputEl.classList.add("correct-input-border");

    setTimeout(() => {
      typedSpelling = "";
      if (reciteIndex < lesson.vocabulary.length - 1) {
        reciteIndex++;
        reciteStep = 'speak';
        renderVocabCenter();
      } else {
        completeVocabRecitation(currentLessonId);
        activeTab = 'finished';
        renderVocabCenter();
      }
    }, 1200);

  } else {
    sfx.playIncorrect();
    // For long words (>5 chars): don't pinpoint a single letter, just encourage retry
    const isLongWord = cleanTarget.replace(/\s/g, '').length > 5;
    let hint;
    if (isLongWord) {
      hint = `الكلمة الصح هي "${v.word}" — راجعها وجرب تاني!`;
    } else {
      hint = getSpellingFeedback(cleanInput, cleanTarget);
    }
    feedbackEl.className = "practice-feedback-bar incorrect";
    feedbackEl.innerHTML = `
      <h4 class="feedback-title-incorrect">Incorrect Spelling! Try Again</h4>
      <p class="ar-text-hint">
        تلميح: ${hint}
      </p>
    `;
    inputEl.classList.add("shake-animation");
    setTimeout(() => inputEl.classList.remove("shake-animation"), 500);
  }
}

function getSpellingFeedback(input, target) {
  const cleanInput = input.trim().toLowerCase();
  const cleanTarget = target.trim().toLowerCase();

  if (!cleanInput) {
    return "اكتب الكلمة يا بطل!";
  }

  // Find first difference
  let diffIndex = -1;
  const minLen = Math.min(cleanInput.length, cleanTarget.length);
  for (let i = 0; i < minLen; i++) {
    if (cleanInput[i] !== cleanTarget[i]) {
      diffIndex = i;
      break;
    }
  }

  // Helper to get ordinal in Arabic (1st, 2nd, 3rd...)
  const ordinalsAr = {
    1: "الأول",
    2: "الثاني",
    3: "الثالث",
    4: "الرابع",
    5: "الخامس",
    6: "السادس",
    7: "السابع",
    8: "الثامن",
    9: "التاسع",
    10: "العاشر",
    11: "الحادي عشر",
    12: "الثاني عشر",
    13: "الثالث عشر",
    14: "الرابع عشر",
    15: "الخامس عشر",
    16: "السادس عشر",
    17: "السابع عشر",
    18: "الثامن عشر",
    19: "التاسع عشر",
    20: "العشرين"
  };
  
  const getOrdinal = (n) => ordinalsAr[n] || `الـ ${n}`;

  // Case 1: Input is shorter but matches target prefix perfectly (e.g., "appl" for "apple")
  if (diffIndex === -1 && cleanInput.length < cleanTarget.length) {
    const missingPos = cleanInput.length + 1;
    return `الكلمة ناقصة! الحرف ${getOrdinal(missingPos)} ناقص يا بطل.`;
  }

  // Case 2: Input is longer but matches target prefix perfectly (e.g., "appler" for "apple")
  if (diffIndex === -1 && cleanInput.length > cleanTarget.length) {
    return `الكلمة فيها حروف زيادة! شيل الحروف اللي بعد الحرف ${getOrdinal(cleanTarget.length)}.`;
  }

  // Case 3: There is a mismatch at diffIndex
  const pos = diffIndex + 1;
  
  // Check if it's a substitution typo (e.g., "helzo" for "hello")
  // Check if length is same
  if (cleanInput.length === cleanTarget.length) {
    return `الحرف ${getOrdinal(pos)} خطأ! (كتبت "${cleanInput[diffIndex]}" والمفروض يكون حرف تاني)`;
  }
  
  // Check if user missed a letter inside the word (e.g., "helo" for "hello")
  const inputRest = cleanInput.substring(diffIndex);
  const targetRestWithSkip = cleanTarget.substring(diffIndex + 1);
  if (inputRest === targetRestWithSkip || targetRestWithSkip.startsWith(inputRest)) {
    return `الحرف ${getOrdinal(pos)} ناقص! (نسيت تكتب حرف في النص)`;
  }

  // Check if user inserted an extra letter inside the word (e.g., "hellzo" for "hello")
  const inputRestWithSkip = cleanInput.substring(diffIndex + 1);
  const targetRest = cleanTarget.substring(diffIndex);
  if (inputRestWithSkip === targetRest || targetRest.startsWith(inputRestWithSkip)) {
    return `الحرف ${getOrdinal(pos)} زيادة! (في حرف زيادة هنا: "${cleanInput[diffIndex]}")`;
  }

  // General fallback mismatch
  return `الحرف ${getOrdinal(pos)} خطأ! راجع الحرف ده وجرب تاني.`;
}

function toggleVocabSpeechRecognition() {
  const micBtn = document.getElementById("vocab-mic-btn");
  const statusTxt = document.getElementById("vocab-status-text");
  const feedbackEl = document.getElementById("vocab-recite-feedback");
  const waves = document.getElementById("vocab-waves");

  if (!micBtn || !statusTxt || !feedbackEl) return;

  const lesson = levelData.curriculum.find(l => l.id === currentLessonId);
  const v = lesson.vocabulary[reciteIndex];
  const targetWord = v.word;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusTxt.innerText = "Mic recognition not supported. Click keyboard fallback!";
    return;
  }

  if (isRecording) {
    if (recognition) recognition.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
    if (waves) waves.classList.remove('active');
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
      if (waves) waves.classList.add('active');
      statusTxt.innerText = "Listening... Speak the word now!";
    };

    recognition.onerror = function(event) {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        statusTxt.innerText = "Mic blocked. Please allow mic permission in settings.";
      } else {
        statusTxt.innerText = "Error: " + event.error + ". Try typing fallback!";
      }
      isRecording = false;
      micBtn.classList.remove('recording');
      if (waves) waves.classList.remove('active');
    };

    recognition.onend = function() {
      isRecording = false;
      micBtn.classList.remove('recording');
      if (waves) waves.classList.remove('active');
    };

    recognition.onresult = function(event) {
      const result = event.results[0][0].transcript;
      statusTxt.innerHTML = `You said: <strong>"${result}"</strong>`;
      
      const cleanTarget = targetWord.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const cleanResult = result.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const resultWords = cleanResult.split(/\s+/).filter(Boolean);
      
      const isMatch = cleanResult === cleanTarget || resultWords.includes(cleanTarget);
      
      if (isMatch) {
        sfx.playCorrect();
        feedbackEl.className = "practice-feedback-bar correct";
        feedbackEl.innerHTML = `
          <h4 class="feedback-title-correct">Pronunciation Correct!</h4>
          <p class="feedback-sub-text">مخرج الحروف سليم جداً! ندخل دلوقتي على التسميع كتابة.</p>
        `;
        
        // Move to spelling step
        setTimeout(() => {
          reciteStep = 'write';
          renderVocabCenter();
        }, 1200);
      } else {
        sfx.playIncorrect();
        feedbackEl.className = "practice-feedback-bar incorrect";
        feedbackEl.innerHTML = `
          <h4 class="feedback-title-incorrect">Doesn't match. Try again!</h4>
          <p class="feedback-sub-text">اسمع الكلمة بصوت المعلم في قسم الحفظ وحاول تقلدها صح.</p>
        `;
      }
    };

    recognition.start();
  } catch(e) {
    console.error(e);
  }
}

function renderFinishedTab(lesson) {
  sfx.playCelebration();
  return `
    <div class="vocab-card-deck vocab-finished-card">
      <div class="results-icon vocab-finished-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="vocab-finished-svg"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"></path></svg>
      </div>
      <h2 class="vocab-finished-title">Lesson ${lesson.id} Vocabulary Mastered!</h2>
      
      <div class="tutor-arabic-card empty-deck-tutor">
        <p class="ar-text vocab-finished-tutor-text">
          وحش الحفظ! سمعت الـ ${lesson.vocabulary.length} كلمة كاملة نطقاً وكتابة بنجاح ساحق. كدة كملت شروط الدرس وعملت إنجاز جديد! +100 XP
        </p>
      </div>

      <div class="vocab-finished-actions">
        <a href="#roadmap" class="btn btn-primary btn-next-svg-adjust">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          <span>Back to Roadmap</span>
        </a>
        ${lesson.id < levelData.curriculum.length ? `
          <button class="btn btn-secondary btn-next-svg-adjust" onclick="window.changeVocabLesson(${lesson.id + 1})">
            <span>Study Next Lesson Words</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function generateWordSlots(typedText, correctWord) {
  let result = '';
  for (let i = 0; i < correctWord.length; i++) {
    const tc = correctWord[i];
    if (tc === ' ') {
      result += '<span class="slot-letter-space">&nbsp;</span>';
    } else if (/[a-zA-Z0-9]/.test(tc)) {
      if (i < typedText.length) {
        result += `<span class="slot-letter typed">${typedText[i]}</span>`;
      } else {
        result += `<span class="slot-letter empty">-</span>`;
      }
    } else {
      result += `<span class="slot-letter punctuation">${tc}</span>`;
    }
  }
  return result;
}
