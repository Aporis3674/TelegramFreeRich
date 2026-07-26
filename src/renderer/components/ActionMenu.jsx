/**
 * ActionMenu — renders a list of registry actions inside a Popover.
 *
 * An action with `children` (e.g. Heading) opens a second level in place, with a
 * back row at the top, mirroring how Telegram nests its heading choices.
 *
 * @module components/ActionMenu
 */

import { useState } from 'react';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';
import { isActionActive, isActionEnabled } from '../lib/editor-actions.js';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{
 *   actions: Array<object>,
 *   editor: object|null,
 *   ctx: object,
 *   onRun: (action: object) => void,
 * }} props
 */
export default function ActionMenu({ actions, editor, ctx, onRun }) {
  const { t } = useI18n();
  const [submenu, setSubmenu] = useState(null);

  const shown = submenu ? submenu.children : actions;

  return (
    <div className="menu-list">
      {submenu && (
        <button type="button" className="menu-item menu-back" onClick={() => setSubmenu(null)}>
          <span className="menu-icon">
            <ChevronLeftIcon size={18} />
          </span>
          <span className="menu-label">{t(submenu.i18nKey)}</span>
        </button>
      )}

      {shown.map((action) => {
        const Icon = action.icon;
        const enabled = isActionEnabled(action, editor);
        const active = isActionActive(action, editor, ctx);
        const hasChildren = Array.isArray(action.children) && action.children.length > 0;

        return (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            className={`menu-item${active ? ' active' : ''}${action.danger ? ' danger' : ''}`}
            disabled={!enabled}
            onClick={() => (hasChildren ? setSubmenu(action) : onRun(action))}
          >
            <span className="menu-icon">
              <Icon size={18} />
            </span>
            <span className="menu-label">
              {t(action.i18nKey)}
              {action.note && <span className="menu-note">{t(action.note)}</span>}
            </span>
            {action.hint && !hasChildren && <span className="menu-hint">{action.hint}</span>}
            {hasChildren ? (
              <span className="menu-chevron">
                <ChevronRightIcon size={15} />
              </span>
            ) : (
              active && (
                <span className="menu-check">
                  <CheckIcon size={15} />
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
