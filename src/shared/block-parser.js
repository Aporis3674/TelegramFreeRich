/**
 * Block Parser — Converts DOM elements to Block State (JSON[]).
 * @module shared/block-parser
 */

import { BlockType } from './block-types.js';

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
};

/**
 * Parse a single block-level DOM element into a Block object.
 * @param {HTMLElement} el
 * @returns {object|null} Block object or null if unparseable.
 */
export function parseBlockElement(el) {
  const tag = el.tagName;
  const type = TAG_TO_BLOCK[tag];

  if (!type) {
    // Check for .tg-math div
    if (tag === 'DIV' && el.classList && el.classList.contains('tg-math')) {
      return { type: BlockType.MATH_BLOCK, text: el.textContent || '' };
    }
    return null;
  }

  switch (type) {
    case BlockType.DIVIDER:
      return { type: BlockType.DIVIDER };

    case BlockType.HEADING: {
      const level = parseInt(tag[1], 10);
      return {
        type: BlockType.HEADING,
        level,
        text: el.textContent || '',
      };
    }

    case BlockType.CODE_BLOCK: {
      const codeEl = el.querySelector('code');
      const langClass = (codeEl && codeEl.className) || '';
      const language = langClass.replace('language-', '').trim();
      return {
        type: BlockType.CODE_BLOCK,
        language,
        text: (codeEl || el).textContent || '',
      };
    }

    case BlockType.TABLE:
      return parseTable(el);

    case BlockType.LIST:
      return parseList(el);

    case BlockType.DETAILS:
      return parseDetails(el);

    default:
      // Generic text blocks: paragraph, blockquote, footer
      return {
        type,
        text: el.textContent || '',
      };
  }
}

/**
 * Parse all direct child elements of a container into Block[].
 * @param {HTMLElement} container
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
 * Parse a <table> element into a table Block.
 * @param {HTMLTableElement} el
 * @returns {object}
 */
function parseTable(el) {
  const rows = Array.from(el.querySelectorAll('tr'));
  if (rows.length === 0) return { type: BlockType.TABLE, header: [], rows: [] };

  const header = Array.from(rows[0].querySelectorAll('th, td')).map(
    (c) => c.textContent || ''
  );
  const bodyRows = rows.slice(1).map((tr) =>
    Array.from(tr.querySelectorAll('td')).map((c) => c.textContent || '')
  );
  return { type: BlockType.TABLE, header, rows: bodyRows };
}

/**
 * Parse a <ul> or <ol> element into a list Block.
 * @param {HTMLElement} el
 * @returns {object}
 */
function parseList(el) {
  const style = el.tagName === 'OL' ? 'numbered' : 'bullet';
  const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    if (checkbox) {
      return { text: li.textContent || '', done: checkbox.checked };
    }
    return { text: li.textContent || '' };
  });
  return { type: BlockType.LIST, style, items };
}

/**
 * Parse a <details> element into a details Block.
 * @param {HTMLDetailsElement} el
 * @returns {object}
 */
function parseDetails(el) {
  const summary = el.querySelector('summary');
  const summaryText = summary ? summary.textContent : '';
  // Get text content of everything except the summary
  const contentParts = [];
  for (const node of el.childNodes) {
    if (node !== summary && node.textContent) {
      contentParts.push(node.textContent);
    }
  }
  return {
    type: BlockType.DETAILS,
    summary: summaryText,
    content: contentParts.join(''),
  };
}
