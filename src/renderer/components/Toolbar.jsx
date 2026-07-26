/**
 * Toolbar — the rounded strip above the editor:
 *
 *   ( ↶ )( ↷ )   ( Aa )( B )( list )( table )( link )( media )( Σ )
 *
 * History sits in its own group; the seven formatting buttons follow.
 *
 * Aa, B, list and media open a vertical menu; table, link and Σ act straight
 * away (insert a table, open the "Create link" panel, ask for a formula).
 * There is no emoji button: custom emoji are Premium-only entities that a bot
 * cannot send through the rich-message API.
 *
 * @module components/Toolbar
 */

import { useCallback, useRef, useState } from 'react';
import ActionMenu from './ActionMenu.jsx';
import Popover from './Popover.jsx';
import {
  BoldIcon,
  BulletListIcon,
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
  LIST_ACTIONS,
  MEDIA_ACTIONS,
  TEXT_STYLE_ACTIONS,
  insertFormula,
  insertLink,
  insertTable,
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
  wide = false,
  buttonRef,
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`tb-btn${wide ? ' wide' : ''}${active ? ' active' : ''}`}
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
  const formattingRef = useRef(null);
  const styleRef = useRef(null);
  const listRef = useRef(null);
  const mediaRef = useRef(null);

  const close = useCallback(() => setMenu(null), []);
  const toggle = useCallback((id) => setMenu((prev) => (prev === id ? null : id)), []);

  /** Run a menu action, closing the menu first. */
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

  /** Run a direct (menu-less) toolbar command. */
  const direct = useCallback(
    (fn) => {
      close();
      if (!editor) return;
      Promise.resolve(fn(editor, ctx)).catch(() => ctx.notify('toast.networkError', 'error'));
    },
    [editor, ctx, close],
  );

  const menus = [
    { id: 'formatting', actions: TEXT_STYLE_ACTIONS, anchor: formattingRef, align: 'start' },
    { id: 'style', actions: FORMAT_ACTIONS, anchor: styleRef, align: 'start' },
    { id: 'list', actions: LIST_ACTIONS, anchor: listRef, align: 'start' },
    { id: 'media', actions: MEDIA_ACTIONS, anchor: mediaRef, align: 'center' },
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
          buttonRef={formattingRef}
          icon={TextStyleIcon}
          label={t('toolbar.formatting')}
          wide
          active={menu === 'formatting'}
          onClick={() => toggle('formatting')}
        />
        <TbButton
          buttonRef={styleRef}
          icon={BoldIcon}
          label={t('toolbar.textStyle')}
          active={menu === 'style'}
          onClick={() => toggle('style')}
        />
        <TbButton
          buttonRef={listRef}
          icon={BulletListIcon}
          label={t('toolbar.lists')}
          active={menu === 'list'}
          onClick={() => toggle('list')}
        />
        <TbButton
          icon={TableIcon}
          label={t('toolbar.table')}
          active={!!editor && editor.isActive('table')}
          onClick={() => direct(insertTable)}
        />
        <TbButton
          icon={LinkIcon}
          label={t('toolbar.link')}
          active={!!editor && editor.isActive('link')}
          onClick={() => direct(insertLink)}
        />
        <TbButton
          buttonRef={mediaRef}
          icon={ImageIcon}
          label={t('toolbar.media')}
          active={menu === 'media'}
          onClick={() => toggle('media')}
        />
        <TbButton
          icon={FormulaIcon}
          label={t('toolbar.formula')}
          onClick={() => direct(insertFormula)}
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
    </div>
  );
}
