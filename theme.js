"use strict";

/**
 * Theme override.
 *
 * Loaded from <head>, before the body is parsed, so a stored choice lands
 * before the first paint -- otherwise a dark-mode user would see a light flash
 * every time the page opens.
 *
 * "auto" removes the attribute entirely and lets the stylesheet's
 * prefers-color-scheme rules decide, which is what an untouched install uses.
 */

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

(async function initTheme() {
  try {
    const { theme } = await browser.storage.local.get({ theme: DEFAULT_CONFIG.theme });
    applyTheme(theme);
  } catch {
    // Storage unavailable: fall back to following the system setting.
  }
})();
