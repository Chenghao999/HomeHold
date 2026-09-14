"use strict";

/**
 * Toolbar popup: the quick way to change the navigation URL.
 *
 * Deliberately a compact subset of the options page. Both write through the
 * same config.js helpers, so they cannot save different shapes of data.
 */

const SAVED_MESSAGE_MS = 1200;

const urlInput = document.getElementById("navUrl");
const enabledInput = document.getElementById("enabled");
const saveButton = document.getElementById("save");
const messageEl = document.getElementById("message");

let messageTimer;

function setMessage(text, tone) {
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
  clearTimeout(messageTimer);
  if (tone === "ok") {
    messageTimer = setTimeout(() => {
      messageEl.textContent = "";
    }, SAVED_MESSAGE_MS);
  }
}

async function load() {
  localizeDocument();

  try {
    const config = await loadConfig();
    urlInput.value = config.navUrl;
    enabledInput.checked = config.enabled;
  } catch {
    setMessage(t("readFailedMessage"), "error");
  }

  urlInput.focus();
  urlInput.select();
}

saveButton.addEventListener("click", async () => {
  const navUrl = urlInput.value.trim();

  if (navUrl && !isSafeNavigationUrl(navUrl)) {
    setMessage(t("invalidUrlMessage"), "error");
    return;
  }

  try {
    await saveConfig({ navUrl, enabled: enabledInput.checked });
  } catch {
    setMessage(t("writeFailedMessage"), "error");
    return;
  }

  urlInput.value = navUrl;
  setMessage(t("savedMessage"), "ok");
});

// Enter anywhere in the popup saves, so the common case needs no mouse.
urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveButton.click();
  }
});

document.getElementById("moreSettings").addEventListener("click", (event) => {
  event.preventDefault();
  browser.runtime.openOptionsPage();
  window.close(); // the popup would otherwise linger over the new tab
});

load();
