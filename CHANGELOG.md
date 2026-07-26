# Changelog

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
