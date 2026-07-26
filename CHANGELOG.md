# Changelog

## [5.1.2] - 2026-07-26

### Fixed (Critical) — the app crashed on launch
- Every launch died with **"Uncaught Exception: TypeError: Session can only be received when app
  is ready"** before a window appeared. `src/main/main.js` built the Telegram requester at module
  scope and passed it `session.defaultSession`, but Electron throws on that property until
  `app.whenReady()` has fired — so the crash happened while the main process was still loading
  its modules. Introduced in 5.1.0 with the proxy work; **5.1.0 and 5.1.1 cannot start at all**
- `createRequester` now takes a `getSession` getter and reads the session per request, when the
  app is long past ready. Verified in a real Electron 35 runtime: the requester is constructed
  before ready without throwing, then resolves the session and sends
- `packaging.test.js` fails if any line in `main.js` reaches `session.defaultSession` without
  deferring it, and `request.test.js` asserts the getter is untouched at construction time

## [5.1.1] - 2026-07-26

### Fixed — the Windows installer refused to upgrade an existing install
- Installing over an older version failed with **"Failed to uninstall old application files.
  Please try running the installer again.: 2"** and **"TelegramFreeRich cannot be closed"**.
  Before copying files, the new installer runs the *old* version's uninstaller; that uninstaller
  exits with code 2 when it believes `TelegramFreeRich.exe` is still running, and electron-builder
  turns any non-zero code into a hard abort. One leftover process — a crashed copy, a Chromium
  helper, or a second window the app used to allow — made the app permanently un-upgradable
- New `installer/installer.nsh`: the installer now closes the app itself (a polite `taskkill`
  first, so settings are flushed, then `/F /T` for the helper processes) *before* the old
  uninstaller looks for it, and a failed uninstall is written to the details log instead of
  aborting the installation — the new files overwrite the old ones either way
- The app now takes a **single-instance lock**. Launching it again focuses the open window
  instead of starting a second process that holds the same installed files open

### Added
- **Portable Windows build** (`TelegramFreeRich-*-portable.exe`) — no installer, no uninstaller,
  nothing in the registry. The escape hatch when a machine will not cooperate with NSIS

### Packaging
- NSIS options made explicit: per-user install (no admin rights), elevation allowed, settings
  kept on uninstall, desktop and Start-menu shortcuts, and installer filenames without spaces
  (`TelegramFreeRich-Setup-5.1.1.exe`)
- `directories.buildResources` moved to `installer/`, which is committed — the previous default
  was the git-ignored `build/`, where the renderer bundle is written
- 225 unit tests; the new `packaging.test.js` pins each of these settings, because a broken
  installer cannot be caught by any test that runs on Linux

### CI
- The release job now runs only for `v*` tags, so a manual `workflow_dispatch` is a safe dry
  build of both platforms

## [5.1.0] - 2026-07-26

### Added — proxy support for blocked countries
- Every Telegram request now goes through Electron's `net` module (Chromium's network stack)
  instead of Node's `https`. Node ignores the operating system's proxy settings, so with a VPN
  client on "Set system proxy" — the normal v2rayN setup where Telegram is blocked — requests
  used to leave unproxied and time out
- Settings → **Connection** with three modes: **System proxy** (default), **Manual proxy** and
  **No proxy**. Manual mode has one-click presets for v2rayN's SOCKS5 (`127.0.0.1:10808`) and
  HTTP (`127.0.0.1:10809`) endpoints, plus optional credentials
- **Check connection to Telegram** reports the proxy Chromium resolved and whether
  `api.telegram.org` answered, so a blocked network is distinguishable from a bad token
- Proxy failures now name the cause: a dead tunnel reports
  `ERR_PROXY_CONNECTION_FAILED — check the proxy (socks5://127.0.0.1:10808)`, and a
  TLS-intercepting proxy says so instead of showing a bare certificate error
- Proxy credentials are answered through Electron's `login` event and stored encrypted beside
  the bot token; the renderer only learns whether a password exists

### Internal
- New `src/main/net/proxy.js` (pure configuration helpers) and `src/main/net/request.js`
  (injectable requester with timeout, 1 MB cap and proxy-aware errors)
- 214 unit tests; the request layer is covered with a fake `net`, and the proxy modes were
  verified in a real Electron runtime (`system` resolved the OS proxy, `manual` resolved
  `SOCKS5 127.0.0.1:10808`, `direct` resolved `DIRECT`)

## [5.0.0] - 2026-07-26

### Fixed (Critical) — messages could not be sent at all
- `sendRichMessage` was called with `rich_message: { blocks: [...] }`, a shape the API does not
  accept. `InputRichMessage` carries **exactly one of `html` or `markdown`**; the `RichBlock`
  array is the *receiving* shape, returned inside `Message.rich_message`. Every send failed,
  which is what the "error when sending a heading" report came down to
- New `src/shared/html-serializer.js` walks the editor DOM into Telegram's documented **Rich
  HTML** vocabulary and builds the request bodies:
  - marks → `<b> <i> <u> <s> <code> <mark> <sub> <sup>`, spoiler → `<tg-spoiler>`,
    inline formula → `<tg-math>`
  - blocks → `<p> <h1>…<h6> <ul> <ol> <li> <pre> <blockquote> <footer> <hr/> <table> <details>`,
    pull quote → `<aside>`, formula → `<tg-math-block>`
  - media → `<img> <video> <audio>`, gallery → `<tg-collage>` / `<tg-slideshow>`,
    location → `<tg-map lat long zoom/>`
  - anything undocumented is unwrapped or dropped; links keep only `http`, `https`, `mailto`,
    `tel`, `tg` and `#anchor`, media only `http(s)`
- `sendRichMessageDraft` now sends the required non-zero `draft_id` and refuses non-private
  chats, as the API demands
- `editMessageText` sends `chat_id` + `message_id` + `rich_message`
- Documented limits are checked before sending: 32,768 characters, 500 blocks, 50 media files,
  20 table columns — each with its own message
- Removed `src/shared/block-serializer.js`; the block model stays only where it is correct —
  driving the live preview, which mirrors what Telegram sends back

### Tooling
- 179 unit tests, 48 of them pinning the Rich HTML output tag by tag
- Verified end to end in a headless build: the app now emits
  `{"chat_id":"…","rich_message":{"html":"<h1>…"}}`

### Breaking
- The renderer no longer produces a block array for sending; anything reading
  `block-serializer.js` must move to `html-serializer.js`

## [4.1.1] - 2026-07-26

### Fixed
- **Live preview rendered one character per line.** The table bubble menu and the preview bubble
  both used a `.bubble` class; the menu's `display: flex` leaked into the preview and squeezed
  every block into a column. The menu is now `.table-bubble`.

### Tooling
- New `tests/unit/styles.test.js`: fails when two stylesheets own the same class, when braces are
  unbalanced, or when a rule survives with no component using it — it caught two dead rules
  (`.menu-sep`, `.palette-foot`) on its first run
- 151 unit tests

### Packaging
- Renderer now builds to `build/renderer`. electron-builder excludes its own output directory
  from the packaged app, so with the renderer inside `dist/` the installers risked shipping
  without a UI; `app.asar` is now verified to contain `build/renderer/index.html`
- `package.json` gained author, license, homepage and repository — without the repository field
  electron-builder aborted a Linux build with "Cannot read properties of null (reading
  'channel')"
- App icon set to `logo.png` (512×512); Linux target declares category and maintainer;
  `build.publish` is null because the workflow uploads the release

### CI
- Build & Release now runs a verify job (lint + tests) and then a two-platform matrix —
  NSIS installer on Windows, AppImage on Linux — attaching both to the GitHub release
- The workflow can also be triggered manually (`workflow_dispatch`)

### Docs
- README and README_fa rewritten: hero screenshot, Premium-vs-bot comparison, three-step quick
  start, toolbar map, folded reference tables, security diagram and project layout

## [4.1.0] - 2026-07-26

### UI — toolbar rebuilt to the Telegram menu spec
- Seven formatting buttons after the history group: **Aa**, **B**, list, table, link, media, Σ
- **Aa → Formatting**: Heading (second level with H1–H6), Text, Quote, Pull quote, Code block,
  Footer, Divider
- **B → Text style**: Bold, Italic, Underline, Strikethrough, Spoiler, Subscript, Superscript,
  Marked
- **List**: Ordered list, Bullet list, Check list, Details (Details moved here from the Aa menu)
- **Table** inserts an editable 3×3 table in one click; a floating bar adds/removes rows and
  columns while the caret is inside the table
- **Link** opens a proper "Create link" panel with Text and URL fields plus Create / Cancel
- **Media** narrowed to Photo or video (two or more URLs become a slideshow), Audio file,
  Location
- **Σ** asks for a formula and inserts a math block
- Menus support a second level, with a back row at the top
- Removed the emoji button and the whole emoji picker: custom emoji are a Premium-only entity
  bots cannot send through the rich-message API
- Removed every violet Premium star badge — from the toolbar, the menus and the palette
- The right-to-left switch moved from the Aa menu to the title bar, next to settings and preview
- Monospace, inline formula, collage and clear-formatting stay reachable from the insert palette

### Tooling
- 147 unit tests; the action-registry suite now covers each menu's exact contents and order

## [4.0.0] - 2026-07-26

### UI — Telegram Desktop composer
- Window rebuilt to match Telegram Desktop's rich-text composer: frameless window with a
  renderer-drawn title bar, hairline-outlined pill toolbar and a single salmon send button.
  The toolbar carries no badges; violet Premium stars mark the individual features inside the
  menus instead
- Toolbar groups: undo/redo, then `Aa` (text style), `B` (formatting), lists, table, link,
  media, formula, with the emoji picker trailing
- New dropdown menu system (`Popover` + `ActionMenu`) with icons, shortcut hints, active
  checkmarks and separators
- Emoji picker: search, category strip, 480+ emoji dataset
- Insert palette behind the wand button — searchable list of every block and inline format
- Bottom bar: insert palette, character counter, clear, send; right-click send to choose
  rich message / draft / edit
- Live preview is now a collapsible side panel rendered as React elements (no
  `dangerouslySetInnerHTML`), showing checklists, galleries, maps, spoilers and inline math
- Custom promise-based prompt/confirm dialogs replace browser `prompt()` / `confirm()`
- Light theme reworked alongside the dark Telegram Night palette
- Persian UI mirrors the entire window (RTL), separate from the per-message RTL flag
- Window controls (minimize / maximize / close) via a validated `window-control` IPC channel;
  native traffic lights kept on macOS

### Editor
- Editor instance moved into React state and passed down as a prop — the `window.__tfrEditor`
  global is gone, so toolbar state reflects the real selection
- Extensions actually wired up: Link, Image, TaskList/TaskItem, Subscript, Superscript,
  Spoiler, InlineMath, PullQuote, Details, Footer, MathBlock, MediaBlock, GalleryBlock, MapBlock
- Single action registry (`lib/editor-actions.js`) drives the menus, the palette and the tests
- Keyboard shortcuts: Ctrl+Enter send, Ctrl+K link, Ctrl+P preview, Ctrl+, settings
  (Ctrl+Enter is left to the editor inside code blocks)

### Data model
- New `shared/inline-parser.js`: inline DOM is parsed into `{ text, marks[], href? }` segments
  instead of being flattened with `textContent`
- Serializer emits nested `RichText*` objects as `rich_text` next to the plain `text`
- Parser now understands task lists (→ `sendChecklist`), pull quotes, images, video, audio,
  slideshows, collages, maps, and reads math from `data-formula`
- Math blocks no longer carry the `$$` delimiters into the API payload

### Tooling
- 141 unit tests (was 62): inline parser, action registry, i18n parity, emoji dataset, plus
  the new block types
- i18n gained a React provider (`I18nProvider` / `useI18n`) and a pure `translate()`; locale
  files are key-for-key identical and covered by a test
- Removed the dead `renderer/app.js`, `ActionBar.jsx`, `SettingsPanel.jsx` and `TipTapEditor.jsx`
- Version unified at 4.0.0 across package.json, README and CHANGELOG

## [3.0.0] - 2026-07-24

### Security (Critical)
- Token NEVER stored or used in renderer — all API calls via secure IPC
- Removed all direct `fetch()` calls with bot token from renderer
- Removed plaintext token storage from `localStorage`
- Input validation for token, chatId, lang, and API method names
- HTTP timeout (30s) and response size limit (1MB) on Telegram requests
- CSP meta tag added to HTML
- URL scheme sanitization against `javascript:` / `data:` XSS

### Architecture
- Block State model: `BlockManager`, `block-parser`, `block-serializer`
- DOM → Block JSON → Telegram `InputRichBlock*` pipeline
- Checklist separated into its own `sendChecklist` API path
- Shared modules under `src/shared/` (types, utils, constants)

### UI
- React 19 + TipTap editor foundation
- Split-pane live preview panel
- RTL toggle
- i18n strings for English and Persian
- Toolbar regrouped (inline / block / media)

### Tooling
- ESLint + Prettier + EditorConfig
- Vitest unit tests (block manager, parser, serializer, utils, validation)
- Vite for React renderer build
- CI workflow: lint + test on PR/push
- Build workflow: Windows + Linux after tests pass

### Breaking
- Version bumped to 3.0.0
- Renderer settings no longer include raw token
- Production path expects Vite build output under `dist/renderer`

## [2.1.0] - 2026-07-23

### Security (Critical)
- Token now stored via `electron safeStorage` (OS-level encryption, not plain text)
- Settings saved to `userData/settings.enc` — encrypted on disk
- Token NEVER leaves main process after initial save
- Renderer no longer holds or passes token to API calls
- Input field shows `•••••••• (saved encrypted)` instead of plain token

### Architecture
- All Telegram HTTP requests moved to main process only
- `window.app.api(method, body)` — main process adds token internally
- New IPC channels: `save-settings`, `load-settings`, `tg-test`
- `loadSettings()` returns token existence flag (not the token itself)
- Removed `localStorage` usage for sensitive settings

### Removed
- `window.tgAPI.send(token, ...)` — token parameter no longer passed from renderer
- Plain-text settings in `localStorage`

## [1.0.0] - 2026-07-23

### Added
- Desktop Electron shell for Telegram Bot API rich messages
- Dark/Light theme toggle
- Settings panel with Bot Token, Chat ID, and Test Connection
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
- Send modes: Rich Message, Draft, Edit
- Character counter (32,768 max)
- Toast notifications
- Clear All button

### Tech Stack
- Electron 35 (Desktop shell)
- Vanilla HTML + CSS + JavaScript
- electron-builder (NSIS installer)

### Supported Platforms
- Windows (x64 installer)
- Linux (AppImage)
