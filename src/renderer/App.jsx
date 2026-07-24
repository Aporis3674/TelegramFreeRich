/**
 * App — Root React component for TelegramFreeRich.
 * Orchestrates editor, preview, toolbar, settings, send.
 */

import { useState, useEffect, useCallback } from 'react';
import TipTapEditor from './components/TipTapEditor.jsx';
import Toolbar from './components/Toolbar.jsx';
import Preview from './components/Preview.jsx';
import Settings from './components/Settings.jsx';
import ActionBar from './components/ActionBar.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import { parseAllBlocks } from '../shared/block-parser.js';
import { buildRichMessageBody, separateChecklists, buildChecklistBody } from '../shared/block-serializer.js';

const THEME_KEY = 'tfr-theme';

function AppInner() {
  const toast = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [settings, setSettings] = useState({ tokenSet: false, chatId: '', lang: 'en' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [mode, setMode] = useState('rich');
  const [sending, setSending] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isRtl, setIsRtl] = useState(false);

  // Load settings from main process on mount
  useEffect(() => {
    window.app.loadSettings().then(setSettings).catch(() => {});
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Apply RTL
  useEffect(() => {
    const editor = document.querySelector('.tiptap-editor');
    if (editor) editor.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, [isRtl]);

  const handleUpdate = useCallback((newHtml) => {
    setHtml(newHtml);
    // Count plain text chars
    const div = document.createElement('div');
    div.innerHTML = newHtml;
    setCharCount((div.textContent || '').length);
  }, []);

  const handleSend = useCallback(async () => {
    if (!settings.tokenSet) { toast('Configure bot token', 'error'); return; }
    if (!settings.chatId) { toast('Set chat ID', 'error'); return; }
    if (!html.trim()) { toast('Nothing to send', 'error'); return; }

    setSending(true);
    try {
      // Parse HTML → Block State
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const blocks = parseAllBlocks(doc.body.firstChild);

      // Separate checklists (they use a different API)
      const { richBlocks, checklistItems } = separateChecklists(blocks);

      // Send checklist separately if present
      if (checklistItems.length > 0) {
        const clBody = buildChecklistBody(checklistItems, settings.chatId);
        const clResult = await window.app.api('sendChecklist', clBody);
        if (!clResult.ok) {
          toast(`Checklist error: ${clResult.description}`, 'error');
        }
      }

      // Send rich message
      if (richBlocks.length > 0) {
        const body = buildRichMessageBody(richBlocks, settings.chatId, { isRtl });

        let result;
        if (mode === 'draft') {
          result = await window.app.api('sendRichMessageDraft', body);
        } else if (mode === 'edit' && settings.editId) {
          body.message_id = settings.editId;
          result = await window.app.api('editMessageText', body);
        } else {
          result = await window.app.api('sendRichMessage', body);
        }

        if (result.ok) {
          toast(mode === 'draft' ? 'Draft sent' : mode === 'edit' ? 'Edited!' : 'Sent!', 'success');
        } else {
          toast(`Error: ${result.description}`, 'error');
        }
      } else if (checklistItems.length === 0) {
        toast('Nothing to send', 'error');
      } else {
        toast('Checklist sent!', 'success');
      }
    } catch {
      toast('Network error', 'error');
    }
    setSending(false);
  }, [settings, html, mode, isRtl, toast]);

  const handleClear = useCallback(() => {
    const editor = window.__tfrEditor;
    if (editor) editor.commands.clearContent();
    setHtml('');
    setCharCount(0);
    toast('Cleared');
  }, [toast]);

  return (
    <>
      {/* Header */}
      <header id="header">
        <div className="header-left">
          <svg className="logo" viewBox="0 0 24 24" width="22" height="22">
            <path d="M11.944.042C5.347.042.042 5.347.042 11.944c0 6.596 5.305 11.902 11.902 11.902 6.596 0 11.902-5.306 11.902-11.902C23.846 5.347 18.54.042 11.944.042zM17.92 8.182l-2.057 9.668c-.153.695-.558.865-1.13.538l-3.117-2.298-1.505 1.448c-.166.166-.306.306-.63.306l.44-3.128 5.69-5.142c.248-.22-.054-.343-.384-.122l-7.04 4.435-3.032-.988c-.66-.206-.673-.66.138-.977l11.83-4.56c.55-.203 1.03.136.852.97z" fill="currentColor" />
          </svg>
          <span className="title">FreeRich</span>
        </div>
        <div className="header-right">
          <button
            className="icon-btn"
            title={isRtl ? 'LTR' : 'RTL'}
            onClick={() => setIsRtl((v) => !v)}
          >
            {isRtl ? 'LTR' : 'RTL'}
          </button>
          <button className="icon-btn" title="Settings" onClick={() => setSettingsOpen(true)}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Split pane: Editor + Preview */}
      <div className="split-pane">
        <div className="editor-side">
          <TipTapEditor onUpdate={handleUpdate} />
        </div>
        <div className="split-handle" />
        <div className="preview-side">
          <Preview html={html} />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Action bar */}
      <ActionBar
        charCount={charCount}
        mode={mode}
        onModeChange={setMode}
        tokenSet={settings.tokenSet}
        sending={sending}
        onSend={handleSend}
        onClear={handleClear}
      />

      {/* Settings modal */}
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={setSettings}
        settings={settings}
        theme={theme}
        onThemeChange={setTheme}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
