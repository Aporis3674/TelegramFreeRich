/**
 * Settings — bot token, chat ID, edit target, language and theme.
 * The token is written straight to the main process (OS-encrypted) and is never
 * held in renderer state; the panel only ever knows whether one exists.
 *
 * @module components/Settings
 */

import { useEffect, useState } from 'react';
import { CloseIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   settings: object,
 *   onSaved: (settings: object) => void,
 *   theme: string,
 *   onThemeChange: (theme: string) => void,
 *   lang: string,
 *   onLangChange: (lang: string) => void,
 * }} props
 */
export default function Settings({
  open,
  onClose,
  settings,
  onSaved,
  theme,
  onThemeChange,
  lang,
  onLangChange,
}) {
  const { t } = useI18n();
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [editId, setEditId] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToken('');
    setChatId(settings.chatId || '');
    setEditId(settings.editId || '');
    setStatus({ text: '', type: '' });
  }, [open, settings]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    const payload = { chatId, lang };
    if (token) payload.token = token;

    try {
      const result = await window.app.saveSettings(payload);
      if (!result.ok) {
        setStatus({ text: result.description || t('toast.networkError'), type: 'error' });
        setSaving(false);
        return;
      }
      onSaved({
        tokenSet: !!token || settings.tokenSet,
        chatId,
        editId,
        lang,
      });
      onClose();
    } catch {
      setStatus({ text: t('toast.networkError'), type: 'error' });
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setStatus({ text: t('settings.testing'), type: '' });

    try {
      if (token) {
        const saved = await window.app.saveSettings({ token });
        if (!saved.ok) {
          setStatus({ text: saved.description || t('toast.networkError'), type: 'error' });
          setTesting(false);
          return;
        }
        onSaved({ ...settings, tokenSet: true });
      }
      const data = await window.app.testConnection();
      if (data.ok) {
        setStatus({ text: `✓ @${data.result.username}`, type: 'ok' });
      } else {
        setStatus({ text: `✗ ${data.description}`, type: 'error' });
      }
    } catch {
      setStatus({ text: t('toast.networkError'), type: 'error' });
    }
    setTesting(false);
  }

  return (
    <div
      className="overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="sheet">
        <div className="sheet-head">
          <h3>{t('settings.title')}</h3>
          <button
            type="button"
            className="sheet-close"
            onClick={onClose}
            aria-label={t('window.close')}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="sheet-body">
          <label htmlFor="set-token">
            {settings.tokenSet ? t('settings.tokenSaved') : t('settings.token')}
          </label>
          <input
            id="set-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={
              settings.tokenSet ? t('settings.tokenKeep') : t('settings.tokenPlaceholder')
            }
            autoComplete="off"
          />

          <label htmlFor="set-chat">{t('settings.chatId')}</label>
          <input
            id="set-chat"
            type="text"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            placeholder={t('settings.chatIdPlaceholder')}
            autoComplete="off"
          />

          <label htmlFor="set-edit">{t('settings.editId')}</label>
          <input
            id="set-edit"
            type="text"
            value={editId}
            onChange={(event) => setEditId(event.target.value)}
            placeholder={t('settings.editIdPlaceholder')}
            autoComplete="off"
          />

          <div className="sheet-row">
            <div className="sheet-field">
              <label htmlFor="set-lang">{t('settings.language')}</label>
              <select
                id="set-lang"
                value={lang}
                onChange={(event) => onLangChange(event.target.value)}
              >
                <option value="en">English</option>
                <option value="fa">فارسی</option>
              </select>
            </div>
            <div className="sheet-field">
              <label htmlFor="set-theme">{t('settings.theme')}</label>
              <select
                id="set-theme"
                value={theme}
                onChange={(event) => onThemeChange(event.target.value)}
              >
                <option value="dark">{t('settings.themeDark')}</option>
                <option value="light">{t('settings.themeLight')}</option>
              </select>
            </div>
          </div>

          {status.text && <div className={`sheet-status ${status.type}`}>{status.text}</div>}

          <p className="sheet-note">{t('settings.security')}</p>

          <div className="sheet-actions">
            <button type="button" className="dialog-btn" onClick={handleTest} disabled={testing}>
              {testing ? t('settings.testing') : t('settings.testConnection')}
            </button>
            <button
              type="button"
              className="dialog-btn primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
