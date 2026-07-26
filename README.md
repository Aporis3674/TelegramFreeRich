<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/logo.svg" width="120" alt="TelegramFreeRich">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Editor-TipTap-purple" alt="TipTap">
  <img src="https://img.shields.io/badge/UI-React-61dafb?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tests-141%20passing-brightgreen" alt="Tests">
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
  <a href="#interface">Interface</a> •
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

## Interface

![TelegramFreeRich](screenshot.jpg)

The window is a faithful rebuild of Telegram Desktop's rich-text composer — a frameless
dark window, hairline-outlined pill buttons, violet Premium stars and a single salmon send
button:

```
┌ ─────────────────────────────────────────────────────────  ─  □  ✕ ┐
│  ( ↶ )( ↷ )   ( Aa )( B )( ☰ )( ▦ )( 🔗 )( 🖼 )( Σ )         ( ☺ ) │
│                                                                    │
│  Message                                        │  Live preview    │
│                                                 │                  │
│  ( ✦A )                        341 / 32,768   ( 🗑 )        ( ➤ )  │
└────────────────────────────────────────────────────────────────────┘
```

| Control | What it does |
|---------|--------------|
| ↶ ↷ | Undo / redo (full ProseMirror history) |
| **Aa** | Text style menu — regular text, H1–H6, quote, pull quote, code block, footer, collapsible, divider, RTL toggle |
| **B** | Formatting menu — bold, italic, underline, strikethrough, spoiler, highlight, monospace, sub/superscript, clear formatting |
| ☰ | Lists — bulleted, numbered, checklist (routed to `sendChecklist`) |
| ▦ | Table — insert 3×3, add/delete row or column, delete table |
| 🔗 | Link — add or remove, with URL-scheme sanitization |
| 🖼 | Media — image from URL or file, video, audio, slideshow, collage, location |
| Σ | Formula — block or inline math |
| ☺ | Emoji picker with search and category strip |
| ✦A | Insert palette — searchable list of every block and format in one place |
| 🗑 | Clear the message (with confirmation) |
| ➤ | Send. Right-click for send mode: rich message, draft or edit |

The toolbar stays unbadged. Inside the menus a violet star marks the individual features
Telegram reserves for Premium subscribers — every one of them is free here, because the Bot API
never charged for them.

---

## Features

### Inline Formatting
- Bold, Italic, Underline, Strikethrough
- Spoiler, Highlight (marked), Inline Code
- Subscript, Superscript

### Block Elements
- Headings (H1 through H6)
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
- Images from a URL or a native file picker
- Videos, Audio
- Slideshows, Collages
- Location (latitude / longitude)

### Math
- Math blocks and inline formulas (LaTeX-style)

### API Integration
- Send via `sendRichMessage` with **structured JSON blocks** (not markdown)
- Edit messages with `editMessageText` + `rich_message`
- Send drafts with `sendRichMessageDraft` (30s, private chats)
- Checklists sent via separate `sendChecklist` API call
- Test Connection button (`getMe`)

### Editor UX
- **Telegram Desktop composer UI** — frameless window with its own title bar, pill toolbar,
  dropdown menus, emoji picker and a salmon send button
- **TipTap-based rich text editor** — ProseMirror document model, real undo/redo
- Markdown input rules — `## `, `> `, `- `, `1. `, ` ``` `, `**bold**`, `` `code` ``
- **Live preview** — collapsible Telegram bubble rendered from the same Block State that is sent
- Insert palette — search every block and format by name
- Dark theme (default) + Light theme
- Keyboard shortcuts, including Ctrl+Enter to send
- Character counter (32,768 max)
- Custom in-app dialogs instead of browser `prompt()` / `confirm()`
- Full RTL: Persian UI mirrors the whole window, plus a per-message RTL flag

---

## Architecture

### v4.0 — Telegram-native UI + Block State with inline entities (Current)

The editor uses **TipTap** (ProseMirror-based) for rich text editing. User content flows through a **Block State** architecture that maps directly to Telegram Bot API 10.1 structured JSON types:

```
TipTap Editor (ProseMirror DOM)
        │
        ▼
Block Parser (DOM → Block State JSON[])
   ├─ block level  → paragraph, heading, table, checklist, media, …
   └─ inline level → styled segments (bold, spoiler, link, math, …)
        │
        ▼
Block Serializer (Block State → Telegram API JSON)
   ├─ blocks     → InputRichBlock*
   └─ rich_text  → nested RichText* objects
        │
        ├──→ sendRichMessage(blocks[])     [rich messages]
        ├──→ sendRichMessageDraft(blocks[]) [30s drafts]
        └──→ sendChecklist(items[])        [checklists only]
```

Inline runs are no longer flattened to plain text: `inline-parser.js` walks the inline DOM of
every block into `{ text, marks[], href? }` segments, and the serializer nests them into
`RichText*` objects (`bold` inside `italic` inside `link`, and so on) alongside the plain
`text` field.

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
| slideshow / collage | `InputRichBlockSlideshow` / `InputRichBlockCollage` |
| map | `InputRichBlockMap` |
| math_block | `InputRichBlockMath` |
| checklist | sent separately via `sendChecklist` |

### Inline Types

| Segment mark | Telegram API type |
|--------------|-------------------|
| bold / italic / underline / strikethrough | `RichTextBold`, `RichTextItalic`, … |
| spoiler | `RichTextSpoiler` |
| marked (highlight) | `RichTextMarked` |
| code | `RichTextCode` |
| subscript / superscript | `RichTextSubscript` / `RichTextSuperscript` |
| link | `RichTextLink` (carries `url`) |
| math | `RichTextMath` |

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
| Theming | CSS variables (Telegram Night palette, dark + light) |
| i18n | English, Persian (فارسی) |
| Packaging | electron-builder (NSIS, AppImage) |
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
│   │   ├── App.jsx              # Shell: state, send logic, shortcuts
│   │   ├── components/
│   │   │   ├── TitleBar.jsx     # Frameless window chrome
│   │   │   ├── Toolbar.jsx      # Telegram pill toolbar + menus
│   │   │   ├── ActionMenu.jsx   # Dropdown menu renderer
│   │   │   ├── Popover.jsx      # Anchored floating panel
│   │   │   ├── EmojiPicker.jsx  # Emoji panel with search
│   │   │   ├── InsertPalette.jsx# Searchable insert palette
│   │   │   ├── BottomBar.jsx    # Palette, char count, clear, send
│   │   │   ├── Preview.jsx      # Live Telegram bubble (React nodes)
│   │   │   ├── Settings.jsx     # Settings sheet (token, chat, lang)
│   │   │   ├── Dialog.jsx       # Promise-based prompt / confirm
│   │   │   ├── Toast.jsx        # Toast notification system
│   │   │   ├── Icons.jsx        # SVG icon set
│   │   │   ├── useTfrEditor.js  # TipTap editor setup
│   │   │   └── extensions.js    # Custom TipTap nodes and marks
│   │   ├── lib/
│   │   │   ├── editor-actions.js# Action registry (menus + palette)
│   │   │   └── emoji-data.js    # Emoji dataset + search
│   │   ├── i18n/                # Translations (en, fa) + provider
│   │   ├── styles/              # theme, app, toolbar, menu, editor, preview
│   │   └── index.html           # Entry HTML (CSP meta tag)
│   │
│   └── shared/                  # Shared between main & renderer
│       ├── block-types.js       # BlockType / InlineType enums
│       ├── block-parser.js      # DOM → Block State conversion
│       ├── inline-parser.js     # Inline DOM → styled segments
│       ├── block-serializer.js  # Block State → Telegram API JSON
│       ├── block-manager.js     # State management + undo/redo
│       ├── constants.js         # App-wide constants
│       └── utils.js             # Utilities (sanitizeUrl, etc.)
│
├── tests/
│   └── unit/                    # Vitest unit tests (141 tests)
│       ├── block-manager.test.js
│       ├── block-parser.test.js
│       ├── block-serializer.test.js
│       ├── inline-parser.test.js
│       ├── editor-actions.test.js
│       ├── i18n.test.js
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

1. Write in the editor — the toolbar menus insert blocks, the palette (✦A) searches them all
2. Toggle the live preview from the title bar (or Ctrl+P) to see the Telegram bubble
3. Press **Ctrl+Enter**, or click the send button, to post to your channel/group

### Send Modes

Right-click (or long-press) the send button to pick a mode:

| Mode | When to use |
|------|-------------|
| **Rich message** | Send as a rich formatted message (default) |
| **Draft** | Send a 30-second temporary preview (private chats only) |
| **Edit** | Edit an existing message (message ID comes from Settings) |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Send |
| Ctrl+K | Add / remove link |
| Ctrl+P | Toggle live preview |
| Ctrl+, | Open settings |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+E | Monospace |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+Shift+P | Spoiler |
| Ctrl+Z / Ctrl+Shift+Z | Undo / redo |

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

**141 tests** covering:
- Block manager (CRUD, undo/redo, listeners)
- Block parser (DOM → Block State, including checklists, media, galleries, maps)
- Inline parser (styled segments, entity detection, segment merging)
- Block serializer (Block State → Telegram API JSON, nested `RichText*`)
- Editor action registry (every menu command, URL sanitization, palette search)
- i18n (locale key parity, placeholders, fallbacks) and the emoji dataset
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
| Spoiler | Mark | `<span data-spoiler>` — text hidden until tapped |
| InlineMath | Mark | `<span data-inline-math>` — inline LaTeX run |
| PullQuote | Node | `<blockquote data-pullquote>` — aside / pull quote |
| Details | Node | `<details>` — collapsible content with summary |
| Footer | Node | `<footer>` — footnote/footer text |
| MathBlock | Node | Math formula block (LaTeX) |
| MediaBlock | Node | `<video>` / `<audio>` block |
| GalleryBlock | Node | `div.tg-gallery` — slideshow or collage |
| MapBlock | Node | `div.tg-map` — latitude / longitude |

Adding a command means adding one entry to `src/renderer/lib/editor-actions.js`: the toolbar
menus, the insert palette and the tests all read from that registry.

---

## Build

### Windows

```bash
npm run build
# Output: dist/TelegramFreeRich-Setup-4.0.0.exe
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
