/**
 * BottomBar — the composer footer from the reference UI:
 *
 *   ( ✦A )                        1 234 / 32 768   ( 🗑 )  ( ➤ )
 *
 * The wand opens the insert palette, the trash clears the message and the
 * salmon circle sends. Right-clicking (or long-pressing) the send button opens
 * the send-mode menu — rich message, draft or edit — mirroring Telegram's
 * "send options" affordance.
 *
 * @module components/BottomBar
 */

import { useCallback, useRef, useState } from 'react';
import Popover from './Popover.jsx';
import InsertPalette from './InsertPalette.jsx';
import { MAX_CHARS } from '../../shared/constants.js';
import { CheckIcon, SendIcon, TrashIcon, WandIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

const MODES = [
  { id: 'rich', i18nKey: 'send.rich' },
  { id: 'draft', i18nKey: 'send.draft' },
  { id: 'edit', i18nKey: 'send.edit' },
];

/**
 * @param {{
 *   editor: object|null,
 *   ctx: object,
 *   charCount: number,
 *   mode: string,
 *   onModeChange: (mode: string) => void,
 *   sending: boolean,
 *   onSend: () => void,
 *   onClear: () => void,
 * }} props
 */
export default function BottomBar({
  editor,
  ctx,
  charCount,
  mode,
  onModeChange,
  sending,
  onSend,
  onClear,
}) {
  const { t } = useI18n();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const wandRef = useRef(null);
  const sendRef = useRef(null);

  const runAction = useCallback(
    (action) => {
      setPaletteOpen(false);
      if (!editor) return;
      Promise.resolve(action.run(editor, ctx)).catch(() =>
        ctx.notify('toast.networkError', 'error'),
      );
    },
    [editor, ctx],
  );

  const over = charCount > MAX_CHARS;
  const modeLabel = MODES.find((m) => m.id === mode);

  return (
    <div className="bottombar">
      <button
        ref={wandRef}
        type="button"
        className={`bb-btn${paletteOpen ? ' active' : ''}`}
        title={t('bottom.palette')}
        aria-label={t('bottom.palette')}
        onClick={() => setPaletteOpen((v) => !v)}
      >
        <WandIcon size={20} />
      </button>

      <div className="bb-spacer">
        {mode !== 'rich' && <span className="bb-mode">{t(modeLabel.i18nKey)}</span>}
        {charCount > 0 && (
          <span className={`bb-chars${over ? ' over' : ''}`}>
            {t('bottom.chars', {
              count: charCount.toLocaleString(),
              max: MAX_CHARS.toLocaleString(),
            })}
          </span>
        )}
      </div>

      <button
        type="button"
        className="bb-btn"
        title={t('bottom.clear')}
        aria-label={t('bottom.clear')}
        onClick={onClear}
      >
        <TrashIcon size={20} />
      </button>

      <button
        ref={sendRef}
        type="button"
        className="bb-send"
        title={`${t('bottom.send')} — Ctrl+Enter`}
        aria-label={t('bottom.send')}
        disabled={sending || over}
        onClick={onSend}
        onContextMenu={(event) => {
          event.preventDefault();
          setSendMenuOpen(true);
        }}
      >
        <SendIcon size={21} />
      </button>

      <Popover
        open={paletteOpen}
        anchorEl={wandRef.current}
        align="start"
        placement="top"
        onClose={() => setPaletteOpen(false)}
        className="popover-palette"
      >
        <InsertPalette editor={editor} onRun={runAction} />
      </Popover>

      <Popover
        open={sendMenuOpen}
        anchorEl={sendRef.current}
        align="end"
        placement="top"
        onClose={() => setSendMenuOpen(false)}
      >
        <div className="menu-list">
          <div className="menu-title">{t('send.menuTitle')}</div>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`menu-item${item.id === mode ? ' active' : ''}`}
              onClick={() => {
                onModeChange(item.id);
                setSendMenuOpen(false);
              }}
            >
              <span className="menu-label">{t(item.i18nKey)}</span>
              {item.id === mode && (
                <span className="menu-check">
                  <CheckIcon size={15} />
                </span>
              )}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}
