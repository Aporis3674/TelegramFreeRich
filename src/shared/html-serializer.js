/**
 * HTML serializer — turns the editor's DOM into the *Rich HTML style* that
 * `InputRichMessage.html` accepts.
 *
 * This is the wire format Bot API 10.1 actually documents for sending:
 *
 *   sendRichMessage → rich_message: { html | markdown, is_rtl?, skip_entity_detection? }
 *
 * Exactly one of `html` / `markdown` may be present, and there is no `blocks`
 * array on the sending side — `RichMessage.blocks` is what a bot *receives* back
 * inside `Message.rich_message`.
 *
 * Everything not in the documented tag list is unwrapped or dropped, so the
 * payload can never carry markup Telegram would reject.
 *
 * @module shared/html-serializer
 */

/* global DOMParser */

/** Documented limits for a single rich message. */
export const LIMITS = Object.freeze({
  CHARS: 32768,
  BLOCKS: 500,
  MEDIA: 50,
  TABLE_COLUMNS: 20,
  MAP_ZOOM_MIN: 13,
  MAP_ZOOM_MAX: 20,
  CHECKLIST_TASKS: 30,
  CHECKLIST_TASK_CHARS: 100,
});

/** Inline tags that map straight through, editor tag → API tag. */
const INLINE_MAP = {
  STRONG: 'b',
  B: 'b',
  EM: 'i',
  I: 'i',
  U: 'u',
  INS: 'u',
  S: 's',
  DEL: 's',
  STRIKE: 's',
  CODE: 'code',
  MARK: 'mark',
  SUB: 'sub',
  SUP: 'sup',
};

/** Block tags that map straight through. */
const BLOCK_MAP = {
  P: 'p',
  H1: 'h1',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  FOOTER: 'footer',
  UL: 'ul',
  OL: 'ol',
  LI: 'li',
};

/** URL schemes allowed on links, and the stricter set allowed on media. */
const LINK_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:', 'tg:'];
const MEDIA_SCHEMES = ['http:', 'https:'];

/**
 * Escape text for HTML output.
 * @param {string} text
 * @returns {string}
 */
export function escapeText(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape a value for use inside a double-quoted attribute.
 * @param {string} value
 * @returns {string}
 */
function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}

/**
 * Keep a URL only when its scheme is allowed.
 * @param {string} raw
 * @param {string[]} schemes
 * @returns {string} The URL, or '' when it is not acceptable.
 */
export function safeUrl(raw, schemes = LINK_SCHEMES) {
  const url = String(raw || '').trim();
  if (!url) return '';
  // In-document anchors are addresses, not schemes.
  if (schemes === LINK_SCHEMES && url.startsWith('#')) return url;
  const scheme = (url.match(/^([a-zA-Z][\w+.-]*:)/) || [])[1];
  if (!scheme) return '';
  return schemes.includes(scheme.toLowerCase()) ? url : '';
}

/**
 * Serialize the editor's HTML into Telegram's Rich HTML.
 *
 * Task lists have two destinations, and `inlineChecklist` picks between them:
 *
 *  - **on** (the normal case) — the task list is written into the message body
 *    as Rich HTML's own `<li><input type="checkbox">` list. Works in any chat,
 *    channels included, and keeps the checked state.
 *  - **off** — the items are lifted out of the body and returned separately for
 *    `sendChecklist`, Telegram's *interactive* checklist. That method only works
 *    for a bot acting for a connected business account in a private chat.
 *
 * Either way the items are reported, so the caller knows what it is sending.
 *
 * @param {string} editorHtml - `editor.getHTML()` output.
 * @param {object} [options]
 * @param {(html: string) => Document} [options.parse] - Injected for tests.
 * @param {boolean} [options.inlineChecklist] - Render task lists into the body.
 * @returns {{
 *   html: string,
 *   checklist: Array<{ text: string, done: boolean }>,
 *   inlinedChecklist: boolean,
 *   blocks: number,
 *   media: number,
 *   chars: number,
 * }}
 */
export function serializeEditorHtml(editorHtml, options = {}) {
  const parse =
    options.parse || ((html) => new DOMParser().parseFromString(html, 'text/html'));
  const doc = parse(`<div id="tfr-root">${editorHtml || ''}</div>`);
  const root = doc.getElementById
    ? doc.getElementById('tfr-root')
    : doc.body && doc.body.firstChild;

  const state = {
    blocks: 0,
    media: 0,
    checklist: [],
    inlineChecklist: !!options.inlineChecklist,
  };
  const html = root ? childrenToHtml(root, state) : '';
  const text = root ? root.textContent || '' : '';

  return {
    html: html.trim(),
    checklist: state.checklist,
    inlinedChecklist: state.inlineChecklist && state.checklist.length > 0,
    blocks: state.blocks,
    media: state.media,
    chars: text.length,
  };
}

/**
 * @param {Element} parent
 * @param {object} state
 * @param {boolean} [inlineOnly] - Table cells accept inline formatting only.
 * @returns {string}
 */
function childrenToHtml(parent, state, inlineOnly = false) {
  let out = '';
  for (const node of parent.childNodes) out += nodeToHtml(node, state, inlineOnly);
  return out;
}

/**
 * @param {Node} node
 * @param {object} state
 * @param {boolean} inlineOnly
 * @returns {string}
 */
function nodeToHtml(node, state, inlineOnly) {
  if (node.nodeType === 3) return escapeText(node.nodeValue || '');
  if (node.nodeType !== 1) return '';

  const el = /** @type {Element} */ (node);
  const tag = el.tagName;

  // ── inline ──
  if (INLINE_MAP[tag]) {
    // <code> inside <pre> is handled by the PRE branch.
    const inner = childrenToHtml(el, state, inlineOnly);
    return inner ? `<${INLINE_MAP[tag]}>${inner}</${INLINE_MAP[tag]}>` : '';
  }

  if (tag === 'BR') return '\n';

  if (tag === 'A') {
    const href = safeUrl(el.getAttribute('href') || '');
    const inner = childrenToHtml(el, state, inlineOnly);
    if (!inner) return '';
    return href ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner;
  }

  if (tag === 'SPAN') {
    const inner = childrenToHtml(el, state, inlineOnly);
    if (el.hasAttribute('data-spoiler')) return `<tg-spoiler>${inner}</tg-spoiler>`;
    if (el.hasAttribute('data-inline-math')) return `<tg-math>${inner}</tg-math>`;
    return inner;
  }

  // Inside a table cell nothing below this point is allowed — unwrap it.
  if (inlineOnly) return childrenToHtml(el, state, true);

  // ── blocks ──
  if (BLOCK_MAP[tag]) {
    if (tag === 'UL' && isTaskList(el)) {
      const before = state.checklist.length;
      collectChecklist(el, state);
      if (!state.inlineChecklist) return '';
      return checklistToHtml(state.checklist.slice(before), state);
    }
    state.blocks += 1;
    // A list item holding a single paragraph reads better without the wrapper.
    const source = tag === 'LI' ? unwrapLoneParagraph(el) : el;
    const inner = childrenToHtml(source, state);
    if (!inner.trim() && tag !== 'LI') return '';
    const name = BLOCK_MAP[tag];
    const start = tag === 'OL' && el.getAttribute('start') ? ` start="${escapeAttr(el.getAttribute('start'))}"` : '';
    return `<${name}${start}>${inner}</${name}>`;
  }

  if (tag === 'HR') {
    state.blocks += 1;
    return '<hr/>';
  }

  if (tag === 'BLOCKQUOTE') {
    state.blocks += 1;
    const inner = childrenToHtml(el, state);
    const credit = el.getAttribute('data-attribution');
    const cite = credit ? `<cite>${escapeText(credit)}</cite>` : '';
    // A pull quote is <aside> in the API dialect.
    return el.hasAttribute('data-pullquote')
      ? `<aside>${inner}${cite}</aside>`
      : `<blockquote>${inner}${cite}</blockquote>`;
  }

  if (tag === 'PRE') {
    state.blocks += 1;
    const codeEl = el.querySelector('code');
    const language = (((codeEl && codeEl.className) || '').match(/language-([\w+#-]+)/) || [])[1];
    const body = escapeText((codeEl || el).textContent || '');
    return language
      ? `<pre><code class="language-${escapeAttr(language)}">${body}</code></pre>`
      : `<pre>${body}</pre>`;
  }

  if (tag === 'TABLE') return tableToHtml(el, state);

  if (tag === 'DETAILS') {
    state.blocks += 1;
    const summaryEl = el.querySelector('summary');
    const summary = escapeText(
      (summaryEl && summaryEl.textContent) || el.getAttribute('data-summary') || 'Details',
    );
    let inner = '';
    for (const child of el.childNodes) {
      if (child === summaryEl) continue;
      inner += nodeToHtml(child, state, false);
    }
    return `<details open><summary>${summary}</summary>${inner}</details>`;
  }

  if (tag === 'IMG') {
    const src = safeUrl(el.getAttribute('src') || '', MEDIA_SCHEMES);
    if (!src) return '';
    state.blocks += 1;
    state.media += 1;
    return `<img src="${escapeAttr(src)}"/>`;
  }

  if (tag === 'VIDEO' || tag === 'AUDIO') {
    const src = safeUrl(el.getAttribute('src') || '', MEDIA_SCHEMES);
    if (!src) return '';
    state.blocks += 1;
    state.media += 1;
    const name = tag.toLowerCase();
    return `<${name} src="${escapeAttr(src)}"></${name}>`;
  }

  if (tag === 'DIV' && el.classList) {
    if (el.classList.contains('tg-math')) {
      state.blocks += 1;
      const formula = el.getAttribute('data-formula') || (el.textContent || '').replace(/^\$\$|\$\$$/g, '');
      return `<tg-math-block>${escapeText(formula)}</tg-math-block>`;
    }
    if (el.classList.contains('tg-gallery')) return galleryToHtml(el, state);
    if (el.classList.contains('tg-map')) {
      const lat = parseFloat(el.getAttribute('data-lat'));
      const lon = parseFloat(el.getAttribute('data-lon'));
      if (Number.isNaN(lat) || Number.isNaN(lon)) return '';
      state.blocks += 1;
      return `<tg-map lat="${lat}" long="${lon}" zoom="${LIMITS.MAP_ZOOM_MIN}"/>`;
    }
  }

  // Anything else: keep the content, drop the wrapper.
  return childrenToHtml(el, state, inlineOnly);
}

/**
 * A list item whose only child is a paragraph renders as bare text.
 * @param {Element} li
 * @returns {Element}
 */
function unwrapLoneParagraph(li) {
  const children = Array.from(li.children);
  if (children.length === 1 && children[0].tagName === 'P') return children[0];
  return li;
}

/**
 * @param {Element} el
 * @returns {boolean}
 */
function isTaskList(el) {
  if (el.getAttribute('data-type') === 'taskList') return true;
  const items = el.querySelectorAll('li');
  for (const li of items) {
    if (li.querySelector('input[type="checkbox"]') || li.hasAttribute('data-checked')) return true;
  }
  return false;
}

/**
 * Pull task items out of the document for the separate checklist API.
 * @param {Element} el
 * @param {object} state
 */
function collectChecklist(el, state) {
  for (const li of el.querySelectorAll(':scope > li')) {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const done = checkbox
      ? checkbox.checked || checkbox.getAttribute('checked') !== null
      : li.getAttribute('data-checked') === 'true';
    const text = (li.textContent || '').trim();
    if (text) state.checklist.push({ text, done: !!done });
  }
}

/**
 * Render collected task items as Rich HTML's own task list.
 *
 * A list item holding `<input type="checkbox">` is part of the documented Rich
 * HTML vocabulary, so Telegram draws real checkboxes — in a channel, a group or
 * a private chat alike, with the checked state preserved. This is the ordinary
 * way to put a checklist in a message; `sendChecklist` is the separate,
 * business-account-only *interactive* checklist.
 *
 * @param {Array<{ text: string, done: boolean }>} items
 * @param {object} state
 * @returns {string}
 */
function checklistToHtml(items, state) {
  if (!items.length) return '';
  state.blocks += 1 + items.length;
  const rows = items
    .map(
      (item) =>
        `<li><input type="checkbox"${item.done ? ' checked' : ''}>${escapeText(item.text)}</li>`,
    )
    .join('');
  return `<ul>${rows}</ul>`;
}

/**
 * @param {Element} el
 * @param {object} state
 * @returns {string}
 */
function tableToHtml(el, state) {
  const rows = Array.from(el.querySelectorAll('tr'));
  if (!rows.length) return '';
  state.blocks += 1;

  let body = '';
  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll('th, td')).slice(0, LIMITS.TABLE_COLUMNS);
    if (!cells.length) continue;
    let row = '';
    for (const cell of cells) {
      const name = cell.tagName === 'TH' ? 'th' : 'td';
      // Table cells carry inline formatting only.
      row += `<${name}>${childrenToHtml(cell, state, true)}</${name}>`;
    }
    body += `<tr>${row}</tr>`;
  }
  return body ? `<table bordered>${body}</table>` : '';
}

/**
 * @param {Element} el
 * @param {object} state
 * @returns {string}
 */
function galleryToHtml(el, state) {
  const attr = el.getAttribute('data-images') || '';
  const listed = attr.split(',').filter(Boolean);
  const sources = (
    listed.length
      ? listed
      : Array.from(el.querySelectorAll('img')).map((img) => img.getAttribute('src') || '')
  )
    .map((src) => safeUrl(src, MEDIA_SCHEMES))
    .filter(Boolean);

  if (!sources.length) return '';
  const wrapper = el.getAttribute('data-kind') === 'collage' ? 'tg-collage' : 'tg-slideshow';
  state.blocks += 1;
  state.media += sources.length;
  const images = sources.map((src) => `<img src="${escapeAttr(src)}"/>`).join('');
  return `<${wrapper}>${images}</${wrapper}>`;
}

/* ═══════════════════════════ Request bodies ═══════════════════════════ */

/**
 * Build the `InputRichMessage` object.
 * @param {string} html
 * @param {{ isRtl?: boolean, skipEntityDetection?: boolean }} [options]
 * @returns {object}
 */
export function buildInputRichMessage(html, options = {}) {
  const richMessage = { html };
  if (options.isRtl) richMessage.is_rtl = true;
  if (options.skipEntityDetection) richMessage.skip_entity_detection = true;
  return richMessage;
}

/**
 * Body for `sendRichMessage`.
 * @param {string} html
 * @param {string} chatId
 * @param {object} [options]
 * @returns {object}
 */
export function buildRichMessageBody(html, chatId, options = {}) {
  return { chat_id: chatId, rich_message: buildInputRichMessage(html, options) };
}

/**
 * Body for `sendRichMessageDraft`.
 * Drafts are private-chat only and need a non-zero draft_id.
 * @param {string} html
 * @param {string|number} chatId
 * @param {number} draftId
 * @param {object} [options]
 * @returns {object}
 */
export function buildDraftBody(html, chatId, draftId, options = {}) {
  return {
    chat_id: Number(chatId),
    draft_id: draftId,
    rich_message: buildInputRichMessage(html, options),
  };
}

/**
 * Body for `editMessageText` with rich content.
 * @param {string} html
 * @param {string} chatId
 * @param {string|number} messageId
 * @param {object} [options]
 * @returns {object}
 */
export function buildEditBody(html, chatId, messageId, options = {}) {
  return {
    chat_id: chatId,
    message_id: Number(messageId) || messageId,
    rich_message: buildInputRichMessage(html, options),
  };
}

/**
 * Body for `sendChecklist`.
 *
 * `InputChecklist` is `{ title, tasks }`, and each `InputChecklistTask` is
 * `{ id, text }` with a positive id unique within the checklist. There is no
 * per-task "done" flag on the sending side — a task can only be ticked
 * afterwards, through `markChecklistTasksAsDone` — so `done` is dropped here.
 *
 * `business_connection_id` is required by the method: a checklist is always
 * sent on behalf of a connected business account.
 *
 * @param {Array<{ text: string, done: boolean }>} items
 * @param {string} chatId
 * @param {{ title?: string, businessConnectionId?: string }} [options]
 * @returns {object}
 */
export function buildChecklistBody(items, chatId, options = {}) {
  const body = {
    chat_id: chatId,
    checklist: {
      title: options.title || '',
      tasks: (items || []).slice(0, LIMITS.CHECKLIST_TASKS).map((item, index) => ({
        id: index + 1,
        text: (item.text || '').slice(0, LIMITS.CHECKLIST_TASK_CHARS),
      })),
    },
  };
  if (options.businessConnectionId) {
    body.business_connection_id = options.businessConnectionId;
  }
  return body;
}

/**
 * Check a checklist against the documented limits before sending.
 * @param {Array<{ text: string }>} items
 * @returns {{ ok: boolean, reason?: 'empty'|'tasks'|'taskChars' }}
 */
export function checkChecklist(items) {
  const list = items || [];
  if (list.length === 0) return { ok: false, reason: 'empty' };
  if (list.length > LIMITS.CHECKLIST_TASKS) return { ok: false, reason: 'tasks' };
  for (const item of list) {
    if ((item.text || '').length > LIMITS.CHECKLIST_TASK_CHARS) {
      return { ok: false, reason: 'taskChars' };
    }
  }
  return { ok: true };
}

/**
 * Check a serialized message against the documented limits.
 * @param {{ chars: number, blocks: number, media: number }} stats
 * @returns {{ ok: boolean, reason?: 'chars'|'blocks'|'media' }}
 */
export function checkLimits(stats) {
  if (stats.chars > LIMITS.CHARS) return { ok: false, reason: 'chars' };
  if (stats.blocks > LIMITS.BLOCKS) return { ok: false, reason: 'blocks' };
  if (stats.media > LIMITS.MEDIA) return { ok: false, reason: 'media' };
  return { ok: true };
}

/**
 * Whether a chat ID addresses a private chat (drafts require one).
 * @param {string} chatId
 * @returns {boolean}
 */
export function isPrivateChatId(chatId) {
  return /^\d+$/.test(String(chatId || '').trim());
}
