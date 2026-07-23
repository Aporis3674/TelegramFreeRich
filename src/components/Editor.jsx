import React, { forwardRef, useEffect, useCallback, useRef } from 'react';

const Editor = forwardRef(({ onContentChange, isDragOver }, ref) => {
  const containerRef = useRef(null);

  // Sync the forwarded ref with our local ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(containerRef.current);
      } else {
        ref.current = containerRef.current;
      }
    }
  }, [ref]);

  // Observe mutations to detect content changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      onContentChange(el);
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [onContentChange]);

  // Handle paste - strip formatting for clean paste
  const handlePaste = useCallback((e) => {
    // Allow rich paste but normalize it
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      // Allow HTML paste but clean it
      e.preventDefault();
      document.execCommand('insertHTML', false, html);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Let parent handle drag-drop
  }, []);

  return (
    <div
      className="editor-container"
      style={{ position: 'relative' }}
    >
      <div
        ref={containerRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onPaste={handlePaste}
        onDrop={handleDrop}
        data-placeholder="Start writing your message..."
      />
      {isDragOver && (
        <div className="drop-overlay">
          <span className="drop-overlay-text">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Drop images here
          </span>
        </div>
      )}
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;
