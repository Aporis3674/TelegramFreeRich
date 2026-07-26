/**
 * Preview — live Telegram-style bubble rendered from Block State.
 *
 * Everything is rendered as React elements (no `dangerouslySetInnerHTML`), so
 * message content can never inject markup into the app window.
 *
 * @module components/Preview
 */

import { useMemo } from 'react';
import { BlockType, InlineType } from '../../shared/block-types.js';
import { parseAllBlocks } from '../../shared/block-parser.js';
import { CloseIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';

/** Marks that map straight onto an HTML wrapper element. */
const MARK_TAGS = {
  [InlineType.BOLD]: 'strong',
  [InlineType.ITALIC]: 'em',
  [InlineType.UNDERLINE]: 'u',
  [InlineType.STRIKETHROUGH]: 's',
  [InlineType.CODE]: 'code',
  [InlineType.MARKED]: 'mark',
  [InlineType.SUBSCRIPT]: 'sub',
  [InlineType.SUPERSCRIPT]: 'sup',
};

/**
 * Render one inline segment with its marks applied.
 * @param {{ text: string, marks?: string[], href?: string }} segment
 * @param {number} index
 * @returns {React.ReactNode}
 */
function renderSegment(segment, index) {
  let node = segment.text;

  for (const mark of segment.marks || []) {
    const Tag = MARK_TAGS[mark];
    if (Tag) {
      node = <Tag>{node}</Tag>;
    } else if (mark === InlineType.SPOILER) {
      node = <span className="pv-spoiler">{node}</span>;
    } else if (mark === InlineType.MATH) {
      node = <span className="pv-math-inline">{node}</span>;
    }
  }

  if (segment.href) {
    node = (
      <a href={segment.href} target="_blank" rel="noreferrer">
        {node}
      </a>
    );
  }

  return <span key={index}>{node}</span>;
}

/**
 * Render a block's text, using inline segments when present.
 * @param {object} block
 * @returns {React.ReactNode}
 */
function renderText(block) {
  if (Array.isArray(block.inline) && block.inline.length > 0) {
    return block.inline.map(renderSegment);
  }
  return block.text || '';
}

/**
 * Render a single Block State entry.
 * @param {object} block
 * @param {number} index
 * @returns {React.ReactNode}
 */
function renderBlock(block, index) {
  const key = `${block.type}-${index}`;

  switch (block.type) {
    case BlockType.PARAGRAPH:
      return <p key={key}>{renderText(block)}</p>;

    case BlockType.HEADING: {
      const Tag = `h${Math.min(Math.max(block.level || 2, 1), 6)}`;
      return <Tag key={key}>{renderText(block)}</Tag>;
    }

    case BlockType.BLOCKQUOTE:
      return <blockquote key={key}>{renderText(block)}</blockquote>;

    case BlockType.PULLQUOTE:
      return (
        <blockquote key={key} className="pv-pullquote">
          {renderText(block)}
          {block.attribution && <footer>— {block.attribution}</footer>}
        </blockquote>
      );

    case BlockType.CODE_BLOCK:
      return (
        <pre key={key}>
          {block.language && <span className="pv-lang">{block.language}</span>}
          <code>{block.text}</code>
        </pre>
      );

    case BlockType.DIVIDER:
      return <hr key={key} />;

    case BlockType.LIST: {
      const Tag = block.style === 'numbered' ? 'ol' : 'ul';
      return (
        <Tag key={key}>
          {(block.items || []).map((item, i) => (
            <li key={i}>{typeof item === 'string' ? item : item.text || ''}</li>
          ))}
        </Tag>
      );
    }

    case BlockType.CHECKLIST:
      return (
        <ul key={key} className="pv-checklist">
          {(block.items || []).map((item, i) => (
            <li key={i} className={item.done ? 'done' : ''}>
              <span className="pv-box">{item.done ? '✓' : ''}</span>
              {item.text}
            </li>
          ))}
        </ul>
      );

    case BlockType.TABLE:
      return (
        <table key={key}>
          {(block.header || []).length > 0 && (
            <thead>
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i}>{cell}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(block.rows || []).map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case BlockType.DETAILS:
      return (
        <details key={key} open>
          <summary>{block.summary}</summary>
          <p>{block.content}</p>
        </details>
      );

    case BlockType.FOOTER:
      return <footer key={key}>{renderText(block)}</footer>;

    case BlockType.MATH_BLOCK:
      return (
        <div key={key} className="pv-math">
          {block.text}
        </div>
      );

    case BlockType.PHOTO:
      return <img key={key} src={block.url} alt={block.caption || ''} />;

    case BlockType.VIDEO:
      return <video key={key} src={block.url} controls />;

    case BlockType.AUDIO:
      return <audio key={key} src={block.url} controls />;

    case BlockType.SLIDESHOW:
    case BlockType.COLLAGE:
      return (
        <div
          key={key}
          className={block.type === BlockType.COLLAGE ? 'pv-collage' : 'pv-slideshow'}
        >
          {(block.images || []).map((src, i) => (
            <img key={i} src={src} alt="" />
          ))}
        </div>
      );

    case BlockType.MAP:
      return (
        <div key={key} className="pv-map">
          📍 {block.latitude}, {block.longitude}
        </div>
      );

    default:
      return null;
  }
}

/**
 * @param {{ html: string, isRtl: boolean, onClose: () => void }} props
 */
export default function Preview({ html, isRtl, onClose }) {
  const { t } = useI18n();

  const blocks = useMemo(() => {
    if (!html) return [];
    try {
      const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
      return parseAllBlocks(doc.body.firstChild);
    } catch {
      return [];
    }
  }, [html]);

  return (
    <aside className="preview">
      <div className="preview-head">
        <span>{t('preview.title')}</span>
        <span className="preview-count">
          {blocks.length > 0 ? t('preview.blocks', { count: blocks.length }) : ''}
        </span>
        <button
          type="button"
          className="tl-btn"
          onClick={onClose}
          aria-label={t('titlebar.preview')}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="preview-scroll">
        {blocks.length === 0 ? (
          <p className="preview-empty">{t('preview.empty')}</p>
        ) : (
          <div className="bubble" dir={isRtl ? 'rtl' : 'ltr'}>
            {blocks.map(renderBlock)}
          </div>
        )}
      </div>
    </aside>
  );
}
