/**
 * Settings panel — Bot token, chat ID, theme, language.
 * Token never stored in renderer state after save.
 */

import { useState, useEffect } from 'react';

/**
 * @param {{ open: boolean, onClose: () => void, onSaved: (settings: object) => void, settings: object, theme: string, onThemeChange: (t: string) => void }} props
 */
export default function Settings({ open, onClose, onSaved, settings, theme, onThemeChange }) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [editId, setEditId] = useState('');
  const [lang, setLang] = useState('en');
  const [status, setStatus] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setToken('');
      setChatId(settings.chatId || '');
      setEditId(settings.editId || '');
      setLang(settings.lang || 'en');
      setStatus({ text: '', type: '' });
    }
  }, [open, settings]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    const payload = { chatId, lang };
    if (token) payload.token = token;

    try {
      const result = await window.app.saveSettings(payload);
      if (!result.ok) {
        setStatus({ text: result.description || 'Save failed', type: 'error' });
        setSaving(false);
        return;
      }
      onSaved({
        tokenSet: !!token || settings.tokenSet,
        chatId,
        lang,
        editId,
      });
      onClose();
    } catch {
      setStatus({ text: 'Failed to save settings', type: 'error' });
    }
    setSaving(false);
  }

  async function handleTest() {
    setStatus({ text: 'Testing...', type: '' });
    // If user typed a new token, save first then test
    if (token) {
      const saveResult = await window.app.saveSettings({ token });
      if (!saveResult.ok) {
        setStatus({ text: saveResult.description || 'Invalid token', type: 'error' });
        return;
      }
    }
    try {
      const data = await window.app.testConnection();
      if (data.ok) {
        setStatus({ text: `✓ @${data.result.username} connected`, type: 'ok' });
      } else {
        setStatus({ text: `✗ ${data.description}`, type: 'error' });
      }
    } catch {
      setStatus({ text: '✗ Network error', type: 'error' });
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        <div className="panel-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="panel-body">
          <label>Bot Token {settings.tokenSet ? '(saved encrypted)' : ''}</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={settings.tokenSet ? '•••••••• (leave blank to keep)' : 'From @BotFather'}
            autoComplete="off"
          />

          <label>Chat ID</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="@channel or numeric ID"
          />

          <label>Edit Message ID</label>
          <input
            type="text"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            placeholder="Message ID to edit"
          />

          <label>Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="fa">فارسی</option>
          </select>

          <label>Theme</label>
          <select value={theme} onChange={(e) => onThemeChange(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>

          <button className="btn-primary" onClick={handleTest}>Test Connection</button>
          {status.text && (
            <div className={status.type === 'ok' ? 'ok' : status.type === 'error' ? 'error' : ''}>
              {status.text}
            </div>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
