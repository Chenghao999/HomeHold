"use strict";

/**
 * New tab override.
 *
 * Reads the stored configuration and forwards the tab to the user's
 * navigation page. Every failure path lands on an on-page notice rather than a
 * blank tab, since this page replaces what the browser would normally show.
 */

const noticeEl = document.getElementById("notice");
const noticeTitleEl = document.getElementById("noticeTitle");
const noticeTextEl = document.getElementById("noticeText");

/**
 * `config` is optional: when storage itself failed there is nothing to read a
 * custom notice out of, so the localized defaults stand in.
 */
function showNotice(message, config) {
  noticeTitleEl.textContent = config?.noticeTitle || t("noticeTitle");
  noticeTextEl.textContent = config?.noticeMessage || message;
  noticeEl.hidden = false;
}

async function init() {
  localizeDocument();

  document.getElementById("openSettings").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
  });

  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    showNotice(t("noticeReadFailed", [String(error?.message || error)]));
    return;
  }

  if (!config.enabled) {
    showNotice(t("noticeDisabled"), config);
    return;
  }

  if (!isSafeNavigationUrl(config.navUrl)) {
    showNotice(t("noticeNotConfigured"), config);
    return;
  }

  // replace() rather than assign(), so the Back button skips this page instead
  // of landing on an empty new tab.
  window.location.replace(config.navUrl);
}

init();
