"use strict";

/**
 * The configuration contract shared by the new tab page, the popup and the
 * options page. Keeping the defaults, the URL rule and the coercion in one file
 * means the three pages cannot drift apart.
 *
 * Nothing here is meant to be edited by hand -- the browser writes these values
 * through the settings UI. The file is named for the defaults it declares, not
 * for anything a user is expected to configure.
 */

const DEFAULT_CONFIG = Object.freeze({
  navUrl: "",
  enabled: true,
  theme: "auto",
  noticeTitle: "",
  noticeMessage: "",
});

const THEMES = Object.freeze(["auto", "light", "dark"]);

// Long enough for a real sentence, short enough that the notice page cannot be
// turned into a wall of text through an imported file.
const NOTICE_TITLE_MAX = 80;
const NOTICE_MESSAGE_MAX = 400;

// Bumped only when the export format changes shape.
const CONFIG_SCHEMA = 1;

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

function clampText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

/** Arrays are objects too, and an array here would quietly read as all-defaults. */
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Coerces anything -- stored data, an imported file, a partial update -- into
 * the canonical shape. Never throws, so a corrupt value degrades to a default
 * instead of breaking a page that has no other way to render.
 */
function normalizeConfig(raw) {
  const source = isPlainObject(raw) ? raw : {};
  const navUrl = String(source.navUrl ?? "").trim();

  return {
    // An address that fails the rule is dropped rather than stored.
    navUrl: isSafeNavigationUrl(navUrl) ? navUrl : "",
    enabled: source.enabled === undefined ? DEFAULT_CONFIG.enabled : Boolean(source.enabled),
    theme: THEMES.includes(source.theme) ? source.theme : DEFAULT_CONFIG.theme,
    noticeTitle: clampText(source.noticeTitle, NOTICE_TITLE_MAX),
    noticeMessage: clampText(source.noticeMessage, NOTICE_MESSAGE_MAX),
  };
}

async function loadConfig() {
  const stored = await browser.storage.local.get(DEFAULT_CONFIG);
  return normalizeConfig(stored);
}

/**
 * Patch-style write: callers pass only the fields they own, and everything else
 * keeps its stored value. The popup and the options page therefore cannot
 * clobber each other's settings.
 */
async function saveConfig(patch) {
  const defined = Object.fromEntries(
    Object.entries(patch ?? {}).filter(([, value]) => value !== undefined),
  );
  const merged = normalizeConfig({ ...(await browser.storage.local.get(DEFAULT_CONFIG)), ...defined });
  await browser.storage.local.set(merged);
  return merged;
}

/** Serializes the settings into the file the options page offers for download. */
function exportConfig(config) {
  return `${JSON.stringify(
    { app: "HomeHold", schema: CONFIG_SCHEMA, config: normalizeConfig(config) },
    null,
    2,
  )}\n`;
}

// Anything normalizeConfig understands. A file carrying none of these is not a
// settings file, and importing it would silently reset every setting to its
// default while reporting success.
const CONFIG_KEYS = Object.freeze(Object.keys(DEFAULT_CONFIG));

/**
 * Reads a file produced by exportConfig. A bare config object is accepted too,
 * so a hand-written file works. Throws when the input is not usable at all --
 * the caller turns that into one localized message.
 */
function parseConfigFile(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("not JSON");
  }

  if (!isPlainObject(parsed)) {
    throw new Error("not a JSON object");
  }

  const source = parsed.app === "HomeHold" && isPlainObject(parsed.config) ? parsed.config : parsed;
  if (!CONFIG_KEYS.some((key) => key in source)) {
    throw new Error("no recognized settings");
  }

  return normalizeConfig(source);
}
