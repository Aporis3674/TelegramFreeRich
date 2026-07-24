<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/logo.svg" width="120" alt="TelegramFreeRich">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Editor-TipTap-purple" alt="TipTap">
  <img src="https://img.shields.io/badge/UI-React-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tests-62-passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/Premium-Free-success" alt="Free">
  <img src="https://github.com/Aporis3674/TelegramFreeRich/actions/workflows/build.yml/badge.svg" alt="Build">
</p>

<h1 align="center">TelegramFreeRich</h1>

<p align="center"><strong>Free Rich Text Editor for Telegram — Desktop Edition</strong></p>
<p align="center">Because bots should not have more rights than humans.</p>

<p align="center"><a href="README_fa.md">[ فارسی ]</a></p>

---

<p align="center">
  <a href="#download">Download</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#build">Build</a> •
  <a href="#development">Development</a>
</p>

---

## Download

| Platform | Download |
|----------|----------|
| **Windows** | [TelegramFreeRich-Setup.exe](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) |

Requires Windows 10 or later. No installation of Node.js or other dependencies needed.

---

## What is this?

Telegram introduced a rich text editor in June 2026 (Bot API 10.1), but locked it behind Premium. Meanwhile, the same API gives bots the exact same capabilities for free.

This is a **desktop app** that lets anyone -- not just Premium subscribers -- create and send professionally formatted messages through Telegram's Bot API.

No coding required. No Telegram Premium required. No server required.

---

## Features

### Inline Formatting
- Bold, Italic, Underline, Strikethrough
- Spoiler, Highlight (marked), Inline Code
- Subscript, Superscript

### Block Elements
- Headings (H1 through H3)
- Blockquotes, Pull Quotes
- Code Blocks with language selector
- Dividers
- Collapsible Details/Summary
- Footer (footnotes)

### Lists & Tables
- Bullet Lists, Numbered Lists
- Checklists (sent via separate `sendChecklist` API)
- Editable table cells

### Media
- Images (URL input)
- Videos, Audio
- Slideshows, Collages

### Math
- Math blocks (LaTeX-style formulas)

### API Integration
- Send via `sendRichMessage` with **structured JSON blocks** (not markdown)
- Edit messages with `editMessageText` + `rich_message`
- Send drafts with `sendRichMessageDraft` (30s, private chats)
- Checklists sent via separate `sendChecklist` API call
- Test Connection button (`getMe`)

### Editor UX
- **TipTap-based rich text editor** — standard contenteditable with ProseMirror
- **Split-pane UI** — editor on left, live Telegram-style preview on right
- Grouped toolbar: Inline / Block / Media
- Dark theme (default) + Light theme toggle
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+E, etc.)
- Character counter (32,768 max) with warning threshold
- Settings modal (Bot Token, Chat ID, Language)
- Toast notifications for actions
- RTL language support (Persian)

---

## Architecture

### v3.0 — React + TipTap + Block State (Current)

The editor uses **TipTap** (ProseMirror-based) for rich text editing. User content flows through a **Block State** architecture that maps directly to Telegram Bot API 10.1 structured JSON types:

```
TipTap Editor (contenteditable DOM)
        │
        ▼
Block Parser (DOM → Block State JSON[])
        │
        ▼
Block Serializer (Block State → Telegram API JSON)
        │
        ├──→ sendRichMessage(blocks[])     [rich messages]
        │
        └──→ sendChecklist(blocks[])       [checklists only]
```

**Why JSON blocks instead of Markdown?**
Telegram Bot API 10.1 supports structured `InputRichBlock*` types that cover ALL formatting features (spoiler, details, tables, math, etc.). Markdown can only express a subset. JSON blocks give 100% feature parity.

### Block Types

| Block Type | Telegram API Type |
|------------|-------------------|
| paragraph | `InputRichBlockParagraph` |
| heading | `InputRichBlockHeading` |
| blockquote | `InputRichBlockBlockquote` |
| pullquote | `InputRichBlockPullquote` |
| code_block | `InputRichBlockCodeBlock` |
| divider | `InputRichBlockDivider` |
| list | `InputRichBlockList` |
| table | `InputRichBlockTable` |
| details | `InputRichBlockDetails` |
| footer | `InputRichBlockFooter` |
| photo / video / audio | `InputRichBlockPhoto` etc. |
| math_block | `InputRichBlockMathBlock` |
| checklist | `InputRichBlockChecklist` |

### Security Model

```
┌─────────────────────────────────────────────────┐
│  Renderer Process (React)                       │
│                                                 │
│  ❌ Bot token is NEVER stored here              │
│  ❌ No direct fetch() to Telegram API           │
│  ✅ Calls window.app.api(method, body)          │
└──────────────────────┬──────────────────────────┘
                       │ IPC (contextBridge)
┌──────────────────────▼──────────────────────────┐
│  Main Process (Electron)                        │
│                                                 │
│  ✅ Token stored via safeStorage (encrypted)    │
│  ✅ All API calls go through here               │
│  ✅ Input validation on every IPC channel       │
│  ✅ HTTP timeout (30s) + response size limit    │
│  ✅ Method whitelist (only allowed TG methods)  │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron 35 |
| UI Framework | React 19 |
| Rich Text Editor | TipTap 2.11+ (ProseMirror) |
| Build Tool | Vite 6 |
| Test Runner | Vitest 2.1 + jsdom |
| Data Model | Block State (JSON array → Telegram API JSON) |
| Security | IPC bridge, safeStorage, input validation |
| Theming | CSS variables (dark + light) |
| i18n | English, Persian (فارسی) |
| Packaging | electron-builder (NSIS) |
| CI/CD | GitHub Actions (lint, test, build) |

---

## Project Structure

```
TelegramFreeRich/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js              # App entry, IPC handlers, TG API calls
│   │   ├── preload.js           # Secure IPC bridge (contextBridge)
│   │   └── security/
│   │       └── validation.js    # Input validation, method whitelist
│   │
│   ├── renderer/                # React UI (Vite dev server)
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Root component (state, send logic)
│   │   ├── components/
│   │   │   ├── TipTapEditor.jsx # TipTap editor with extensions
│   │   │   ├── Toolbar.jsx      # Grouped formatting toolbar
│   │   │   ├── Preview.jsx      # Live Telegram-style preview
│   │   │   ├── ActionBar.jsx    # Mode tabs, char count, send button
│   │   │   ├── Settings.jsx     # Settings modal (token, chat, lang)
│   │   │   ├── Toast.jsx        # Toast notification system
│   │   │   └── extensions.js    # Custom TipTap extensions
│   │   ├── i18n/                # Translations (en, fa)
│   │   ├── styles/              # CSS (app, editor, preview)
│   │   ├── index.html           # Entry HTML (CSP meta tag)
│   │   └── app.js               # Legacy renderer (until full migration)
│   │
│   └── shared/                  # Shared between main & renderer
│       ├── block-types.js       # BlockType / InlineType enums
│       ├── block-parser.js      # DOM → Block State conversion
│       ├── block-serializer.js  # Block State → Telegram API JSON
│       ├── block-manager.js     # State management + undo/redo
│       ├── constants.js         # App-wide constants
│       └── utils.js             # Utilities (sanitizeUrl, etc.)
│
├── tests/
│   └── unit/                    # Vitest unit tests (62 tests)
│       ├── block-manager.test.js
│       ├── block-parser.test.js
│       ├── block-serializer.test.js
│       ├── utils.test.js
│       └── validation.test.js
│
├── vite.config.js               # Vite config (React plugin)
├── vitest.config.js             # Vitest config (jsdom, coverage)
├── package.json                 # Dependencies + scripts
├── .eslintrc.json               # ESLint config
├── .prettierrc                  # Prettier config
└── .github/workflows/
    ├── ci.yml                   # Lint + test + build (CI)
    └── build.yml                # Windows build + release
```

---

## Installation

### Prerequisites
- Node.js 18 or higher (only for building from source)
- A Telegram bot (get one from [@BotFather](https://t.me/BotFather))
- A Chat ID (channel or group)

### Quick Start (Download)

1. Download the latest release from the [Releases page](https://github.com/Aporis3674/TelegramFreeRich/releases/latest)
2. Run `TelegramFreeRich-Setup.exe`
3. Open the app
4. Click Settings (gear icon)
5. Enter your Bot Token (from @BotFather)
6. Enter Chat ID (`@channel` or numeric ID)
7. Click "Test Connection"
8. Start writing and click Send

---

## Usage

1. Type or format your message in the editor (left pane)
2. Use the toolbar to insert blocks and formatting
3. See the live Telegram-style preview on the right
4. Click **Send** to post to your channel/group

### Send Modes

| Mode | When to use |
|------|-------------|
| **Rich** | Send as a rich formatted message (recommended) |
| **Draft** | Send a 30-second temporary preview (private chats only) |
| **Edit** | Edit an existing message (enter message ID) |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+E | Inline Code |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+Shift+H | Highlight |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |

---

## Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npx vitest --coverage
```

**62 tests** covering:
- Block manager (CRUD, undo/redo, listeners)
- Block parser (DOM → Block State)
- Block serializer (Block State → Telegram API JSON)
- Utilities (URL sanitization, ID generation, validation)
- Security validation (token, chat ID, method whitelist)

---

## Development

```bash
# Install dependencies
npm install

# Start dev mode (Vite + Electron)
npm run dev

# Lint
npm run lint

# Build for production
npm run build
```

### Custom TipTap Extensions

| Extension | Type | Description |
|-----------|------|-------------|
| Spoiler | Mark | `<span class="tg-spoiler">` — text hidden until tapped |
| Details | Node | `<details>` — collapsible content with summary |
| Footer | Node | `<footer>` — footnote/footer text |
| MathBlock | Node | Math formula block (LaTeX) |

---

## Build

### Windows

```bash
npm run build
# Output: dist/TelegramFreeRich-Setup-3.0.0.exe
```

### CI/CD

GitHub Actions automatically:
- Lints and runs tests on every push
- Builds Windows installer on tag push
- Creates GitHub Release with installer

---

## Security

| Layer | Protection |
|-------|-----------|
| Token storage | `safeStorage` (OS keychain encryption) |
| IPC bridge | `contextBridge` — renderer cannot access Node APIs |
| Input validation | Whitelist for API methods, chat IDs, languages |
| HTTP | 30s timeout, 1MB response size limit |
| URL sanitization | Blocks `javascript:`, `data:`, `vbscript:` schemes |
| CSP | Content Security Policy meta tag in index.html |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## License

MIT

---

> The best things in life are free. The second-best things are also free, if you use a bot.
