# Changelog

## [5.4.0] - 2026-07-26

### Added — media can carry a caption
- Rich HTML captions a media item with a `<figcaption>` that follows it, and that caption may name
  its own source in a `<cite>`:
  `<video src="…"></video><figcaption>Clip title<cite>The Author</cite></figcaption>`
- **Media ▸ Caption…** asks for the caption, then for its credit, and writes both onto the photo,
  video, audio file or gallery the caret is on. Greyed out elsewhere, ticked once something is set,
  and clearing both fields removes the `<figcaption>` again
- A gallery's caption goes inside the wrapper, which is where the documented example puts it:
  `<tg-slideshow><img …/><figcaption>Trip<cite>Ada</cite></figcaption></tg-slideshow>`
- Like the quote attribution, the text lives in an attribute rather than in the editable body, so
  it survives editing; the editor shows it under the media and the live preview renders a real
  `<figcaption>`

### Fixed — a message of nothing but media could not be sent
- The send guard refused anything with zero characters, so a photo on its own, a gallery on its own
  or a map on its own was rejected as "nothing to send" — media carries no text. The guard now only
  refuses a document that produces no blocks at all, which the existing check after serialization
  already covered

### Verified
- Driven in a real Electron window: the media menu lists **Caption…**, both prompts appear with
  their translated hints, the editor document becomes
  `<img data-caption="A view from the pass" data-credit="Ada Lovelace" src="…">`, the preview shows
  the caption with its cite, and the send payload is
  `<img src="…"/><figcaption>A view from the pass<cite>Ada Lovelace</cite></figcaption>`
- 265 unit tests

## [5.3.0] - 2026-07-26

### Added — a quote can name its source
- Rich HTML documents `<blockquote>text<cite>Author</cite></blockquote>`, and the same `<cite>` on
  `<aside>`. The serializer already emitted it from a `data-attribution` attribute — but nothing
  could ever set that attribute, so no quote ever carried one. A plain `<blockquote>` did not even
  have the attribute to set
- **Aa ▸ Attribution…** asks who said it and writes it onto the quote the caret is in — either
  kind. It is greyed out outside a quote, shows a tick once a source is named, and clearing the
  field removes the `<cite>` again
- The attribution is drawn from the attribute rather than kept in the editable text, so it cannot
  be half-deleted while editing, and the live preview renders it as a real `<cite>`
- `block-parser.js` now reads the attribution off a plain quote too, not only a pull quote

### Internal
- `askText` accepts `placeholderKey` beside `placeholder`, so a translated hint can be shown where
  the existing callers pass a literal example
- 258 unit tests: the new menu entry and its enablement, the trimmed/cancelled prompt, `<cite>` on
  both quote kinds, escaping, and an empty attribution emitting no `<cite>`

### Verified
- Driven in a real Electron window: the Aa menu lists **Attribution…** after Pull quote, the editor
  document becomes `<blockquote data-attribution="Pavel Durov">`, the preview shows the cite, and
  the send payload is
  `<blockquote><p>Bots deserve rights too</p><cite>Pavel Durov</cite></blockquote>`

## [5.2.1] - 2026-07-26

Same application code as 5.2.0. Only the release notes changed: 5.2.0 shipped before the workflow
could compose them, and a published release's body cannot be rewritten afterwards — so this tag
carries the notes and the screenshots that 5.2.0's release page is missing.

### The slideshow carousel, in the editor and in the preview

| A slideshow, frame 1 of 3 | The same slideshow on the video frame |
|---|---|
| ![Slideshow carousel](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.1/docs/slideshow.png) | ![Video that cannot be previewed](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.1/docs/slideshow-video.png) |

A collage stays a grid — tiles, no arrows:

![Collage](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.1/docs/collage.png)

- A slideshow is **one frame at a time** now, with `‹` / `›` buttons, a `2 / 3` counter and
  clickable dots, wrapping around at either end. It was a row of thumbnails scrolling sideways
- **A video in a gallery no longer draws a broken image.** Every entry used to be rendered as
  `<img>`, so a video or audio URL always showed the browser's broken-image icon even though
  Telegram renders it perfectly once sent. Entries are `<img>` / `<video controls>` /
  `<audio controls>` by extension, and when the media genuinely will not load in the app window the
  tile says what the file is — a ▶ / ♪ / 🖼 glyph, the file name, and *"Not previewable here —
  Telegram will show it"*
- The editor's gallery is drawn by a TipTap node view, so the wire format is untouched
- Full detail in the [5.2.0 entry](#520---2026-07-26) below

## [5.2.0] - 2026-07-26

| A slideshow, frame 1 of 3 | The same slideshow on the video frame |
|---|---|
| ![Slideshow carousel](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.0/docs/slideshow.png) | ![Video that cannot be previewed](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.0/docs/slideshow-video.png) |

A collage stays a grid — tiles, no arrows:

![Collage](https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/v5.2.0/docs/collage.png)

### Slideshows are a carousel now, in the editor and in the preview
- A slideshow used to be a row of thumbnails scrolling sideways in both panes. It is now a proper
  carousel: **one frame at a time**, with `‹` / `›` buttons, a `2 / 3` counter and clickable dots.
  Wrapping around at either end
- The editor's gallery is drawn by a TipTap **node view**, so only what you *see* changed —
  `renderHTML` still emits `div.tg-gallery[data-kind][data-images]`, which is what `getHTML()` and
  the serializer read. The wire format is untouched
- The preview carousel keeps its position while you keep typing, instead of resetting on every
  keystroke
- **A collage stays a grid**, because that is what a collage is — no arrows there, just tiles

### Fixed — a video in a gallery showed a broken image
- Every gallery entry was rendered as `<img>`, so a video or audio URL always drew the browser's
  broken-image icon even though Telegram renders it perfectly once sent. Entries are now
  `<img>` / `<video controls>` / `<audio controls>` by file extension
- When the media genuinely will not load in the app window — a Telegram CDN link often refuses —
  the tile says what the file is: a ▶ / ♪ / 🖼 glyph, the file name, and
  *"Not previewable here — Telegram will show it"*. No more broken-image icon standing in for a
  file that is perfectly fine

### Verified
- Driven in a real Electron window with a three-item slideshow (two images and a video URL):
  editor and preview both report `1 / 3`, two nav buttons and three dots; stepping forward moves
  both to `2 / 3` and shows the labelled tile for the video. The collage renders three tiles with
  no nav buttons. The editor HTML is unchanged throughout
- Screenshots in `docs/`

## [5.1.6] - 2026-07-26

### Docs
- **Several table-of-contents links in both READMEs went nowhere.** GitHub's heading slugs are
  unpredictable once emoji, Persian text and zero-width joiners are in the heading — `#-پنجرهٔ-برنامه`,
  `#-چطور-کار-می‌کند`, `#️-what-you-can-send` and two more never resolved. Both files now carry
  explicit `<a id="…">` anchors with the same ASCII ids in either language
- New **When something goes wrong** section in both languages: what each proxy error means, how to
  tell a Telegram `Bad Request` apart from a network failure, `chat not found`, `not enough rights`,
  the Windows uninstall dialog, and how to reset the encrypted settings
- Corrected details that had gone stale: the packaging row now names the Windows portable build,
  `npm run build` shows both artifacts it produces, `Settings.jsx` is described with the business
  connection and proxy it now holds, the validation allowlists include the business connection ID,
  `installer/installer.nsh` appears in the project layout, and the live-preview bullet no longer
  claims to render "the exact blocks that will be sent" — the send path is HTML
- New `tests/unit/docs.test.js`: fails on a dead in-document link, a duplicate anchor, a README
  version that disagrees with `package.json`, a link to a file that does not exist, an unbalanced
  `<details>` block, or the two READMEs drifting apart in sections or badges
- 253 unit tests

## [5.1.5] - 2026-07-26

### Fixed — a checklist can be sent to a channel after all
- 5.1.4 treated `sendChecklist` as the only way to send a checklist and, since that method is
  business-account-only, fell back to a plain `☑` / `☐` text list. That was wrong: **Rich HTML has
  its own task-list form**, `<ul><li><input type="checkbox" checked>done</li></ul>`, so a checklist
  travels inside an ordinary rich message — in a channel, a group or a private chat — and Telegram
  draws real checkboxes with the ticks preserved
- That is now the normal path, with nothing to configure. Verified in a real Electron window: the
  app emits `rich_message.html = "<ul><li><input type=\"checkbox\">buy milk</li></ul>"`
- `sendChecklist` stays for what it actually is — Telegram's *interactive* checklist, whose boxes
  readers tick themselves — used only when a business connection ID is configured and the chat is
  private. The Settings help text and both READMEs now say which is which
- The apologetic "sent as a ☑ / ☐ list" notice is gone; the only remaining note is when a business
  connection is configured but the chat is not private

## [5.1.4] - 2026-07-26

### Fixed — checklists could not be sent
- Telegram answered `Bad Request: can't parse InputChecklist: Can't find field "title"`. The body
  was `checklist: { items: [{ text, done }] }`, which is not a shape the API has. `InputChecklist`
  is `{ title, tasks }`, and each `InputChecklistTask` is `{ id, text }` with a **positive id
  unique within the checklist**
- `buildChecklistBody` now emits exactly that, caps the list at the documented **30 tasks** and
  each task at **100 characters**, and drops `done`: there is no way to send a task pre-ticked —
  `markChecklistTasksAsDone` is what ticks one afterwards. The app says so before sending when
  items were checked in the editor
- The app asks for the checklist title, since the API requires one

### Added — checklists work without a business account too
- `sendChecklist` only works for **a bot acting on behalf of a connected business account, in a
  private chat**. That is a Telegram restriction, not a payload problem, so a plain bot token can
  never send an interactive checklist
- Settings gained **Business connection ID** (optional, stored encrypted beside the bot token).
  With it set and a private chat, a real checklist is sent
- Without it, the task list is rendered into the message body as a `☑` / `☐` list instead of
  failing, and a toast says which of the two conditions was missing
- Both READMEs gained a **Checklists** section spelling out the three cases

### Verified
- Driven in a real Electron window with a stubbed API: with a business connection the app emits
  `{"chat_id":"12345","checklist":{"title":"Shopping","tasks":[{"id":1,"text":"buy milk"}]},"business_connection_id":"…"}`;
  without one it emits `rich_message.html = "<ul><li>☐ buy milk</li></ul>"` and shows the
  explanatory toast
- 240 unit tests, including the markup TipTap actually emits for a task list

## [5.1.3] - 2026-07-26

### Fixed (Critical) — every send failed with `net::ERR_INVALID_ARGUMENT`
- The request layer set `Content-Length` by hand on POSTs. Chromium computes that header from
  the body it is given and **rejects a manually supplied one**, so every send — rich message,
  draft, edit, checklist — was refused locally before it ever reached the network. GET requests
  carry no body and no such header, which is why **Check connection to Telegram kept reporting
  success while nothing could be sent**
- Only `Content-Type` is set now. Reproduced and then confirmed fixed in a real Electron 35
  runtime: with the header, an identical POST fails `net::ERR_INVALID_ARGUMENT`; without it the
  request leaves the process and fails only on the network beyond it
- `request.test.js` now records the headers the requester sets and fails if a POST carries
  anything besides `Content-Type`

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
