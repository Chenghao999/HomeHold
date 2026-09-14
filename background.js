"use strict";

/**
 * Caches the private-window permission so the options page can show it
 * without asking every time it opens.
 *
 * The value is display-only: an extension cannot grant itself private-window
 * access, only the user can, from about:addons.
 */
async function syncIncognitoFlag() {
  try {
    const allowed = await browser.extension.isAllowedIncognitoAccess();
    await browser.storage.local.set({ incognitoAllowed: allowed });
  } catch {
    // Permission probing can fail on some builds; the options page falls back
    // to querying the API directly, so there is nothing useful to do here.
  }
}

browser.runtime.onStartup.addListener(syncIncognitoFlag);
browser.runtime.onInstalled.addListener(syncIncognitoFlag);
