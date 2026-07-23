/**
 * domToMarkdown - Converts contenteditable DOM to Telegram-rich markdown.
 *
 * Supports all verified conversion rules.
 */

export default function domToMarkdown(root) {
  const blocks = [];
  footnoteCounter = 0;
  footnotes = [];
  walk(root, blocks, {});
  // Append footnotes at end
  if (footnotes.length) {
    blocks.push('\n');
    footnotes.forEach(fn => {
      blocks.push(`\n[^${fn.id}]: ${fn.text}\n`);
    });
  }
  return blocks.join('').replace(/\n{3,}/g, '\n\n').trim();
}

function walk(node, blocks, state) {
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (text) {
      blocks.push(escapeMarkdown(text));
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node;
  const tag = el.tagName.toLowerCase();
  const cls = el.className || '';

  // --- Inline elements ---

  // Bold
  if (tag === 'b' || tag === 'strong') {
    const inner = extractText(el);
    blocks.push(inner ? `*${inner}*` : '');
    return;
  }

  // Italic
  if (tag === 'i' || tag === 'em') {
    const inner = extractText(el);
    blocks.push(inner ? `_${inner}_` : '');
    return;
  }

  // Underline (passthrough HTML)
  if (tag === 'u') {
    const inner = extractText(el);
    blocks.push(inner ? `<u>${inner}</u>` : '');
    return;
  }

  // Strike
  if (tag === 's' || tag === 'strike' || tag === 'del') {
    const inner = extractText(el);
    blocks.push(inner ? `~${inner}~` : '');
    return;
  }

  // Inline code
  if (tag === 'code') {
    const inner = extractText(el);
    blocks.push(inner ? `\`${inner}\`` : '');
    return;
  }

  // Mark / highlight
  if (tag === 'mark') {
    const inner = extractText(el);
    blocks.push(inner ? `==${inner}==` : '');
    return;
  }

  // Spoiler
  if (cls.includes('tg-spoiler')) {
    const inner = extractText(el);
    blocks.push(inner ? `||${inner}||` : '');
    return;
  }

  // Subscript
  if (tag === 'sub') {
    const inner = extractText(el);
    blocks.push(inner ? `<sub>${inner}</sub>` : '');
    return;
  }

  // Superscript
  if (tag === 'sup') {
    const inner = extractText(el);
    // Check if this is a footnote reference
    if (cls.includes('footnote') || el.getAttribute('data-fn')) {
      const fnId = el.getAttribute('data-fn') || inner.replace(/[[\]^]/g, '');
      blocks.push(`[^${fnId}]`);
      return;
    }
    blocks.push(inner ? `<sup>${inner}</sup>` : '');
    return;
  }

  // tg-math inline
  if (cls.includes('tg-math') && tag === 'span') {
    const inner = extractText(el);
    blocks.push(inner ? `$${inner}$` : '');
    return;
  }

  // tg-math-block
  if (cls.includes('tg-math-block') && tag === 'div') {
    const inner = extractText(el);
    blocks.push(inner ? `$$${inner}$$` : '');
    return;
  }

  // tg-time
  if (cls.includes('tg-time')) {
    const inner = extractText(el);
    blocks.push(inner || '');
    return;
  }

  // tg-map
  if (cls.includes('tg-map') || tag === 'tg-map') {
    const lat = el.getAttribute('lat') || '0';
    const lng = el.getAttribute('long') || '0';
    const zoom = el.getAttribute('zoom') || '14';
    blocks.push(`<tg-map lat="${lat}" long="${lng}" zoom="${zoom}"/>`);
    return;
  }

  // tg-slideshow
  if (cls.includes('tg-slideshow') || tag === 'tg-slideshow') {
    const imgs = el.querySelectorAll('img');
    let inner = '';
    imgs.forEach(img => {
      const src = img.getAttribute('src') || '';
      inner += `<img src="${src}"/>`;
    });
    blocks.push(`<tg-slideshow>${inner}</tg-slideshow>`);
    return;
  }

  // --- Block elements ---

  // Headings
  if (/^h[1-6]$/.test(tag)) {
    const level = tag[1];
    const prefix = '#'.repeat(parseInt(level));
    const inner = extractText(el);
    blocks.push(`\n${prefix} ${inner}\n`);
    return;
  }

  // Paragraph
  if (tag === 'p') {
    const inner = extractText(el);
    if (inner) {
      blocks.push(`\n${inner}\n`);
    }
    return;
  }

  // Div
  if (tag === 'div') {
    // Just recurse
    el.childNodes.forEach(child => walk(child, blocks, state));
    return;
  }

  // Unordered list
  if (tag === 'ul') {
    const items = el.querySelectorAll(':scope > li');
    items.forEach(li => processListItem(li, blocks, '-'));
    return;
  }

  // Ordered list
  if (tag === 'ol') {
    const items = el.querySelectorAll(':scope > li');
    let idx = el.getAttribute('start') ? parseInt(el.getAttribute('start')) : 1;
    items.forEach(li => {
      processListItem(li, blocks, `${idx}.`);
      idx++;
    });
    return;
  }

  // List item
  if (tag === 'li') {
    // Handled via parent ul/ol already, but in case standalone:
    processListItem(el, blocks, '-');
    return;
  }

  // Blockquote
  if (tag === 'blockquote') {
    const inner = extractText(el);
    if (inner) {
      blocks.push(`\n> ${inner}\n`);
    }
    // Check for cite inside
    const cite = el.querySelector('cite');
    if (cite) {
      const citeText = extractText(cite);
      if (citeText) {
        blocks.push(`\n<cite>${citeText}</cite>\n`);
      }
    }
    return;
  }

  // Pull quote (aside)
  if (tag === 'aside') {
    const inner = extractText(el);
    if (inner) {
      blocks.push(`\n<aside>${inner}</aside>\n`);
    }
    return;
  }

  // Pre > Code (code block)
  if (tag === 'pre') {
    const codeEl = el.querySelector('code');
    if (codeEl) {
      const lang = codeEl.getAttribute('data-language')
        || codeEl.getAttribute('class')?.replace(/^language-/, '')
        || '';
      const code = codeEl.textContent || '';
      blocks.push(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
      return;
    }
    // pre without code
    const code = el.textContent || '';
    blocks.push(`\n\`\`\`\n${code}\n\`\`\`\n`);
    return;
  }

  // Anchor
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    const text = extractText(el);
    if (text && href) {
      blocks.push(`[${text}](${href})`);
    } else if (text) {
      blocks.push(text);
    }
    return;
  }

  // Table
  if (tag === 'table') {
    const tableMarkdown = convertTable(el);
    blocks.push(`\n${tableMarkdown}\n`);
    return;
  }

  // Horizontal rule
  if (tag === 'hr') {
    blocks.push('\n---\n');
    return;
  }

  // Image
  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    const alt = el.getAttribute('alt') || '';
    blocks.push(`![${alt}](${src})`);
    return;
  }

  // Details / summary
  if (tag === 'details') {
    const summaryEl = el.querySelector(':scope > summary');
    const summaryText = summaryEl ? extractText(summaryEl) : '';
    // Get content after summary
    const contentParts = [];
    el.childNodes.forEach(child => {
      if (child !== summaryEl) {
        walk(child, contentParts, state);
      }
    });
    const content = contentParts.join('').trim();
    blocks.push(`\n<details><summary>${summaryText}</summary>${content}</details>\n`);
    return;
  }

  // Summary (handled inside details)
  if (tag === 'summary') {
    return;
  }

  // Br
  if (tag === 'br') {
    blocks.push('\n');
    return;
  }

  // Span - just recurse
  if (tag === 'span') {
    el.childNodes.forEach(child => walk(child, blocks, state));
    return;
  }

  // Classic footnote definition: div.footnotes > div.footnote-item
  if (cls.includes('footnotes') && tag === 'div') {
    const items = el.querySelectorAll('.footnote-item, .footnote');
    items.forEach(item => {
      const fnText = extractText(item);
      const fnId = item.getAttribute('data-fn-id') || (++footnoteCounter).toString();
      footnotes.push({ id: fnId, text: fnText });
    });
    return;
  }

  // Fallback: recurse for any unknown element
  el.childNodes.forEach(child => walk(child, blocks, state));
}

function processListItem(li, blocks, prefix) {
  const checkbox = li.querySelector('input[type="checkbox"]');
  if (checkbox) {
    const checked = checkbox.checked;
    // Get text excluding the checkbox itself
    let inner = '';
    li.childNodes.forEach(child => {
      if (child.tagName !== 'INPUT' && child.type !== 'checkbox') {
        inner += child.textContent || '';
      }
    });
    inner = trimText(inner);
    const checkboxText = checked ? '- [x]' : '- [ ]';
    blocks.push(`\n${checkboxText} ${inner}\n`);
    return;
  }

  const inner = extractText(li);
  blocks.push(`\n${prefix} ${inner}\n`);
}

function extractText(el) {
  // Get plain text, skipping child elements that are handled specially
  // We want the raw text content for inline formatting
  return trimText(el.textContent || '');
}

function trimText(t) {
  return t.replace(/\u00A0/g, ' ').trim();
}

function escapeMarkdown(text) {
  // Escape special markdown characters except those produced by our converter
  return text
    .replace(/\\([\\`*_{}\[\]()#+\-.!|~<>])/g, '\\$1')
    .replace(/([\\`*_{}\[\]()#+\-.!|])/g, '\\$1');
}

// ===== FOOTNOTE STATE =====
let footnoteCounter = 0;
let footnotes = [];

export function resetFootnotes() {
  footnoteCounter = 0;
  footnotes = [];
}

export function getFootnotes() {
  return footnotes;
}

function convertTable(tableEl) {
  const rows = tableEl.querySelectorAll('thead tr, tbody tr, tr');
  if (!rows.length) return '';

  // Check for caption
  const caption = tableEl.querySelector('caption');
  let captionText = '';
  if (caption) {
    captionText = trimText(caption.textContent || '');
  }

  const markdownRows = [];
  const colWidths = [];

  // First pass: determine column widths
  rows.forEach(tr => {
    const cells = tr.querySelectorAll('th, td');
    cells.forEach((cell, i) => {
      const textLen = (cell.textContent || '').trim().length;
      if (!colWidths[i] || textLen > colWidths[i]) {
        colWidths[i] = Math.max(textLen, 3);
      }
    });
  });

  let headerRow = null;
  let bodyRows = [];

  rows.forEach((tr, idx) => {
    const cells = tr.querySelectorAll('th, td');
    const rowTexts = [];
    cells.forEach((cell, i) => {
      const text = (cell.textContent || '').trim();
      rowTexts.push(text);
    });
    if (idx === 0 || tr.closest('thead')) {
      headerRow = rowTexts;
    } else {
      bodyRows.push(rowTexts);
    }
  });

  if (!headerRow) {
    // No header found, treat first row as header
    if (bodyRows.length) {
      headerRow = bodyRows.shift();
    } else {
      return '';
    }
  }

  const formatRow = (cells) => {
    return '| ' + cells.map((c, i) => {
      const w = colWidths[i] || 3;
      return (c || '').padEnd(w);
    }).join(' | ') + ' |';
  };

  const headerSep = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';

  let result = '';
  if (captionText) {
    result = `*${captionText}*\n`;
  }
  result += formatRow(headerRow) + '\n' + headerSep;
  bodyRows.forEach(row => {
    result += '\n' + formatRow(row);
  });

  return result;
}
