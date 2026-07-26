/**
 * Custom TipTap extensions covering the Telegram Bot API 10.1 rich blocks and
 * rich-text entities that no upstream extension provides.
 *
 * Each node/mark renders to HTML that `src/shared/block-parser.js` can read
 * back, so the editor DOM stays the single source of truth for serialization.
 *
 * @module components/extensions
 */

import { Mark, Node, mergeAttributes } from '@tiptap/core';

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
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
        getAttrs: (el) => ({ kind: 'video', src: el.getAttribute('src') || '' }),
      },
      {
        tag: 'audio[src]',
        getAttrs: (el) => ({ kind: 'audio', src: el.getAttribute('src') || '' }),
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

  addAttributes() {
    return {
      kind: {
        default: 'slideshow',
        parseHTML: (el) => el.getAttribute('data-kind') || 'slideshow',
        renderHTML: (attrs) => ({ 'data-kind': attrs.kind }),
      },
      images: {
        default: [],
        parseHTML: (el) => (el.getAttribute('data-images') || '').split(',').filter(Boolean),
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
