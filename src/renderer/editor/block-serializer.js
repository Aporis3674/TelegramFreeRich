/**
 * block-serializer — Convert Block objects to Telegram Bot API format.
 *
 * Produces a `sendRichMessage`-compatible payload containing a Markdown
 * string built from the block array. Also exports a raw Markdown generator
 * (blockToMarkdown) for individual blocks.
 *
 * The serializer is the final stage: parse (DOM→Blocks) → manage → serialize (Blocks→API).
 *
 * @module block-serializer
 */

'use strict';

/* ------------------------------------------------------------------ */
/*  Individual block → Markdown                                        */
/* ------------------------------------------------------------------ */

/**
 * Serialize a single block object to Telegram Markdown V1 string.
 *
 * @param {Object} block - A block object { id, type, content }.
 * @returns {string} Markdown representation of the block (with trailing newline).
 */
function blockToMarkdown(block) {
  if (!block || !block.type) return '';

  switch (block.type) {
    case 'heading':
      return _headingToMd(block.content);

    case 'paragraph':
      return _paragraphToMd(block.content);

    case 'code_block':
      return _codeBlockToMd(block.content);

    case 'blockquote':
      return _blockquoteToMd(block.content);

    case 'list':
      return _listToMd(block.content);

    case 'table':
      return _tableToMd(block.content);

    case 'divider':
      return '---\n';

    case 'details':
      return _detailsToMd(block.content);

    case 'photo':
      return _photoToMd(block.content);

    case 'footer':
      return _footerToMd(block.content);

    default:
      // Unknown type — best-effort stringification.
      if (typeof block.content === 'string') return block.content + '\n';
      return '';
  }
}

/* ---- block-specific converters ---- */

/**
 * @param {Object|string} content - { level: number, text: string } or string
 * @returns {string}
 * @private
 */
function _headingToMd(content) {
  if (!content) return '';
  if (typeof content === 'string') return '### ' + content + '\n';
  const level = Math.min(Math.max(content.level || 1, 1), 6);
  const prefix = '#'.repeat(level);
  return prefix + ' ' + (content.text || '') + '\n';
}

/**
 * @param {string|Object} content
 * @returns {string}
 * @private
 */
function _paragraphToMd(content) {
  const text = typeof content === 'string' ? content : (content.text || '');
  return text + '\n';
}

/**
 * @param {Object|string} content - { language: string, text: string }
 * @returns {string}
 * @private
 */
function _codeBlockToMd(content) {
  if (!content) return '```\n```\n';
  if (typeof content === 'string') return '```\n' + content + '\n```\n';
  const lang = content.language || '';
  return '```' + lang + '\n' + (content.text || '') + '\n```\n';
}

/**
 * @param {string|Object} content
 * @returns {string}
 * @private
 */
function _blockquoteToMd(content) {
  const text = typeof content === 'string' ? content : (content.text || '');
  if (!text) return '';
  // Each line prefixed with "> ".
  return text.split('\n').map(line => '> ' + line).join('\n') + '\n';
}

/**
 * @param {Object} content - { style: 'bullet'|'numbered', items: [{text, checked?}] }
 * @returns {string}
 * @private
 */
function _listToMd(content) {
  if (!content || !Array.isArray(content.items)) return '';
  const style = content.style || 'bullet';
  return content.items.map((item, i) => {
    const text = typeof item === 'string' ? item : (item.text || '');
    if (style === 'numbered') {
      return (i + 1) + '. ' + text;
    }
    // Bullet or checklist.
    if (item && typeof item === 'object' && typeof item.checked === 'boolean') {
      return item.checked ? '- [x] ' + text : '- [ ] ' + text;
    }
    return '- ' + text;
  }).join('\n') + '\n';
}

/**
 * @param {Object} content - { rows: [{cells, isHeader}], hasHeader: boolean }
 * @returns {string}
 * @private
 */
function _tableToMd(content) {
  if (!content || !Array.isArray(content.rows) || content.rows.length === 0) return '';

  const lines = [];
  content.rows.forEach((row, ri) => {
    const cells = (row.cells || []).map(c => String(c));
    lines.push('| ' + cells.join(' | ') + ' |');
    // Add separator after the first (header) row.
    if (ri === 0 || (content.hasHeader && row.isHeader)) {
      lines.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    }
  });

  return lines.join('\n') + '\n';
}

/**
 * @param {Object|string} content - { summary: string, body: string }
 * @returns {string}
 * @private
 */
function _detailsToMd(content) {
  if (!content) return '';
  if (typeof content === 'string') return '<details>\n' + content + '\n</details>\n';
  const summary = content.summary || '';
  const body = content.body || '';
  return '<details>\n<summary>' + summary + '</summary>\n' + body + '\n</details>\n';
}

/**
 * @param {Object|string} content - { url: string, caption: string }
 * @returns {string}
 * @private
 */
function _photoToMd(content) {
  if (!content) return '';
  if (typeof content === 'string') return '![](' + content + ')\n';
  const url = content.url || '';
  const caption = content.caption || '';
  return '![' + caption + '](' + url + ')\n';
}

/**
 * @param {string|Object} content
 * @returns {string}
 * @private
 */
function _footerToMd(content) {
  const text = typeof content === 'string' ? content : (content.text || '');
  return '_' + text + '_\n';
}

/* ------------------------------------------------------------------ */
/*  Full array → API payload                                           */
/* ------------------------------------------------------------------ */

/**
 * Serialize an array of blocks into a Telegram Bot API `sendRichMessage`
 * compatible payload object.
 *
 * Returns an object with:
 * - `markdown`: the full MarkdownV1 string
 * - `blocks`: structured block data (for future rich block API)
 * - `parse_mode`: "MarkdownV1" (or "Markdown" for Bot API compat)
 *
 * @param {Object[]} blocks - Array of block objects (from block-parser or BlockManager).
 * @returns {{ markdown: string, blocks: Object[], parse_mode: string }}
 */
function serializeToApi(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { markdown: '', blocks: [], parse_mode: 'Markdown' };
  }

  const markdownParts = [];
  const apiBlocks = [];

  for (const block of blocks) {
    const md = blockToMarkdown(block);
    if (md) markdownParts.push(md);

    // Build a structured API block alongside the markdown.
    apiBlocks.push(_toApiBlock(block));
  }

  // Join and clean up excessive newlines.
  let markdown = markdownParts.join('\n');
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return {
    markdown,
    blocks: apiBlocks,
    parse_mode: 'Markdown',
  };
}

/**
 * Convert a block to its API-structured representation (non-markdown).
 * This parallels BlockManager.serialize() but works on raw block objects.
 *
 * @param {Object} block
 * @returns {Object}
 * @private
 */
function _toApiBlock(block) {
  if (!block) return {};

  switch (block.type) {
    case 'heading': {
      const content = block.content || {};
      return {
        type: 'heading',
        level: content.level || 1,
        text: content.text || (typeof content === 'string' ? content : ''),
      };
    }

    case 'paragraph':
      return { type: 'paragraph', text: typeof block.content === 'string' ? block.content : '' };

    case 'code_block': {
      const c = block.content || {};
      return {
        type: 'code_block',
        language: c.language || '',
        text: c.text || '',
      };
    }

    case 'blockquote':
      return { type: 'blockquote', text: typeof block.content === 'string' ? block.content : '' };

    case 'list': {
      const c = block.content || {};
      return {
        type: 'list',
        style: c.style || 'bullet',
        items: c.items || [],
      };
    }

    case 'table': {
      const c = block.content || {};
      return {
        type: 'table',
        rows: c.rows || [],
        has_header: c.hasHeader || false,
      };
    }

    case 'divider':
      return { type: 'divider' };

    case 'details': {
      const c = block.content || {};
      return {
        type: 'details',
        summary: c.summary || '',
        body: c.body || '',
      };
    }

    case 'photo': {
      const c = block.content || {};
      return {
        type: 'photo',
        url: c.url || '',
        caption: c.caption || '',
      };
    }

    case 'footer':
      return { type: 'footer', text: typeof block.content === 'string' ? block.content : '' };

    default:
      return { type: block.type, content: block.content };
  }
}

/* ------------------------------------------------------------------ */
/*  HTML fallback (inline with htmlToMarkdown approach)                 */
/* ------------------------------------------------------------------ */

/**
 * Fallback: serialize HTML directly to Markdown using regex replacement
 * (mirrors the existing htmlToMarkdown() in app.js but as a standalone function).
 *
 * Use this when you have raw HTML and want a quick Markdown conversion
 * without going through the block parser first.
 *
 * @param {string} html - Raw HTML string.
 * @returns {string} Telegram Markdown V1 string.
 */
function htmlToMarkdownFallback(html) {
  let md = html;

  // Headings.
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n');

  // Blockquote.
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gis, (_, inner) =>
    inner.split('\n').map(l => '> ' + l.replace(/<[^>]+>/g, '')).join('\n') + '\n'
  );

  // Code block.
  md = md.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) =>
    '```\n' + _decodeEntities(code.trim()) + '\n```\n'
  );

  // Horizontal rule.
  md = md.replace(/<hr\s*\/?>/gi, '---\n');

  // Details.
  md = md.replace(/<details[^>]*><summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
    '<details><summary>$1</summary>\n$2\n</details>\n'
  );

  // Math div.
  md = md.replace(/<div\s+class="tg-math"[^>]*>\$\$([\s\S]*?)\$\$<\/div>/gi, '$$$$1$$\n');

  // Bullet list.
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    const lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!lis) return '';
    return lis.map(li => {
      const text = li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '');
      const checked = li.includes('checked');
      return checked ? '- [x] ' + text : '- ' + text;
    }).join('\n') + '\n';
  });

  // Numbered list.
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    const lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!lis) return '';
    return lis.map((li, i) =>
      (i + 1) + '. ' + li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '')
    ).join('\n') + '\n';
  });

  // Table.
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, table) => {
    const rows = [];
    const trs = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trs) return '';
    trs.forEach((tr, ri) => {
      const cells = [];
      const regex = ri === 0 ? /<th[^>]*>([\s\S]*?)<\/th>/gi : /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let m;
      while ((m = regex.exec(tr)) !== null) cells.push(m[1].replace(/<[^>]+>/g, ''));
      rows.push('| ' + cells.join(' | ') + ' |');
      if (ri === 0) rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    });
    return rows.join('\n') + '\n';
  });

  // Inline formatting.
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  md = md.replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>');
  md = md.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<span\s+class="tg-spoiler">([\s\S]*?)<\/span>/gi, '||$1||');
  md = md.replace(/<sub>([\s\S]*?)<\/sub>/gi, '<sub>$1</sub>');
  md = md.replace(/<sup>([\s\S]*?)<\/sup>/gi, '<sup>$1</sup>');
  md = md.replace(/<mark>([\s\S]*?)<\/mark>/gi, '==$1==');
  md = md.replace(/<span\s+class="tg-math">([\s\S]*?)<\/span>/gi, '$$$$1$$');
  md = md.replace(/<footer>([\s\S]*?)<\/footer>/gi, '_$1_');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Structural cleanup.
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');

  md = _decodeEntities(md);
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

/**
 * Decode HTML entities.
 * @param {string} s
 * @returns {string}
 * @private
 */
function _decodeEntities(s) {
  if (typeof document !== 'undefined' && document.createElement) {
    const el = document.createElement('div');
    el.innerHTML = s;
    return el.textContent || '';
  }
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

module.exports = { serializeToApi, blockToMarkdown, htmlToMarkdownFallback };
