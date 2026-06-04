/**
 * Core Application Controller (SPA Router & Global State Manager)
 * Egyptian English Academy
 */

import { getProgress, resetProgress } from './storage.js';
import { renderDashboard } from './components/dashboard.js';
import { renderRoadmap } from './components/roadmap.js';
import { renderLesson } from './components/lessonViewer.js';
import { initVocabCenter } from './components/vocabCenter.js';
import { initFinalTest } from './components/finalTest.js';
import { renderDictionary } from './components/dictionary.js';
import { initReviewCenter } from './components/reviewCenter.js';
import { initLevelManager, levelData } from './levelManager.js';
import { initSettingsController } from './settingsController.js';
import { initGameCenter } from './components/gameCenter.js';

// Router Map matching hashes to section DOM IDs
const ROUTES = {
  'dashboard': 'dashboard-section',
  'roadmap': 'roadmap-section',
  'lesson-viewer': 'lesson-viewer-section',
  'vocab-center': 'vocab-center-section',
  'dictionary': 'dictionary-section',
  'final-test': 'final-test-section',
  'review-center': 'review-center-section',
  'game-center': 'game-center-section'
};

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize level manager to dynamically load current curriculum data
  await initLevelManager();

  // Apply saved theme at startup
  const savedTheme = localStorage.getItem("academy_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  initSidebarMobile();
  initRouter();
  updateProfileUI();
  initSettingsController();

  // Listen for progress updates to refresh user profile HUD
  window.addEventListener("academyProgressUpdated", () => {
    updateProfileUI();
  });
});

/* ==========================================================================
   2. User Profile HUD (XP, Level, Rank Title)
   ========================================================================== */
function updateProfileUI() {
  const progress = getProgress();
  
  const xpPerLevel = 3000;
  const level = Math.floor(progress.xp / xpPerLevel) + 1;
  
  const completedCount = progress.completedLessons.length;
  const totalLessons = levelData.curriculum.length || 40;
  
  // Detailed milestone-based progress: dynamic lessons * 3 milestones
  const completedVocabs = (progress.completedVocabRecitations || []).length;
  const completedPractices = (progress.completedPractices || []).length;
  const completedQuizzes = Object.keys(progress.quizScores || {}).filter(lessonId => {
    const score = progress.quizScores[lessonId] || 0;
    return score >= 14;
  }).length;
  
  const totalMilestones = totalLessons * 3;
  const completedMilestones = completedVocabs + completedPractices + completedQuizzes;
  const progressPercent = Math.min(100, Math.round((completedMilestones / totalMilestones) * 100));

  const currentLevelId = levelData.currentLevel || "A1";
  let rankTitle = `${currentLevelId} Beginner`;
  if (level === 2) rankTitle = "English Explorer";
  else if (level === 3) rankTitle = "Grammar Rookie";
  else if (level === 4) rankTitle = "Fluency Aspirant";
  else if (level >= 5) rankTitle = `${currentLevelId} Champion`;

  if (progress.finalTestScore !== null && progress.finalTestScore >= 16) {
    rankTitle = "Certified Graduate";
  }

  const avatarEl = document.getElementById("user-hud-avatar");
  const rankEl = document.getElementById("user-hud-rank");
  const nameEl = document.getElementById("user-hud-name");
  const xpTextEl = document.getElementById("user-hud-xp-text");
  const xpFillEl = document.getElementById("user-hud-xp-fill");
  const levelNumEl = document.getElementById("user-hud-level-num");
  const totalXpEl = document.getElementById("user-hud-total-xp");

  if (avatarEl) {
    if (progress.fullName) {
      avatarEl.innerText = progress.fullName.charAt(0).toUpperCase();
    } else {
      avatarEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    }
  }
  if (nameEl) {
    nameEl.innerText = progress.fullName || "Student";
  }
  if (rankEl) {
    rankEl.innerText = rankTitle;
  }
  if (xpTextEl) {
    xpTextEl.innerText = `${completedCount} / ${totalLessons} Lessons`;
  }
  if (xpFillEl) {
    xpFillEl.style.width = `${progressPercent}%`;
  }
  if (levelNumEl) {
    levelNumEl.innerText = level;
  }
  if (totalXpEl) {
    totalXpEl.innerText = `${progress.xp} XP Total`;
  }
}

/* ==========================================================================
   3. Single Page Application Router
   ========================================================================== */
function initRouter() {
  window.addEventListener("hashchange", handleRouting);
  
  // Trigger initial routing
  handleRouting();
}

function handleRouting() {
  const hashString = window.location.hash || "#dashboard";
  
  // Parse hash and queries: e.g. #lesson-viewer?id=2&tab=learn
  const parts = hashString.split("?");
  const routeName = parts[0].substring(1); // Remove '#'
  const queryString = parts[1] || "";
  
  // Parse query string parameters
  const params = {};
  if (queryString) {
    queryString.split("&").forEach(param => {
      const kv = param.split("=");
      params[kv[0]] = decodeURIComponent(kv[1]);
    });
  }

  // Check if route exists, fallback to dashboard
  const targetSectionId = ROUTES[routeName] || 'dashboard-section';
  const cleanRouteName = ROUTES[routeName] ? routeName : 'dashboard';

  // Toggle active class on pages
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.classList.remove("active");
  });
  
  const targetSec = document.getElementById(targetSectionId);
  if (targetSec) targetSec.classList.add("active");

  // Highlight active sidebar navigation links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    const linkHash = link.getAttribute("href");
    
    // Exact match or prefix match for subpages
    if (linkHash === `#${cleanRouteName}` || 
       (cleanRouteName === 'lesson-viewer' && linkHash === '#roadmap') ||
       (queryString.includes('mode=review') && linkHash.includes('mode=review'))) {
      link.classList.add("active");
    }
  });

  // Call corresponding component engine to draw content
  switch (cleanRouteName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'roadmap':
      renderRoadmap();
      break;
    case 'lesson-viewer':
      renderLesson(params.id || 1, params.tab || 'learn');
      break;
    case 'vocab-center':
      initVocabCenter(params);
      break;
    case 'final-test':
      initFinalTest();
      break;
    case 'dictionary':
      renderDictionary();
      break;
    case 'review-center':
      initReviewCenter();
      break;
    case 'game-center':
      initGameCenter(params);
      break;
  }

  // Close sidebar on mobile after navigating
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) sidebar.classList.remove("open");
}

/* ==========================================================================
   4. Mobile Responsive Navigation
   ========================================================================== */
function initSidebarMobile() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }
}

// Global utility bound to window to allow resetting progress from anywhere
window.resetAcademyProgress = function() {
  const arConfirm = confirm("Are you sure you want to reset all your progress, XP, and start over?");
  if (arConfirm) {
    resetProgress();
    window.location.hash = '#dashboard';
    updateProfileUI();
  }
};
export { updateProfileUI };
