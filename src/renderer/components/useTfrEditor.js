/**
 * useTfrEditor — builds the TipTap editor instance with every extension the
 * Telegram Bot API 10.1 rich message format needs.
 *
 * The editor lives in App.jsx and is passed down as a prop, so no module-level
 * or `window` globals are involved.
 *
 * @module components/useTfrEditor
 */

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

import {
  Details,
  Footer,
  GalleryBlock,
  InlineMath,
  MapBlock,
  MathBlock,
  MediaCaption,
  MediaBlock,
  PullQuote,
  QuoteAttribution,
  Spoiler,
} from './extensions.js';
import { MEDIA_SCHEMES, safeUrl } from '../../shared/html-serializer.js';

/**
 * `Image` with the same URL filter the rest of the app uses.
 *
 * Pasting HTML from a web page brings its `<img>` elements along, and the
 * upstream extension keeps whatever `src` they carry — `file:///etc/passwd`
 * included, which the app's own CSP would then happily load. The serializer
 * drops anything that is not http(s) anyway, so accepting it here only ever
 * produced an image in the editor that the message would not contain.
 */
const SafeImage = Image.extend({
  parseHTML() {
    return [
      {
        tag: this.options.allowBase64 ? 'img[src]' : 'img[src]:not([src^="data:"])',
        getAttrs: (el) => {
          const src = safeUrl(el.getAttribute('src'), MEDIA_SCHEMES);
          return src ? { src } : false;
        },
      },
    ];
  },
});

/**
 * @param {{
 *   placeholder: string,
 *   onUpdate: (html: string, text: string) => void,
 *   t: (key: string) => string,
 * }} options
 * @returns {import('@tiptap/react').Editor|null}
 */
export default function useTfrEditor({ placeholder, onUpdate, t }) {
  return useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: { HTMLAttributes: { class: 'tg-pre' } },
      }),
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, autolink: true, protocols: ['http', 'https', 'tg'] }),
      SafeImage.configure({ inline: false, allowBase64: false }),
      TaskList,
      TaskItem.configure({ nested: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Spoiler,
      InlineMath,
      PullQuote,
      QuoteAttribution,
      Details,
      Footer,
      MathBlock,
      MediaBlock,
      MediaCaption,
      GalleryBlock.configure({ t }),
      MapBlock,
    ],
    content: '',
    autofocus: true,
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML(), editor.getText());
    },
    editorProps: {
      attributes: { class: 'tfr-editor' },
    },
  });
}
