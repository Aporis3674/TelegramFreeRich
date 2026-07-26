/**
 * Editor action registry — the single source of truth for every command the UI
 * can run. The seven toolbar menus, the table bubble menu and the insert palette
 * all read from this file, so a feature is declared exactly once.
 *
 * Every action is a plain object:
 *   id       unique key, also used as the React key
 *   i18nKey  translation key for the visible label
 *   icon     component from ./components/Icons.jsx
 *   children optional sub-list (renders as a second menu level, e.g. Heading)
 *   run      (editor, ctx) => void | Promise<void>
 *   isActive (editor) => boolean — optional, drives the checkmark/active state
 *   enabled  (editor) => boolean — optional, greys the item out
 *   hint     optional shortcut string shown right-aligned in menus
 *
 * `ctx` is supplied by App.jsx and provides UI services the pure registry must
 * not own: { askText, askLink, notify }.
 *
 * @module lib/editor-actions
 */

import {
  AudioIcon,
  BoldIcon,
  BulletListIcon,
  ChecklistIcon,
  ClearFormatIcon,
  CodeBlockIcon,
  CodeIcon,
  CollageIcon,
  DetailsIcon,
  DividerIcon,
  FooterIcon,
  FormulaIcon,
  HeadingIcon,
  HighlightIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  MapIcon,
  MathInlineIcon,
  OrderedListIcon,
  ParagraphIcon,
  PullQuoteIcon,
  QuoteIcon,
  SpoilerIcon,
  StrikeIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  UnderlineIcon,
} from '../components/Icons.jsx';
import { sanitizeUrl } from '../../shared/utils.js';

/** Convenience: run a chained command on a focused editor. */
const chain = (editor) => editor.chain().focus();

/* ═════════════════════ 1. Formatting — the "Aa" button ═════════════════════ */

/** Heading levels, shown as a second menu level under "Heading". */
export const HEADING_ACTIONS = [1, 2, 3, 4, 5, 6].map((level) => ({
  id: `heading${level}`,
  i18nKey: `block.heading${level}`,
  icon: (props) => HeadingIcon({ ...props, level }),
  run: (editor) => chain(editor).toggleHeading({ level }).run(),
  isActive: (editor) => editor.isActive('heading', { level }),
}));

export const TEXT_STYLE_ACTIONS = [
  {
    id: 'heading',
    i18nKey: 'block.heading',
    icon: (props) => HeadingIcon({ ...props, level: '' }),
    children: HEADING_ACTIONS,
    isActive: (editor) => editor.isActive('heading'),
  },
  {
    id: 'paragraph',
    i18nKey: 'block.text',
    icon: ParagraphIcon,
    run: (editor) => chain(editor).setParagraph().run(),
    isActive: (editor) => editor.isActive('paragraph'),
  },
  {
    id: 'blockquote',
    i18nKey: 'block.blockquote',
    icon: QuoteIcon,
    run: (editor) => chain(editor).toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
  {
    id: 'pullquote',
    i18nKey: 'block.pullquote',
    icon: PullQuoteIcon,
    run: (editor) => chain(editor).togglePullQuote().run(),
    isActive: (editor) => editor.isActive('pullQuote'),
  },
  {
    id: 'codeBlock',
    i18nKey: 'block.codeBlock',
    icon: CodeBlockIcon,
    run: (editor) => chain(editor).toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  {
    id: 'footer',
    i18nKey: 'block.footer',
    icon: FooterIcon,
    run: (editor) => chain(editor).setFooter().run(),
    isActive: (editor) => editor.isActive('footer'),
  },
  {
    id: 'divider',
    i18nKey: 'block.divider',
    icon: DividerIcon,
    run: (editor) => chain(editor).setHorizontalRule().run(),
  },
];

/* ═════════════════════ 2. Text style — the "B" button ═════════════════════ */

export const FORMAT_ACTIONS = [
  {
    id: 'bold',
    i18nKey: 'format.bold',
    icon: BoldIcon,
    hint: 'Ctrl+B',
    run: (editor) => chain(editor).toggleBold().run(),
    isActive: (editor) => editor.isActive('bold'),
  },
  {
    id: 'italic',
    i18nKey: 'format.italic',
    icon: ItalicIcon,
    hint: 'Ctrl+I',
    run: (editor) => chain(editor).toggleItalic().run(),
    isActive: (editor) => editor.isActive('italic'),
  },
  {
    id: 'underline',
    i18nKey: 'format.underline',
    icon: UnderlineIcon,
    hint: 'Ctrl+U',
    run: (editor) => chain(editor).toggleUnderline().run(),
    isActive: (editor) => editor.isActive('underline'),
  },
  {
    id: 'strike',
    i18nKey: 'format.strike',
    icon: StrikeIcon,
    hint: 'Ctrl+Shift+X',
    run: (editor) => chain(editor).toggleStrike().run(),
    isActive: (editor) => editor.isActive('strike'),
  },
  {
    id: 'spoiler',
    i18nKey: 'format.spoiler',
    icon: SpoilerIcon,
    hint: 'Ctrl+Shift+P',
    run: (editor) => chain(editor).toggleSpoiler().run(),
    isActive: (editor) => editor.isActive('spoiler'),
  },
  {
    id: 'subscript',
    i18nKey: 'format.subscript',
    icon: SubscriptIcon,
    run: (editor) => chain(editor).toggleSubscript().run(),
    isActive: (editor) => editor.isActive('subscript'),
  },
  {
    id: 'superscript',
    i18nKey: 'format.superscript',
    icon: SuperscriptIcon,
    run: (editor) => chain(editor).toggleSuperscript().run(),
    isActive: (editor) => editor.isActive('superscript'),
  },
  {
    id: 'marked',
    i18nKey: 'format.marked',
    icon: HighlightIcon,
    run: (editor) => chain(editor).toggleHighlight().run(),
    isActive: (editor) => editor.isActive('highlight'),
  },
];

/* ═════════════════════ 3. Lists — the list button ═════════════════════ */

export const LIST_ACTIONS = [
  {
    id: 'orderedList',
    i18nKey: 'block.orderedList',
    icon: OrderedListIcon,
    run: (editor) => chain(editor).toggleOrderedList().run(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    id: 'bulletList',
    i18nKey: 'block.bulletList',
    icon: BulletListIcon,
    run: (editor) => chain(editor).toggleBulletList().run(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    id: 'checklist',
    i18nKey: 'block.checklist',
    icon: ChecklistIcon,
    note: 'block.checklistNote',
    run: (editor) => chain(editor).toggleTaskList().run(),
    isActive: (editor) => editor.isActive('taskList'),
  },
  {
    id: 'details',
    i18nKey: 'block.details',
    icon: DetailsIcon,
    run: (editor) => chain(editor).setDetails().run(),
    isActive: (editor) => editor.isActive('details'),
  },
];

/* ═════════════════════ 4. Table — direct insert + bubble menu ═════════════ */

/**
 * Insert a ready-to-edit 3×3 table with a header row.
 * @param {object} editor
 */
export function insertTable(editor) {
  chain(editor).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}

/** Row/column controls shown in the bubble menu while the caret is in a table. */
export const TABLE_ACTIONS = [
  {
    id: 'addRow',
    i18nKey: 'table.addRow',
    icon: TableIcon,
    run: (editor) => chain(editor).addRowAfter().run(),
  },
  {
    id: 'addColumn',
    i18nKey: 'table.addColumn',
    icon: TableIcon,
    run: (editor) => chain(editor).addColumnAfter().run(),
  },
  {
    id: 'deleteRow',
    i18nKey: 'table.deleteRow',
    icon: TableIcon,
    run: (editor) => chain(editor).deleteRow().run(),
  },
  {
    id: 'deleteColumn',
    i18nKey: 'table.deleteColumn',
    icon: TableIcon,
    run: (editor) => chain(editor).deleteColumn().run(),
  },
  {
    id: 'deleteTable',
    i18nKey: 'table.delete',
    icon: TableIcon,
    danger: true,
    run: (editor) => chain(editor).deleteTable().run(),
  },
];

/* ═════════════════════ 5. Link — the chain button ═════════════════════ */

/**
 * Open the "Create link" panel and apply the result.
 * With a selection, the panel's Text field is prefilled and the selection is
 * replaced; without one, the entered text is inserted as a link.
 * @param {object} editor
 * @param {object} ctx
 */
export async function insertLink(editor, ctx) {
  const { from, to, empty } = editor.state.selection;
  const selected = empty ? '' : editor.state.doc.textBetween(from, to, ' ');
  const existing = editor.getAttributes('link').href || '';

  const result = await ctx.askLink({ text: selected, url: existing });
  if (!result) return;

  const href = sanitizeUrl((result.url || '').trim());
  if (!href) {
    ctx.notify('toast.unsafeUrl', 'error');
    return;
  }
  const label = (result.text || '').trim() || href;

  chain(editor)
    .insertContent({
      type: 'text',
      text: label,
      marks: [{ type: 'link', attrs: { href } }],
    })
    .run();
}

/** Registry entry so the palette can reach the link panel too. */
export const LINK_ACTION = {
  id: 'link',
  i18nKey: 'toolbar.link',
  icon: LinkIcon,
  hint: 'Ctrl+K',
  run: (editor, ctx) => insertLink(editor, ctx),
  isActive: (editor) => editor.isActive('link'),
};

/* ═════════════════════ 6. Media — the photo button ═════════════════════ */

const VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v|avi)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|ogg|oga|wav|m4a|flac|opus|aac)(\?|#|$)/i;

/**
 * Guess which rich block a media URL belongs to.
 * @param {string} url
 * @returns {'video'|'audio'|'photo'}
 */
export function mediaKindForUrl(url) {
  if (VIDEO_EXT.test(url)) return 'video';
  if (AUDIO_EXT.test(url)) return 'audio';
  return 'photo';
}

/**
 * Split a comma-separated list of URLs and drop unsafe ones.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseUrlList(raw) {
  return String(raw || '')
    .split(',')
    .map((url) => sanitizeUrl(url.trim()))
    .filter(Boolean);
}

export const MEDIA_ACTIONS = [
  {
    id: 'photoOrVideo',
    i18nKey: 'media.photoOrVideo',
    icon: ImageIcon,
    note: 'media.photoOrVideoNote',
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.photoOrVideo',
        placeholder: 'https://a.jpg, https://b.mp4',
      });
      if (!raw) return;
      const urls = parseUrlList(raw);
      if (!urls.length) {
        ctx.notify('toast.unsafeUrl', 'error');
        return;
      }
      // Two or more files become a slideshow, exactly like Telegram groups them.
      if (urls.length > 1) {
        chain(editor).setGalleryBlock({ kind: 'slideshow', images: urls }).run();
        return;
      }
      const [url] = urls;
      const kind = mediaKindForUrl(url);
      if (kind === 'photo') chain(editor).setImage({ src: url }).run();
      else chain(editor).setMediaBlock({ kind, src: url }).run();
    },
  },
  {
    id: 'audioFile',
    i18nKey: 'media.audioFile',
    icon: AudioIcon,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.audioFile',
        placeholder: 'https://example.com/song.mp3',
      });
      if (!raw) return;
      const [url] = parseUrlList(raw);
      if (!url) {
        ctx.notify('toast.unsafeUrl', 'error');
        return;
      }
      chain(editor).setMediaBlock({ kind: 'audio', src: url }).run();
    },
  },
  {
    id: 'location',
    i18nKey: 'media.location',
    icon: MapIcon,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.locationPrompt',
        placeholder: '35.6892, 51.3890',
      });
      if (!raw) return;
      const [lat, lon] = raw.split(',').map((n) => parseFloat(n.trim()));
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        ctx.notify('toast.invalidCoords', 'error');
        return;
      }
      chain(editor).setMapBlock({ latitude: lat, longitude: lon }).run();
    },
  },
];

/* ═════════════════════ 7. Formula — the sigma button ═════════════════════ */

/**
 * Ask for a formula and insert it as a block.
 * @param {object} editor
 * @param {object} ctx
 */
export async function insertFormula(editor, ctx) {
  const formula = await ctx.askText({
    titleKey: 'toolbar.formula',
    placeholder: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
  });
  if (!formula) return;
  chain(editor).setMathBlock(formula).run();
}

export const FORMULA_ACTION = {
  id: 'formula',
  i18nKey: 'toolbar.formula',
  icon: FormulaIcon,
  run: (editor, ctx) => insertFormula(editor, ctx),
};

/* ═════ Palette-only extras — reachable from the insert palette (wand) ═════ */

export const EXTRA_ACTIONS = [
  {
    id: 'code',
    i18nKey: 'format.code',
    icon: CodeIcon,
    hint: 'Ctrl+E',
    run: (editor) => chain(editor).toggleCode().run(),
    isActive: (editor) => editor.isActive('code'),
  },
  {
    id: 'clearFormat',
    i18nKey: 'format.clear',
    icon: ClearFormatIcon,
    run: (editor) => chain(editor).unsetAllMarks().run(),
  },
  {
    id: 'mathInline',
    i18nKey: 'formula.inline',
    icon: MathInlineIcon,
    run: async (editor, ctx) => {
      const formula = await ctx.askText({ titleKey: 'formula.inline', placeholder: 'a^2 + b^2' });
      if (!formula) return;
      chain(editor).insertInlineMath(formula).run();
    },
  },
  {
    id: 'collage',
    i18nKey: 'media.collage',
    icon: CollageIcon,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.collage',
        placeholder: 'https://a.jpg, https://b.jpg',
      });
      if (!raw) return;
      const images = parseUrlList(raw);
      if (!images.length) {
        ctx.notify('toast.unsafeUrl', 'error');
        return;
      }
      chain(editor).setGalleryBlock({ kind: 'collage', images }).run();
    },
  },
  {
    id: 'insertTable',
    i18nKey: 'table.insert',
    icon: TableIcon,
    run: (editor) => insertTable(editor),
  },
];

/* ═════════════════════════ Palette helpers ═════════════════════════ */

/**
 * Flat list of every action, used by the insert palette (the wand button).
 * Second-level items (heading levels) are flattened in; the parent is dropped.
 * @returns {Array<object>}
 */
export function allActions() {
  const flat = [];
  for (const action of TEXT_STYLE_ACTIONS) {
    if (action.children) flat.push(...action.children);
    else flat.push(action);
  }
  return [
    ...FORMAT_ACTIONS,
    LINK_ACTION,
    ...flat,
    ...LIST_ACTIONS,
    ...MEDIA_ACTIONS,
    FORMULA_ACTION,
    ...EXTRA_ACTIONS,
  ];
}

/**
 * Filter actions by a search query against their translated labels.
 * @param {Array<object>} actions
 * @param {string} query
 * @param {(key: string) => string} translate
 * @returns {Array<object>}
 */
export function filterActions(actions, query, translate) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return actions;
  return actions.filter((action) => {
    const label = translate(action.i18nKey).toLowerCase();
    return label.includes(q) || action.id.toLowerCase().includes(q);
  });
}

/**
 * Resolve whether an action is currently enabled.
 * @param {object} action
 * @param {object|null} editor
 * @returns {boolean}
 */
export function isActionEnabled(action, editor) {
  if (!editor) return false;
  if (typeof action.enabled !== 'function') return true;
  return !!action.enabled(editor);
}

/**
 * Resolve whether an action is currently active (checked).
 * @param {object} action
 * @param {object|null} editor
 * @param {object} [ctx]
 * @returns {boolean}
 */
export function isActionActive(action, editor, ctx) {
  if (typeof action.isActive !== 'function') return false;
  try {
    return !!action.isActive(editor, ctx);
  } catch {
    return false;
  }
}
