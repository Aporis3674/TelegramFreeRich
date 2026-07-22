<div align="center">

# 🆓 TelegramFreeRich

### Free Rich Text Editor for Telegram

**Because bots shouldn't have more rights than humans.**

[![GitHub Repo](https://img.shields.io/badge/Repo-TelegramFreeRich-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Aporis3674/TelegramFreeRich)
[![Telegram Bot API](https://img.shields.io/badge/Telegram%20Bot%20API-10.1-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge)](LICENSE)
[![No Premium](https://img.shields.io/badge/Premium-Not%20Required-ff6b6b?style=for-the-badge)](#)

![Status](https://img.shields.io/badge/status-active-success?style=flat-square)
![Markdown](https://img.shields.io/badge/Markdown-supported-blue?style=flat-square&logo=markdown)
![HTML](https://img.shields.io/badge/HTML-supported-orange?style=flat-square&logo=html5)
![Price](https://img.shields.io/badge/Price-%240-00c853?style=flat-square)

</div>

---

## 🤔 The Story

Telegram recently introduced a **rich text editor** for composing formatted messages — headings, tables, lists, blockquotes, code blocks, and embedded media. Pretty cool, right?

**The catch:** It's locked behind Telegram Premium ($5/month).

**The twist:** Telegram gave the exact same capability to bots **for free** via the Bot API.

**The irony:** A lifeless bot has more formatting rights than the human user holding the phone.

So we built this. A free, open-source rich text editor that uses the same API Telegram charges humans for.

---

## ✨ What Is This?

Two things:

### 1. 📝 Standalone Web Editor (`index.html`)

A self-contained HTML file you open in any browser. No server needed. No install. No npm. Just double-click.

- **Markdown editor** with live preview
- **HTML editor** with full Telegram tag support
- **Toolbar** for quick formatting (bold, italic, code, tables, etc.)
- **Direct send** to Telegram via Bot API
- **Keyboard shortcuts** (Ctrl+B, Ctrl+I, etc.)
- **32,768 character counter** with color warnings
- **Spoiler toggle** in preview
- **Dark theme** — easy on the eyes
- **Offline** — works without internet (except sending)
- **Mobile responsive** — works on your phone too

### 2. 🤖 Cloudflare Worker Bot (`worker.js`)

A lightweight bot that runs on Cloudflare's free tier. Send it any Markdown or HTML, get a rendered Rich Message back.

- **No server, no database** — just one file
- **Free Cloudflare Workers** tier is enough
- **Bilingual** support (Markdown + HTML)
- **Entity reconstruction** — rebuilds your formatting from Telegram's parsed entities
- **Fallback handling** — gracefully degrades if `sendRichMessage` fails

---

## 🚀 Quick Start

### Web Editor

1. Download `index.html`
2. Open it in your browser
3. Write in Markdown or HTML
4. See the live preview
5. Enter your bot token + chat ID
6. Click Send

That's it. No installation. No build step. No dependency hell.

### Cloudflare Worker Bot

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Copy `worker.js` into a Cloudflare Worker
3. Set `BOT_TOKEN` as a secret (or paste it in the code)
4. Set webhook:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>
   ```
5. Send any Markdown or HTML to your bot

---

## 📖 Supported Syntax

### Markdown (MarkdownV2)

| Feature | Syntax |
|---------|--------|
| **Bold** | `**text**` |
| *Italic* | `*text*` |
| __Underline__ | `__text__` |
| ~~Strikethrough~~ | `~~text~~` |
| \|\|Spoiler\|\| | `\|\|text\|\|` |
| ==Highlight== | `==text==` |
| `Code` | `` `code` `` |
| Code Block | ` ```lang\ncode\n``` ` |
| [Link](https://telegram.org) | `[text](url)` |
| # Heading | `# H1` through `###### H6` |
| > Blockquote | `> text` |
| - List | `- item` or `1. item` |
| - [x] Task | `- [x] done` or `- [ ] todo` |
| Table | `\| A \| B \|` |
| --- Divider | `---` |
| Media | `![caption](url)` |
| Math | `$E=mc^2$` or `$$block$$` |

### HTML Tags

| Tag | Purpose |
|-----|---------|
| `<b>` / `<strong>` | Bold |
| `<i>` / `<em>` | Italic |
| `<u>` / `<ins>` | Underline |
| `<s>` / `<del>` | Strikethrough |
| `<tg-spoiler>` | Spoiler |
| `<mark>` | Highlight |
| `<code>` | Inline code |
| `<pre><code class="lang">` | Code block |
| `<blockquote>` | Blockquote |
| `<details><summary>` | Collapsible |
| `<a href="...">` | Link |
| `<sup>` / `<sub>` | Super/Subscript |
| `<tg-collage>` | Photo collage |
| `<tg-slideshow>` | Media slideshow |
| `<tg-map>` | Embedded map |
| `<tg-math-block>` | Math expression |

---

## 🎭 The Contradiction, Summarized

| | Premium User | Bot (Free) |
|---|:---:|:---:|
| Send bold text | ✅ | ✅ |
| Rich text editor | 💰 Premium | ✅ Free |
| Tables in messages | 💰 Premium | ✅ Free |
| Headings | 💰 Premium | ✅ Free |
| Code blocks | 💰 Premium | ✅ Free |
| Media in text | 💰 Premium | ✅ Free |
| Needs a phone | Yes | No |
| Is alive | Yes | No |
| Can feel pain | Yes | No |
| Pays $5/month | Yes | **No** |

Telegram's official joke about this: *"If it were free, we'd have to call it the Poor People's Editor."*

Our response: We call it **TelegramFreeRich**. And it works.

---

## 🛠 Tech Details

- **Bot API Version:** 10.1
- **Methods Used:** `sendRichMessage`, `sendRichMessageDraft`, `editMessageText`
- **Input Format:** `InputRichMessage` with `markdown` or `html` field
- **Worker Runtime:** Cloudflare Workers (V8 isolates)
- **Editor:** Vanilla JS, zero dependencies
- **Theme:** Dark indigo/purple

---

## 📁 Project Structure

```
TelegramFreeRich/
├── index.html          # Standalone web editor (open in browser)
├── worker.js           # Cloudflare Worker bot
├── README.md           # You're reading this
└── LICENSE             # MIT — do whatever you want
```

---

## 🤝 Contributing

PRs welcome. Especially:
- Better LaTeX rendering
- More languages (i18n)
- Vim keybindings for the editor
- Export to PDF
- More ways to gently roast Telegram's pricing decisions

---

## 📄 License

MIT — use it, fork it, sell it (good luck), or just point it at Telegram and laugh.

---

## 🙏 Credits

- [Telegram Bot API](https://core.telegram.org/bots/api) — for giving bots what they gave humans for free
- [TeleRich](https://github.com/DarknessShade/TeleRich) — inspiration for the bot side
- Every Premium user who realized bots can do it for $0

---

<div align="center">

**Made with ❤️ and $0**

*"The best things in life are free. The second-best things are also free, if you use a bot."*

</div>
