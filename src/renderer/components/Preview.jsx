/**
 * Preview — live Telegram-style bubble rendered from Block State.
 *
 * Everything is rendered as React elements (no `dangerouslySetInnerHTML`), so
 * message content can never inject markup into the app window.
 *
 * @module components/Preview
 */

import { useMemo, useState } from 'react';
import { BlockType, InlineType } from '../../shared/block-types.js';
import { parseAllBlocks } from '../../shared/block-parser.js';
import { CloseIcon } from './Icons.jsx';
import { useI18n } from '../i18n/index.js';
import { mediaKindForUrl } from '../lib/editor-actions.js';
import { KIND_GLYPH, fileNameOf } from './extensions.js';

/**
 * One gallery entry: the real media, or a labelled tile if it will not load.
 *
 * A Telegram CDN link often refuses to play inside the app while Telegram
 * renders it perfectly once sent, so a failure is reported as "not previewable"
 * rather than as a broken image.
 *
 * @param {{ url: string }} props
 */
function GalleryMedia({ url }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const kind = mediaKindForUrl(url);

  if (failed) {
    return (
      <div className="pv-gallery-fallback" title={url}>
        <span className="pv-gallery-glyph">{KIND_GLYPH[kind] || KIND_GLYPH.photo}</span>
        <span className="pv-gallery-name">{fileNameOf(url)}</span>
        <span className="pv-gallery-note">{t('gallery.noPreview')}</span>
      </div>
    );
  }

  if (kind === 'video') {
    return <video src={url} controls preload="metadata" onError={() => setFailed(true)} />;
  }
  if (kind === 'audio') {
    return <audio src={url} controls onError={() => setFailed(true)} />;
  }
  return <img src={url} alt="" onError={() => setFailed(true)} />;
}

/**
 * The caption under a media item — Rich HTML's `<figcaption>`, with the `<cite>`
 * it may carry.
 *
 * @param {{ caption?: string, credit?: string }} props
 */
function Figcaption({ caption, credit }) {
  if (!caption && !credit) return null;
  return (
    <figcaption className="pv-figcaption">
      {caption}
      {credit && <cite>{credit}</cite>}
    </figcaption>
  );
}

/**
 * A slideshow shows one frame at a time with ‹ › controls; a collage keeps its
 * grid, because that is what a collage is.
 *
 * @param {{ images: string[], collage: boolean }} props
 */
function PreviewGallery({ images, collage }) {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(0);

  if (images.length === 0) return null;

  if (collage) {
    return (
      <div className="pv-collage">
        {images.map((url, i) => (
          <GalleryMedia key={`${i}-${url}`} url={url} />
        ))}
      </div>
    );
  }

  // Clamped rather than reset in an effect: the list changes on every keystroke
  // while the same component instance stays mounted.
  const index = Math.min(cursor, images.length - 1);
  const step = (delta) => setCursor((index + delta + images.length) % images.length);

  return (
    <div className="pv-slideshow">
      <div className="pv-gallery-stage">
        <GalleryMedia key={images[index]} url={images[index]} />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="pv-gallery-nav prev"
            aria-label={t('gallery.prev')}
            onClick={() => step(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="pv-gallery-nav next"
            aria-label={t('gallery.next')}
            onClick={() => step(1)}
          >
            ›
          </button>
          <span className="pv-gallery-count">
            {index + 1} / {images.length}
          </span>
          <div className="pv-gallery-dots">
            {images.map((url, i) => (
              <button
                key={`${i}-${url}`}
                type="button"
                className={`pv-gallery-dot${i === index ? ' active' : ''}`}
                aria-label={String(i + 1)}
                onClick={() => setCursor(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
      return (
        <blockquote key={key}>
          {renderText(block)}
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      );

    case BlockType.PULLQUOTE:
      return (
        <blockquote key={key} className="pv-pullquote">
          {renderText(block)}
          {block.attribution && <cite>{block.attribution}</cite>}
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

    // The parser blanks a URL the message cannot carry. Showing an empty
    // <img> for it would be a broken-image icon standing in for something the
    // recipient will never see, so the block is left out entirely — which is
    // what the serializer does with it too.
    case BlockType.PHOTO:
      return block.url ? (
        <figure key={key} className="pv-figure">
          <img src={block.url} alt={block.caption || ''} />
          <Figcaption caption={block.caption} credit={block.credit} />
        </figure>
      ) : null;

    case BlockType.VIDEO:
      return block.url ? (
        <figure key={key} className="pv-figure">
          <video src={block.url} controls />
          <Figcaption caption={block.caption} credit={block.credit} />
        </figure>
      ) : null;

    case BlockType.AUDIO:
      return block.url ? (
        <figure key={key} className="pv-figure">
          <audio src={block.url} controls />
          <Figcaption caption={block.caption} credit={block.credit} />
        </figure>
      ) : null;

    case BlockType.SLIDESHOW:
    case BlockType.COLLAGE:
      return (
        <figure key={key} className="pv-figure">
          <PreviewGallery
            images={block.images || []}
            collage={block.type === BlockType.COLLAGE}
          />
          <Figcaption caption={block.caption} credit={block.credit} />
        </figure>
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
