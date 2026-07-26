/**
 * App — application shell.
 *
 *   ┌ titlebar ──────────────────────────────────── ─ □ ✕ ┐
 *   │ [Aa][B][list][table][link][media][Σ]                  │
 *   │                                                       │
 *   │  editor                              │  preview       │
 *   │                                                       │
 *   │ (✦A)                        chars   (🗑)         (➤)  │
 *   └───────────────────────────────────────────────────────┘
 *
 * @module App
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';

import BottomBar from './components/BottomBar.jsx';
import { DialogProvider, useDialogs } from './components/Dialog.jsx';
import Preview from './components/Preview.jsx';
import Settings from './components/Settings.jsx';
import TitleBar from './components/TitleBar.jsx';
import { ToastProvider, useToast } from './components/Toast.jsx';
import TableBubble from './components/TableBubble.jsx';
import Toolbar from './components/Toolbar.jsx';
import useTfrEditor from './components/useTfrEditor.js';
import { I18nProvider, useI18n } from './i18n/index.js';
import {
  buildChecklistBody,
  buildDraftBody,
  buildEditBody,
  buildRichMessageBody,
  checkChecklist,
  checkLimits,
  isPrivateChatId,
  serializeEditorHtml,
} from '../shared/html-serializer.js';
import { DEFAULT_LANG, DEFAULT_THEME } from '../shared/constants.js';
import { insertLink } from './lib/editor-actions.js';

const THEME_KEY = 'tfr-theme';
const LANG_KEY = 'tfr-lang';
const EDIT_ID_KEY = 'tfr-edit-id';
const RTL_KEY = 'tfr-rtl';

/** Draft streaming needs a stable non-zero id so updates animate in place. */
const DRAFT_ID = 1;

/**
 * @param {{ lang: string, onLangChange: (lang: string) => void }} props
 */
function Shell({ lang, onLangChange }) {
  const { t, dir } = useI18n();
  const toast = useToast();
  const { askText, askLink, confirm } = useDialogs();

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || DEFAULT_THEME);
  const [settings, setSettings] = useState(() => ({
    tokenSet: false,
    chatId: '',
    editId: localStorage.getItem(EDIT_ID_KEY) || '',
    lang,
  }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isRtl, setIsRtl] = useState(() => localStorage.getItem(RTL_KEY) === '1');
  const [html, setHtml] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [mode, setMode] = useState('rich');
  const [sending, setSending] = useState(false);

  const tRef = useRef(t);
  tRef.current = t;

  const handleUpdate = useCallback((nextHtml, text) => {
    setHtml(nextHtml);
    setCharCount(text.length);
  }, []);

  const editor = useTfrEditor({
    placeholder: () => tRef.current('editor.placeholder'),
    onUpdate: handleUpdate,
  });

  /* ── persisted preferences ── */

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  useEffect(() => {
    localStorage.setItem(RTL_KEY, isRtl ? '1' : '0');
  }, [isRtl]);

  useEffect(() => {
    if (settings.editId) localStorage.setItem(EDIT_ID_KEY, settings.editId);
  }, [settings.editId]);

  // Load chat ID / token presence / language from the main process on mount.
  useEffect(() => {
    if (!window.app || !window.app.loadSettings) return;
    window.app
      .loadSettings()
      .then((loaded) => {
        setSettings((prev) => ({ ...prev, ...loaded }));
        if (loaded.lang && loaded.lang !== lang) onLangChange(loaded.lang);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── services handed to the action registry ── */

  const notify = useCallback((key, type) => toast(tRef.current(key), type), [toast]);

  const toggleRtl = useCallback(() => {
    setIsRtl((prev) => {
      notify(prev ? 'toast.rtlOff' : 'toast.rtlOn');
      return !prev;
    });
  }, [notify]);

  const ctx = useMemo(() => ({ askText, askLink, notify }), [askText, askLink, notify]);

  /* ── send ── */

  const handleSend = useCallback(async () => {
    if (!settings.tokenSet) {
      notify('toast.configureToken', 'error');
      setSettingsOpen(true);
      return;
    }
    if (!settings.chatId) {
      notify('toast.setChatId', 'error');
      setSettingsOpen(true);
      return;
    }
    if (!html.trim() || charCount === 0) {
      notify('toast.nothingToSend', 'error');
      return;
    }
    if (mode === 'edit' && !settings.editId) {
      notify('toast.needEditId', 'error');
      setSettingsOpen(true);
      return;
    }

    // Drafts stream into a private chat only, and need a non-zero draft_id.
    if (mode === 'draft' && !isPrivateChatId(settings.chatId)) {
      notify('toast.draftPrivateOnly', 'error');
      return;
    }

    setSending(true);
    try {
      // An interactive checklist is its own API, and that API only works on
      // behalf of a connected business account. Without one, the task list
      // travels inside the message body as a ☑ / ☐ list instead of failing.
      const businessId = settings.businessConnectionId || '';
      const asChecklist = !!businessId && isPrivateChatId(settings.chatId);
      const message = serializeEditorHtml(html, { inlineChecklist: !asChecklist });
      const limits = checkLimits(message);
      if (!limits.ok) {
        notify(`toast.limit.${limits.reason}`, 'error');
        setSending(false);
        return;
      }

      if (message.inlinedChecklist) {
        // Say which of the two reasons applied, so it is actionable.
        notify(businessId ? 'toast.checklistPrivateOnly' : 'toast.checklistNeedsBusiness', 'info');
      }

      if (asChecklist && message.checklist.length > 0) {
        const valid = checkChecklist(message.checklist);
        if (!valid.ok) {
          notify(`toast.checklist.${valid.reason}`, 'error');
          setSending(false);
          return;
        }
        // Telegram takes a title above the tasks, and there is no way to send a
        // task pre-ticked — only markChecklistTasksAsDone can do that later.
        const title = await askText({
          titleKey: 'dialog.checklistTitle',
          placeholder: tRef.current('dialog.checklistTitlePlaceholder'),
        });
        if (title === null) {
          setSending(false);
          return;
        }
        if (message.checklist.some((item) => item.done)) {
          notify('toast.checklistDoneIgnored', 'info');
        }
        const result = await window.app.api(
          'sendChecklist',
          buildChecklistBody(message.checklist, settings.chatId, {
            title: title.trim() || tRef.current('dialog.checklistTitleFallback'),
            businessConnectionId: businessId,
          }),
        );
        if (!result.ok) {
          toast(`${tRef.current('toast.networkError')}: ${result.description}`, 'error');
        } else if (!message.html) {
          notify('toast.checklistSent', 'success');
        }
      }

      if (message.html) {
        const options = { isRtl };
        let result;
        if (mode === 'draft') {
          result = await window.app.api(
            'sendRichMessageDraft',
            buildDraftBody(message.html, settings.chatId, DRAFT_ID, options),
          );
        } else if (mode === 'edit') {
          result = await window.app.api(
            'editMessageText',
            buildEditBody(message.html, settings.chatId, settings.editId, options),
          );
        } else {
          result = await window.app.api(
            'sendRichMessage',
            buildRichMessageBody(message.html, settings.chatId, options),
          );
        }

        if (result.ok) {
          notify(
            mode === 'draft' ? 'toast.draftSent' : mode === 'edit' ? 'toast.edited' : 'toast.sent',
            'success',
          );
        } else {
          toast(`${tRef.current('toast.networkError')}: ${result.description}`, 'error');
        }
      } else if (message.checklist.length === 0) {
        notify('toast.nothingToSend', 'error');
      }
    } catch {
      notify('toast.networkError', 'error');
    }
    setSending(false);
  }, [settings, html, charCount, mode, isRtl, notify, toast, askText]);

  const handleClear = useCallback(async () => {
    if (charCount === 0 && !html.trim()) return;
    const ok = await confirm({
      titleKey: 'dialog.clearTitle',
      bodyKey: 'dialog.clearBody',
      confirmKey: 'dialog.clearConfirm',
      danger: true,
    });
    if (!ok || !editor) return;
    editor.chain().focus().clearContent(true).run();
    setHtml('');
    setCharCount(0);
    notify('toast.cleared');
  }, [charCount, html, confirm, editor, notify]);

  /* ── shortcuts ── */

  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      if (event.key === 'Enter') {
        // Inside a code block Ctrl+Enter belongs to the editor (exit code block).
        if (editor && editor.isActive('codeBlock')) return;
        event.preventDefault();
        handleSend();
      } else if (event.key === ',') {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (!event.shiftKey && event.key.toLowerCase() === 'p') {
        // Ctrl+Shift+P stays with the editor (spoiler).
        event.preventDefault();
        setPreviewOpen((v) => !v);
      } else if (event.key.toLowerCase() === 'k' && editor) {
        event.preventDefault();
        insertLink(editor, ctx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSend, editor, ctx]);

  return (
    <>
      <TitleBar
        tokenSet={settings.tokenSet}
        previewOpen={previewOpen}
        isRtl={isRtl}
        onToggleRtl={toggleRtl}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Toolbar editor={editor} ctx={ctx} />

      <main className={`workspace${previewOpen ? ' with-preview' : ''}`}>
        <div className="editor-pane" dir={isRtl ? 'rtl' : 'ltr'}>
          <EditorContent editor={editor} />
          <TableBubble editor={editor} />
        </div>
        {previewOpen && <Preview html={html} isRtl={isRtl} onClose={() => setPreviewOpen(false)} />}
      </main>

      <BottomBar
        editor={editor}
        ctx={ctx}
        charCount={charCount}
        mode={mode}
        onModeChange={setMode}
        sending={sending}
        onSend={handleSend}
        onClear={handleClear}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaved={(next) => {
          setSettings(next);
          notify('toast.settingsSaved', 'success');
        }}
        theme={theme}
        onThemeChange={setTheme}
        lang={lang}
        onLangChange={onLangChange}
      />
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || DEFAULT_LANG);

  return (
    <I18nProvider lang={lang}>
      <ToastProvider>
        <DialogProvider>
          <Shell lang={lang} onLangChange={setLang} />
        </DialogProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
