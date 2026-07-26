<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/telegram.svg" width="110" alt="TelegramFreeRich">
</p>

<h1 align="center">TelegramFreeRich</h1>

<p align="center"><strong>Telegram's rich text editor — for everyone, without Premium.</strong></p>
<p align="center"><em>Because bots should not have more rights than humans.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.1.1-2ca5e0" alt="Version 4.1.1">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-2ca5e0?logo=telegram&logoColor=white" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Electron-35-47848f?logo=electron&logoColor=white" alt="Electron 35">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TipTap-2-8b5cf6" alt="TipTap 2">
  <img src="https://img.shields.io/badge/tests-151%20passing-4fc3a1" alt="151 tests">
  <img src="https://img.shields.io/badge/license-MIT-8b99a7" alt="MIT">
</p>

<p align="center">
  <a href="README_fa.md">🇮🇷 فارسی</a> &nbsp;•&nbsp;
  <a href="#-quick-start">Quick start</a> &nbsp;•&nbsp;
  <a href="#-the-window">The window</a> &nbsp;•&nbsp;
  <a href="#️-what-you-can-send">Features</a> &nbsp;•&nbsp;
  <a href="#-how-it-works">Architecture</a> &nbsp;•&nbsp;
  <a href="#-security">Security</a> &nbsp;•&nbsp;
  <a href="#-development">Development</a>
</p>

<p align="center">
  <img src="screenshot.jpg" width="880" alt="TelegramFreeRich — editor and live preview">
</p>

---

## Why this exists

In June 2026 Telegram shipped a rich text editor — and locked it behind Premium. The very same
formatting is available to **every bot, for free**, through Bot API 10.1.

|  | Telegram Premium | A bot + this app |
|---|---|---|
| Headings, quotes, tables, code blocks | 💎 Premium | ✅ Free |
| Spoilers, marked text, sub/superscript | 💎 Premium | ✅ Free |
| Checklists, collapsibles, formulas | 💎 Premium | ✅ Free |
| Monthly cost | 💸 | **0** |

No coding, no server, no subscription. Point the app at a bot token and a chat, and write.

---

## 🚀 Quick start

**1 — Get a bot.** Message [@BotFather](https://t.me/BotFather), send `/newbot`, copy the token.
Add the bot to your channel or group as an administrator.

**2 — Install.** Grab a package from the
[latest release](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) —
`TelegramFreeRich-Setup-*.exe` for Windows, `TelegramFreeRich-*.AppImage` for Linux
(`chmod +x` it and run) — or start from source:

```bash
git clone https://github.com/Aporis3674/TelegramFreeRich.git
cd TelegramFreeRich
npm install
npm run dev
```

**3 — Configure.** Click the ⚙ gear in the title bar, paste the token and the chat ID
(`@channel` or a numeric ID), press **Test connection**, then **Save**.

Write your message and press <kbd>Ctrl</kbd>+<kbd>Enter</kbd>. That's it.

---

## 🪟 The window

A faithful rebuild of Telegram Desktop's composer: frameless, dark, hairline-outlined pill
buttons and one salmon send button.

```
┌ ⚙ ▣ ¶ ────────────────────────────────────────────  ─  □  ✕ ┐
│  ( ↶ )( ↷ )   ( Aa )( B )( ☰ )( ▦ )( 🔗 )( 🖼 )( Σ )         │
│                                                              │
│  Message                                    │  Live preview  │
│                                             │                │
│  ( ✦ )                       342 / 32,768  ( 🗑 )      ( ➤ ) │
└──────────────────────────────────────────────────────────────┘
```

| Button | Click it and you get |
|:--:|---|
| ↶ ↷ | Undo / redo — the full ProseMirror history |
| **Aa** | **Formatting** → Heading (opens H1–H6), Text, Quote, Pull quote, Code block, Footer, Divider |
| **B** | **Text style** → Bold, Italic, Underline, Strikethrough, Spoiler, Subscript, Superscript, Marked |
| ☰ | **Insert list** → Ordered list, Bullet list, Checklist, Details |
| ▦ | **Insert table** → an editable 3×3 table; a floating bar adds and removes rows and columns, and column widths drag on the borders |
| 🔗 | **Insert link** → a *Create link* panel with **Text** and **URL** fields |
| 🖼 | **Insert media** → Photo or video (two or more become a slideshow), Audio file, Location |
| Σ | **Insert formula** → asks for the formula, drops in a math block |
| ✦ | The insert palette — search every block and format by name |
| 🗑 ➤ | Clear the message · Send it (right-click to pick rich message, draft or edit) |

The title bar holds the settings gear with a connection dot, the live-preview toggle and the
right-to-left switch for the message you are writing.

> **No emoji button.** Custom emoji are a Premium-only entity that bots cannot send through the
> rich-message API. Plain Unicode emoji typed from your keyboard travel as ordinary text.

---

## ✍️ What you can send

| | |
|---|---|
| **Text** | Bold · Italic · Underline · Strikethrough · Spoiler · Marked · Subscript · Superscript · Monospace · Inline formula · Links |
| **Blocks** | Heading H1–H6 · Paragraph · Quote · Pull quote · Code block with language · Divider · Collapsible · Footer · Formula block |
| **Lists** | Ordered · Bulleted · Checklist *(sent through the separate `sendChecklist` API)* |
| **Tables** | Header row, editable cells, drag-to-resize columns |
| **Media** | Photo · Video · Audio · Slideshow · Collage · Location |

And while you write:

- **Live preview** — a real Telegram bubble, rendered from the exact blocks that will be sent
- **Markdown shortcuts** — `## `, `> `, `- `, `1. `, ` ``` `, `**bold**`, `` `code` ``
- **Insert palette** — one search box over every block and format
- **Dark and light themes**, English and Persian UI, full right-to-left support
- **Character counter** against Telegram's 32,768 limit

### Send modes

Right-click the send button:

| Mode | What it does |
|---|---|
| **Rich message** | `sendRichMessage` — the normal path |
| **Draft** | `sendRichMessageDraft` — a 30-second preview, private chats only |
| **Edit** | `editMessageText` — rewrites an existing message (ID comes from Settings) |

### Keyboard shortcuts

| | | | |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> Send | <kbd>Ctrl</kbd>+<kbd>K</kbd> Link | <kbd>Ctrl</kbd>+<kbd>P</kbd> Preview | <kbd>Ctrl</kbd>+<kbd>,</kbd> Settings |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> Bold | <kbd>Ctrl</kbd>+<kbd>I</kbd> Italic | <kbd>Ctrl</kbd>+<kbd>U</kbd> Underline | <kbd>Ctrl</kbd>+<kbd>E</kbd> Monospace |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> Strikethrough | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> Spoiler | <kbd>Ctrl</kbd>+<kbd>Z</kbd> Undo | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> Redo |

---

## 🧩 How it works

Telegram's rich messages are **not** Markdown. The API expects an array of structured
`InputRichBlock*` objects, so that is what the app builds — blocks *and* the styled runs inside
them:

```
TipTap (ProseMirror) document
        │
        ▼
Block parser ─────────────────────────────► Block State (JSON[])
   ├─ block level   paragraph, heading, table, checklist, media, …
   └─ inline level  { text, marks[], href? } segments
        │
        ▼
Block serializer
   ├─ blocks     → InputRichBlock*
   └─ rich_text  → nested RichText*   (bold inside italic inside link)
        │
        ├──► sendRichMessage        rich messages
        ├──► sendRichMessageDraft   30-second drafts
        └──► sendChecklist          checklists, always a separate call
```

<details>
<summary><strong>Block types → Telegram API</strong></summary>

| Block | API type |
|---|---|
| paragraph | `InputRichBlockParagraph` |
| heading | `InputRichBlockHeading` |
| blockquote | `InputRichBlockBlockquote` |
| pullquote | `InputRichBlockAside` |
| code_block | `InputRichBlockPreformatted` |
| divider | `InputRichBlockDivider` |
| list | `InputRichBlockList` |
| table | `InputRichBlockTable` |
| details | `InputRichBlockDetails` |
| footer | `InputRichBlockFooter` |
| photo / video / audio | `InputRichBlockPhoto` / `…Video` / `…Audio` |
| slideshow / collage | `InputRichBlockSlideshow` / `InputRichBlockCollage` |
| map | `InputRichBlockMap` |
| math_block | `InputRichBlockMath` |
| checklist | sent separately via `sendChecklist` |

</details>

<details>
<summary><strong>Inline marks → RichText objects</strong></summary>

| Mark | API type |
|---|---|
| bold / italic / underline / strikethrough | `RichTextBold`, `RichTextItalic`, `RichTextUnderline`, `RichTextStrikethrough` |
| spoiler | `RichTextSpoiler` |
| marked | `RichTextMarked` |
| code | `RichTextCode` |
| subscript / superscript | `RichTextSubscript` / `RichTextSuperscript` |
| link | `RichTextLink` (carries `url`) |
| math | `RichTextMath` |

A run wearing several marks nests from the inside out, so `**_word_**` becomes
`italic( bold( text ) )`.

</details>

---

## 🔒 Security

The bot token is the one secret in this app, and it never reaches the window you type in.

```
Renderer (React)                     Main process (Electron)
─────────────────                    ───────────────────────
✗ never holds the token              ✓ token encrypted with safeStorage
✗ never calls the network   ──IPC──► ✓ every Telegram request starts here
✓ knows only "a token exists"        ✓ validates method, chat ID, language
                                     ✓ 30 s timeout · 1 MB response cap
```

| Layer | Protection |
|---|---|
| Token storage | `safeStorage` — OS keychain encryption, on disk as `settings.enc` |
| IPC bridge | `contextBridge` with `contextIsolation` — no Node APIs in the renderer |
| Input validation | Allowlists for API methods, chat IDs and languages |
| HTTP | 30-second timeout, 1 MB response limit |
| URLs | `javascript:`, `data:` and `vbscript:` schemes are refused |
| Rendering | The preview builds React elements — never `innerHTML` |
| CSP | Content-Security-Policy meta tag in `index.html` |

---

## 🛠 Development

```bash
npm run dev           # Vite + Electron with hot reload
npm test              # 151 unit tests (Vitest)
npm run lint          # ESLint, zero warnings
npm run format        # Prettier
npm run build         # Windows installer → dist/TelegramFreeRich-Setup-4.1.1.exe
npm run build:linux   # AppImage
```

<details>
<summary><strong>Project layout</strong></summary>

```
src/
├── main/                       Electron main process
│   ├── main.js                 window, IPC handlers, Telegram requests
│   ├── preload.js              contextBridge — the only renderer surface
│   └── security/validation.js  method / chat ID / language allowlists
│
├── renderer/                   React UI
│   ├── App.jsx                 shell: state, send logic, shortcuts
│   ├── components/
│   │   ├── TitleBar.jsx        frameless window chrome
│   │   ├── Toolbar.jsx         the seven-button strip + menus
│   │   ├── ActionMenu.jsx      menu renderer, two levels deep
│   │   ├── Popover.jsx         anchored floating panel
│   │   ├── TableBubble.jsx     floating table row/column controls
│   │   ├── InsertPalette.jsx   searchable palette
│   │   ├── BottomBar.jsx       palette · counter · clear · send
│   │   ├── Preview.jsx         live Telegram bubble
│   │   ├── Settings.jsx        token, chat, language, theme
│   │   ├── Dialog.jsx          promise-based prompt / confirm / link panel
│   │   ├── Toast.jsx           notifications
│   │   ├── Icons.jsx           the SVG set
│   │   ├── useTfrEditor.js     TipTap setup
│   │   └── extensions.js       custom nodes and marks
│   ├── lib/editor-actions.js   one registry behind every menu
│   ├── i18n/                   en · fa · provider
│   └── styles/                 theme · app · toolbar · menu · editor · preview
│
└── shared/                     used by both processes
    ├── block-types.js          BlockType / InlineType enums
    ├── block-parser.js         DOM → Block State
    ├── inline-parser.js        inline DOM → styled segments
    ├── block-serializer.js     Block State → Telegram JSON
    ├── block-manager.js        CRUD + undo/redo
    ├── constants.js            limits and defaults
    └── utils.js                sanitizeUrl, validation, helpers

tests/unit/                     151 tests — parsers, serializer, registry,
                                i18n parity, stylesheets, validation
```

Adding a command means adding **one entry** to `src/renderer/lib/editor-actions.js`; the menus,
the palette and the tests all read from that registry.

</details>

<details>
<summary><strong>Custom TipTap extensions</strong></summary>

| Extension | Kind | Renders as |
|---|---|---|
| Spoiler | mark | `<span data-spoiler>` |
| InlineMath | mark | `<span data-inline-math>` |
| PullQuote | node | `<blockquote data-pullquote>` |
| Details | node | `<details>` with an editable body |
| Footer | node | `<footer>` |
| MathBlock | node | `div.tg-math` |
| MediaBlock | node | `<video>` / `<audio>` |
| GalleryBlock | node | `div.tg-gallery` — slideshow or collage |
| MapBlock | node | `div.tg-map` |

</details>

---

## 📦 Tech stack

| Layer | Choice |
|---|---|
| Desktop shell | Electron 35 — frameless window, `safeStorage`, `contextBridge` |
| UI | React 19 + Vite 6 |
| Editor | TipTap 2 (ProseMirror) |
| Data model | Block State → `InputRichBlock*` / `RichText*` |
| Tests | Vitest 2 + jsdom |
| Packaging | electron-builder — NSIS installer, AppImage |
| CI | GitHub Actions — lint, test, build |

---

<p align="center">
  <a href="CHANGELOG.md">Changelog</a> •
  <a href="Documentation.html">Design spec</a> •
  <a href="https://core.telegram.org/bots/api">Bot API docs</a>
</p>

<p align="center">MIT © Aporis3674</p>

<p align="center"><sub>The best things in life are free. The second-best are also free, if you use a bot.</sub></p>
