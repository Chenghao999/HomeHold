# HomeHold

**English** | [中文](README.zh-CN.md)

Keep your homepage: every new tab opens your own navigation page — in private windows too.

HomeHold is a small Firefox extension (Manifest V3). It overrides the new tab page and
forwards it to a URL you choose. Nothing else: no telemetry, no network requests, no
account. Your configuration stays in `browser.storage.local` on your own machine.

---

## What it does

| | |
|---|---|
| **New tab** | Redirects to your navigation page |
| **Private windows** | Works too, once you grant the permission (see below) |
| **Storage** | `browser.storage.local` — local only, never uploaded |
| **Permissions** | `storage` only |
| **Requires** | Firefox 109+ |

---

## Install

### From source (temporary, for development)

```bash
git clone https://github.com/Chenghao999/HomeHold.git
cd HomeHold
```

Then open `about:debugging#/runtime/this-firefox` in Firefox, click **Load Temporary
Add-on…**, and select `manifest.json`. The extension stays loaded until you restart
Firefox. Signing is required for a permanent install — see [Packaging](#packaging).

### With web-ext (auto-reloading dev loop)

```bash
npm install --global web-ext
cd HomeHold
web-ext run
```

`web-ext run` launches a clean Firefox profile with the extension loaded and reloads it
whenever a source file changes. Add `--firefox-profile <name>` to reuse your own profile.

---

## Usage

1. Open the settings page — `about:addons` → HomeHold → **Preferences**, or the
   **Open settings** button shown on the new tab page before you have configured anything.
2. Enter the address you want every new tab to open. It must start with `http://` or
   `https://`.
3. Press **Save**, then open a new tab.

### Private windows

Firefox does not let an extension grant itself private-window access — you have to turn it
on yourself, and HomeHold cannot do it for you:

> `about:addons` → HomeHold → **Permissions** → enable **Run in Private Windows**

The settings page shows the current state of that permission and repeats these
instructions when it is off. Until you enable it, private windows keep Firefox's default
new tab page.

---

## Development

The extension is plain JavaScript with no build step and no dependencies. Edit a file,
reload the add-on in `about:debugging`, and the change is live.

```
.
├── manifest.json            # Extension declaration
├── background.js            # Private-window permission check (background)
├── config.js                # Shared config defaults + URL validation
├── i18n.js                  # data-i18n DOM localization helper
├── newtab.html/.js/.css     # The overridden new tab page
├── options.html/.js/.css    # Settings page
├── _locales/
│   ├── en/messages.json     # English strings (default locale)
│   └── zh_CN/messages.json  # Simplified Chinese strings
├── icons/                   # icon-48.png, icon-96.png
└── tools/make-icons.py      # Regenerates the icons
```

### Localization

Firefox picks the locale from the browser's UI language, so there is one settings page
rather than one per language. Strings live in `_locales/<locale>/messages.json`; markup
refers to them through `data-i18n` attributes, which `i18n.js` resolves on load. English is
the default locale and the fallback for anything untranslated.

To add a language, copy `_locales/en/` to `_locales/<code>/` and translate the `message`
values. Keys, placeholders and the file structure must stay identical.

### Regenerating the icons

```bash
python3 tools/make-icons.py
```

Uses only the Python standard library — no Pillow needed. Edit `SIZES` in the script to
emit additional sizes.

### Packaging

```bash
web-ext lint                # static checks
web-ext build               # writes a zip to web-ext-artifacts/
```

Before publishing, change `browser_specific_settings.gecko.id` in `manifest.json` from the
`homehold@yourdomain.com` placeholder to an ID you control.

`web-ext lint` reports two advisory warnings on a clean checkout: `strict_min_version` is
`109.0`, but `data_collection_permissions` was only introduced in Firefox 140. The property
is additive — older versions ignore it — so the extension still works on 109 onward. AMO
now requires the declaration for new submissions, so the two are kept together
deliberately. Raise `strict_min_version` to `140.0` if you would rather have a clean lint
run and do not need the older versions.

---

## Privacy

- Requests only the `storage` permission. No `tabs`, `history`, `webRequest` or `cookies`.
- Makes no network requests of its own. The redirect is performed by the browser, and the
  only address ever contacted is the one you configured.
- Collects no telemetry and sends nothing anywhere.
- All configuration stays in local extension storage.
- Stored URLs are restricted to `http:` and `https:`, so a stored value cannot become
  script execution or local file access.
- Text is written to the page with `textContent`, never `innerHTML`.

---

## Known limitations

1. Private-window access must be granted by the user; an extension cannot force it.
2. Without that permission, the override does not load in private windows and Firefox's
   default new tab page is shown instead.
3. `file://` pages may be blocked by CSP. Prefer an online address.
4. Behaviour of `chrome_url_overrides` in private windows has varied across Firefox
   releases — worth re-testing on any version you support.

---

## Roadmap

- **v1.1** — Multiple navigation pages with a keyboard shortcut to switch
- **v1.2** — Configuration import/export
- **v1.3** — `storage.sync` cross-device sync
- **v1.4** — Generate a navigation page from bookmarks
- **v2.0** — Optional dark theme and a customizable notice page

---

## License

[MIT](LICENSE) © 2026 Chenghao999

You are free to use, modify and redistribute this code, including commercially, as long as
the copyright notice and permission notice are kept. The software comes with no warranty.
