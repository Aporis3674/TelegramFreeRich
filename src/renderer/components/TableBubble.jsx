/**
 * TableBubble — floating row/column controls that appear while the caret sits
 * inside a table, so a table can be reshaped with the mouse after the toolbar
 * inserted it. Column widths are dragged directly on the table borders (the
 * Table extension is configured with `resizable`).
 *
 * @module components/TableBubble
 */

import { BubbleMenu } from '@tiptap/react';
import { TrashIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{ editor: object|null }} props
 */
export default function TableBubble({ editor }) {
  const { t } = useI18n();
  if (!editor) return null;

  const cmd = (fn) => () => fn(editor.chain().focus()).run();

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubble"
      shouldShow={({ editor: ed }) => ed.isActive('table')}
      tippyOptions={{ placement: 'top', duration: 120 }}
    >
      <div className="table-bubble">
        <button type="button" className="table-bubble-btn" title={t('table.addRow')} onClick={cmd((c) => c.addRowAfter())}>
          + {t('table.row')}
        </button>
        <button
          type="button"
          className="table-bubble-btn"
          title={t('table.addColumn')}
          onClick={cmd((c) => c.addColumnAfter())}
        >
          + {t('table.column')}
        </button>
        <span className="table-bubble-sep" />
        <button type="button" className="table-bubble-btn" title={t('table.deleteRow')} onClick={cmd((c) => c.deleteRow())}>
          − {t('table.row')}
        </button>
        <button
          type="button"
          className="table-bubble-btn"
          title={t('table.deleteColumn')}
          onClick={cmd((c) => c.deleteColumn())}
        >
          − {t('table.column')}
        </button>
        <span className="table-bubble-sep" />
        <button
          type="button"
          className="table-bubble-btn danger"
          title={t('table.delete')}
          onClick={cmd((c) => c.deleteTable())}
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </BubbleMenu>
  );
}
