/**
 * Dialog — promise-based panels replacing the browser `prompt()` / `confirm()`
 * (blocked in Electron and visually foreign).
 *
 * Three kinds:
 *   askText({ titleKey, placeholder|placeholderKey, value }) → Promise<string|null>
 *   askLink({ text, url })                     → Promise<{text, url}|null>
 *   confirm({ titleKey, bodyKey, confirmKey }) → Promise<boolean>
 *
 * @module components/Dialog
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.js';

const DialogContext = createContext(null);

/**
 * Access the dialog helpers.
 * @returns {{
 *   askText: (opts?: object) => Promise<string|null>,
 *   askLink: (opts?: object) => Promise<{text: string, url: string}|null>,
 *   confirm: (opts?: object) => Promise<boolean>,
 * }}
 */
export function useDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used within DialogProvider');
  return ctx;
}

/**
 * Provider rendering the active dialog.
 * @param {{ children: React.ReactNode }} props
 */
export function DialogProvider({ children }) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const firstFieldRef = useRef(null);

  const askText = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setValue(options.value || '');
        setDialog({ kind: 'text', options, resolve });
      }),
    [],
  );

  const askLink = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setLinkText(options.text || '');
        setLinkUrl(options.url || '');
        setDialog({ kind: 'link', options, resolve });
      }),
    [],
  );

  const confirm = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setDialog({ kind: 'confirm', options, resolve });
      }),
    [],
  );

  const finish = useCallback(
    (result) => {
      if (dialog) dialog.resolve(result);
      setDialog(null);
      setValue('');
      setLinkText('');
      setLinkUrl('');
    },
    [dialog],
  );

  /** The value a cancel/dismiss resolves to, per dialog kind. */
  const cancelled = dialog && dialog.kind === 'confirm' ? false : null;

  /** The value the confirm button resolves to, per dialog kind. */
  const accept = () => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') finish(true);
    else if (dialog.kind === 'link') {
      if (!linkUrl.trim()) return;
      finish({ text: linkText, url: linkUrl });
    } else {
      // An empty field resolves to '', not null. `null` means "cancelled", and
      // the two are not the same answer: callers that edit an existing value —
      // a media caption, its credit, a quote's attribution — read `null` as
      // "leave it alone", so collapsing the two made those impossible to clear
      // once set. Callers that only want a new value still test for falsy and
      // are unaffected.
      finish(value);
    }
  };

  useEffect(() => {
    if (dialog && firstFieldRef.current) firstFieldRef.current.focus();
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish(cancelled);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [dialog, finish, cancelled]);

  return (
    <DialogContext.Provider value={{ askText, askLink, confirm }}>
      {children}

      {dialog && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) finish(cancelled);
          }}
        >
          <div className={`dialog${dialog.kind === 'confirm' ? ' dialog-confirm' : ''}`}>
            <div className="dialog-title">
              {t(
                dialog.kind === 'link'
                  ? 'link.create'
                  : dialog.options.titleKey || 'dialog.ok',
              )}
            </div>

            {dialog.kind === 'text' && (
              <input
                ref={firstFieldRef}
                className="dialog-input"
                type="text"
                value={value}
                placeholder={
                  dialog.options.placeholderKey
                    ? t(dialog.options.placeholderKey)
                    : dialog.options.placeholder || ''
                }
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && accept()}
              />
            )}

            {dialog.kind === 'link' && (
              <div className="dialog-fields">
                <label htmlFor="link-text">{t('link.text')}</label>
                <input
                  ref={firstFieldRef}
                  id="link-text"
                  className="dialog-input"
                  type="text"
                  value={linkText}
                  placeholder={t('link.textPlaceholder')}
                  onChange={(event) => setLinkText(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && accept()}
                />
                <label htmlFor="link-url">{t('link.url')}</label>
                <input
                  id="link-url"
                  className="dialog-input"
                  type="text"
                  value={linkUrl}
                  placeholder="https://t.me/…"
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && accept()}
                />
              </div>
            )}

            {dialog.kind === 'confirm' && (
              <div className="dialog-body">{t(dialog.options.bodyKey || '')}</div>
            )}

            <div className="dialog-actions">
              <button type="button" className="dialog-btn" onClick={() => finish(cancelled)}>
                {t('dialog.cancel')}
              </button>
              <button
                type="button"
                className={`dialog-btn primary${dialog.options.danger ? ' danger' : ''}`}
                disabled={dialog.kind === 'link' && !linkUrl.trim()}
                onClick={accept}
              >
                {t(
                  dialog.kind === 'link'
                    ? 'link.createBtn'
                    : dialog.options.confirmKey || 'dialog.ok',
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
