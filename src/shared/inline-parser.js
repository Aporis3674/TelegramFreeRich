/**
 * Inline parser — flattens the inline DOM of a block into styled text segments,
 * so bold/italic/spoiler/link runs survive the trip to the Telegram API instead
 * of being flattened to `textContent`.
 *
 * A segment is `{ text, marks[], href? }`; `block-serializer.js` turns segments
 * into nested `RichText*` objects.
 *
 * @module shared/inline-parser
 */

import { InlineType } from './block-types.js';
import { safeUrl } from './html-serializer.js';

/**
 * Tag name → inline mark. Kept in sync with the editor extensions.
 * @type {Record<string, string>}
 */
const TAG_TO_MARK = {
  STRONG: InlineType.BOLD,
  B: InlineType.BOLD,
  EM: InlineType.ITALIC,
  I: InlineType.ITALIC,
  U: InlineType.UNDERLINE,
  S: InlineType.STRIKETHROUGH,
  DEL: InlineType.STRIKETHROUGH,
  STRIKE: InlineType.STRIKETHROUGH,
  CODE: InlineType.CODE,
  MARK: InlineType.MARKED,
  SUB: InlineType.SUBSCRIPT,
  SUP: InlineType.SUPERSCRIPT,
  A: InlineType.LINK,
};

/**
 * Resolve the mark contributed by a single element, if any.
 * @param {Element} el
 * @returns {string|null}
 */
function markForElement(el) {
  if (el.tagName === 'SPAN') {
    if (el.hasAttribute('data-spoiler')) return InlineType.SPOILER;
    if (el.hasAttribute('data-inline-math')) return InlineType.MATH;
    return null;
  }
  return TAG_TO_MARK[el.tagName] || null;
}

/**
 * Auto-detected entity for a bare text run (mentions, hashtags, commands…).
 * Telegram detects these server-side, but reporting them keeps the preview and
 * the serialized payload honest about what the message contains.
 * @param {string} text
 * @returns {string|null}
 */
export function detectEntity(text) {
  if (/^@[A-Za-z0-9_]{4,}$/.test(text)) return InlineType.MENTION;
  if (/^#[^\s#]+$/.test(text)) return InlineType.HASHTAG;
  if (/^\/[A-Za-z0-9_]+$/.test(text)) return InlineType.BOT_COMMAND;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(text)) return InlineType.EMAIL;
  if (/^\+?\d[\d\s()-]{7,}$/.test(text)) return InlineType.PHONE;
  return null;
}

/**
 * Parse the inline content of a block element into styled segments.
 * @param {Element|null} root
 * @returns {Array<{ text: string, marks: string[], href?: string }>}
 */
export function parseInlineSegments(root) {
  /** @type {Array<{ text: string, marks: string[], href?: string }>} */
  const segments = [];

  /**
   * @param {Node} node
   * @param {string[]} marks
   * @param {string|undefined} href
   */
  function walk(node, marks, href) {
    for (const child of node.childNodes) {
      // Text node
      if (child.nodeType === 3) {
        const text = child.nodeValue || '';
        if (!text) continue;
        push(text, marks, href);
        continue;
      }
      if (child.nodeType !== 1) continue;

      // <br> becomes a newline inside the same block
      if (child.tagName === 'BR') {
        push('\n', marks, href);
        continue;
      }

      const mark = markForElement(child);
      const nextMarks = mark ? [...marks, mark] : marks;
      // Filtered with the serializer's own list, for two reasons. The preview
      // renders these segments as real <a href> elements inside the app window
      // — the window that holds the bot token — so a `javascript:` href here
      // would run there. And a scheme the message cannot carry has no business
      // looking like a working link in a preview of that message.
      const nextHref =
        child.tagName === 'A' ? safeUrl(child.getAttribute('href') || '') || href : href;
      walk(child, nextMarks, nextHref);
    }
  }

  /**
   * @param {string} text
   * @param {string[]} marks
   * @param {string|undefined} href
   */
  function push(text, marks, href) {
    const last = segments[segments.length - 1];
    if (
      last &&
      last.href === href &&
      last.marks.length === marks.length &&
      last.marks.every((m, i) => m === marks[i])
    ) {
      last.text += text;
      return;
    }
    const segment = { text, marks: [...marks] };
    if (href) segment.href = href;
    segments.push(segment);
  }

  if (root) walk(root, [], undefined);
  return segments.filter((segment) => segment.text.length > 0);
}

/**
 * Whether a segment list carries any formatting worth serializing.
 * @param {Array<{ marks: string[], href?: string }>} segments
 * @returns {boolean}
 */
export function hasFormatting(segments) {
  return segments.some((segment) => segment.marks.length > 0 || !!segment.href);
}

/**
 * Concatenate segments back into plain text.
 * @param {Array<{ text: string }>} segments
 * @returns {string}
 */
export function segmentsToText(segments) {
  return segments.map((segment) => segment.text).join('');
}
