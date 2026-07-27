/**
 * Custom TipTap extensions covering the Telegram Bot API 10.1 rich blocks and
 * rich-text entities that no upstream extension provides.
 *
 * Each node/mark renders to HTML that `src/shared/block-parser.js` can read
 * back, so the editor DOM stays the single source of truth for serialization.
 *
 * @module components/extensions
 */

import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core';
import { mediaKindForUrl } from '../lib/editor-actions.js';
import { MEDIA_SCHEMES, safeUrl } from '../../shared/html-serializer.js';

/* ─────────────────────── Gallery node view helpers ─────────────────────── */

/** Glyph standing in for a media file that the app cannot preview. */
export const KIND_GLYPH = { video: '▶', audio: '♪', photo: '🖼' };

/**
 * The last path segment of a URL, short enough to sit under a glyph.
 * @param {string} url
 * @returns {string}
 */
export function fileNameOf(url) {
  const clean = String(url).split(/[?#]/)[0];
  const name = clean.slice(clean.lastIndexOf('/') + 1) || clean;
  return name.length > 30 ? `${name.slice(0, 29)}…` : name;
}

/**
 * A tile shown when the media itself will not load in the app window.
 *
 * A Telegram CDN link often refuses to play here while Telegram renders it
 * perfectly once sent — so this says what the file is instead of showing a
 * broken-image icon.
 *
 * @param {string} url
 * @param {(key: string) => string} t
 * @returns {HTMLElement}
 */
function fallbackTile(url, t) {
  const kind = mediaKindForUrl(url);
  const box = document.createElement('div');
  box.className = 'tg-gallery-fallback';
  box.title = url;

  const glyph = document.createElement('span');
  glyph.className = 'tg-gallery-glyph';
  glyph.textContent = KIND_GLYPH[kind] || KIND_GLYPH.photo;

  const name = document.createElement('span');
  name.className = 'tg-gallery-name';
  name.textContent = fileNameOf(url);

  const note = document.createElement('span');
  note.className = 'tg-gallery-note';
  note.textContent = t('gallery.noPreview');

  box.append(glyph, name, note);
  return box;
}

/**
 * The media element for one gallery entry, falling back to a labelled tile if
 * the browser cannot load it.
 * @param {string} url
 * @param {(key: string) => string} t
 * @returns {HTMLElement}
 */
function mediaTile(url, t) {
  const kind = mediaKindForUrl(url);
  const el = document.createElement(kind === 'photo' ? 'img' : kind);
  el.src = url;
  if (kind !== 'photo') {
    el.controls = true;
    el.preload = 'metadata';
  } else {
    el.alt = '';
  }
  el.addEventListener('error', () => {
    if (el.parentNode) el.replaceWith(fallbackTile(url, t));
  });
  return el;
}

/**
 * @param {string} className
 * @param {string} label
 * @param {string} glyph
 * @param {() => void} onClick
 * @returns {HTMLButtonElement}
 */
function navButton(className, label, glyph, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.textContent = glyph;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  return button;
}

/* ───────────────────────────── Marks ───────────────────────────── */

/** Spoiler mark — `RichTextSpoiler`. */
export const Spoiler = Mark.create({
  name: 'spoiler',

  parseHTML() {
    return [{ tag: 'span[data-spoiler]' }, { tag: 'span.tg-spoiler' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-spoiler': '', class: 'tg-spoiler' }),
      0,
    ];
  },

  addCommands() {
    return {
      setSpoiler:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleSpoiler:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetSpoiler:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Shift-p': () => this.editor.commands.toggleSpoiler() };
  },
});

/** Inline math mark — `RichTextMath`. */
export const InlineMath = Mark.create({
  name: 'inlineMath',

  parseHTML() {
    return [{ tag: 'span[data-inline-math]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-inline-math': '', class: 'tg-math-inline' }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleInlineMath:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      insertInlineMath:
        (formula = '') =>
        ({ commands }) =>
          commands.insertContent(`<span data-inline-math="">${formula}</span>`),
    };
  },
});

/* ───────────────────────────── Nodes ───────────────────────────── */

/** Pull quote / aside block — `InputRichBlockAside`. */
export const PullQuote = Node.create({
  name: 'pullQuote',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      attribution: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-attribution') || '',
        renderHTML: (attrs) =>
          attrs.attribution ? { 'data-attribution': attrs.attribution } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'blockquote[data-pullquote]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(HTMLAttributes, { 'data-pullquote': '', class: 'tg-pullquote' }),
      0,
    ];
  },

  addCommands() {
    return {
      setPullQuote:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      togglePullQuote:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

/**
 * Who said it — the `<cite>` a quote may carry.
 *
 * Rich HTML documents `<blockquote>text<cite>Author</cite></blockquote>` and the
 * same for `<aside>`, so both quote kinds can name a source. `PullQuote` above
 * declares its own `attribution`; this adds the matching one to the plain
 * blockquote that StarterKit provides, and one command that writes to whichever
 * of the two the caret is in.
 */
export const QuoteAttribution = Extension.create({
  name: 'quoteAttribution',

  addGlobalAttributes() {
    return [
      {
        types: ['blockquote'],
        attributes: {
          attribution: {
            default: '',
            parseHTML: (element) => element.getAttribute('data-attribution') || '',
            renderHTML: (attrs) =>
              attrs.attribution ? { 'data-attribution': attrs.attribution } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setQuoteAttribution:
        (attribution = '') =>
        ({ commands, editor }) =>
          commands.updateAttributes(editor.isActive('pullQuote') ? 'pullQuote' : 'blockquote', {
            attribution,
          }),
    };
  },
});

/**
 * The `<figcaption>` a media item may carry.
 *
 * Rich HTML puts the caption after the media it belongs to, and the caption may
 * name its own source:
 *
 *   <video src="…"/><figcaption>Clip title<cite>The Author</cite></figcaption>
 *
 * TipTap's Image and the gallery node get the pair here; MediaBlock declares it
 * itself, above.
 */
export const MediaCaption = Extension.create({
  name: 'mediaCaption',

  addGlobalAttributes() {
    return [
      {
        types: ['image', 'galleryBlock'],
        attributes: {
          caption: {
            default: '',
            parseHTML: (element) => element.getAttribute('data-caption') || '',
            renderHTML: (attrs) => (attrs.caption ? { 'data-caption': attrs.caption } : {}),
          },
          credit: {
            default: '',
            parseHTML: (element) => element.getAttribute('data-credit') || '',
            renderHTML: (attrs) => (attrs.credit ? { 'data-credit': attrs.credit } : {}),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setMediaCaption:
        (caption = '', credit = '') =>
        ({ commands, editor }) => {
          const node = ['image', 'mediaBlock', 'galleryBlock'].find((name) =>
            editor.isActive(name),
          );
          return node ? commands.updateAttributes(node, { caption, credit }) : false;
        },
    };
  },
});

/** Collapsible block — `InputRichBlockDetails`. */
export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      summary: {
        default: 'Details',
        parseHTML: (element) => {
          const summary = element.querySelector('summary');
          return summary ? summary.textContent : 'Details';
        },
        renderHTML: (attrs) => ({ 'data-summary': attrs.summary || '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, { open: 'open' }),
      ['summary', { contenteditable: 'false' }, node.attrs.summary || 'Details'],
      ['div', { class: 'details-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setDetails:
        (summary = 'Details') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { summary },
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});

/** Footer block — `InputRichBlockFooter`. */
export const Footer = Node.create({
  name: 'footer',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'footer' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['footer', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFooter:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
      toggleFooter:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, 'paragraph'),
    };
  },
});

/** Block math — `InputRichBlockMath`. */
export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      formula: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-formula') || element.textContent || '',
        renderHTML: (attrs) => ({ 'data-formula': attrs.formula || '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.tg-math' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const formula = node.attrs.formula || '';
    return ['div', mergeAttributes(HTMLAttributes, { class: 'tg-math' }), `$$${formula}$$`];
  },

  addCommands() {
    return {
      setMathBlock:
        (formula = '') =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { formula } }),
    };
  },
});

/** Video / audio block — `InputRichBlockVideo` and `InputRichBlockAudio`. */
export const MediaBlock = Node.create({
  name: 'mediaBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: { default: 'video' },
      src: { default: '' },
      caption: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-caption') || '',
        renderHTML: (attrs) => (attrs.caption ? { 'data-caption': attrs.caption } : {}),
      },
      credit: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-credit') || '',
        renderHTML: (attrs) => (attrs.credit ? { 'data-credit': attrs.credit } : {}),
      },
    };
  },

  parseHTML() {
    return [
      // Same filter as the gallery, and for the same reason: the editor must
      // not show media the serializer will drop.
      {
        tag: 'video[src]',
        getAttrs: (el) => ({ kind: 'video', src: safeUrl(el.getAttribute('src'), MEDIA_SCHEMES) }),
      },
      {
        tag: 'audio[src]',
        getAttrs: (el) => ({ kind: 'audio', src: safeUrl(el.getAttribute('src'), MEDIA_SCHEMES) }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const tag = node.attrs.kind === 'audio' ? 'audio' : 'video';
    return [
      tag,
      mergeAttributes(HTMLAttributes, {
        src: node.attrs.src,
        controls: 'true',
        class: `tg-${tag}`,
      }),
    ];
  },

  addCommands() {
    return {
      setMediaBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

/** Slideshow / collage block — `InputRichBlockSlideshow` and `InputRichBlockCollage`. */
export const GalleryBlock = Node.create({
  name: 'galleryBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addOptions() {
    // The node view is plain DOM, so it cannot use the React i18n hook; the
    // editor is configured with a getter that reads the current language.
    return { t: (key) => key };
  },

  addAttributes() {
    return {
      kind: {
        default: 'slideshow',
        parseHTML: (el) => el.getAttribute('data-kind') || 'slideshow',
        renderHTML: (attrs) => ({ 'data-kind': attrs.kind }),
      },
      images: {
        default: [],
        // Filtered on the way in, with the list the serializer uses. Pasted
        // gallery markup would otherwise show tiles in the editor for URLs the
        // message silently drops.
        parseHTML: (el) =>
          (el.getAttribute('data-images') || '')
            .split(',')
            .map((src) => safeUrl(src.trim(), MEDIA_SCHEMES))
            .filter(Boolean),
        renderHTML: (attrs) => ({ 'data-images': (attrs.images || []).join(',') }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.tg-gallery' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const images = node.attrs.images || [];
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'tg-gallery' }),
      ...images.map((src) => ['img', { src, alt: '' }]),
    ];
  },

  /**
   * A slideshow is one frame at a time with ‹ › controls; a collage keeps its
   * grid, because that is what a collage is. Either way the node view only
   * changes what is *shown* — `renderHTML` above is what `getHTML()` and the
   * serializer read, so the wire format is untouched.
   */
  addNodeView() {
    const t = this.options.t;

    return ({ node: initialNode }) => {
      let current = initialNode;
      let index = 0;

      const dom = document.createElement('div');
      const stage = document.createElement('div');
      stage.className = 'tg-gallery-stage';

      const render = () => {
        const images = current.attrs.images || [];
        const kind = current.attrs.kind === 'collage' ? 'collage' : 'slideshow';
        const single = images.length < 2;

        dom.className = 'tg-gallery';
        dom.setAttribute('data-kind', kind);
        dom.setAttribute('data-images', images.join(','));
        dom.replaceChildren(stage);

        if (index > images.length - 1) index = Math.max(0, images.length - 1);

        if (kind === 'collage') {
          stage.replaceChildren(...images.map((url) => mediaTile(url, t)));
          return;
        }

        stage.replaceChildren(...(images.length ? [mediaTile(images[index], t)] : []));
        if (single) return;

        const step = (delta) => {
          index = (index + delta + images.length) % images.length;
          render();
        };

        const count = document.createElement('span');
        count.className = 'tg-gallery-count';
        count.textContent = `${index + 1} / ${images.length}`;

        const dots = document.createElement('div');
        dots.className = 'tg-gallery-dots';
        images.forEach((_, i) => {
          const dot = navButton(
            `tg-gallery-dot${i === index ? ' active' : ''}`,
            String(i + 1),
            '',
            () => {
              index = i;
              render();
            },
          );
          dots.append(dot);
        });

        dom.append(
          navButton('tg-gallery-nav prev', t('gallery.prev'), '‹', () => step(-1)),
          navButton('tg-gallery-nav next', t('gallery.next'), '›', () => step(1)),
          count,
          dots,
        );
      };

      render();

      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== current.type.name) return false;
          current = updated;
          render();
          return true;
        },
        // The node view redraws itself; ProseMirror must not read its DOM back.
        ignoreMutation: () => true,
        // Let the controls take their own clicks, but leave every other event
        // to ProseMirror so the block can still be selected and deleted.
        stopEvent: (event) => {
          const target = event.target;
          return !!(target && target.closest && target.closest('button'));
        },
      };
    };
  },

  addCommands() {
    return {
      setGalleryBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

/** Map block — `InputRichBlockMap`. */
export const MapBlock = Node.create({
  name: 'mapBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latitude: {
        default: 0,
        parseHTML: (el) => parseFloat(el.getAttribute('data-lat')) || 0,
        renderHTML: (attrs) => ({ 'data-lat': String(attrs.latitude) }),
      },
      longitude: {
        default: 0,
        parseHTML: (el) => parseFloat(el.getAttribute('data-lon')) || 0,
        renderHTML: (attrs) => ({ 'data-lon': String(attrs.longitude) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.tg-map' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { latitude, longitude } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'tg-map' }),
      `📍 ${latitude}, ${longitude}`,
    ];
  },

  addCommands() {
    return {
      setMapBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
