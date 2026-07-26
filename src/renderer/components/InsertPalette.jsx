/**
 * InsertPalette — searchable command list behind the wand button.
 * Surfaces every registered block and inline format in one place, so nothing is
 * hidden behind a menu the user has to guess at.
 *
 * @module components/InsertPalette
 */

import { useMemo, useState } from 'react';
import { SearchIcon } from './Icons.jsx';
import { allActions, filterActions, isActionEnabled } from '../lib/editor-actions.js';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{ editor: object|null, onRun: (action: object) => void }} props
 */
export default function InsertPalette({ editor, onRun }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const actions = useMemo(() => allActions(), []);
  const shown = useMemo(() => filterActions(actions, query, t), [actions, query, t]);

  return (
    <div className="palette">
      <div className="palette-search">
        <SearchIcon size={16} />
        <input
          type="text"
          value={query}
          placeholder={t('palette.search')}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
      </div>

      <div className="palette-list">
        {shown.length === 0 && <div className="palette-empty">{t('palette.empty')}</div>}
        {shown.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="menu-item"
              disabled={!isActionEnabled(action, editor)}
              onClick={() => onRun(action)}
            >
              <span className="menu-icon">
                <Icon size={18} />
              </span>
              <span className="menu-label">{t(action.i18nKey)}</span>
              {action.hint && <span className="menu-hint">{action.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
