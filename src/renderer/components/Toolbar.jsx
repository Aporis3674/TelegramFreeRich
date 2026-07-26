/**
 * Toolbar — the pill toolbar from Telegram Desktop's rich-text composer.
 *
 * Layout (left → right):
 *   [ undo ][ redo ]   [ Aa ][ B ][ list ][ table ][ link ][ image ][ Σ ]   ( ☺ )
 *
 * Each button is an outlined pill; buttons that open a menu render their
 * options through <Popover>. The toolbar itself stays unbadged — the violet
 * Premium stars live next to the individual features inside the menus.
 *
 * @module components/Toolbar
 */

import { useCallback, useRef, useState } from 'react';
import ActionMenu from './ActionMenu.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import Popover from './Popover.jsx';
import {
  BoldIcon,
  BulletListIcon,
  EmojiIcon,
  FormulaIcon,
  ImageIcon,
  LinkIcon,
  RedoIcon,
  TableIcon,
  TextStyleIcon,
  UndoIcon,
} from './Icons.jsx';
import {
  FORMAT_ACTIONS,
  FORMULA_ACTIONS,
  LIST_ACTIONS,
  MEDIA_ACTIONS,
  TABLE_ACTIONS,
  TEXT_STYLE_ACTIONS,
  toggleLink,
} from '../lib/editor-actions.js';
import { useI18n } from '../i18n/index.js';

/**
 * A single outlined toolbar pill.
 * @param {{
 *   icon: Function,
 *   label: string,
 *   onClick: (event: React.MouseEvent) => void,
 *   active?: boolean,
 *   disabled?: boolean,
 *   round?: boolean,
 *   wide?: boolean,
 *   buttonRef?: React.Ref<HTMLButtonElement>,
 * }} props
 */
function TbButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  round = false,
  wide = false,
  buttonRef,
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`tb-btn${round ? ' round' : ''}${wide ? ' wide' : ''}${active ? ' active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon size={20} />
    </button>
  );
}

/**
 * @param {{ editor: object|null, ctx: object }} props
 */
export default function Toolbar({ editor, ctx }) {
  const { t } = useI18n();
  const [menu, setMenu] = useState(null);
  const textStyleRef = useRef(null);
  const formatRef = useRef(null);
  const listsRef = useRef(null);
  const tableRef = useRef(null);
  const mediaRef = useRef(null);
  const formulaRef = useRef(null);
  const emojiRef = useRef(null);

  const close = useCallback(() => setMenu(null), []);
  const toggle = useCallback((id) => setMenu((prev) => (prev === id ? null : id)), []);

  const run = useCallback(
    (action) => {
      close();
      if (!editor) return;
      Promise.resolve(action.run(editor, ctx)).catch(() =>
        ctx.notify('toast.networkError', 'error'),
      );
    },
    [editor, ctx, close],
  );

  const insertEmoji = useCallback(
    (emoji) => {
      if (editor) editor.chain().focus().insertContent(emoji).run();
    },
    [editor],
  );

  const menus = [
    { id: 'textStyle', actions: TEXT_STYLE_ACTIONS, anchor: textStyleRef, align: 'start' },
    { id: 'format', actions: FORMAT_ACTIONS, anchor: formatRef, align: 'start' },
    { id: 'lists', actions: LIST_ACTIONS, anchor: listsRef, align: 'start' },
    { id: 'table', actions: TABLE_ACTIONS, anchor: tableRef, align: 'start' },
    { id: 'media', actions: MEDIA_ACTIONS, anchor: mediaRef, align: 'center' },
    { id: 'formula', actions: FORMULA_ACTIONS, anchor: formulaRef, align: 'end' },
  ];

  const canUndo = !!editor && editor.can().undo();
  const canRedo = !!editor && editor.can().redo();

  return (
    <div className="tfr-toolbar">
      <div className="tb-group">
        <TbButton
          icon={UndoIcon}
          label={t('toolbar.undo')}
          disabled={!canUndo}
          onClick={() => editor && editor.chain().focus().undo().run()}
        />
        <TbButton
          icon={RedoIcon}
          label={t('toolbar.redo')}
          disabled={!canRedo}
          onClick={() => editor && editor.chain().focus().redo().run()}
        />
      </div>

      <div className="tb-group">
        <TbButton
          buttonRef={textStyleRef}
          icon={TextStyleIcon}
          label={t('toolbar.textStyle')}
          wide
          active={menu === 'textStyle'}
          onClick={() => toggle('textStyle')}
        />
        <TbButton
          buttonRef={formatRef}
          icon={BoldIcon}
          label={t('toolbar.format')}
          active={menu === 'format'}
          onClick={() => toggle('format')}
        />
        <TbButton
          buttonRef={listsRef}
          icon={BulletListIcon}
          label={t('toolbar.lists')}
          active={menu === 'lists'}
          onClick={() => toggle('lists')}
        />
        <TbButton
          buttonRef={tableRef}
          icon={TableIcon}
          label={t('toolbar.table')}
          active={menu === 'table'}
          onClick={() => toggle('table')}
        />
        <TbButton
          icon={LinkIcon}
          label={t('toolbar.link')}
          active={!!editor && editor.isActive('link')}
          onClick={() => editor && toggleLink(editor, ctx)}
        />
        <TbButton
          buttonRef={mediaRef}
          icon={ImageIcon}
          label={t('toolbar.media')}
          active={menu === 'media'}
          onClick={() => toggle('media')}
        />
        <TbButton
          buttonRef={formulaRef}
          icon={FormulaIcon}
          label={t('toolbar.formula')}
          active={menu === 'formula'}
          onClick={() => toggle('formula')}
        />
      </div>

      <div className="tb-group tb-group-trailing">
        <TbButton
          buttonRef={emojiRef}
          icon={EmojiIcon}
          label={t('toolbar.emoji')}
          round
          active={menu === 'emoji'}
          onClick={() => toggle('emoji')}
        />
      </div>

      {menus.map((config) => (
        <Popover
          key={config.id}
          open={menu === config.id}
          anchorEl={config.anchor.current}
          align={config.align}
          onClose={close}
        >
          <ActionMenu actions={config.actions} editor={editor} ctx={ctx} onRun={run} />
        </Popover>
      ))}

      <Popover
        open={menu === 'emoji'}
        anchorEl={emojiRef.current}
        align="end"
        onClose={close}
        className="popover-emoji"
      >
        <EmojiPicker onPick={insertEmoji} />
      </Popover>
    </div>
  );
}
