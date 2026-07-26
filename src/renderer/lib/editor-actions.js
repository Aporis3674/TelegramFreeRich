/**
 * Editor action registry — the single source of truth for every command the UI
 * can run. The toolbar menus, the insert palette and the keyboard shortcuts all
 * read from this file, so a feature only ever has to be declared once.
 *
 * Every action is a plain object:
 *   id       unique key, also used as the React key
 *   i18nKey  translation key for the visible label
 *   icon     component from ./components/Icons.jsx
 *   premium  true when Telegram gates the feature behind Premium
 *            (free here — that is the whole point of the app)
 *   run      (editor, ctx) => void | Promise<void>
 *   isActive (editor) => boolean — optional, drives the checkmark/active state
 *   hint     optional shortcut string shown right-aligned in menus
 *
 * `ctx` is supplied by App.jsx and provides UI services the pure registry
 * must not own: { askText, pickFile, toggleRtl, isRtl, notify }.
 *
 * @module lib/editor-actions
 */

import {
  AudioIcon,
  BulletListIcon,
  ChecklistIcon,
  ClearFormatIcon,
  CodeBlockIcon,
  CodeIcon,
  CollageIcon,
  DetailsIcon,
  DividerIcon,
  FileIcon,
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
  RtlIcon,
  SlideshowIcon,
  SpoilerIcon,
  StrikeIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  UnderlineIcon,
  VideoIcon,
  BoldIcon,
} from '../components/Icons.jsx';
import { sanitizeUrl } from '../../shared/utils.js';

/** Convenience: run a chained command on a focused editor. */
const chain = (editor) => editor.chain().focus();

/* ═════════════════════════ Text style ("Aa") ═════════════════════════ */

/** @type {Array<object>} */
export const TEXT_STYLE_ACTIONS = [
  {
    id: 'paragraph',
    i18nKey: 'block.paragraph',
    icon: ParagraphIcon,
    run: (editor) => chain(editor).setParagraph().run(),
    isActive: (editor) => editor.isActive('paragraph'),
  },
  ...[1, 2, 3, 4, 5, 6].map((level) => ({
    id: `heading${level}`,
    i18nKey: `block.heading${level}`,
    icon: (props) => HeadingIcon({ ...props, level }),
    run: (editor) => chain(editor).toggleHeading({ level }).run(),
    isActive: (editor) => editor.isActive('heading', { level }),
  })),
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
    premium: true,
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
    premium: true,
    run: (editor) => chain(editor).setFooter().run(),
    isActive: (editor) => editor.isActive('footer'),
  },
  {
    id: 'details',
    i18nKey: 'block.details',
    icon: DetailsIcon,
    premium: true,
    run: (editor) => chain(editor).setDetails().run(),
    isActive: (editor) => editor.isActive('details'),
  },
  {
    id: 'divider',
    i18nKey: 'block.divider',
    icon: DividerIcon,
    run: (editor) => chain(editor).setHorizontalRule().run(),
  },
  {
    id: 'rtl',
    i18nKey: 'block.rtl',
    icon: RtlIcon,
    separated: true,
    run: (_editor, ctx) => ctx.toggleRtl(),
    isActive: (_editor, ctx) => !!(ctx && ctx.isRtl),
  },
];

/* ═════════════════════════ Inline format ("B") ═════════════════════════ */

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
    premium: true,
    hint: 'Ctrl+Shift+P',
    run: (editor) => chain(editor).toggleSpoiler().run(),
    isActive: (editor) => editor.isActive('spoiler'),
  },
  {
    id: 'highlight',
    i18nKey: 'format.highlight',
    icon: HighlightIcon,
    premium: true,
    run: (editor) => chain(editor).toggleHighlight().run(),
    isActive: (editor) => editor.isActive('highlight'),
  },
  {
    id: 'code',
    i18nKey: 'format.code',
    icon: CodeIcon,
    hint: 'Ctrl+E',
    run: (editor) => chain(editor).toggleCode().run(),
    isActive: (editor) => editor.isActive('code'),
  },
  {
    id: 'subscript',
    i18nKey: 'format.subscript',
    icon: SubscriptIcon,
    premium: true,
    run: (editor) => chain(editor).toggleSubscript().run(),
    isActive: (editor) => editor.isActive('subscript'),
  },
  {
    id: 'superscript',
    i18nKey: 'format.superscript',
    icon: SuperscriptIcon,
    premium: true,
    run: (editor) => chain(editor).toggleSuperscript().run(),
    isActive: (editor) => editor.isActive('superscript'),
  },
  {
    id: 'clearFormat',
    i18nKey: 'format.clear',
    icon: ClearFormatIcon,
    separated: true,
    run: (editor) => chain(editor).unsetAllMarks().run(),
  },
];

/* ═════════════════════════ Lists ═════════════════════════ */

export const LIST_ACTIONS = [
  {
    id: 'bulletList',
    i18nKey: 'block.bulletList',
    icon: BulletListIcon,
    run: (editor) => chain(editor).toggleBulletList().run(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    id: 'orderedList',
    i18nKey: 'block.orderedList',
    icon: OrderedListIcon,
    run: (editor) => chain(editor).toggleOrderedList().run(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    id: 'checklist',
    i18nKey: 'block.checklist',
    icon: ChecklistIcon,
    premium: true,
    note: 'block.checklistNote',
    run: (editor) => chain(editor).toggleTaskList().run(),
    isActive: (editor) => editor.isActive('taskList'),
  },
];

/* ═════════════════════════ Table ═════════════════════════ */

export const TABLE_ACTIONS = [
  {
    id: 'insertTable',
    i18nKey: 'table.insert',
    icon: TableIcon,
    run: (editor) => chain(editor).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'addColumn',
    i18nKey: 'table.addColumn',
    icon: TableIcon,
    separated: true,
    enabled: (editor) => editor.isActive('table'),
    run: (editor) => chain(editor).addColumnAfter().run(),
  },
  {
    id: 'addRow',
    i18nKey: 'table.addRow',
    icon: TableIcon,
    enabled: (editor) => editor.isActive('table'),
    run: (editor) => chain(editor).addRowAfter().run(),
  },
  {
    id: 'deleteColumn',
    i18nKey: 'table.deleteColumn',
    icon: TableIcon,
    enabled: (editor) => editor.isActive('table'),
    run: (editor) => chain(editor).deleteColumn().run(),
  },
  {
    id: 'deleteRow',
    i18nKey: 'table.deleteRow',
    icon: TableIcon,
    enabled: (editor) => editor.isActive('table'),
    run: (editor) => chain(editor).deleteRow().run(),
  },
  {
    id: 'deleteTable',
    i18nKey: 'table.delete',
    icon: TableIcon,
    danger: true,
    enabled: (editor) => editor.isActive('table'),
    run: (editor) => chain(editor).deleteTable().run(),
  },
];

/* ═════════════════════════ Media ═════════════════════════ */

/**
 * Insert a media node after asking the user for a URL (or a local file).
 * @param {object} editor
 * @param {object} ctx
 * @param {string} kind - 'photo' | 'video' | 'audio'
 * @param {string} titleKey
 */
async function insertMediaFromUrl(editor, ctx, kind, titleKey) {
  const raw = await ctx.askText({ titleKey, placeholder: 'https://', value: '' });
  if (!raw) return;
  const url = sanitizeUrl(raw.trim());
  if (!url) {
    ctx.notify('toast.unsafeUrl', 'error');
    return;
  }
  if (kind === 'photo') chain(editor).setImage({ src: url }).run();
  else chain(editor).setMediaBlock({ kind, src: url }).run();
}

export const MEDIA_ACTIONS = [
  {
    id: 'imageUrl',
    i18nKey: 'media.imageUrl',
    icon: ImageIcon,
    premium: true,
    run: (editor, ctx) => insertMediaFromUrl(editor, ctx, 'photo', 'media.imageUrl'),
  },
  {
    id: 'imageFile',
    i18nKey: 'media.imageFile',
    icon: FileIcon,
    premium: true,
    run: async (editor, ctx) => {
      const filePath = await ctx.pickFile('image');
      if (!filePath) return;
      chain(editor)
        .setImage({ src: `file://${filePath}` })
        .run();
    },
  },
  {
    id: 'video',
    i18nKey: 'media.video',
    icon: VideoIcon,
    premium: true,
    separated: true,
    run: (editor, ctx) => insertMediaFromUrl(editor, ctx, 'video', 'media.video'),
  },
  {
    id: 'audio',
    i18nKey: 'media.audio',
    icon: AudioIcon,
    premium: true,
    run: (editor, ctx) => insertMediaFromUrl(editor, ctx, 'audio', 'media.audio'),
  },
  {
    id: 'slideshow',
    i18nKey: 'media.slideshow',
    icon: SlideshowIcon,
    premium: true,
    separated: true,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.slideshow',
        placeholder: 'https://a.jpg, https://b.jpg',
      });
      if (!raw) return;
      const images = raw
        .split(',')
        .map((u) => sanitizeUrl(u.trim()))
        .filter(Boolean);
      if (!images.length) return;
      chain(editor).setGalleryBlock({ kind: 'slideshow', images }).run();
    },
  },
  {
    id: 'collage',
    i18nKey: 'media.collage',
    icon: CollageIcon,
    premium: true,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({
        titleKey: 'media.collage',
        placeholder: 'https://a.jpg, https://b.jpg',
      });
      if (!raw) return;
      const images = raw
        .split(',')
        .map((u) => sanitizeUrl(u.trim()))
        .filter(Boolean);
      if (!images.length) return;
      chain(editor).setGalleryBlock({ kind: 'collage', images }).run();
    },
  },
  {
    id: 'map',
    i18nKey: 'media.map',
    icon: MapIcon,
    premium: true,
    run: async (editor, ctx) => {
      const raw = await ctx.askText({ titleKey: 'media.mapPrompt', placeholder: '35.6892, 51.3890' });
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

/* ═════════════════════════ Formula ═════════════════════════ */

export const FORMULA_ACTIONS = [
  {
    id: 'mathBlock',
    i18nKey: 'formula.block',
    icon: FormulaIcon,
    premium: true,
    run: async (editor, ctx) => {
      const formula = await ctx.askText({
        titleKey: 'formula.block',
        placeholder: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
      });
      if (!formula) return;
      chain(editor).setMathBlock(formula).run();
    },
  },
  {
    id: 'mathInline',
    i18nKey: 'formula.inline',
    icon: MathInlineIcon,
    premium: true,
    run: async (editor, ctx) => {
      const formula = await ctx.askText({ titleKey: 'formula.inline', placeholder: 'a^2 + b^2' });
      if (!formula) return;
      chain(editor).insertInlineMath(formula).run();
    },
  },
];

/* ═════════════════════════ Link ═════════════════════════ */

/**
 * Toggle a link on the current selection, asking for the target when adding.
 * @param {object} editor
 * @param {object} ctx
 */
export async function toggleLink(editor, ctx) {
  if (editor.isActive('link')) {
    chain(editor).unsetLink().run();
    return;
  }
  const previous = editor.getAttributes('link').href || '';
  const raw = await ctx.askText({
    titleKey: 'toolbar.link',
    placeholder: 'https://t.me/…',
    value: previous,
  });
  if (!raw) return;
  const href = sanitizeUrl(raw.trim());
  if (!href) {
    ctx.notify('toast.unsafeUrl', 'error');
    return;
  }
  chain(editor).setLink({ href }).run();
}

/** Link as a registry entry, so the insert palette lists it too. */
export const LINK_ACTION = {
  id: 'link',
  i18nKey: 'toolbar.link',
  icon: LinkIcon,
  hint: 'Ctrl+K',
  run: (editor, ctx) => toggleLink(editor, ctx),
  isActive: (editor) => editor.isActive('link'),
};

/* ═════════════════════════ Palette ═════════════════════════ */

/**
 * Flat list of every action, used by the insert palette (the wand button).
 * @returns {Array<object>}
 */
export function allActions() {
  return [
    ...FORMAT_ACTIONS,
    LINK_ACTION,
    ...TEXT_STYLE_ACTIONS,
    ...LIST_ACTIONS,
    ...TABLE_ACTIONS,
    ...MEDIA_ACTIONS,
    ...FORMULA_ACTIONS,
  ].filter((a) => a.id !== 'rtl');
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
