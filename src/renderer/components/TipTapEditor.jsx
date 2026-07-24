/**
 * TipTapEditor — Main rich text editor component using TipTap.
 * Provides WYSIWYG editing with Telegram-compatible formatting.
 */

import { useEditor, EditorContent } from '@tiptap/react';
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
import { useEffect, useCallback } from 'react';

/**
 * Custom Spoiler extension for Telegram-style spoiler text.
 */
const Spoiler = {
  name: 'spoiler',
  group: 'inline',
  inline: true,
  atom: false,
  parseHTML() {
    return [{ tag: 'span[data-spoiler]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-spoiler': '', class: 'tg-spoiler' }, 0];
  },
  addCommands() {
    return {
      setSpoiler:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleSpoiler:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
    };
  },
  addKeyboardShortcuts() {
    return { 'Mod+s': () => this.editor.commands.toggleSpoiler() };
  },
};

/**
 * Custom Details/Summary extension for collapsible blocks.
 */
const Details = {
  name: 'details',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'details' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      HTMLAttributes,
      ['summary', {}, 0],
      ['div', { class: 'details-content' }, 0],
    ];
  },
  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
    };
  },
};

/**
 * Custom Footer extension.
 */
const Footer = {
  name: 'footer',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'footer' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['footer', HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setFooter:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },
};

/**
 * Main TipTap editor component.
 * @param {{ onUpdate?: (html: string) => void, editable?: boolean }} props
 */
export default function TipTapEditor({ onUpdate, editable = true }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: { HTMLAttributes: { class: 'language-' } },
      }),
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      Spoiler,
      Details,
      Footer,
    ],
    content: '',
    editable,
    onUpdate: ({ editor: ed }) => {
      if (onUpdate) onUpdate(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Expose editor instance to parent via window for toolbar access
  useEffect(() => {
    if (editor) {
      window.__tfrEditor = editor;
      return () => { window.__tfrEditor = null; };
    }
  }, [editor]);

  return (
    <div className="tiptap-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}
