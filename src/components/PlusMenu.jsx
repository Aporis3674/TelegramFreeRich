import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';

const menuItems = [
  { id: 'h1', label: 'Heading 1', shortcut: '' },
  { id: 'h2', label: 'Heading 2', shortcut: '' },
  { id: 'h3', label: 'Heading 3', shortcut: '' },
  { id: 'div1', divider: true },
  { id: 'ul', label: 'Bullet List', shortcut: '' },
  { id: 'ol', label: 'Numbered List', shortcut: '' },
  { id: 'checklist', label: 'Checklist', shortcut: '' },
  { id: 'div2', divider: true },
  { id: 'blockquote', label: 'Blockquote', shortcut: '' },
  { id: 'codeblock', label: 'Code Block', shortcut: '' },
  { id: 'inlinecode', label: 'Inline Code', shortcut: 'Ctrl+E' },
  { id: 'div3', divider: true },
  { id: 'table', label: 'Table', shortcut: '' },
  { id: 'hr', label: 'Horizontal Line', shortcut: '' },
  { id: 'div4', divider: true },
  { id: 'spoiler', label: 'Spoiler', shortcut: '' },
  { id: 'highlight', label: 'Highlight', shortcut: '' },
  { id: 'div5', divider: true },
  { id: 'math', label: 'Inline Math', shortcut: '' },
  { id: 'mathblock', label: 'Block Math', shortcut: '' },
  { id: 'div6', divider: true },
  { id: 'details', label: 'Collapsible Block', shortcut: '' },
  { id: 'sub', label: 'Subscript', shortcut: '' },
  { id: 'sup', label: 'Superscript', shortcut: '' },
  { id: 'div7', divider: true },
  { id: 'img', label: 'Insert Image', shortcut: '' },
  { id: 'slideshow', label: 'Slideshow', shortcut: '' },
  { id: 'map', label: 'Map', shortcut: '' },
  { id: 'div8', divider: true },
  { id: 'footnote', label: 'Footnote', shortcut: '' },
  { id: 'pullquote', label: 'Pull Quote', shortcut: '' },
];

const PlusMenu = forwardRef(({ onAction }, ref) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggle = useCallback(() => setOpen(prev => !prev), []);

  const handleAction = useCallback((actionId) => {
    onAction(actionId);
    setOpen(false);
  }, [onAction]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="plus-btn" onClick={toggle} title="Insert Block">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="plus-menu-overlay" onClick={() => setOpen(false)} />
          <div className="plus-menu">
            {menuItems.map((item) => {
              if (item.divider) {
                return <div key={item.id} className="plus-menu-divider" />;
              }
              return (
                <button
                  key={item.id}
                  className="plus-menu-item"
                  onClick={() => handleAction(item.id)}
                >
                  {item.label}
                  {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

PlusMenu.displayName = 'PlusMenu';

export default PlusMenu;
