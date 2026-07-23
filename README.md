<p align="center">
  <img src="https://img.shields.io/badge/Bot%20API-10.1-blue?logo=telegram" alt="Bot API 10.1">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React 18">
  <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite" alt="Vite 5">
  <img src="https://img.shields.io/github/license/Aporis3674/TelegramFreeRich" alt="License">
  <img src="https://img.shields.io/badge/Premium-Free-success" alt="Free">
</p>

<h1 align="center">TelegramFreeRich</h1>

<p align="center"><strong>Free Rich Text Editor for Telegram</strong></p>
<p align="center">Because bots should not have more rights than humans.</p>

---

## What is this?

Telegram introduced a rich text editor in June 2026, but locked it behind Premium. Meanwhile, Bot API 10.1 gives bots the exact same capabilities for free.

This project is a WYSIWYG visual editor that lets anyone -- not just Premium subscribers -- create and send professionally formatted messages through Telegram's Bot API.

No coding required. No Telegram Premium required. No server required.

## Features

### Inline Formatting
- Bold, Italic, Underline, Strikethrough
- Spoiler, Highlight/Marked, Inline Code
- Subscript, Superscript
- Links, Mentions
- Footnotes with auto-numbering

### Block Elements
- Headings (H1 through H6)
- Blockquotes with citation
- Pull Quotes
- Code Blocks with language support
- Dividers
- Collapsible Details/Summary blocks
- Tables with headers
- Footers

### Lists
- Bullet Lists
- Numbered Lists
- Checklists (done/todo)

### Media
- Images (drag-and-drop or URL)
- Videos, Audio, Voice Notes
- Slideshows with navigation
- OpenStreetMap embeds

### Math
- Inline math ($formula$)
- Block math ($$formula$$)

### API Integration
- Send via `sendRichMessage` with Markdown field
- Edit messages with `editMessageText` + `rich_message`
- Send drafts with `sendRichMessageDraft` (30s temporary, private chats)
- Fallback to `sendMessage` with `parse_mode=HTML`

### Editor UX
- Split pane: Editor (60%) + Live Preview (40%)
- Telegram-style message bubble preview
- Dark theme (default) + Light theme toggle
- Floating toolbar with all formatting buttons
- Plus menu for inserting blocks
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K, Ctrl+E)
- Drag-and-drop media files
- Character counter (32,768 max)
- Settings panel (Bot Token, Chat ID, Send Method)
- Focus mode for distraction-free writing
- Clear All button
- Toast notifications
- Mobile responsive

## Architecture

```
contenteditable DOM
    |
    v  (domToMarkdown.js)
  Markdown string
    |
    v  (sendRichMessage API)
Telegram Bot API 10.1
    |
    v
  Rendered rich message in chat
```

The editor uses `contenteditable` for WYSIWYG editing. A custom DOM parser (`domToMarkdown.js`) converts the editor content to Telegram-compatible Markdown. Messages are sent via `sendRichMessage` with the `markdown` field.

## Tech Stack

- React 18
- Vite 5
- Vanilla CSS (no framework, no CDN)
- SVG icons (inline, no icon library)

## Project Structure

```
TelegramFreeRich/
  src/
    main.jsx              # React entry point
    App.jsx               # Main app with split layout
    App.css               # All styles (dark/light theme)
    components/
      Editor.jsx          # contenteditable WYSIWYG editor
      Toolbar.jsx         # Formatting buttons with SVG icons
      Preview.jsx         # Live Markdown preview
      Settings.jsx        # Bot Token, Chat ID, Send Method
      PlusMenu.jsx        # Insert block menu
    lib/
      domToMarkdown.js    # DOM to Telegram Markdown converter
      sendMessage.js      # Telegram API client
  index.html              # Vite entry HTML
  vite.config.js          # Vite configuration
  package.json            # Dependencies
```

## Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the app in your browser
2. Click Settings (gear icon)
3. Enter your Bot Token (from @BotFather)
4. Enter Chat ID (@channel or numeric ID)
5. Choose Send Method (sendRichMessage recommended)
6. Start writing in the editor
7. See live preview on the right
8. Click Send

## Send Methods

| Method | When to use |
|--------|-------------|
| `sendRichMessage` (Markdown) | Recommended. Supports all features: inline, headings, lists, tables, code, math, details, footnotes, media, slideshows, maps |
| `sendRichMessage` (HTML) | Fewer features. No footnotes, no media, no details |
| `sendMessage` (parse_mode=HTML) | Legacy fallback. Basic formatting only |

## Bot API 10.1 Types (Tested)

### Working Block Types
- `paragraph`, `heading`, `blockquote`, `pre`, `divider`, `list`, `footer`, `table`, `photo`, `video`

### Working Inline Types
- `bold`, `italic`, `underline`, `strikethrough`, `spoiler`, `code`, `marked`, `subscript`, `superscript`, `url`, `mention`, `text_mention`, `anchor`, `reference`

### Markdown Syntax (Verified)

```
*bold*  _italic_  ~strike~  `code`  ==highlight==  ||spoiler||

# Heading 1  through  ###### Heading 6

- bullet item
1. numbered item
- [ ] todo
- [x] done

> blockquote
---
[a link](https://example.com)

| A | B |
|---|---|
| 1 | 2 |

$inline math$
$$block math$$

<details><summary>Title</summary>Content</details>

[^id1]: Footnote definition
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+K | Insert Link |
| Ctrl+E | Inline Code |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

---

> The best things in life are free. The second-best things are also free, if you use a bot.
