import React, { useState } from 'react';

export default function Settings({ settings, onSave, onClose, theme, onToggleTheme }) {
  const [form, setForm] = useState({ ...settings });
  const [focusEditor, setFocusEditor] = useState(() => {
    try { return localStorage.getItem('tfr-focus') === 'true'; } catch { return false; }
  });

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    onSave(form);
    localStorage.setItem('tfr-settings', JSON.stringify(form));
    localStorage.setItem('tfr-focus', String(focusEditor));
    onClose();
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Theme */}
          <div className="settings-group">
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Dark Theme</span>
              <button
                className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                onClick={onToggleTheme}
              />
            </div>
          </div>

          {/* Focus Editor */}
          <div className="settings-group">
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Focus Mode (hidden preview)</span>
              <button
                className={`toggle-switch ${focusEditor ? 'active' : ''}`}
                onClick={() => setFocusEditor(v => !v)}
              />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          {/* Bot Token */}
          <div className="settings-group">
            <label className="settings-label">Bot Token</label>
            <input
              className="settings-input"
              type="text"
              value={form.botToken}
              onChange={(e) => update('botToken', e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
            <span className="settings-hint">Token from @BotFather</span>
          </div>

          {/* Chat ID */}
          <div className="settings-group">
            <label className="settings-label">Chat ID</label>
            <input
              className="settings-input"
              type="text"
              value={form.chatId}
              onChange={(e) => update('chatId', e.target.value)}
              placeholder="@channel or chat_id"
            />
            <span className="settings-hint">Channel username (@name) or numeric chat ID</span>
          </div>

          {/* Send Method */}
          <div className="settings-group">
            <label className="settings-label">Send Method</label>
            <select
              className="settings-select"
              value={form.method}
              onChange={(e) => update('method', e.target.value)}
            >
              <option value="sendRichMessage">sendRichMessage (Rich format)</option>
              <option value="sendMessage">sendMessage (Plain text)</option>
              <option value="sendPhoto">sendPhoto (With photo)</option>
              <option value="sendDocument">sendDocument (As document)</option>
            </select>
          </div>

          <button className="settings-save-btn" onClick={save}>
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
