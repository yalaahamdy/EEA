/**
 * Unified Session Runner Component
 * Egyptian English Academy
 * Strictly English UI, isolated Egyptian Arabic tutoring content.
 * Manages assessment sessions for Quizzes, Reviews, and the Final Exam.
 */

import { sfx } from '../audioEffects.js';
import { speakText } from './lessonViewer.js';
import { addXP } from '../storage.js';

let sessionQuestions = [];
let sessionIndex = 0;
let sessionScore = 0;
let sessionMode = 'review'; // review, quiz, final
let sessionContainer = null;
let currentSessionXP = 0;
let answered = false;
let selectedMCQOption = null;

// Writing inputs state
let typedSentence = "";

// Speech recognition state
let isRecording = false;
let recognition = null;
let onCompleteCallback = null;
let onExitCallback = null;

/**
 * Initializes and starts a new session
 */
export function startSession(questions, options) {
  sessionQuestions = questions;
  sessionIndex = 0;
  sessionScore = 0;
  sessionMode = options.mode || 'review';
  sessionContainer = document.getElementById(options.containerId);
  currentSessionXP = 0;
  answered = false;
  selectedMCQOption = null;
  typedSentence = "";
  isRecording = false;
  
  onCompleteCallback = options.onComplete;
  onExitCallback = options.onExit;

  if (recognition) {
    try { recognition.stop(); } catch(e){}
    recognition = null;
  }

  // Bind key actions to window for event listeners
  window.sessionSpeakText = (txt) => speakText(txt);
  window.selectMCQOption = (idx) => selectMCQOption(idx);
  window.submitMCQAnswer = () => verifyMCQAnswer();
  window.toggleSessionSpeech = () => toggleSpeechRecognition();
  window.checkSpellingSession = () => checkSpellingAnswer();
  window.checkWritingSession = () => checkWritingAnswer();
  window.checkVocabSpeakingSession = () => checkVocabSpeakingAnswer();
  window.sessionOnWritingInput = (val) => onWritingInput(val);
  window.sessionOnSpellingInput = (val) => onSpellingInput(val);
  window.sessionExit = () => {
    if (confirm("Are you sure you want to exit? Your progress in this session won't be saved.")) {
      if (onExitCallback) onExitCallback();
    }
  };
  window.nextSessionQuestion = () => nextQuestion();

  renderQuestion();
}

function renderQuestion() {
  if (!sessionContainer || sessionQuestions.length === 0) return;

  if (sessionIndex >= sessionQuestions.length) {
    finishSession();
    return;
  }

  answered = false;
  selectedMCQOption = null;
  typedSentence = "";
  
  if (recognition) {
    try { recognition.stop(); } catch(e){}
    recognition = null;
  }

  const q = sessionQuestions[sessionIndex];
  const progressPercent = Math.round((sessionIndex / sessionQuestions.length) * 100);

  // Layout templates matching Stripe & ClickUp aesthetics
  sessionContainer.innerHTML = `
    <div class="quiz-container">
      <!-- Progress Bar -->
      <div class="quiz-progress-wrapper">
        <span class="quiz-progress-text">Question ${sessionIndex + 1} of ${sessionQuestions.length} (${sessionMode.toUpperCase()})</span>
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- Quiz Card Frame -->
      <div class="quiz-card">
        <div class="results-xp cert-results-desc" style="font-size: 0.8rem; text-align: left; margin-bottom: 12px; color: var(--text-muted);">
          Lesson: ${q.lessonTitle || `Lesson ${q.lessonId}`}
        </div>
        
        <!-- Active Question Area -->
        <div id="session-card-body"></div>
 
        <!-- Tutor Feedback Bubble -->
        <div id="session-tutor-feedback" class="quiz-explanation-hidden"></div>

        <!-- Action Wrapper -->
        <div class="quiz-action-wrapper" style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn btn-secondary btn-next-svg-adjust" onclick="window.sessionExit()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Exit Exam</span>
          </button>
          
          <button class="btn btn-primary btn-next-svg-adjust" id="btn-session-action" disabled>
            <span>Submit Answer</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const bodyContainer = document.getElementById("session-card-body");
  
  if (q.type === 'vocab') {
    renderVocabCard(q, bodyContainer);
  } else if (q.type === 'skill') {
    renderSkillCard(q, bodyContainer);
  }
}

// ----------------------------------------------------
// Card Renderers
// ----------------------------------------------------

function renderVocabCard(q, container) {
  const v = q.data;
  const actionBtn = document.getElementById("btn-session-action");
  
  if (q.vocabMode === 'spelling') {
    container.innerHTML = `
      <div class="vocab-recite-step-box" style="text-align: center;">
        <div class="badge badge-accent vocab-badge-step" style="margin-bottom: 12px;">Vocabulary Spelling Test</div>
        <h4 class="vocab-recite-label" style="font-size: 1rem; color: var(--text-muted);">Type the English spelling for:</h4>
        <h2 class="vocab-recite-translation-spelling" style="font-size: 2rem; color: var(--success); margin: 12px 0;">${v.translation}</h2>

        <!-- Slots display for word -->
        <div class="sentence-slots-container" id="session-spelling-slots-tray" style="margin: 0 auto 16px auto;">
          ${generateSentenceSlots(typedSentence, v.word)}
        </div>

        <div class="vocab-input-wrapper" style="position: relative; max-width: 400px; margin: 0 auto 16px auto;">
          <input type="text" id="session-spelling-input" class="speaking-fallback-input" 
                 placeholder="Type spelling here..." autocomplete="off" 
                 autocorrect="off" autocapitalize="off" spellcheck="false"
                 style="padding-right: 48px;"
                 value="${typedSentence.replace(/"/g, '&quot;')}"
                 oninput="window.sessionOnSpellingInput(this.value)"
                 onkeydown="if(event.key==='Enter' && !window.answered) window.checkSpellingSession()">
          <button class="speak-btn" onclick="window.sessionSpeakText('${v.word.replace(/'/g, "\\'")}')" 
                  title="Listen Hint" style="position: absolute; right: 10px; top: 18px; transform: translateY(-50%);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>
      </div>
    `;
    
    actionBtn.onclick = () => window.checkSpellingSession();
    actionBtn.disabled = false;
    
    setTimeout(() => {
      const input = document.getElementById("session-spelling-input");
      if (input) input.focus();
    }, 100);
  } else {
    // speaking mode
    container.innerHTML = `
      <div class="vocab-recite-step-box" style="text-align: center;">
        <div class="badge badge-warning vocab-badge-step" style="margin-bottom: 12px;">Vocabulary Pronunciation Test</div>
        <h4 class="vocab-recite-label" style="font-size: 1rem; color: var(--text-muted);">Pronounce the English word for:</h4>
        <h2 class="vocab-recite-translation" style="font-size: 2rem; color: var(--primary); margin: 12px 0;">${v.translation}</h2>

        <!-- Mic Section -->
        <div class="mic-section" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 20px 0;">
          <button class="mic-btn" id="session-mic-btn" onclick="window.toggleSessionSpeech()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <div class="speech-waves-visualizer" id="session-waves">
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
          </div>
        </div>
        <p id="session-status-text" class="vocab-status-text" style="font-size: 0.85rem; color: var(--text-muted);">Click mic and speak in English</p>
        
        <div class="review-actions-inline" style="display: flex; justify-content: center; gap: 10px; margin-top: 16px;">
          <button class="btn btn-secondary btn-sm-padding btn-next-svg-adjust" onclick="window.sessionSpeakText('${v.word.replace(/'/g, "\\'")}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Pronunciation Hint</span>
          </button>
          
          <button class="btn btn-secondary btn-sm-padding btn-next-svg-adjust" onclick="document.getElementById('session-vocab-fallback-typing-div').classList.remove('review-hidden')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
            <span>Typing Fallback</span>
          </button>
        </div>

        <div id="session-vocab-fallback-typing-div" class="review-fallback-typing-box review-hidden" style="margin-top: 16px; max-width: 450px; margin-left: auto; margin-right: auto;">
          <div class="vocab-input-wrapper" style="display: flex; gap: 8px;">
            <input type="text" id="session-vocab-fallback-input" class="speaking-fallback-input" placeholder="Type the English word..." 
                   onkeydown="if(event.key==='Enter' && !window.answered) window.checkVocabSpeakingSession()" style="margin: 0; text-align: left;">
            <button class="btn btn-primary btn-next-svg-adjust" onclick="window.checkVocabSpeakingSession()">
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    `;
    actionBtn.onclick = () => window.toggleSessionSpeech();
    actionBtn.disabled = true; // Wait for mic result or skip
  }
}

function renderSkillCard(q, container) {
  const ex = q.data;
  const actionBtn = document.getElementById("btn-session-action");

  if (q.skillType === 'listening') {
    container.innerHTML = `
      <div style="text-align: center;">
        <div class="badge badge-primary vocab-badge-step" style="margin-bottom: 12px;">Listening Comprehension Test</div>
        <h4 style="font-size: 1rem; color: var(--text-muted); margin-bottom: 16px;">Listen to the speech audio, then select the matching word:</h4>

        <!-- Giant Audio Button -->
        <button class="listen-main-btn" onclick="window.sessionSpeakText('${ex.text.replace(/'/g, "\\'")}')" style="margin: 0 auto 20px auto;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>

        <div class="quiz-options-list" style="max-width: 500px; margin: 0 auto;">
          ${ex.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            return `
              <div class="quiz-option-card" id="session-opt-${idx}" onclick="window.selectMCQOption(${idx})">
                <div class="option-bullet">${letter}</div>
                <div>${opt}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    actionBtn.onclick = () => window.submitMCQAnswer();
    actionBtn.disabled = true;
  } 
  
  else if (q.skillType === 'speaking') {
    container.innerHTML = `
      <div style="text-align: center;">
        <div class="badge badge-warning vocab-badge-step" style="margin-bottom: 12px;">Speaking & Recall Test</div>
        <h4 style="font-size: 1rem; color: var(--text-muted); margin-bottom: 8px;">Translate and speak this phrase in English:</h4>
        <h2 class="review-recite-translation" style="font-size: 1.5rem; color: var(--primary); margin: 12px 0;">"${ex.translation}"</h2>

        <!-- Mic Section -->
        <div class="mic-section" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 20px 0;">
          <button class="mic-btn" id="session-mic-btn" onclick="window.toggleSessionSpeech()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <div class="speech-waves-visualizer" id="session-waves">
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
            <div class="speech-wave-bar"></div>
          </div>
        </div>
        <p id="session-status-text" class="vocab-status-text" style="font-size: 0.85rem; color: var(--text-muted);">Click mic and speak translation</p>
        
        <div class="review-actions-inline" style="display: flex; justify-content: center; gap: 10px; margin-top: 16px;">
          <button class="btn btn-secondary btn-sm-padding btn-next-svg-adjust" onclick="window.sessionSpeakText('${ex.text.replace(/'/g, "\\'")}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Pronunciation Hint</span>
          </button>
          
          <button class="btn btn-secondary btn-sm-padding btn-next-svg-adjust" onclick="document.getElementById('session-fallback-typing-div').classList.remove('review-hidden')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-left"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
            <span>Typing Fallback</span>
          </button>
        </div>

        <div id="session-fallback-typing-div" class="review-fallback-typing-box review-hidden" style="margin-top: 16px; max-width: 450px; margin-left: auto; margin-right: auto;">
          <div class="vocab-input-wrapper" style="display: flex; gap: 8px;">
            <input type="text" id="session-speaking-fallback-input" class="speaking-fallback-input" placeholder="Type the English translation..." 
                   onkeydown="if(event.key==='Enter' && !window.answered) window.checkWritingSession()" style="margin: 0; text-align: left;">
            <button class="btn btn-primary btn-next-svg-adjust" onclick="window.checkWritingSession()">
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    `;
    actionBtn.onclick = () => window.toggleSessionSpeech();
    actionBtn.disabled = true;
  } 
  
  else if (q.skillType === 'reading') {
    container.innerHTML = `
      <div>
        <div class="review-center-align" style="text-align: center; margin-bottom: 12px;">
          <div class="badge badge-success vocab-badge-step">Reading Comprehension Test</div>
        </div>

        <!-- Two Column Grid for Reading -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <!-- Left column: Passage -->
          <div class="reading-passage-box" style="margin-bottom: 0;">
            "${ex.passage}"
          </div>

          <!-- Right column: Question & Options -->
          <div>
            <h4 class="review-question-title" style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); margin-bottom: 12px; text-align: left; direction: ltr;">
              ${ex.q}
            </h4>

            <div class="quiz-options-list">
              ${ex.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                return `
                  <div class="quiz-option-card" id="session-opt-${idx}" onclick="window.selectMCQOption(${idx})">
                    <div class="option-bullet">${letter}</div>
                    <div>${opt}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    actionBtn.onclick = () => window.submitMCQAnswer();
    actionBtn.disabled = true;
  } 
  
  else if (q.skillType === 'writing') {
    const isBlank = !ex.correct; // if correct list exists, it is Sentence Writer, otherwise fill blank
    
    if (isBlank) {
      // Fill-in-the-blanks style
      const parts = ex.prompt.split(':');
      const instruction = parts[0].trim();
      const sentence = parts.length > 1 ? parts.slice(1).join(':').trim() : ex.prompt;
      
      const inputHtml = `<input type="text" id="session-blank-input" class="speaking-fallback-input practice-blank-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="..." oninput="if(this.value.toLowerCase().trim()=== '${ex.answer.toLowerCase()}') window.checkWritingSession()">`;
      const sentenceHtml = sentence.includes('___') ? sentence.replace('___', inputHtml) : sentence + ' ' + inputHtml;

      container.innerHTML = `
        <div style="text-align: center;">
          <div class="badge badge-accent vocab-badge-step" style="margin-bottom: 12px;">Writing: Fill in the Blank</div>
          <h4 style="font-size: 1rem; color: var(--text-muted);">${instruction}</h4>
          
          <div class="practice-blank-sentence-display" style="margin: 24px 0;">
            ${sentenceHtml}
          </div>
        </div>
      `;
      actionBtn.onclick = () => window.checkWritingSession();
      actionBtn.disabled = false;
      
      setTimeout(() => {
        const input = document.getElementById("session-blank-input");
        if (input) input.focus();
      }, 100);
    } else {
      // Sentence Writer style
      const correctSentence = ex.correct.join(' ');
      
      container.innerHTML = `
        <div style="text-align: center;">
          <div class="badge badge-accent vocab-badge-step" style="margin-bottom: 12px;">Writing: Sentence Translator</div>
          <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 16px;">${ex.prompt}</h4>
          
          <!-- Slots display -->
          <div class="sentence-slots-container" id="session-slots-tray" style="margin: 0 auto 16px auto;">
            ${generateSentenceSlots(typedSentence, correctSentence)}
          </div>

          <!-- Input box -->
          <input type="text" id="session-sentence-input" class="speaking-fallback-input practice-sentence-input" 
                 placeholder="Type the sentence in English here..." autocomplete="off" 
                 autocorrect="off" autocapitalize="off" spellcheck="false"
                 value="${typedSentence.replace(/"/g, '&quot;')}"
                 style="margin: 0 auto;"
                 oninput="window.sessionOnWritingInput(this.value)"
                 onkeydown="if(event.key==='Enter' && !window.answered) window.checkWritingSession()">
        </div>
      `;
      actionBtn.onclick = () => window.checkWritingSession();
      actionBtn.disabled = false;

      setTimeout(() => {
        const input = document.getElementById("session-sentence-input");
        if (input) input.focus();
      }, 100);
    }
  }
}

// ----------------------------------------------------
// Sentence Dashes Generator (Helper)
// ----------------------------------------------------
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
      result += `<span class="slot-letter punctuation">${tc}</span>`;
    }
  }
  return result;
}

function onWritingInput(val) {
  const q = sessionQuestions[sessionIndex];
  const correctSentence = q.data.correct.join(' ');
  
  if (val.length > correctSentence.length) {
    val = val.substring(0, correctSentence.length);
    const input = document.getElementById("session-sentence-input");
    if (input) input.value = val;
  }
  
  typedSentence = val;
  const slotsTray = document.getElementById("session-slots-tray");
  if (slotsTray) {
    slotsTray.innerHTML = generateSentenceSlots(typedSentence, correctSentence);
  }
}

function onSpellingInput(val) {
  const q = sessionQuestions[sessionIndex];
  const targetWord = q.data.word;
  
  if (val.length > targetWord.length) {
    val = val.substring(0, targetWord.length);
    const input = document.getElementById("session-spelling-input");
    if (input) input.value = val;
  }
  
  typedSentence = val;
  const slotsTray = document.getElementById("session-spelling-slots-tray");
  if (slotsTray) {
    slotsTray.innerHTML = generateSentenceSlots(typedSentence, targetWord);
  }
}

// ----------------------------------------------------
// Option Selection (MCQ)
// ----------------------------------------------------
function selectMCQOption(idx) {
  if (answered) return;

  const q = sessionQuestions[sessionIndex];
  selectedMCQOption = q.data.options[idx];

  document.querySelectorAll('.quiz-option-card').forEach(card => card.classList.remove('selected'));
  const card = document.getElementById(`session-opt-${idx}`);
  if (card) card.classList.add('selected');

  const actionBtn = document.getElementById("btn-session-action");
  if (actionBtn) actionBtn.disabled = false;
}

// ----------------------------------------------------
// Answer Verification Logics
// ----------------------------------------------------

function handleCorrectAnswer(feedbackBox, inputEl = null) {
  answered = true;
  sessionScore++;
  sfx.playCorrect();
  
  if (inputEl) {
    inputEl.disabled = true;
    inputEl.classList.add("correct-input-border");
  }

  feedbackBox.className = "quiz-explanation-bubble correct-feedback";
  feedbackBox.innerHTML = `
    <div class="explanation-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    </div>
    <div class="explanation-text-wrapper">
      <h5 style="color: var(--success); font-weight: 600;">Correct!</h5>
      <div class="tutor-arabic-card quiz-tutor-feedback-card">
        <p class="ar-text quiz-tutor-feedback-text">إجابة صحيحة يا بطل! الله ينور عليك.</p>
      </div>
    </div>
  `;

  prepareNextButton();
}

function handleIncorrectAnswer(feedbackBox, errMsg, inputEl = null) {
  answered = true;
  sfx.playIncorrect();

  if (inputEl) {
    inputEl.classList.add("shake-animation");
    setTimeout(() => inputEl.classList.remove("shake-animation"), 500);
  }

  feedbackBox.className = "quiz-explanation-bubble incorrect-feedback";
  feedbackBox.innerHTML = `
    <div class="explanation-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    </div>
    <div class="explanation-text-wrapper">
      <h5 style="color: var(--error); font-weight: 600;">Incorrect</h5>
      <div class="tutor-arabic-card quiz-tutor-feedback-card">
        <p class="ar-text quiz-tutor-feedback-text">تلميح المدرس: ${errMsg}</p>
      </div>
    </div>
  `;

  prepareNextButton();
}

function prepareNextButton() {
  const actionBtn = document.getElementById("btn-session-action");
  if (!actionBtn) return;

  actionBtn.disabled = false;
  actionBtn.onclick = () => window.nextSessionQuestion();
  actionBtn.innerHTML = (sessionIndex === sessionQuestions.length - 1)
    ? `<span>Show Results</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>`
    : `<span>Next Question</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
  actionBtn.classList.add("btn-next-svg-adjust");
}

function checkSpellingAnswer() {
  const inputEl = document.getElementById("session-spelling-input");
  const feedbackBox = document.getElementById("session-tutor-feedback");
  if (!inputEl || !feedbackBox) return;

  const q = sessionQuestions[sessionIndex];
  const cleanInput = inputEl.value.trim().toLowerCase();
  const cleanTarget = q.data.word.trim().toLowerCase();

  if (cleanInput === cleanTarget) {
    handleCorrectAnswer(feedbackBox, inputEl);
  } else {
    const hint = getWordSpellingFeedback(cleanInput, cleanTarget);
    handleIncorrectAnswer(feedbackBox, hint, inputEl);
  }
}

function verifyMCQAnswer() {
  const feedbackBox = document.getElementById("session-tutor-feedback");
  const q = sessionQuestions[sessionIndex];
  if (!feedbackBox) return;

  const cleanChosen = selectedMCQOption.toLowerCase().trim();
  const cleanTarget = q.data.answer.toLowerCase().trim();

  // Color options in UI
  document.querySelectorAll(".quiz-option-card").forEach((card, idx) => {
    const optText = q.data.options[idx].toLowerCase().trim();
    if (optText === cleanTarget) {
      card.classList.add("correct");
    } else if (optText === cleanChosen && cleanChosen !== cleanTarget) {
      card.classList.add("incorrect");
    }
  });

  if (cleanChosen === cleanTarget) {
    handleCorrectAnswer(feedbackBox);
  } else {
    const explanation = q.data.explanation || q.data.hint || "راجع كلمات وشرح الدرس جيداً.";
    handleIncorrectAnswer(feedbackBox, explanation);
  }
}

function checkWritingAnswer() {
  const q = sessionQuestions[sessionIndex];
  const feedbackBox = document.getElementById("session-tutor-feedback");
  if (!feedbackBox) return;

  const isBlank = !q.data.correct;
  
  if (isBlank) {
    const inputEl = document.getElementById("session-blank-input");
    if (!inputEl) return;
    const val = inputEl.value.trim().toLowerCase();
    const ans = q.data.answer.toLowerCase();
    
    if (val === ans) {
      handleCorrectAnswer(feedbackBox, inputEl);
    } else {
      handleIncorrectAnswer(feedbackBox, `الكلمة غير صحيحة. الخيار المناسب هو: "${q.data.answer}"`, inputEl);
    }
  } else {
    // Sentence Writer check
    const inputEl = document.getElementById("session-sentence-input");
    const correctSentence = q.data.correct.join(' ');
    
    const targetClean = correctSentence.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const inputClean = typedSentence.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

    if (inputClean === targetClean) {
      handleCorrectAnswer(feedbackBox, inputEl);
    } else {
      const hint = getSentenceSpellingFeedback(typedSentence, correctSentence);
      handleIncorrectAnswer(feedbackBox, hint, inputEl);
    }
  }
}

function checkVocabSpeakingAnswer() {
  const q = sessionQuestions[sessionIndex];
  const feedbackBox = document.getElementById("session-tutor-feedback");
  const inputEl = document.getElementById("session-vocab-fallback-input");
  if (!feedbackBox || !inputEl) return;

  const val = inputEl.value.trim().toLowerCase();
  const ans = q.data.word.toLowerCase().trim();

  if (val === ans) {
    handleCorrectAnswer(feedbackBox, inputEl);
  } else {
    const hint = getWordSpellingFeedback(val, ans);
    handleIncorrectAnswer(feedbackBox, hint, inputEl);
  }
}

// ----------------------------------------------------
// Speech Recognition Logic
// ----------------------------------------------------
function toggleSpeechRecognition() {
  const micBtn = document.getElementById("session-mic-btn");
  const statusTxt = document.getElementById("session-status-text");
  const feedbackBox = document.getElementById("session-tutor-feedback");
  const waves = document.getElementById("session-waves");

  if (!micBtn || !statusTxt || !feedbackBox) return;

  const q = sessionQuestions[sessionIndex];
  // Target phrase is q.data.word (for vocab) or q.data.text (for speaking skill)
  const targetPhrase = q.data.word || q.data.text; 

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusTxt.innerText = "Speech Recognition not supported in this browser. Please type spelling/use fallback.";
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
      statusTxt.innerText = "Listening... Speak the translation now!";
    };

    recognition.onerror = function(event) {
      console.error(event.error);
      statusTxt.innerText = "Error: " + event.error + ". Try alternative input!";
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
      
      const cleanTarget = targetPhrase.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const cleanResult = result.toLowerCase().replace(/[^\w\s]/g, "").trim();
      
      const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
      const resultWords = cleanResult.split(/\s+/).filter(Boolean);
      
      let isMatch = false;
      if (targetWords.length === 1) {
        isMatch = cleanResult === cleanTarget || resultWords.includes(cleanTarget);
      } else {
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
        isMatch = cleanResult === cleanTarget || (matchRatio >= 0.75 && lengthRatio >= 0.7 && lengthRatio <= 1.4);
      }

      if (isMatch) {
        handleCorrectAnswer(feedbackBox);
      } else {
        const hint = targetWords.length === 1 
          ? `النطق لم يطابق الكلمة. انطق الكلمة "${targetPhrase}" بشكل أوضح.` 
          : `النطق يختلف عن الجملة المطلوبة. قل الجملة كاملة بوضوح.`;
        handleIncorrectAnswer(feedbackBox, hint);
      }
    };

    recognition.start();
  } catch (e) {
    console.error(e);
  }
}

// ----------------------------------------------------
// Spelling Advisors (Arabic Feedback)
// ----------------------------------------------------
function getWordSpellingFeedback(input, target) {
  if (!input) return "اكتب الكلمة يا بطل!";
  let diffIndex = -1;
  const minLen = Math.min(input.length, target.length);
  for (let i = 0; i < minLen; i++) {
    if (input[i] !== target[i]) {
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

  if (diffIndex === -1 && input.length < target.length) {
    return `الكلمة ناقصة! الحرف ${getOrdinal(input.length + 1)} ناقص يا بطل.`;
  }
  if (diffIndex === -1 && input.length > target.length) {
    return `حروف زيادة! شيل الحروف بعد الحرف ${getOrdinal(target.length)}.`;
  }

  const pos = diffIndex + 1;
  if (input.length === target.length) {
    return `الحرف ${getOrdinal(pos)} خطأ! (كتبت "${input[diffIndex]}" والمفروض يكون حرف تاني)`;
  }
  
  const inputRest = input.substring(diffIndex);
  const targetRestWithSkip = target.substring(diffIndex + 1);
  if (inputRest === targetRestWithSkip || targetRestWithSkip.startsWith(inputRest)) {
    return `الحرف ${getOrdinal(pos)} ناقص في منتصف الكلمة!`;
  }

  const inputRestWithSkip = input.substring(diffIndex + 1);
  const targetRest = target.substring(diffIndex);
  if (inputRestWithSkip === targetRest || targetRest.startsWith(inputRestWithSkip)) {
    return `الحرف ${getOrdinal(pos)} زيادة! (في حرف زيادة هنا: "${input[diffIndex]}")`;
  }

  return `الحرف ${getOrdinal(pos)} خطأ!`;
}

function getSentenceSpellingFeedback(inputSentence, targetSentence) {
  const cleanInput = inputSentence.trim();
  const cleanTarget = targetSentence.trim();
  if (!cleanInput) return "اكتب الجملة أولاً!";

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
      return `أكمل الجملة! الكلمة ${getWordOrdinal(i + 1)} ناقصة.`;
    }
    if (iWord !== tWord) {
      const wordErrorDetails = getWordSpellingFeedback(iWord, tWord);
      return `الكلمة ${getWordOrdinal(i + 1)} ("${iWord}") فيها خطأ: ${wordErrorDetails}`;
    }
  }

  if (inputWords.length > targetWords.length) {
    return `الجملة تحتوي على كلمات إضافية في نهايتها!`;
  }
  if (cleanInput.toLowerCase().replace(/[^\w\s]/g, '') !== cleanTarget.toLowerCase().replace(/[^\w\s]/g, '')) {
    return `تأكد من ترتيب الكلمات وهجائها بشكل سليم.`;
  }
  return null;
}

// ----------------------------------------------------
// Session Lifecycle Transitions
// ----------------------------------------------------

function nextQuestion() {
  sessionIndex++;
  renderQuestion();
}

function finishSession() {
  if (onCompleteCallback) {
    onCompleteCallback(sessionScore, sessionQuestions.length, currentSessionXP);
  }
}
