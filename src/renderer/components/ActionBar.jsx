/**
 * Action bar — Clear, char count, mode tabs, send button.
 */

import { useCallback } from 'react';

/**
 * @param {{
 *   charCount: number,
 *   mode: string,
 *   onModeChange: (m: string) => void,
 *   tokenSet: boolean,
 *   sending: boolean,
 *   onSend: () => void,
 *   onClear: () => void,
 * }} props
 */
export default function ActionBar({
  charCount,
  mode,
  onModeChange,
  tokenSet,
  sending,
  onSend,
  onClear,
}) {
  const handleClear = useCallback(() => {
    if (confirm('Clear all content?')) onClear();
  }, [onClear]);

  return (
    <div className="action-bar">
      <button className="action-btn action-clear" onClick={handleClear} title="Clear All">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      <div className="action-spacer" />

      <div className="action-bottom-info">
        <span className="char-count" style={{ color: charCount > 32768 ? 'var(--danger)' : '' }}>
          {charCount.toLocaleString()} / 32,768
        </span>

        <div className="mode-tabs">
          {['rich', 'draft', 'edit'].map((m) => (
            <button
              key={m}
              className={`mode-tab ${mode === m ? 'active' : ''}`}
              onClick={() => onModeChange(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className={`status-dot ${tokenSet ? 'connected' : ''}`} />
      </div>

      <button
        className="send-btn"
        onClick={onSend}
        disabled={sending}
        title="Send"
        style={{ opacity: sending ? 0.5 : 1 }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" fill="none" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
