/**
 * ActionMenu — renders a list of registry actions inside a Popover.
 * Shows the icon, translated label, optional shortcut hint, the violet
 * Premium star (features Telegram charges for, free in this app) and a
 * checkmark for active state.
 *
 * @module components/ActionMenu
 */

import { CheckIcon, PremiumStar } from './Icons.jsx';
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

  return (
    <div className="menu-list">
      {actions.map((action) => {
        const Icon = action.icon;
        const enabled = isActionEnabled(action, editor);
        const active = isActionActive(action, editor, ctx);

        return (
          <div key={action.id}>
            {action.separated && <div className="menu-sep" />}
            <button
              type="button"
              role="menuitem"
              className={`menu-item${active ? ' active' : ''}${action.danger ? ' danger' : ''}`}
              disabled={!enabled}
              onClick={() => onRun(action)}
            >
              <span className="menu-icon">
                <Icon size={18} />
              </span>
              <span className="menu-label">
                {t(action.i18nKey)}
                {action.note && <span className="menu-note">{t(action.note)}</span>}
              </span>
              {action.premium && (
                <span className="menu-premium" title={t('premium.free')}>
                  <PremiumStar size={11} />
                </span>
              )}
              {action.hint && <span className="menu-hint">{action.hint}</span>}
              {active && (
                <span className="menu-check">
                  <CheckIcon size={15} />
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
