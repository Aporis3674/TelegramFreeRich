/**
 * Dialog — promise-based text prompt and confirmation, replacing the browser
 * `prompt()` / `confirm()` calls (blocked in Electron and visually foreign).
 *
 * Usage:
 *   const { askText, confirm } = useDialogs();
 *   const url = await askText({ titleKey: 'toolbar.link', placeholder: 'https://' });
 *
 * @module components/Dialog
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.js';

const DialogContext = createContext(null);

/**
 * Access the dialog helpers.
 * @returns {{ askText: (opts: object) => Promise<string|null>, confirm: (opts: object) => Promise<boolean> }}
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
  const inputRef = useRef(null);

  const askText = useCallback(
    (options = {}) =>
      new Promise((resolve) => {
        setValue(options.value || '');
        setDialog({ kind: 'text', options, resolve });
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
    },
    [dialog],
  );

  useEffect(() => {
    if (dialog && dialog.kind === 'text' && inputRef.current) inputRef.current.focus();
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(dialog.kind === 'confirm' ? false : null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, finish]);

  return (
    <DialogContext.Provider value={{ askText, confirm }}>
      {children}

      {dialog && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              finish(dialog.kind === 'confirm' ? false : null);
            }
          }}
        >
          <div className={`dialog${dialog.kind === 'confirm' ? ' dialog-confirm' : ''}`}>
            <div className="dialog-title">
              {t(dialog.options.titleKey || 'dialog.ok')}
            </div>

            {dialog.kind === 'text' ? (
              <input
                ref={inputRef}
                className="dialog-input"
                type="text"
                value={value}
                placeholder={dialog.options.placeholder || ''}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') finish(value.trim() ? value : null);
                }}
              />
            ) : (
              <div className="dialog-body">{t(dialog.options.bodyKey || '')}</div>
            )}

            <div className="dialog-actions">
              <button type="button" className="dialog-btn" onClick={() => finish(dialog.kind === 'confirm' ? false : null)}>
                {t('dialog.cancel')}
              </button>
              <button
                type="button"
                className={`dialog-btn primary${dialog.options.danger ? ' danger' : ''}`}
                onClick={() => finish(dialog.kind === 'confirm' ? true : value.trim() ? value : null)}
              >
                {t(dialog.options.confirmKey || 'dialog.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
