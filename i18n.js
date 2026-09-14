"use strict";

/**
 * Minimal localization helper shared by newtab.html and options.html.
 *
 * Firefox resolves the locale from the browser's UI language, so the same
 * markup serves every language. Elements opt in with data attributes:
 *
 *   data-i18n="key"              -> textContent
 *   data-i18n-placeholder="key"  -> placeholder attribute
 *   data-i18n-title="key"        -> title attribute
 */

function t(key, substitutions) {
  // getMessage returns "" for an unknown key; fall back to the key so a
  // missing translation is visible instead of silently blank.
  return browser.i18n.getMessage(key, substitutions) || key;
}

function localizeDocument(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  for (const el of root.querySelectorAll("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle);
  }
}

// Tags the document with the locale Firefox actually resolved, which helps
// with font selection and screen-reader pronunciation.
document.documentElement.lang = browser.i18n.getUILanguage();
