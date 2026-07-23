import React, { useMemo, useRef, useEffect } from 'react';

function renderMarkdown(md) {
  if (!md) return '<span style="color:var(--text-dim);font-style:italic;">Nothing to preview...</span>';

  let html = md;

  // Escape HTML first (but preserve markdown syntax)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (triple backticks) — must be first
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="lang-${lang}">${code}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // Underline
  html = html.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>');

  // Strikethrough
  html = html.replace(/~([^~\n]+)~/g, '<s>$1</s>');

  // Spoiler
  html = html.replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

  // Highlight
  html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>');

  // Math inline
  html = html.replace(/\$([^$]+)\$/g, '<code style="color:var(--accent2);">$1</code>');

  // Math block
  html = html.replace(/\$\$([^$]+)\$\$/g, '<pre style="text-align:center;color:var(--accent2);">$1</pre>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;"/>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Sub / Sup
  html = html.replace(/&lt;sub&gt;([^&]+)&lt;\/sub&gt;/g, '<sub>$1</sub>');
  html = html.replace(/&lt;sup&gt;([^&]+)&lt;\/sup&gt;/g, '<sup>$1</sup>');

  // Details/summary
  html = html.replace(/&lt;details&gt;&lt;summary&gt;([\s\S]*?)&lt;\/summary&gt;([\s\S]*?)&lt;\/details&gt;/g,
    '<details style="border:1px solid var(--border);padding:8px;border-radius:var(--radius-sm);margin:4px 0;"><summary style="cursor:pointer;font-weight:600;">$1</summary><div style="margin-top:8px;">$2</div></details>');

  // tg-map
  html = html.replace(/&lt;tg-map[^/]*?\/&gt;/g, '<div style="background:var(--surface2);padding:12px;border-radius:var(--radius-sm);text-align:center;color:var(--text-dim);">📍 Map</div>');

  // tg-slideshow
  html = html.replace(/&lt;tg-slideshow&gt;([\s\S]*?)&lt;\/tg-slideshow&gt;/g, (match, imgs) => {
    // Extract img srcs
    const srcs = [...imgs.matchAll(/&lt;img src="([^"]+)"&gt;/g)].map(m => m[1]);
    if (srcs.length) {
      const imgHtml = srcs.map(s => `<img src="${s}" style="max-width:100%;border-radius:var(--radius-sm);"/>`).join('');
      return `<div style="display:flex;gap:8px;overflow-x:auto;">${imgHtml}</div>`;
    }
    return '<div style="color:var(--text-dim);">Slideshow</div>';
  });

  // Todo items (must be before list processing)
  html = html.replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:6px;align-items:center;"><input type="checkbox" checked disabled/> <span>$1</span></div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:6px;align-items:center;"><input type="checkbox" disabled/> <span>$1</span></div>');

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<div style="padding-left:16px;">• $1</div>');

  // Ordered list items
  let counter = 0;
  html = html.replace(/^(\d+)\. (.+)$/gm, (match, num, text) => {
    return `<div style="padding-left:16px;">${num}. ${text}</div>`;
  });

  // Line breaks to paragraphs
  html = html.split('\n').map(line => {
    if (line.match(/^<(h[1-6]|pre|table|hr|blockquote|div|ul|ol|li|details)/i)) return line;
    if (line.trim() === '') return '<br>';
    return `<div>${line}</div>`;
  }).join('');

  return html;
}

export default function Preview({ markdown, showSource, onToggleSource }) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  const containerRef = useRef(null);

  // Auto-scroll preview
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [html]);

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <span>Preview</span>
        <button
          className="header-btn"
          onClick={onToggleSource}
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          {showSource ? 'Preview' : 'Source'}
        </button>
      </div>
      <div className="preview-container" ref={containerRef}>
        {showSource ? (
          <div className="markdown-source">
            <pre style={{ margin: 0 }}>{markdown || '// Empty'}</pre>
          </div>
        ) : (
          <div
            className="tg-message-bubble"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
