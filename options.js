"use strict";

/** Options page: reads and writes the shared configuration. */

// How long the "Saved" confirmation stays on screen.
const SAVED_MESSAGE_MS = 1500;

const urlInput = document.getElementById("navUrl");
const enabledInput = document.getElementById("enabled");
const saveButton = document.getElementById("save");
const messageEl = document.getElementById("message");
const incognitoIcon = document.getElementById("incognitoIcon");
const incognitoText = document.getElementById("incognitoText");
const incognitoHelp = document.getElementById("incognitoHelp");

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

async function refreshIncognitoStatus() {
  let allowed;
  try {
    allowed = await browser.extension.isAllowedIncognitoAccess();
  } catch {
    incognitoIcon.textContent = "•";
    incognitoText.textContent = t("incognitoUnknown");
    incognitoHelp.hidden = true;
    return;
  }

  incognitoIcon.textContent = allowed ? "✓" : "!";
  incognitoText.textContent = t(allowed ? "incognitoAllowed" : "incognitoDenied");
  incognitoHelp.textContent = t("incognitoHelpDenied");
  incognitoHelp.hidden = allowed;
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

  await refreshIncognitoStatus();
}

saveButton.addEventListener("click", async () => {
  const navUrl = urlInput.value.trim();

  // Empty is allowed and means "not configured yet"; anything else has to be a
  // real http(s) address.
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

// The permission is changed outside this page, so re-read it whenever the user
// returns to this tab.
window.addEventListener("focus", refreshIncognitoStatus);

load();
