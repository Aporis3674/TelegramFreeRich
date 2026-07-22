/**
 * TelegramFreeRich — Cloudflare Worker Bot
 * Free Rich Message formatting for everyone
 * https://github.com/Aporis3674/TelegramFreeRich
 *
 * Telegram Bot API 10.1 — sendRichMessage
 *
 * WHY THIS EXISTS:
 * Telegram locked rich text formatting behind Premium for human users,
 * then gave it FREE to bots via the same API. So here we are — a bot
 * that does what Telegram charges humans for, at the low price of $0.
 *
 * SETUP:
 * 1. Set BOT_TOKEN as a Cloudflare Secret (or paste below)
 * 2. Deploy to Cloudflare Workers (free tier)
 * 3. Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>
 */

const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default {
  async fetch(request, env) {
    const token = (env && env.BOT_TOKEN) || BOT_TOKEN;
    const api = `https://api.telegram.org/bot${token}`;

    if (request.method === "GET") {
      return new Response(JSON.stringify({
        status: "running",
        name: "TelegramFreeRich",
        description: "Free rich text formatting — because bots shouldn't have more rights than humans",
        version: "1.0.0",
        api: "Bot API 10.1"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST") return new Response("OK");

    let update;
    try { update = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

    try {
      const message = update.message;
      const callbackQuery = update.callback_query;
      if (callbackQuery) await handleCallback(callbackQuery, api);
      else if (message?.text) await handleMessage(message, api);
    } catch (err) {
      console.error("Handler error:", err?.stack || err);
      try {
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        if (chatId) {
          await callApi(api, "sendMessage", {
            chat_id: chatId,
            text: `⚠️ Error: ${err?.message || err}`
          });
        }
      } catch {}
    }

    return new Response("OK", { status: 200 });
  },
};

// ─── Message Handler ─────────────────────────────────────────────────────────
async function handleMessage(message, api) {
  const chatId = message.chat.id;
  const rawText = message.text?.trim();
  if (!rawText) return;

  if (rawText === "/start" || rawText === "/help") {
    await sendRich(api, chatId, HELP_TEXT, mainKeyboard());
    return;
  }

  if (rawText === "/demo") {
    await sendRich(api, chatId, DEMO_TEXT, mainKeyboard());
    return;
  }

  // Reconstruct markdown from Telegram entities
  let text = entitiesToMarkdown(rawText, message.entities);
  if (!text) text = rawText;

  // Detect format and send as rich message
  if (text.startsWith("<") || /<\/?\w/.test(text)) {
    await sendRichHtml(api, chatId, text);
  } else {
    await sendRich(api, chatId, text);
  }
}

// ─── Callback Handler ────────────────────────────────────────────────────────
async function handleCallback(cb, api) {
  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
  const data = cb.data;

  await callApi(api, "answerCallbackQuery", { callback_query_id: cb.id });

  if (data === "demo") {
    await editRich(api, chatId, msgId, DEMO_TEXT, mainKeyboard());
  } else if (data === "help") {
    await editRich(api, chatId, msgId, HELP_TEXT, mainKeyboard());
  } else if (data === "md_guide") {
    await editRich(api, chatId, msgId, MD_GUIDE, backKeyboard());
  } else if (data === "html_guide") {
    await editRich(api, chatId, msgId, HTML_GUIDE, backKeyboard());
  } else if (data === "back") {
    await editRich(api, chatId, msgId, HELP_TEXT, mainKeyboard());
  }
}

// ─── Keyboards ───────────────────────────────────────────────────────────────
function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📖 Markdown Guide", callback_data: "md_guide" },
        { text: "🌐 HTML Guide", callback_data: "html_guide" },
      ],
      [
        { text: "🎨 Full Demo", callback_data: "demo" },
      ],
    ],
  };
}

function backKeyboard() {
  return {
    inline_keyboard: [[{ text: "⬅️ Back", callback_data: "back" }]],
  };
}

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function callApi(api, method, body) {
  const res = await fetch(`${api}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[${method}] ${res.status}: ${err}`);
  }
  return res;
}

async function sendRich(api, chatId, markdown, replyMarkup) {
  const body = { chat_id: chatId, rich_message: { markdown } };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await callApi(api, "sendRichMessage", body);
  if (!res.ok) {
    // Fallback to sendMessage with MarkdownV2
    const fallback = { chat_id: chatId, text: markdown, parse_mode: "MarkdownV2" };
    if (replyMarkup) fallback.reply_markup = replyMarkup;
    await callApi(api, "sendMessage", fallback);
  }
}

async function sendRichHtml(api, chatId, html, replyMarkup) {
  const body = { chat_id: chatId, rich_message: { html } };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await callApi(api, "sendRichMessage", body);
  if (!res.ok) {
    const fallback = { chat_id: chatId, text: html, parse_mode: "HTML" };
    if (replyMarkup) fallback.reply_markup = replyMarkup;
    await callApi(api, "sendMessage", fallback);
  }
}

async function editRich(api, chatId, msgId, markdown, replyMarkup) {
  const body = { chat_id: chatId, message_id: msgId, rich_message: { markdown } };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await callApi(api, "editMessageText", body);
  if (!res.ok) {
    const fallback = { chat_id: chatId, message_id: msgId, text: markdown, parse_mode: "MarkdownV2" };
    if (replyMarkup) fallback.reply_markup = replyMarkup;
    await callApi(api, "editMessageText", fallback);
  }
}

// ─── Entity → Markdown Reconstruction ────────────────────────────────────────
function entitiesToMarkdown(text, entities) {
  if (!entities?.length) return text;
  const items = entities.map((e, idx) => ({ e, idx, start: e.offset, end: e.offset + e.length }));

  function isTopLevel(item, pool) {
    return !pool.some(other => {
      if (other.idx === item.idx) return false;
      return (other.start <= item.start && other.end >= item.end &&
        (other.start < item.start || other.end > item.end));
    });
  }

  function render(start, end, pool) {
    const inRange = pool.filter(it => it.start >= start && it.end <= end);
    const top = inRange.filter(it => isTopLevel(it, inRange)).sort((a, b) => a.start - b.start);
    let out = "", pos = start;
    for (const item of top) {
      out += text.slice(pos, item.start);
      const innerPool = pool.filter(p => p.idx !== item.idx);
      const inner = render(item.start, item.end, innerPool);
      out += wrapEntity(item.e, inner);
      pos = item.end;
    }
    out += text.slice(pos, end);
    return out;
  }

  return render(0, text.length, items);
}

function wrapEntity(e, content) {
  switch (e.type) {
    case "bold": return `**${content}**`;
    case "italic": return `*${content}*`;
    case "underline": return `__${content}__`;
    case "strikethrough": return `~~${content}~~`;
    case "spoiler": return `||${content}||`;
    case "code": return `\`${content}\``;
    case "pre": return "```" + (e.language || "") + "\n" + content + "\n```";
    case "text_link": return `[${content}](${e.url})`;
    case "text_mention": return e.user ? `[${content}](tg://user?id=${e.user.id})` : content;
    case "blockquote":
    case "expandable_blockquote":
      return content.split("\n").map(l => `>${l}`).join("\n");
    default: return content;
  }
}

// ─── Content ─────────────────────────────────────────────────────────────────
const HELP_TEXT = `# 🤖 TelegramFreeRich

**Free rich text formatting for everyone!**

Send any *Markdown* or *HTML* text and get a beautifully rendered **Rich Message** back.

> Telegram charges Premium users for this. We give it to bots for free. Same API. Same result. Zero cost.

Use the buttons below to explore 👇`;

const DEMO_TEXT = `# 🎨 Full Feature Demo

---

## Text Formatting

**Bold text** — *italic text* — __underlined__ — ~~strikethrough~~

||This is a spoiler — click to reveal||

\`inline code\` and ==highlighted text==

---

## Nested Formatting

**Bold *italic bold ~~strikethrough italic bold ||spoiler||~~* bold**

---

## Code Block

\`\`\`javascript
// TelegramFreeRich — Free rich formatting
const message = {
  rich_message: {
    markdown: "**Hello** from a _free_ bot!"
  }
};
// This costs $0. Telegram Premium costs real money.
console.log("Same API, same result.");
\`\`\`

---

## Blockquote

> "Why pay for formatting when bots get it for free?"
> — Every developer who read the Bot API changelog

---

## Table

| Feature | Premium User | Free Bot |
|---------|:----------:|:--------:|
| Bold | ✅ | ✅ |
| Rich Messages | 💰 $5/mo | ✅ Free |
| Tables | 💰 $5/mo | ✅ Free |
| Dignity | 💰 $5/mo | ✅ Already had it |

---

## Task List

- [x] Read Telegram Bot API docs
- [x] Discover bots get rich formatting for free
- [x] Build this project
- [ ] Send Telegram a thank-you note

---

## Links & Media

[GitHub Repository](https://github.com/Aporis3674/TelegramFreeRich)

---

## Math

Inline: $E = mc^2$

Block:
$$\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\ldots + x_n$$

---

*Built with ❤️ and $0*`;

const MD_GUIDE = `# 📖 Markdown Reference

Full [Telegram MarkdownV2](https://core.telegram.org/bots/api#markdownv2-style) syntax:

---

## Text Styles

\\*\\*bold\\*\\* → **bold**
\\*italic\\* → *italic*
\\_\\_underline\\_\\_ → __underline__
\\~\\~strikethrough\\~\\~ → ~~strikethrough||
||spoiler|| → ||tap to reveal||
\\==highlight== → ==highlighted==
\\\`code\\\` → \`inline code\`

---

## Headings

\\# Heading 1
\\## Heading 2
\\### Heading 3
\\#### Heading 4
\\##### Heading 5
\\###### Heading 6

---

## Lists

Unordered:
\\- item one
\\- item two
\\- \\[ \\] todo
\\- \\[x\\] done

Ordered:
\\1. first
\\2. second
\\3. third

---

## Links & Quotes

\\[text\\]\\(https://url.com\\)

\\> This is a blockquote
\\> It can span multiple lines

---

## Code Blocks

\\\`\\\`\\\`python
def hello():
    print("Free formatting!")
\\\`\\\`\\\`

---

## Tables

\\| Header A | Header B |
\\|----------|----------|
\\| Cell 1   | Cell 2   |

---

## Math

Inline: \\$E=mc^2\\$
Block: \\$\\$\\sum x\_i\\$\\$

---

## Media

\\![caption](https://example.com/photo.jpg)`;

const HTML_GUIDE = `# 🌐 HTML Reference

Full [Telegram HTML](https://core.telegram.org/bots/api#html-style) tags:

---

## Text Tags

\\<b>bold\\</b> — \\<strong>bold\\</strong>
\\<i>italic\\</i> — \\<em>italic\\</em>
\\<u>underline\\</u> — \\<ins>underline\\</ins>
\\<s>strike\\</s> — \\<del>strike\\</del>
\\<tg-spoiler>spoiler\\</tg-spoiler>
\\<mark>highlight\\</mark>
\\<sup>super\\</sup> — \\<sub>sub\\</sub>

---

## Links

\\<a href="https://url.com">link text\\</a>
\\<a href="tg://user?id=12345">@mention\\</a>

---

## Code

\\<code>inline code\\</code>

\\<pre>
\\<code class="language-python">
def hello():
    print("Free!")
\\</code>
\\</pre>

---

## Blockquotes

\\<blockquote>quoted text\\</blockquote>

---

## Details / Collapsible

\\<details>
\\<summary>Title</summary>
Hidden content here
\\</details>

---

## Media Blocks

\\<tg-collage>
\\<img src="https://photo.jpg"/>
\\<figcaption>Caption\\<cite>Author\\</cite>\\</figcaption>
\\</tg-collage>

\\<tg-slideshow>
\\<img src="photo.jpg"/>
\\<video src="video.mp4"/>
\\<figcaption>Slideshow caption\\</figcaption>
\\</tg-slideshow>

\\<tg-map lat="35.6892" long="51.3890" zoom="12"/>

---

## Math

\\<tg-math-block>E = mc^2\\</tg-math-block>`;
