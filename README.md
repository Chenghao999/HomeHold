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

### 1. Get the package

Building produces a **`.xpi`** file. That is Firefox's extension package format — a ZIP
with an `.xpi` extension — and it is the file you install.

**Download a build.** Every push to `main` builds one. Open the
[Actions tab](https://github.com/Chenghao999/HomeHold/actions), pick the newest **Build**
run, and download the **homehold-xpi** artifact. Tagged releases also attach the `.xpi`
directly to the [Releases page](https://github.com/Chenghao999/HomeHold/releases), which
is the shorter route.

**Or build it locally:**

```bash
npm install
npm run build        # -> dist/homehold-1.0.0.xpi
```

### 2. Install it in Firefox

Firefox only installs an **unsigned** package temporarily, so the right method depends on
which Firefox you run:

| Package | How to install | Lasts |
|---|---|---|
| Unsigned | `about:debugging` → **This Firefox** → **Load Temporary Add-on…** → pick the `.xpi` | Until Firefox restarts |
| Signed | Any Firefox: `about:addons` → gear icon → **Install Add-on From File…** | Permanently |
| Unsigned | **Developer Edition / Nightly / ESR**: `about:addons` → gear icon → **Install Add-on From File…** | Permanently |

Regular Firefox (release and beta) refuses to install an unsigned package permanently —
it reports the file as corrupt. That is a Firefox security rule, not a problem with the
build.

To get a signed `.xpi`, upload the package to Mozilla for signing. It is free, and the
`unlisted` channel means the extension is signed but **not** published in the add-on
store:

```bash
# Create API keys once: https://addons.mozilla.org/developers/addon/api/key/
npm run sign -- --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET"
```

The signed `.xpi` lands in `dist/` and installs permanently on any Firefox.

### 3. Configure it in the browser

Yes — everything is configured inside Firefox. There is no config file to edit.

Open the settings page either way:

- `about:addons` → **HomeHold** → **Preferences**, or
- click **Open settings** on the new tab page, shown until an address is configured

Enter the address every new tab should open, press **Save**, and open a new tab. Settings
live in the browser's local extension storage and take effect immediately — no restart.

### For development

```bash
npm install
npm start            # web-ext run: clean profile, auto-reloads on save
```

Add `-- --firefox-profile <name>` to reuse your own profile. To load the unpacked source
instead, open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**
and select `manifest.json`.

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

The extension itself is plain JavaScript — no build step, no framework, no runtime
dependencies. `npm` is only used to run the packaging tools. Edit a file and the running
add-on picks it up on reload.

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
├── tools/make-icons.py      # Regenerates the icons
├── scripts/build.sh         # Builds dist/homehold-<version>.xpi
├── .web-ext-config.mjs      # Shared web-ext settings (what ships, what doesn't)
└── .github/workflows/       # CI: builds the .xpi on every push
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
npm run lint         # static checks
npm run build        # -> dist/homehold-<version>.xpi
npm run sign         # signed .xpi, needs AMO API keys (see Install)
```

The ignore list lives in `.web-ext-config.mjs` and is shared by both `lint` and `build`, so
the linter and the packager can never disagree about what the extension contains. Note the
`.xpi` is deliberately *not* committed — `dist/` is gitignored, and CI rebuilds it.

Before publishing, change `browser_specific_settings.gecko.id` in `manifest.json` from the
`homehold@yourdomain.com` placeholder to an ID you control.

### Publishing a release

Push a `v*` tag and CI attaches the `.xpi` to a GitHub Release automatically:

```bash
git tag v1.0.0
git push origin v1.0.0
```

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
