/**
 * Settings Controller Component
 * Egyptian English Academy
 * Handles the logic for settings modal, theme switching, level switching,
 * speech speed customisation, sound effects toggle, and progress backup/restore.
 */

import { levelData, loadLevelData } from './levelManager.js';
import { getProgress, saveProgress, resetProgress } from './storage.js';
import { updateProfileUI } from './app.js';

export function initSettingsController() {
  const modal = document.getElementById("settings-modal");
  const openBtn = document.getElementById("open-settings-btn");
  const closeBtn = document.getElementById("close-settings-btn");

  if (!modal || !openBtn || !closeBtn) {
    console.warn("[SettingsController] Modal or trigger buttons not found in DOM.");
    return;
  }

  // --- Modal Open/Close Logic ---
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    // Sync settings state when opening the modal
    syncSettingsUI();
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // --- Initialize Options & Listeners ---
  initLevelSelection();
  initSpeechRate();
  initSFXOption();
  initSpeakingOption();
  initThemeOption();
  initBackupAndRestore();
  initResetOption();
}

/**
 * Synchronizes the setting UI controls with current localStorage/state values
 */
function syncSettingsUI() {
  // Sync level selection
  const levelSelect = document.getElementById("settings-level-select");
  if (levelSelect) {
    levelSelect.value = levelData.currentLevel || localStorage.getItem("academy_current_level") || "A1";
  }

  // Sync speech rate
  const speechRateSlider = document.getElementById("settings-speech-rate-slider");
  const speechRateVal = document.getElementById("settings-speech-rate-val");
  if (speechRateSlider && speechRateVal) {
    const savedRate = localStorage.getItem("academy_speech_rate") || "0.85";
    speechRateSlider.value = savedRate;
    speechRateVal.innerText = `${savedRate}x`;
  }

  // Sync SFX Button
  const sfxBtn = document.getElementById("settings-sfx-toggle");
  if (sfxBtn) {
    const enabled = localStorage.getItem("academy_sfx_enabled") !== "false";
    updateSFXButtonUI(sfxBtn, enabled);
  }

  // Sync Speaking Button
  const speakingBtn = document.getElementById("settings-speaking-toggle");
  if (speakingBtn) {
    const disabled = localStorage.getItem("academy_speaking_disabled") === "true";
    updateSpeakingButtonUI(speakingBtn, !disabled);
  }

  // Sync Theme Button
  const themeBtn = document.getElementById("settings-theme-toggle");
  if (themeBtn) {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    updateThemeButtonUI(themeBtn, currentTheme);
  }
}

/**
 * Level Selection logic
 */
function initLevelSelection() {
  const levelSelect = document.getElementById("settings-level-select");
  if (!levelSelect) return;

  levelSelect.addEventListener("change", async (e) => {
    const newLevel = e.target.value;
    const currentLevel = levelData.currentLevel;

    if (newLevel === currentLevel) return;

    try {
      // Show loading indicator in select
      levelSelect.disabled = true;
      
      // Load curriculum data dynamically for the new level
      await loadLevelData(newLevel);
      
      // Hide modal
      const modal = document.getElementById("settings-modal");
      if (modal) modal.style.display = "none";
      
      // Reload page to re-initialize roadmap, dashboard, and other components with new level data
      window.location.reload();
    } catch (error) {
      alert("حدث خطأ أثناء تحميل بيانات المستوى الجديد. يرجى المحاولة مرة أخرى.");
      levelSelect.value = currentLevel;
      levelSelect.disabled = false;
    }
  });
}

/**
 * Speech Rate logic
 */
function initSpeechRate() {
  const slider = document.getElementById("settings-speech-rate-slider");
  const valEl = document.getElementById("settings-speech-rate-val");
  if (!slider || !valEl) return;

  slider.addEventListener("input", (e) => {
    const rate = e.target.value;
    valEl.innerText = `${rate}x`;
    localStorage.setItem("academy_speech_rate", rate);
  });
}

/**
 * Sound Effects logic
 */
function initSFXOption() {
  const btn = document.getElementById("settings-sfx-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    let enabled = localStorage.getItem("academy_sfx_enabled") !== "false";
    enabled = !enabled;
    localStorage.setItem("academy_sfx_enabled", enabled ? "true" : "false");
    updateSFXButtonUI(btn, enabled);
  });
}

function updateSFXButtonUI(btn, enabled) {
  if (enabled) {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>SFX: On</span>`;
  } else {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> <span>SFX: Off</span>`;
  }
}

/**
 * Speaking & Microphone Questions Option
 */
function initSpeakingOption() {
  const btn = document.getElementById("settings-speaking-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    let disabled = localStorage.getItem("academy_speaking_disabled") === "true";
    disabled = !disabled;
    localStorage.setItem("academy_speaking_disabled", disabled ? "true" : "false");
    updateSpeakingButtonUI(btn, !disabled);
  });
}

function updateSpeakingButtonUI(btn, enabled) {
  if (enabled) {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"></path></svg> <span>Speaking: On</span>`;
    btn.style.borderColor = "var(--border-color)";
    btn.style.color = "var(--text-main)";
  } else {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"></path><path d="M17 11.5a6 6 0 0 1-4 5.5v2.5M8 23h8M19 10.5v1a7 7 0 0 1-1.33 4.12"></path></svg> <span>Speaking: Off</span>`;
    btn.style.borderColor = "var(--error)";
    btn.style.color = "var(--error)";
  }
}

/**
 * Theme logic
 */
function initThemeOption() {
  const btn = document.getElementById("settings-theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = activeTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("academy_theme", newTheme);
    updateThemeButtonUI(btn, newTheme);

    // Sync other theme buttons if they exist
    const otherThemeBtn = document.getElementById("theme-toggle");
    if (otherThemeBtn) {
      updateThemeButtonUI(otherThemeBtn, newTheme);
    }
  });
}

function updateThemeButtonUI(btn, theme) {
  if (theme === "dark") {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> <span>Light Mode</span>`;
  } else {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sidebar-btn-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> <span>Dark Mode</span>`;
  }
}

/**
 * Backup and Restore progress logic
 */
function initBackupAndRestore() {
  const exportBtn = document.getElementById("settings-export-btn");
  const importBtn = document.getElementById("settings-import-btn");
  const fileInput = document.getElementById("settings-import-file");

  if (!exportBtn || !importBtn || !fileInput) return;

  // Export Progress handler
  exportBtn.addEventListener("click", () => {
    try {
      const progress = getProgress();
      const dataStr = JSON.stringify(progress, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = 'egyptian-english-academy-progress.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      console.error("[SettingsController] Failed to export progress", e);
      alert("فشل تصدير التقدم الدراسي. يرجى المحاولة مرة أخرى.");
    }
  });

  // Import Progress handler
  importBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);

        // Simple validation check
        if (importedData && typeof importedData === 'object' && 'xp' in importedData) {
          // Additional verification
          if (Array.isArray(importedData.completedLessons)) {
            // Save to localStorage
            saveProgress(importedData);
            alert("تم استيراد تقدمك الدراسي بنجاح. سيتم الآن تحديث التطبيق.");
            window.location.reload();
          } else {
            throw new Error("Invalid structure: completedLessons must be an array.");
          }
        } else {
          throw new Error("Invalid structure: missing required properties.");
        }
      } catch (err) {
        console.error("[SettingsController] Failed to import progress", err);
        alert("فشل استيراد تقدمك الدراسي. يرجى التأكد من اختيار ملف التقدم الصحيح الذي تم تصديره مسبقاً.");
      }
    };
    reader.readAsText(file);
    // Clear value to allow selecting same file again
    fileInput.value = "";
  });
}

/**
 * Reset Progress logic
 */
function initResetOption() {
  const resetBtn = document.getElementById("settings-reset-btn");
  if (!resetBtn) return;

  resetBtn.addEventListener("click", () => {
    const hasConfirmed = confirm("هل أنت متأكد من رغبتك في حذف كل تقدمك الدراسي ونقاط الخبرة والبدء من جديد؟ لا يمكن التراجع عن هذا الإجراء.");
    if (hasConfirmed) {
      resetProgress();
      const modal = document.getElementById("settings-modal");
      if (modal) modal.style.display = "none";
      window.location.hash = "#dashboard";
      window.location.reload();
    }
  });
}
