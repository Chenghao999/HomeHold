"use strict";

/**
 * The configuration contract shared by the new tab page and the options page.
 * Keeping the defaults and the URL rule in one file means the two pages cannot
 * drift apart.
 */

const DEFAULT_CONFIG = Object.freeze({
  navUrl: "",
  enabled: true,
});

/**
 * Only http(s) is accepted. Storing javascript:, data: or file: and then
 * navigating to it would turn a user setting into script execution or local
 * file access.
 */
function isSafeNavigationUrl(value) {
  try {
    const { protocol } = new URL(String(value).trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

async function loadConfig() {
  return browser.storage.local.get(DEFAULT_CONFIG);
}

async function saveConfig({ navUrl, enabled }) {
  await browser.storage.local.set({
    navUrl: String(navUrl || "").trim(),
    enabled: Boolean(enabled),
  });
}
