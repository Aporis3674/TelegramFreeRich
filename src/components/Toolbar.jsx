import React from 'react';

const icons = {
  bold: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    </svg>
  ),
  italic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
    </svg>
  ),
  underline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>
    </svg>
  ),
  strike: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  spoiler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5"/>
    </svg>
  ),
  highlight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  unorderedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  orderedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
      <text x="3" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
      <text x="3" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
      <text x="3" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  codeblock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2"/><polyline points="8 10 5 7 8 4"/><polyline points="16 10 19 7 16 4"/>
      <line x1="13" y1="14" x2="11" y2="14"/>
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  math: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <text x="3" y="17" fontSize="14" fill="currentColor" stroke="none" fontFamily="serif" fontStyle="italic">f(x)</text>
    </svg>
  ),
  details: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  hr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  sub: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <text x="2" y="14" fontSize="13" fill="currentColor" stroke="none" fontFamily="sans-serif">X</text>
      <text x="13" y="18" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
    </svg>
  ),
  sup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <text x="2" y="14" fontSize="13" fill="currentColor" stroke="none" fontFamily="sans-serif">X</text>
      <text x="13" y="10" fontSize="9" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 16 10"/>
    </svg>
  ),
};

const buttons = [
  { key: 'bold', icon: 'bold', cmd: () => document.execCommand('bold'), title: 'Bold (Ctrl+B)' },
  { key: 'italic', icon: 'italic', cmd: () => document.execCommand('italic'), title: 'Italic (Ctrl+I)' },
  { key: 'underline', icon: 'underline', cmd: () => document.execCommand('underline'), title: 'Underline (Ctrl+U)' },
  { key: 'strike', icon: 'strike', cmd: () => document.execCommand('strikeThrough'), title: 'Strikethrough' },
  { key: 'code', icon: 'code', cmd: () => document.execCommand('insertHTML', false, '<code>code</code>'), title: 'Inline Code (Ctrl+E)' },
  { key: 'spoiler', icon: 'spoiler', cmd: () => document.execCommand('insertHTML', false, '<span class="tg-spoiler">spoiler</span>'), title: 'Spoiler' },
  { key: 'highlight', icon: 'highlight', cmd: () => document.execCommand('insertHTML', false, '<mark>highlighted</mark>'), title: 'Highlight' },
  { key: 'sub', icon: 'sub', cmd: () => document.execCommand('insertHTML', false, '<sub>text</sub>'), title: 'Subscript' },
  { key: 'sup', icon: 'sup', cmd: () => document.execCommand('insertHTML', false, '<sup>text</sup>'), title: 'Superscript' },
  'divider1',
  { key: 'ul', icon: 'unorderedList', cmd: () => document.execCommand('insertUnorderedList'), title: 'Bullet List' },
  { key: 'ol', icon: 'orderedList', cmd: () => document.execCommand('insertOrderedList'), title: 'Numbered List' },
  { key: 'check', icon: 'check', cmd: () => document.execCommand('insertHTML', false, '<li><input type="checkbox"> Todo</li>'), title: 'Checklist' },
  'divider2',
  { key: 'link', icon: 'link', cmd: null, title: 'Link (Ctrl+K)' },
  { key: 'codeblock', icon: 'codeblock', cmd: () => document.execCommand('insertHTML', false, '<pre><code class="language-">// code</code></pre><p></p>'), title: 'Code Block' },
  { key: 'table', icon: 'table', cmd: () => document.execCommand('insertHTML', false, '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><p></p>'), title: 'Table' },
  { key: 'hr', icon: 'hr', cmd: () => document.execCommand('insertHorizontalRule'), title: 'Divider' },
  'divider3',
  { key: 'image', icon: 'image', cmd: null, title: 'Image' },
  { key: 'map', icon: 'math', cmd: () => document.execCommand('insertHTML', false, '<div class="tg-map" lat="35.6892" long="51.3890" zoom="14"><iframe src="about:blank" style="width:100%;height:200px;border:none;"></iframe></div><p></p>'), title: 'Map' },
  { key: 'slideshow', icon: 'check', cmd: () => document.execCommand('insertHTML', false, '<div class="tg-slideshow-wrap"><div class="tg-slideshow-track"><div class="tg-slideshow-slide"><img src="https://picsum.photos/400/300"/></div></div></div><p></p>'), title: 'Slideshow' },
  { key: 'math', icon: 'math', cmd: () => document.execCommand('insertHTML', false, '<span class="tg-math">formula</span>'), title: 'Math' },
  { key: 'details', icon: 'details', cmd: () => document.execCommand('insertHTML', false, '<details><summary>Click to expand</summary><p>Content</p></details><p></p>'), title: 'Collapsible' },
  { key: 'footnote', icon: 'sub', cmd: () => document.execCommand('insertHTML', false, '<sup class="footnote" data-fn="1">[1]</sup>'), title: 'Footnote' },
  { key: 'pullquote', icon: 'spoiler', cmd: () => document.execCommand('insertHTML', false, '<aside>Pull quote text</aside><p></p>'), title: 'Pull Quote' },
];

export default function Toolbar({ execCommand, showLinkDialog }) {
  const handleClick = (btn) => {
    if (btn.key === 'link') {
      showLinkDialog();
      return;
    }
    if (btn.cmd) {
      btn.cmd();
    }
  };

  return (
    <div className="toolbar">
      {buttons.map((btn) => {
        if (typeof btn === 'string') {
          return <div key={btn} className="toolbar-divider" />;
        }
        return (
          <button
            key={btn.key}
            className="toolbar-btn"
            onClick={() => handleClick(btn)}
            title={btn.title}
          >
            {icons[btn.icon]}
            <span className="tooltip">{btn.title}</span>
          </button>
        );
      })}
    </div>
  );
}
