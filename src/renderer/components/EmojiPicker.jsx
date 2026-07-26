/**
 * EmojiPicker — Telegram-style emoji panel: search field, category strip and a
 * scrolling grid. Inserts plain Unicode emoji (custom emoji are a Premium-only
 * entity that bots cannot upload).
 *
 * @module components/EmojiPicker
 */

import { useMemo, useRef, useState } from 'react';
import { EMOJI_CATEGORIES, searchEmoji } from '../lib/emoji-data.js';
import { SearchIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

/**
 * @param {{ onPick: (emoji: string) => void }} props
 */
export default function EmojiPicker({ onPick }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0].id);
  const gridRef = useRef(null);

  const results = useMemo(() => (query ? searchEmoji(query) : null), [query]);
  const active = EMOJI_CATEGORIES.find((c) => c.id === category) || EMOJI_CATEGORIES[0];
  const shown = results || active.emojis;

  return (
    <div className="emoji-panel">
      <div className="emoji-search">
        <SearchIcon size={16} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('emoji.search')}
          autoFocus
        />
      </div>

      {!query && (
        <div className="emoji-tabs">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`emoji-tab${cat.id === category ? ' active' : ''}`}
              title={t(cat.id)}
              onClick={() => {
                setCategory(cat.id);
                if (gridRef.current) gridRef.current.scrollTop = 0;
              }}
            >
              {cat.emojis[0].char}
            </button>
          ))}
        </div>
      )}

      <div className="emoji-grid" ref={gridRef}>
        {shown.length === 0 && <div className="emoji-empty">{t('emoji.empty')}</div>}
        {shown.map((emoji) => (
          <button
            key={emoji.char}
            type="button"
            className="emoji-cell"
            title={emoji.keywords}
            onClick={() => onPick(emoji.char)}
          >
            {emoji.char}
          </button>
        ))}
      </div>
    </div>
  );
}
