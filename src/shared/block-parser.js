/**
 * Block Parser — converts the editor DOM into Block State (JSON[]).
 *
 * Every block keeps both a plain `text` string (backwards compatible, used for
 * previews and simple sends) and an `inline` segment list carrying the bold /
 * italic / spoiler / link runs, which the serializer turns into `RichText*`.
 *
 * @module shared/block-parser
 */

import { BlockType } from './block-types.js';
import { hasFormatting, parseInlineSegments, segmentsToText } from './inline-parser.js';
import { MEDIA_SCHEMES, safeUrl } from './html-serializer.js';

/** Media the message cannot carry should not render in a preview of it. */
const mediaUrl = (raw) => safeUrl(raw || '', MEDIA_SCHEMES);

/**
 * Map of DOM tag names to BlockType constants.
 * @type {Record<string, string>}
 */
const TAG_TO_BLOCK = {
  P: BlockType.PARAGRAPH,
  H1: BlockType.HEADING,
  H2: BlockType.HEADING,
  H3: BlockType.HEADING,
  H4: BlockType.HEADING,
  H5: BlockType.HEADING,
  H6: BlockType.HEADING,
  BLOCKQUOTE: BlockType.BLOCKQUOTE,
  PRE: BlockType.CODE_BLOCK,
  HR: BlockType.DIVIDER,
  UL: BlockType.LIST,
  OL: BlockType.LIST,
  TABLE: BlockType.TABLE,
  DETAILS: BlockType.DETAILS,
  FOOTER: BlockType.FOOTER,
  IMG: BlockType.PHOTO,
  VIDEO: BlockType.VIDEO,
  AUDIO: BlockType.AUDIO,
};

/**
 * Build the `{ text, inline? }` pair for a text-bearing element.
 * @param {Element} el
 * @returns {{ text: string, inline?: Array<object> }}
 */
function textContentOf(el) {
  const segments = parseInlineSegments(el);
  const text = segments.length ? segmentsToText(segments) : el.textContent || '';
  return hasFormatting(segments) ? { text, inline: segments } : { text };
}

/**
 * Parse a single block-level DOM element into a Block object.
 * @param {Element} el
 * @returns {object|null} Block object, or null when the element is not a block.
 */
export function parseBlockElement(el) {
  const tag = el.tagName;

  // Custom DIV-based blocks emitted by the editor extensions.
  if (tag === 'DIV' && el.classList) {
    if (el.classList.contains('tg-math')) {
      return {
        type: BlockType.MATH_BLOCK,
        text: (el.getAttribute('data-formula') || el.textContent || '').replace(
          /^\$\$|\$\$$/g,
          '',
        ),
      };
    }
    if (el.classList.contains('tg-gallery')) return parseGallery(el);
    if (el.classList.contains('tg-map')) {
      return {
        type: BlockType.MAP,
        latitude: parseFloat(el.getAttribute('data-lat')) || 0,
        longitude: parseFloat(el.getAttribute('data-lon')) || 0,
      };
    }
    return null;
  }

  const type = TAG_TO_BLOCK[tag];
  if (!type) return null;

  switch (type) {
    case BlockType.DIVIDER:
      return { type: BlockType.DIVIDER };

    case BlockType.HEADING:
      return {
        type: BlockType.HEADING,
        level: parseInt(tag[1], 10),
        ...textContentOf(el),
      };

    // Both quote kinds may name a source — Rich HTML puts it in a <cite>.
    case BlockType.BLOCKQUOTE:
      return {
        type: el.hasAttribute('data-pullquote') ? BlockType.PULLQUOTE : BlockType.BLOCKQUOTE,
        attribution: el.getAttribute('data-attribution') || '',
        ...textContentOf(el),
      };

    case BlockType.CODE_BLOCK: {
      const codeEl = el.querySelector('code');
      const langClass = (codeEl && codeEl.className) || '';
      const match = langClass.match(/language-([\w+#-]+)/);
      return {
        type: BlockType.CODE_BLOCK,
        language: match ? match[1] : '',
        text: (codeEl || el).textContent || '',
      };
    }

    // A caption travels as data-caption, with an optional data-credit that
    // becomes the <cite> inside the <figcaption>.
    case BlockType.PHOTO:
      return {
        type: BlockType.PHOTO,
        url: mediaUrl(el.getAttribute('src')),
        caption: el.getAttribute('data-caption') || el.getAttribute('alt') || '',
        credit: el.getAttribute('data-credit') || '',
      };

    case BlockType.VIDEO:
    case BlockType.AUDIO:
      return {
        type,
        url: mediaUrl(el.getAttribute('src')),
        caption: el.getAttribute('data-caption') || '',
        credit: el.getAttribute('data-credit') || '',
      };

    case BlockType.TABLE:
      return parseTable(el);

    case BlockType.LIST:
      return parseList(el);

    case BlockType.DETAILS:
      return parseDetails(el);

    default:
      // paragraph, footer
      return { type, ...textContentOf(el) };
  }
}

/**
 * Parse all direct child elements of a container into Block[].
 * @param {Element} container
 * @returns {object[]}
 */
export function parseAllBlocks(container) {
  if (!container || !container.children) return [];
  const blocks = [];
  for (const child of container.children) {
    const block = parseBlockElement(child);
    if (block) blocks.push(block);
  }
  return blocks;
}

/**
 * Parse a `<table>` element into a table Block.
 * @param {Element} el
 * @returns {object}
 */
function parseTable(el) {
  const rows = Array.from(el.querySelectorAll('tr'));
  if (rows.length === 0) return { type: BlockType.TABLE, header: [], rows: [] };

  const header = Array.from(rows[0].querySelectorAll('th, td')).map((c) => c.textContent || '');
  const bodyRows = rows
    .slice(1)
    .map((tr) => Array.from(tr.querySelectorAll('td')).map((c) => c.textContent || ''));
  return { type: BlockType.TABLE, header, rows: bodyRows };
}

/**
 * Parse a `<ul>` / `<ol>` element into a list or checklist Block.
 * Task lists (checkboxes) become CHECKLIST, which is sent through the separate
 * `sendChecklist` API rather than inside the rich message.
 * @param {Element} el
 * @returns {object}
 */
function parseList(el) {
  const items = Array.from(el.querySelectorAll(':scope > li'));
  const isChecklist =
    el.getAttribute('data-type') === 'taskList' ||
    items.some(
      (li) => li.querySelector('input[type="checkbox"]') || li.hasAttribute('data-checked'),
    );

  if (isChecklist) {
    return {
      type: BlockType.CHECKLIST,
      items: items.map((li) => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const done = checkbox
          ? checkbox.checked || checkbox.getAttribute('checked') !== null
          : li.getAttribute('data-checked') === 'true';
        return { text: (li.textContent || '').trim(), done: !!done };
      }),
    };
  }

  return {
    type: BlockType.LIST,
    style: el.tagName === 'OL' ? 'numbered' : 'bullet',
    items: items.map((li) => ({ text: li.textContent || '' })),
  };
}

/**
 * Parse a `<details>` element into a details Block.
 * @param {Element} el
 * @returns {object}
 */
function parseDetails(el) {
  const summary = el.querySelector('summary');
  const summaryText = summary ? summary.textContent || '' : el.getAttribute('data-summary') || '';
  const contentParts = [];
  for (const node of el.childNodes) {
    if (node === summary) continue;
    const text = node.textContent;
    if (text) contentParts.push(text);
  }
  return {
    type: BlockType.DETAILS,
    summary: summaryText,
    content: contentParts.join('').trim(),
  };
}

/**
 * Parse a gallery `<div>` into a slideshow or collage Block.
 * @param {Element} el
 * @returns {object}
 */
function parseGallery(el) {
  const attr = el.getAttribute('data-images') || '';
  const fromAttr = attr.split(',').filter(Boolean);
  const images = (
    fromAttr.length
      ? fromAttr
      : Array.from(el.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  )
    .map(mediaUrl)
    .filter(Boolean);
  const kind = el.getAttribute('data-kind') === 'collage' ? BlockType.COLLAGE : BlockType.SLIDESHOW;
  return {
    type: kind,
    images,
    caption: el.getAttribute('data-caption') || '',
    credit: el.getAttribute('data-credit') || '',
  };
}
