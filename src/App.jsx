import React, { useState, useCallback, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Settings from './components/Settings';
import PlusMenu from './components/PlusMenu';
import { sendRichMessage } from './lib/sendMessage';
import domToMarkdown from './lib/domToMarkdown';

export default function App() {
  const [markdown, setMarkdown] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('tfr-theme') || 'dark');
  const [focusMode, setFocusMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tfr-settings');
      return saved ? JSON.parse(saved) : {
        botToken: '8584038563:AAGllE8hNppDYubOqrgjI9oCPM8EIyAcCqo',
        chatId: '@ProgramAryelle',
        method: 'sendRichMessage',
      };
    } catch {
      return {
        botToken: '8584038563:AAGllE8hNppDYubOqrgjI9oCPM8EIyAcCqo',
        chatId: '@ProgramAryelle',
        method: 'sendRichMessage',
      };
    }
  });

  const editorRef = useRef(null);
  const plusMenuRef = useRef(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tfr-theme', theme);
  }, [theme]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('tfr-settings', JSON.stringify(settings));
  }, [settings]);

  // Toast system
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 200);
    }, 3000);
  }, []);

  // Convert DOM to markdown on content change
  const handleContentChange = useCallback((editorEl) => {
    if (!editorEl) return;
    const md = domToMarkdown(editorEl);
    setMarkdown(md);
    setCharCount(editorEl.textContent.length);
  }, []);

  // Execute formatting command
  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!markdown.trim()) {
      showToast('Nothing to send - editor is empty', 'error');
      return;
    }
    if (!settings.botToken) {
      showToast('Bot token not configured', 'error');
      setShowSettings(true);
      return;
    }
    if (!settings.chatId) {
      showToast('Chat ID not configured', 'error');
      setShowSettings(true);
      return;
    }

    setIsSending(true);
    try {
      const result = await sendRichMessage({
        token: settings.botToken,
        chatId: settings.chatId,
        markdown: markdown,
        method: settings.method,
      });
      if (result.ok) {
        showToast('Message sent successfully!', 'success');
      } else {
        showToast(`API Error: ${result.description || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  }, [markdown, settings, showToast]);

  // Clear all
  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      handleContentChange(editorRef.current);
      showToast('Editor cleared', 'info');
    }
  }, [handleContentChange, showToast]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Toggle focus mode
  const toggleFocus = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        execCommand('bold');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        execCommand('italic');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        execCommand('underline');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showLinkDialog();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        execCommand('formatBlock', 'pre');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [execCommand]);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const linkUrlRef = useRef('');
  const linkTextRef = useRef('');

  const showLinkDialog = useCallback(() => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      linkTextRef.current = sel.toString() || '';
    }
    linkUrlRef.current = '';
    setLinkDialogOpen(true);
  }, []);

  const handleLinkInsert = useCallback(() => {
    const url = linkUrlRef.current;
    if (!url) return;

    // Create an anchor element
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const a = document.createElement('a');
    a.href = url;
    a.textContent = linkTextRef.current || url;
    a.target = '_blank';
    a.rel = 'noopener';
    range.insertNode(a);
    sel.removeAllRanges();

    // Move cursor after the link
    const newRange = document.createRange();
    newRange.setStartAfter(a);
    newRange.collapse(true);
    sel.addRange(newRange);

    setLinkDialogOpen(false);
    if (editorRef.current) {
      handleContentChange(editorRef.current);
    }
  }, [handleContentChange]);

  // Plus menu actions
  const handlePlusAction = useCallback((action) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const insert = (html) => {
      document.execCommand('insertHTML', false, html);
      setTimeout(() => handleContentChange(editor), 0);
    };

    switch (action) {
      case 'h1': insert('<h1>Heading 1</h1>'); break;
      case 'h2': insert('<h2>Heading 2</h2>'); break;
      case 'h3': insert('<h3>Heading 3</h3>'); break;
      case 'ul':
        document.execCommand('insertUnorderedList');
        break;
      case 'ol':
        document.execCommand('insertOrderedList');
        break;
      case 'checklist':
        insert('<li><input type="checkbox"> Todo item</li>');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'codeblock':
        insert('<pre><code class="language-">// code here</code></pre><p></p>');
        break;
      case 'inlinecode':
        document.execCommand('insertHTML', false, '<code>code</code>');
        break;
      case 'table':
        insert('<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table><p></p>');
        break;
      case 'hr':
        document.execCommand('insertHorizontalRule');
        break;
      case 'spoiler':
        document.execCommand('insertHTML', false, '<span class="tg-spoiler">spoiler text</span>');
        break;
      case 'highlight':
        document.execCommand('insertHTML', false, '<mark>highlighted</mark>');
        break;
      case 'math':
        document.execCommand('insertHTML', false, '<span class="tg-math">formula</span>');
        break;
      case 'mathblock':
        insert('<div class="tg-math-block">formula</div><p></p>');
        break;
      case 'details':
        insert('<details><summary>Click to expand</summary><p>Hidden content here</p></details><p></p>');
        break;
      case 'sub':
        document.execCommand('insertHTML', false, '<sub>subscript</sub>');
        break;
      case 'sup':
        document.execCommand('insertHTML', false, '<sup>superscript</sup>');
        break;
      case 'img':
        const imgUrl = prompt('Enter image URL:');
        if (imgUrl) {
          insert(`<img src="${imgUrl}" alt="image"/><p></p>`);
        }
        break;
      case 'map':
        insert('<div class="tg-map" lat="35.6892" long="51.3890" zoom="14"><iframe src="about:blank" style="width:100%;height:200px;border:none;"></iframe></div><p></p>');
        break;
      case 'slideshow':
        insert('<div class="tg-slideshow-wrap"><div class="tg-slideshow-track"><div class="tg-slideshow-slide"><img src="https://picsum.photos/400/300"/></div><div class="tg-slideshow-slide"><img src="https://picsum.photos/401/300"/></div></div></div><p></p>');
        break;
      case 'footnote':
        insert('<sup class="footnote" data-fn="1">[1]</sup>');
        break;
      case 'pullquote':
        insert('<aside>Pull quote text<cite>Author</cite></aside><p></p>');
        break;
      default:
        break;
    }
  }, [handleContentChange]);

  // Drag and drop
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files.length) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.focus();
          document.execCommand('insertHTML', false, `<img src="${ev.target.result}" alt="${file.name}"/><p></p>`);
          setTimeout(() => handleContentChange(editor), 0);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [handleContentChange]);

  return (
    <div
      className={`app ${focusMode ? 'focus-mode' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="header-title">TelegramRich</span>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={toggleFocus} title="Focus Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
            {focusMode ? 'Normal' : 'Focus'}
          </button>

          <button className="header-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <button className="header-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>

          <button className="header-btn" onClick={handleClear} title="Clear All">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5-3h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1z"/>
            </svg>
            Clear
          </button>

          <button
            className="header-btn send-btn"
            onClick={handleSend}
            disabled={isSending}
            title="Send to Telegram"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="main">
        {/* Editor Pane */}
        <div className="editor-pane">
          <Toolbar
            execCommand={execCommand}
            showLinkDialog={showLinkDialog}
          />

          <Editor
            ref={editorRef}
            onContentChange={handleContentChange}
            isDragOver={isDragOver}
          />

          <div className="editor-footer">
            <div className={`char-counter ${charCount > 32000 ? 'danger' : charCount > 28000 ? 'warning' : ''}`}>
              <div className="char-bar">
                <div
                  className={`char-bar-fill ${charCount > 32000 ? 'danger' : charCount > 28000 ? 'warning' : ''}`}
                  style={{ width: `${Math.min((charCount / 32768) * 100, 100)}%` }}
                />
              </div>
              <span>{charCount.toLocaleString()} / 32,768</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <PlusMenu onAction={handlePlusAction} ref={plusMenuRef} />
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        <Preview
          markdown={markdown}
          showSource={showSource}
          onToggleSource={() => setShowSource(v => !v)}
        />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Link Dialog */}
      {linkDialogOpen && (
        <div className="dialog-overlay" onClick={() => setLinkDialogOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Insert Link</h3>
            <div className="dialog-row">
              <label>URL</label>
              <input
                className="settings-input"
                type="url"
                placeholder="https://example.com"
                defaultValue={linkUrlRef.current}
                onChange={(e) => { linkUrlRef.current = e.target.value; }}
                autoFocus
              />
            </div>
            <div className="dialog-row">
              <label>Display Text (optional)</label>
              <input
                className="settings-input"
                type="text"
                placeholder="Link text"
                defaultValue={linkTextRef.current}
                onChange={(e) => { linkTextRef.current = e.target.value; }}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setLinkDialogOpen(false)}>Cancel</button>
              <button className="primary" onClick={handleLinkInsert}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
          >
            {toast.type === 'success' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
