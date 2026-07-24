# Changelog

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
