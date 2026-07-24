/**
 * SettingsPanel — Modal for configuring bot token, chat ID, theme, language.
 * All sensitive data goes through IPC — token never stored in renderer.
 */

import { useState, useCallback } from 'react';

/**
 * @param {{ settings: object, onSave: (s: object) => void, onTest: () => Promise, onClose: () => void }} props
 */
export default function SettingsPanel({ settings, onSave, onTest, onClose }) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState(settings.chatId || '');
  const [editId, setEditId] = useState('');
  const [lang, setLang] = useState(settings.lang || 'en');
  const [theme, setTheme] = useState(
    localStorage.getItem('tfr-theme') || 'dark'
  );
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch {
      setTestResult({ ok: false, description: 'Network error' });
    }
    setTesting(false);
  }, [onTest]);

  const handleSave = useCallback(() => {
    const toSave = { lang, theme };
    if (token.trim()) toSave.token = token.trim();
    if (chatId.trim()) toSave.chatId = chatId.trim();
    if (editId.trim()) toSave.editId = editId.trim();
    onSave(toSave);
  }, [token, chatId, editId, lang, theme, onSave]);

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="panel-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="panel-body">
          <label>Bot Token</label>
          <input
            type="password"
            placeholder={settings.tokenSet ? '•••••••• (saved encrypted)' : 'From @BotFather'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
          />

          <label>Chat ID</label>
          <input
            type="text"
            placeholder="@channel or numeric ID"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            autoComplete="off"
          />

          <label>Edit Message ID</label>
          <input
            type="text"
            placeholder="Message ID to edit"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            autoComplete="off"
          />

          <label>Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="fa">فارسی</option>
          </select>

          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>

          <button className="btn-primary" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div id="connection-status" className={testResult.ok ? 'ok' : 'error'}>
              {testResult.ok ? `✓ @${testResult.username} connected` : `✗ ${testResult.description}`}
            </div>
          )}

          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
