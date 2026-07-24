/**
 * block-parser — Parse a contenteditable DOM subtree into Block objects.
 *
 * Walks the top-level children of the editor element and maps each HTML
 * element to a structured block. Inline formatting is preserved as
 * Markdown-escaped strings inside the block content.
 *
 * This parser is **pure / side-effect-free** — it only reads the DOM and
 * returns an array of block objects. It never mutates the DOM.
 *
 * @module block-parser
 */

'use strict';

/** Generate a short unique id for each parsed block. */
let _idCounter = 0;
function _uid() {
  return 'blk_' + Date.now().toString(36) + '_' + (++_idCounter).toString(36);
}

/* ------------------------------------------------------------------ */
/*  Block-element → block-type mapping                                */
/* ------------------------------------------------------------------ */

/**
 * Top-level element tag → block type.
 * @type {Object<string, string>}
 */
const BLOCK_MAP = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  p: 'paragraph',
  pre: 'code_block',
  blockquote: 'blockquote',
  ul: 'list',
  ol: 'list',
  table: 'table',
  hr: 'divider',
  details: 'details',
  img: 'photo',
  footer: 'footer',
};

/* ------------------------------------------------------------------ */
/*  Inline formatting extraction                                       */
/* ------------------------------------------------------------------ */

/**
 * Map HTML tag / attribute combinations to Markdown formatting.
 *
 * Each entry is a pair:
 *   [regexThatMatchesOpeningTag, replacementOpen, replacementClose]
 *
 * Processing is sequential and handles nesting (bold inside italic etc.)
 * by operating on the innermost HTML first (depth-first).
 *
 * @type {Array<{re: RegExp, open: string, close: string}>}
 */
const INLINE_RULES = [
  // Order matters — process nested tags before their parents.
  { re: /<code\b[^>]*>([\s\S]*?)<\/code>/gi,       open: '`',  close: '`'  },
  { re: /<strong\b[^>]*>([\s\S]*?)<\/strong>/gi,    open: '**', close: '**' },
  { re: /<b\b[^>]*>([\s\S]*?)<\/b>/gi,              open: '**', close: '**' },
  { re: /<em\b[^>]*>([\s\S]*?)<\/em>/gi,            open: '*',  close: '*'  },
  { re: /<i\b[^>]*>([\s\S]*?)<\/i>/gi,              open: '*',  close: '*'  },
  { re: /<u\b[^>]*>([\s\S]*?)<\/u>/gi,              open: '<u>', close: '</u>' },
  { re: /<s\b[^>]*>([\s\S]*?)<\/s>/gi,              open: '~~', close: '~~' },
  { re: /<del\b[^>]*>([\s\S]*?)<\/del>/gi,          open: '~~', close: '~~' },
  { re: /<mark\b[^>]*>([\s\S]*?)<\/mark>/gi,        open: '==', close: '==' },
  { re: /<sub\b[^>]*>([\s\S]*?)<\/sub>/gi,          open: '<sub>',  close: '</sub>'  },
  { re: /<sup\b[^>]*>([\s\S]*?)<\/sup>/gi,          open: '<sup>',  close: '</sup>'  },
  { re: /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,  open: null, close: null, isLink: true },
  { re: /<span\b[^>]*class="tg-spoiler"[^>]*>([\s\S]*?)<\/span>/gi, open: '||', close: '||' },
  { re: /<span\b[^>]*class="tg-math"[^>]*>([\s\S]*?)<\/span>/gi,   open: '$$',  close: '$$' },
];

/**
 * Convert HTML inline markup inside `html` to Markdown-flavored text.
 *
 * @param {string} html - Inner HTML of a single block element.
 * @returns {string} Markdown-like text with inline formatting.
 */
function _extractInlineFormatting(html) {
  let text = html;

  for (const rule of INLINE_RULES) {
    if (rule.isLink) {
      // Markdown link: [text](url)
      text = text.replace(rule.re, (_, href, inner) => {
        const innerText = _stripOuterTags(inner);
        return '[' + innerText + '](' + href + ')';
      });
    } else {
      text = text.replace(rule.re, (_, inner) => {
        const innerText = _stripOuterTags(inner);
        return rule.open + innerText + rule.close;
      });
    }
  }

  // Convert <br> to newlines.
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Decode HTML entities.
  text = _decodeEntities(text);

  return text.trim();
}

/**
 * Strip any remaining HTML tags from a string (used inside inline wrappers).
 * @param {string} s
 * @returns {string}
 * @private
 */
function _stripOuterTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

/**
 * Decode HTML entities using a temporary element.
 * @param {string} s
 * @returns {string}
 * @private
 */
function _decodeEntities(s) {
  // Works in both browser (DOM) and Node.js (heuristic fallback).
  if (typeof document !== 'undefined' && document.createElement) {
    const el = document.createElement('div');
    el.innerHTML = s;
    return el.textContent || '';
  }
  // Node.js fallback — decode the most common entities.
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/* ------------------------------------------------------------------ */
/*  Block-level parsers                                                */
/* ------------------------------------------------------------------ */

/**
 * Parse a heading element.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseHeading(el) {
  const level = parseInt(el.tagName[1], 10); // h1→1 … h6→6
  return {
    id: _uid(),
    type: 'heading',
    content: { level, text: _extractInlineFormatting(el.innerHTML) },
  };
}

/**
 * Parse a paragraph.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseParagraph(el) {
  return {
    id: _uid(),
    type: 'paragraph',
    content: _extractInlineFormatting(el.innerHTML),
  };
}

/**
 * Parse a <pre><code> block.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseCodeBlock(el) {
  const codeEl = el.querySelector('code');
  const raw = codeEl ? codeEl.textContent : el.textContent;
  let language = '';
  if (codeEl) {
    const m = (codeEl.className || '').match(/language-(\S+)/);
    if (m) language = m[1];
  }
  return {
    id: _uid(),
    type: 'code_block',
    content: { language, text: raw },
  };
}

/**
 * Parse a blockquote.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseBlockquote(el) {
  return {
    id: _uid(),
    type: 'blockquote',
    content: _extractInlineFormatting(el.innerHTML),
  };
}

/**
 * Parse a <ul> into a list block.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseBulletList(el) {
  const items = _parseListItems(el);
  return {
    id: _uid(),
    type: 'list',
    content: { style: 'bullet', items },
  };
}

/**
 * Parse an <ol> into a list block.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseNumberedList(el) {
  const items = _parseListItems(el);
  return {
    id: _uid(),
    type: 'list',
    content: { style: 'numbered', items },
  };
}

/**
 * Extract list items from a <ul> or <ol>.
 * @param {HTMLElement} el
 * @returns {Object[]}
 * @private
 */
function _parseListItems(el) {
  const items = [];
  for (const li of el.querySelectorAll(':scope > li')) {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const item = { text: _extractInlineFormatting(li.innerHTML) };
    if (checkbox) {
      item.checked = checkbox.hasAttribute('checked');
    }
    items.push(item);
  }
  return items;
}

/**
 * Parse a <table> into a structured table block.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseTable(el) {
  const rows = [];
  let hasHeader = false;
  for (const tr of el.querySelectorAll('tr')) {
    const cells = [];
    const isHeader = tr.querySelector('th') !== null;
    if (isHeader) hasHeader = true;
    const cellEls = tr.querySelectorAll('th, td');
    for (const td of cellEls) {
      cells.push(_extractInlineFormatting(td.innerHTML));
    }
    rows.push({ cells, isHeader });
  }
  return {
    id: _uid(),
    type: 'table',
    content: { rows, hasHeader },
  };
}

/**
 * Parse an <hr> into a divider block.
 * @returns {Object}
 * @private
 */
function _parseDivider() {
  return { id: _uid(), type: 'divider', content: '' };
}

/**
 * Parse a <details> element.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseDetails(el) {
  const summaryEl = el.querySelector('summary');
  const summary = summaryEl ? summaryEl.textContent : '';
  // Get body HTML after removing <summary>.
  let bodyHtml = el.innerHTML;
  if (summaryEl) {
    bodyHtml = bodyHtml.replace(summaryEl.outerHTML, '');
  }
  return {
    id: _uid(),
    type: 'details',
    content: { summary, body: _extractInlineFormatting(bodyHtml) },
  };
}

/**
 * Parse an <img> into a photo block.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parsePhoto(el) {
  return {
    id: _uid(),
    type: 'photo',
    content: {
      url: el.getAttribute('src') || '',
      caption: el.getAttribute('alt') || '',
    },
  };
}

/**
 * Parse a <footer> element.
 * @param {HTMLElement} el
 * @returns {Object}
 * @private
 */
function _parseFooter(el) {
  return {
    id: _uid(),
    type: 'footer',
    content: _extractInlineFormatting(el.innerHTML),
  };
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

/**
 * Parse the children of a contenteditable editor element into an ordered
 * array of block objects.
 *
 * Each **top-level element** in the editor is mapped to a block. Text
 * nodes, empty nodes, and unsupported elements are skipped.
 *
 * @param {HTMLElement} editorElement - The contenteditable container.
 * @returns {Object[]} Array of block objects: { id, type, content, children? }
 */
function parseDomToBlocks(editorElement) {
  const blocks = [];

  if (!editorElement || !editorElement.children) return blocks;

  for (const el of editorElement.children) {
    const tag = el.tagName.toLowerCase();

    // Skip non-element children and unsupported tags.
    if (el.nodeType !== 1) continue;

    // Handle block-level elements that have a direct mapping.
    const mappedType = BLOCK_MAP[tag];
    if (!mappedType) continue; // skip <div>, <span>, etc.

    let block;

    switch (tag) {
      case 'h1': case 'h2': case 'h3':
      case 'h4': case 'h5': case 'h6':
        block = _parseHeading(el);
        break;

      case 'p':
        block = _parseParagraph(el);
        break;

      case 'pre':
        block = _parseCodeBlock(el);
        break;

      case 'blockquote':
        block = _parseBlockquote(el);
        break;

      case 'ul':
        block = _parseBulletList(el);
        break;

      case 'ol':
        block = _parseNumberedList(el);
        break;

      case 'table':
        block = _parseTable(el);
        break;

      case 'hr':
        block = _parseDivider();
        break;

      case 'details':
        block = _parseDetails(el);
        break;

      case 'img':
        block = _parsePhoto(el);
        break;

      case 'footer':
        block = _parseFooter(el);
        break;

      default:
        // Should never reach here because of BLOCK_MAP guard, but just in case.
        continue;
    }

    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

module.exports = { parseDomToBlocks };
