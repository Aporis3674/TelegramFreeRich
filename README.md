<p align="center">
  <img src="https://raw.githubusercontent.com/Aporis3674/TelegramFreeRich/master/logo.svg" width="120" alt="TelegramFreeRich">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/github/license/Aporis3674/TelegramFreeRich" alt="License">
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
  <a href="#build">Build from Source</a>
</p>

<p align="center">
  <img src="screenshot.jpg" alt="TelegramFreeRich Screenshot" width="800">
</p>

---

## Download

| Platform | Download |
|----------|----------|
| **Windows** | [TelegramFreeRich-Setup.exe](https://github.com/Aporis3674/TelegramFreeRich/releases/latest) |

Requires Windows 10 or later. No installation of Node.js or other dependencies needed.

## What is this?

Telegram introduced a rich text editor in June 2026 (Bot API 10.1), but locked it behind Premium. Meanwhile, the same API gives bots the exact same capabilities for free.

This is a **desktop app** that lets anyone -- not just Premium subscribers -- create and send professionally formatted messages through Telegram's Bot API.

No coding required. No Telegram Premium required. No server required.

## Features

### Inline Formatting
- Bold, Italic, Underline, Strikethrough
- Spoiler, Inline Code

### Block Elements
- Headings (H1 through H6)
- Blockquotes with citation, Pull Quotes
- Code Blocks with language selector
- Dividers
- Collapsible Details/Summary

### Lists
- Bullet Lists
- Numbered Lists
- Checklists (markdown: `- [x]` / `- [ ]`)

### Tables
- Editable table cells
- Add row/column buttons

### Media
- Images (URL input)
- Videos, Audio
- Slideshows (multiple images)

### API Integration
- Send via `sendRichMessage` with markdown formatting
- Edit messages with `editMessageText` + `rich_message`
- Send drafts with `sendRichMessageDraft` (30s, private chats)
- Test Connection button (`getMe`)

### Editor UX
- **Block-based editor** -- each element is a draggable card (Notion-like)
- Live preview panel with Telegram-style message bubble
- Dark theme (default) + Light theme toggle
- 3-group toolbar: Inline, Block, Media
- Plus menu for inserting blocks
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+E)
- Drag-and-drop media files
- Character counter (32,768 max)
- Settings panel (Bot Token, Chat ID, Language)
- Clear All button
- Toast notifications
- Drag-to-reorder blocks
- Delete individual blocks

## Architecture

The editor uses a **block-based JSON state** internally. When sending, the blocks are converted to **Telegram Markdown** via `htmlToMarkdown()` and sent through the `markdown` field of `InputRichMessage`.

```
Editor State (JSON[])          htmlToMarkdown()         Telegram Bot API
  +-----------+                    |                   +------------------+
  | paragraph |--- HTML text       v                   | InputRichMessage |
  | heading   |--- HTML text   markdown string -------->|   markdown: "..."|
  | code-block|--- code text                          +------------------+
  | table     |--- cells[][]
  | list      |--- items[]
  | details   |--- summary, HTML body
  | image     |--- URL, caption         Markdown output:
  | video     |--- URL, caption         **bold** *italic*
  | slideshow |--- images[]             # Heading
  | divider   |                        - bullet list
  | pull-quote|--- text, cite          1. numbered list
  | footer    |--- text                - [x] checklist
  | checklist |--- items[]             --- divider
  +-----------+                        | table |
                                       ````code````
                                       > blockquote
                                       <details>...</details>
```

### Inline Formatting Conversion

The `htmlToMarkdown()` function converts HTML from the editor to Telegram markdown:

| Editor HTML | Telegram Markdown |
|-------------|-------------------|
| `<strong>text</strong>` | `**text**` |
| `<em>text</em>` | `*text*` |
| `<u>text</u>` | `<u>text</u>` |
| `<s>text</s>` | `~~text~~` |
| `<code>text</code>` | `` `text` `` |
| `<span class="tg-spoiler">text</span>` | `\|\|text\|\|` |

## Installation

### Prerequisites
- Node.js 18 or higher (only for building from source)
- A Telegram bot (get one from @BotFather)
- A Chat ID (channel or group)

### Quick Start (Download)

1. Download the latest release from the [Releases page](https://github.com/Aporis3674/TelegramFreeRich/releases/latest)
2. Run `TelegramFreeRich-Setup.exe`
3. Open the app
4. Click Settings (gear icon)
5. Enter your Bot Token (from @BotFather)
6. Enter Chat ID (@channel or numeric ID)
7. Click "Test Connection"
8. Start writing and click Send

### From Source

```bash
git clone https://github.com/Aporis3674/TelegramFreeRich.git
cd TelegramFreeRich
npm install
npm start
```

## Usage

1. Type or format your message in the editor (left pane)
2. Use the toolbar to insert blocks and formatting
3. See the live Telegram-style preview on the right
4. Click Send to post to your channel/group

### Send Modes

| Mode | Button | When to use |
|------|--------|-------------|
| Rich | Send | Send as a rich formatted message (recommended) |
| Draft | Draft | Send a 30-second temporary preview (private chats only) |
| Edit | Edit | Edit an existing message (enter message ID) |

### Toolbar Groups

| Group | Buttons |
|-------|---------|
| **Inline** | Bold, Italic, Underline, Strikethrough, Code, Spoiler |
| **Block** | Heading H1-H3, Bullet List, Numbered List, Checklist, Code Block, Table, Details, Divider, Footnote |
| **Media** | Image, Video, Slideshow |

## Build

### Windows (on any OS)

```bash
# Build Windows installer
npm run build
# Output: dist/TelegramFreeRich-Setup-2.0.0.exe
```

### Linux

```bash
npm run build:linux
```

## Bot API 10.1 Types (Tested)

### Markdown Features
Bold, Italic, Underline, Strikethrough, Spoiler, Inline Code, Headings, Lists, Checklists, Tables, Blockquotes, Code Blocks, Dividers, Details/Summary, Footers

### Media
Images (`![](url)`), Videos, Audio, Slideshows

### Checklist
Markdown format: `- [x] done` / `- [ ] not done` (sent via `sendRichMessage` markdown)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+E | Inline Code |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron 35 |
| Frontend | Vanilla HTML + CSS + JS |
| Data model | Block State (JSON object array) |
| Output | InputRichMessage.markdown |
| Conversion | htmlToMarkdown (HTML to Telegram MD) |
| Theming | CSS variables (dark + light) |
| Packaging | electron-builder (NSIS) |

## Project Structure

```
TelegramFreeRich/
  src/
    main/
      main.js           # Electron main process
      preload.js        # Secure IPC bridge
    renderer/
      index.html        # UI: editor, toolbar, preview, settings
      app.js            # Core: block state, editor, preview, API
      styles/
        app.css         # Dark/light theme, layout, components
  Documentation.html    # API reference and tested types
  Specification.md      # Persian design specification
  package.json          # Dependencies and build config
```

## License

MIT

---

> The best things in life are free. The second-best things are also free, if you use a bot.
