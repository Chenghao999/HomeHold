"use strict";

/**
 * Options page: reads, writes, imports and exports the shared configuration.
 *
 * One Save button covers every field on the page, so it writes the whole form
 * at once. The import path writes whatever the file held.
 */

// How long a confirmation stays on screen.
const SAVED_MESSAGE_MS = 1500;

const urlInput = document.getElementById("navUrl");
const enabledInput = document.getElementById("enabled");
const themeSelect = document.getElementById("theme");
const noticeTitleInput = document.getElementById("noticeTitle");
const noticeMessageInput = document.getElementById("noticeMessage");
const saveButton = document.getElementById("save");
const exportButton = document.getElementById("export");
const importButton = document.getElementById("import");
const importFileInput = document.getElementById("importFile");
const incognitoIcon = document.getElementById("incognitoIcon");
const incognitoText = document.getElementById("incognitoText");
const incognitoHelp = document.getElementById("incognitoHelp");

/** Wires a status element to a self-clearing message setter. */
function makeMessenger(element, ttl) {
  let timer;
  return (text, tone) => {
    element.textContent = text;
    element.dataset.tone = tone;
    clearTimeout(timer);
    if (tone === "ok") {
      timer = setTimeout(() => {
        element.textContent = "";
      }, ttl);
    }
  };
}

const setMessage = makeMessenger(document.getElementById("message"), SAVED_MESSAGE_MS);
const setBackupMessage = makeMessenger(document.getElementById("backupMessage"), SAVED_MESSAGE_MS);

function fillForm(config) {
  urlInput.value = config.navUrl;
  enabledInput.checked = config.enabled;
  themeSelect.value = config.theme;
  noticeTitleInput.value = config.noticeTitle;
  noticeMessageInput.value = config.noticeMessage;
}

function readForm() {
  return {
    navUrl: urlInput.value.trim(),
    enabled: enabledInput.checked,
    theme: themeSelect.value,
    noticeTitle: noticeTitleInput.value,
    noticeMessage: noticeMessageInput.value,
  };
}

/**
 * Every write goes through here and re-fills the form from what was actually
 * stored, so the page always shows the saved value rather than what was typed
 * -- trimmed, truncated, or dropped for failing the URL rule.
 */
async function persist(patch, messenger, okMessage) {
  try {
    fillForm(await saveConfig(patch));
  } catch {
    messenger(t("writeFailedMessage"), "error");
    return false;
  }
  messenger(okMessage, "ok");
  return true;
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
    fillForm(await loadConfig());
  } catch {
    setMessage(t("readFailedMessage"), "error");
  }

  await refreshIncognitoStatus();
}

saveButton.addEventListener("click", async () => {
  const form = readForm();

  // Empty is allowed and means "not configured yet"; anything else has to be a
  // real http(s) address.
  if (form.navUrl && !isSafeNavigationUrl(form.navUrl)) {
    setMessage(t("invalidUrlMessage"), "error");
    return;
  }

  await persist(form, setMessage, t("savedMessage"));
});

// Preview the choice immediately; it is not stored until Save. Reloading the
// page without saving puts it back, which is the usual "unsaved" behaviour.
themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

exportButton.addEventListener("click", async () => {
  let config;
  try {
    config = await loadConfig();
  } catch {
    setBackupMessage(t("readFailedMessage"), "error");
    return;
  }

  const blob = new Blob([exportConfig(config)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "homehold-settings.json";
  link.click();

  // The browser reads the blob asynchronously after the click returns, so
  // revoking at once can cancel the download. A minute is comfortably past it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
});

importButton.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files[0];
  // Reset so picking the same file twice in a row still fires a change event.
  importFileInput.value = "";
  if (!file) {
    return;
  }

  let config;
  try {
    config = parseConfigFile(await file.text());
  } catch {
    setBackupMessage(t("importFailedMessage"), "error");
    return;
  }

  await persist(config, setBackupMessage, t("importedMessage"));
});

// The permission is changed outside this page, so re-read it whenever the user
// returns to this tab.
window.addEventListener("focus", refreshIncognitoStatus);

load();
