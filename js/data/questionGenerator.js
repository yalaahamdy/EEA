/**
 * Dynamic Question Generator Component
 * Egyptian English Academy
 * Dynamically pads exercises to exactly 10 items per skill per lesson,
 * and generates 15-question interactive quizzes.
 */

import { levelData } from '../levelManager.js';

// Helper to shuffle array
function shuffle(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Helper to get random distractors from vocabulary
function getVocabDistractors(correctWord, lesson, count = 2) {
  const lessonVocab = lesson.vocabulary.map(v => v.word);
  let pool = lessonVocab.filter(w => w.toLowerCase() !== correctWord.toLowerCase());
  
  if (pool.length < count) {
    // Pull from entire curriculum if lesson vocab is not enough
    levelData.curriculum.forEach(l => {
      l.vocabulary.forEach(v => {
        if (v.word.toLowerCase() !== correctWord.toLowerCase() && !pool.includes(v.word)) {
          pool.push(v.word);
        }
      });
    });
  }
  
  return shuffle(pool).slice(0, count);
}

// Helper to get random Arabic translation distractors
function getTranslationDistractors(correctTrans, lesson, count = 2) {
  const lessonTrans = lesson.vocabulary.map(v => v.translation);
  let pool = lessonTrans.filter(t => t !== correctTrans);
  
  if (pool.length < count) {
    levelData.curriculum.forEach(l => {
      l.vocabulary.forEach(v => {
        if (v.translation !== correctTrans && !pool.includes(v.translation)) {
          pool.push(v.translation);
        }
      });
    });
  }
  
  return shuffle(pool).slice(0, count);
}

// Split sentence into clean words list for Sentence Writer
function cleanSentenceWords(sentence) {
  return sentence
    .replace(/[^\w\s']/g, '') // remove punctuation except apostrophes
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns exactly 10 exercises for a given roadmap lesson and skill
 */
export function getLessonExercises(lesson, skill) {
  let list = [];
  
  if (skill === 'listening') {
    // 1. Get existing listening exercises
    if (lesson.practice && lesson.practice.listening) {
      list = [...lesson.practice.listening];
    }
    
    // 2. Pad to 10 using vocabulary
    if (list.length < 10) {
      const vocabList = shuffle(lesson.vocabulary);
      for (let i = 0; i < vocabList.length && list.length < 10; i++) {
        const v = vocabList[i];
        // Skip if already in listening texts to avoid duplicates
        if (list.some(ex => ex.text.toLowerCase().includes(v.word.toLowerCase()))) {
          continue;
        }
        
        const dists = getVocabDistractors(v.word, lesson, 2);
        const options = shuffle([v.word, ...dists]);
        list.push({
          text: v.example || v.word,
          options: options,
          answer: v.word,
          hint: `الكلمة تعني بالعامية: ${v.translation}`
        });
      }
    }
  } 
  
  else if (skill === 'speaking') {
    if (lesson.practice && lesson.practice.speaking) {
      list = [...lesson.practice.speaking];
    }
    
    if (list.length < 10) {
      const vocabList = shuffle(lesson.vocabulary);
      for (let i = 0; i < vocabList.length && list.length < 10; i++) {
        const v = vocabList[i];
        if (list.some(ex => ex.text.toLowerCase() === v.word.toLowerCase() || (v.example && ex.text.toLowerCase() === v.example.toLowerCase()))) {
          continue;
        }
        
        list.push({
          text: v.example || v.word,
          translation: v.exampleTranslation || v.translation
        });
      }
    }
  } 
  
  else if (skill === 'reading') {
    // Reading contains a text passage and multiple questions
    const passage = (lesson.practice && lesson.practice.reading && lesson.practice.reading.passage) || (lesson.practice && lesson.practice.reading && lesson.practice.reading.text) || "";
    let questions = [];
    
    if (lesson.practice && lesson.practice.reading && lesson.practice.reading.questions) {
      questions = [...lesson.practice.reading.questions];
    }
    
    // Generate vocabulary-based reading questions if we need 10
    if (questions.length < 10) {
      const vocabList = shuffle(lesson.vocabulary);
      for (let i = 0; i < vocabList.length && questions.length < 10; i++) {
        const v = vocabList[i];
        if (questions.some(q => q.q.includes(v.word))) {
          continue;
        }
        
        const dists = getTranslationDistractors(v.translation, lesson, 2);
        const options = shuffle([v.translation, ...dists]);
        questions.push({
          q: `What is the Arabic translation of the word "${v.word}"?`,
          options: options,
          answer: v.translation,
          explanation: `الترجمة الصحيحة لكلمة "${v.word}" هي "${v.translation}"`
        });
      }
    }
    
    // Map them to full reading objects including the passage
    list = questions.map(q => ({
      ...q,
      passage: passage
    }));
  } 
  
  else if (skill === 'writing') {
    if (lesson.practice && lesson.practice.writing) {
      // Include only fill-in-the-blank questions (those with an 'answer' field)
      list = lesson.practice.writing.filter(ex => ex.answer && !ex.correct);
    }
    
    if (list.length < 10) {
      const vocabList = shuffle(lesson.vocabulary);
      for (let i = 0; i < vocabList.length && list.length < 10; i++) {
        const v = vocabList[i];
        if (!v.example) continue;
        
        // Always use Fill-in-the-blank (never Sentence Writer)
        const lowercaseWord = v.word.toLowerCase();
        const cleanEx = v.example.replace(/[^\w\s']/g, '');
        const words = cleanEx.split(/\s+/);
        const foundIdx = words.findIndex(w => w.toLowerCase() === lowercaseWord);
        
        if (foundIdx !== -1) {
          const blankedSentence = v.example.replace(new RegExp(`\\b${v.word}\\b`, 'i'), '___');
          const dists = getVocabDistractors(v.word, lesson, 2);
          list.push({
            prompt: `أكمل الجملة: ${v.exampleTranslation || v.translation} : ${blankedSentence}`,
            placeholder: shuffle([v.word, ...dists]).join(' / '),
            answer: v.word
          });
        } else {
          // Fallback: simple word fill blank
          const dists = getVocabDistractors(v.word, lesson, 2);
          list.push({
            prompt: `اكتب الكلمة الناقصة: كيف تقول "${v.translation}" بالإنجليزية؟`,
            placeholder: shuffle([v.word, ...dists]).join(' / '),
            answer: v.word
          });
        }
      }
    }
  }

  // Always return exactly 10, shuffled
  return shuffle(list).slice(0, 10);
}

/**
 * Generates 15 quiz questions for a lesson:
 * - 3 Vocab (2 spelling, 1 speaking)
 * - 3 Listening
 * - 3 Speaking
 * - 3 Reading
 * - 3 Writing
 */
export function generateLessonQuizQuestions(lesson) {
  const quizQuestions = [];
  
  // 1. Vocab (3 questions)
  const vocabShuffled = shuffle(lesson.vocabulary);
  quizQuestions.push({
    type: 'vocab',
    vocabMode: 'spelling',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    data: vocabShuffled[0]
  });
  quizQuestions.push({
    type: 'vocab',
    vocabMode: 'spelling',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    data: vocabShuffled[1]
  });
  quizQuestions.push({
    type: 'vocab',
    vocabMode: 'speaking',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    data: vocabShuffled[2]
  });

  // 2. Listening (3 questions)
  const listEx = getLessonExercises(lesson, 'listening');
  shuffle(listEx).slice(0, 3).forEach(ex => {
    quizQuestions.push({
      type: 'skill',
      skillType: 'listening',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      data: ex
    });
  });

  // 3. Speaking (3 questions)
  const speakEx = getLessonExercises(lesson, 'speaking');
  shuffle(speakEx).slice(0, 3).forEach(ex => {
    quizQuestions.push({
      type: 'skill',
      skillType: 'speaking',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      data: ex
    });
  });

  // 4. Reading (3 questions)
  const readEx = getLessonExercises(lesson, 'reading');
  shuffle(readEx).slice(0, 3).forEach(ex => {
    quizQuestions.push({
      type: 'skill',
      skillType: 'reading',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      data: ex
    });
  });

  // 5. Writing (3 questions)
  const writeEx = getLessonExercises(lesson, 'writing');
  shuffle(writeEx).slice(0, 3).forEach(ex => {
    quizQuestions.push({
      type: 'skill',
      skillType: 'writing',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      data: ex
    });
  });

  return shuffle(quizQuestions);
}

/**
 * Generates 50 cumulative exam questions from completed lessons
 */
export function generateCumulativeExamQuestions(completedLessons) {
  const examQuestions = [];
  
  // Distribute: 10 vocab + 40 skills (10 Listening, 10 Speaking, 10 Reading, 10 Writing)
  const allVocab = [];
  const allListening = [];
  const allSpeaking = [];
  const allReading = [];
  const allWriting = [];
  
  completedLessons.forEach(lesson => {
    lesson.vocabulary.forEach(v => allVocab.push({ v, lesson }));
    getLessonExercises(lesson, 'listening').forEach(ex => allListening.push({ ex, lesson }));
    getLessonExercises(lesson, 'speaking').forEach(ex => allSpeaking.push({ ex, lesson }));
    getLessonExercises(lesson, 'reading').forEach(ex => allReading.push({ ex, lesson }));
    getLessonExercises(lesson, 'writing').forEach(ex => allWriting.push({ ex, lesson }));
  });

  // Pick 10 unique vocab
  shuffle(allVocab).slice(0, 10).forEach((item, idx) => {
    examQuestions.push({
      type: 'vocab',
      vocabMode: idx % 2 === 0 ? 'spelling' : 'speaking',
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      data: item.v
    });
  });

  // Pick 10 Listening
  shuffle(allListening).slice(0, 10).forEach(item => {
    examQuestions.push({
      type: 'skill',
      skillType: 'listening',
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      data: item.ex
    });
  });

  // Pick 10 Speaking
  shuffle(allSpeaking).slice(0, 10).forEach(item => {
    examQuestions.push({
      type: 'skill',
      skillType: 'speaking',
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      data: item.ex
    });
  });

  // Pick 10 Reading
  shuffle(allReading).slice(0, 10).forEach(item => {
    examQuestions.push({
      type: 'skill',
      skillType: 'reading',
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      data: item.ex
    });
  });

  // Pick 10 Writing
  shuffle(allWriting).slice(0, 10).forEach(item => {
    examQuestions.push({
      type: 'skill',
      skillType: 'writing',
      lessonId: item.lesson.id,
      lessonTitle: item.lesson.title,
      data: item.ex
    });
  });

  return shuffle(examQuestions);
}
