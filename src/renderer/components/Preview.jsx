/**
 * Preview — Live preview panel showing Telegram-style message bubble.
 * Re-renders on every editor change.
 */

import { serializeBlocks } from '../../shared/block-serializer.js';
import { parseAllBlocks } from '../../shared/block-parser.js';

/**
 * Convert TipTap HTML to blocks and render as Telegram preview.
 * @param {{ html: string }} props
 */
export default function Preview({ html }) {
  // Parse HTML to block state, then serialize for preview
  let previewHtml = '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
    const container = doc.body.firstChild;

    if (container && container.children.length > 0) {
      const blocks = parseAllBlocks(container);
      const apiBlocks = serializeBlocks(blocks);
      previewHtml = renderApiBlocks(apiBlocks);
    }
  } catch (e) {
    previewHtml = '<p class="preview-error">Preview error</p>';
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">Live Preview</div>
      <div className="telegram-bubble">
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}

/**
 * Render API blocks to HTML for the preview bubble.
 * @param {object[]} apiBlocks
 * @returns {string}
 */
function renderApiBlocks(apiBlocks) {
  if (!apiBlocks || apiBlocks.length === 0) {
    return '<p class="preview-empty">Start typing to see preview...</p>';
  }

  return apiBlocks.map(renderPreviewBlock).filter(Boolean).join('');
}

/**
 * Render a single API block to HTML string.
 * @param {object} block
 * @returns {string}
 */
function renderPreviewBlock(block) {
  switch (block.type) {
    case 'paragraph':
      return `<p>${escapePreview(block.text)}</p>`;

    case 'heading': {
      const lvl = Math.min(Math.max(block.level || 2, 1), 6);
      return `<h${lvl}>${escapePreview(block.text)}</h${lvl}>`;
    }

    case 'blockquote':
      return `<blockquote>${escapePreview(block.text)}</blockquote>`;

    case 'aside':
      return `<blockquote class="pullquote">${escapePreview(block.text)}${block.attribution ? `<footer>— ${escapePreview(block.attribution)}</footer>` : ''}</blockquote>`;

    case 'preformatted':
      return `<pre><code class="language-${escapePreview(block.language || '')}">${escapePreview(block.text)}</code></pre>`;

    case 'divider':
      return '<hr>';

    case 'list': {
      const tag = block.style === 'numbered' ? 'ol' : 'ul';
      const items = (block.items || []).map((item) => {
        const text = typeof item === 'string' ? item : item.text || '';
        return `<li>${escapePreview(text)}</li>`;
      }).join('');
      return `<${tag}>${items}</${tag}>`;
    }

    case 'table': {
      const headerCells = (block.header || []).map((h) => `<th>${escapePreview(h)}</th>`).join('');
      const bodyRows = (block.rows || []).map((row) => {
        const cells = row.map((c) => `<td>${escapePreview(c)}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }

    case 'details':
      return `<details><summary>${escapePreview(block.summary)}</summary><p>${escapePreview(block.content)}</p></details>`;

    case 'footer':
      return `<footer>${escapePreview(block.text)}</footer>`;

    case 'math':
      return `<div class="tg-math">${escapePreview(block.text)}</div>`;

    case 'photo':
      return `<img src="${escapePreview(block.url)}" alt="${escapePreview(block.caption || 'photo')}" style="max-width:200px;border-radius:8px">`;

    case 'video':
      return `<video src="${escapePreview(block.url)}" controls style="max-width:200px;border-radius:8px"></video>`;

    case 'audio':
      return `<audio src="${escapePreview(block.url)}" controls></audio>`;

    default:
      return '';
  }
}

/**
 * Escape text for safe HTML preview display.
 * @param {string} str
 * @returns {string}
 */
function escapePreview(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
