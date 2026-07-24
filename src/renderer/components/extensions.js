/**
 * Custom TipTap extensions for Telegram-specific formatting.
 */

import { Mark, Node, mergeAttributes } from '@tiptap/core';

/**
 * Spoiler mark — Telegram-style spoiler text.
 */
export const Spoiler = Mark.create({
  name: 'spoiler',

  parseHTML() {
    return [
      { tag: 'span[data-spoiler]' },
      { tag: 'span.tg-spoiler' },
    ];
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
});

/**
 * Details/collapsible block node.
 */
export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) =>
          commands.insertContent(
            '<details><summary>Click to expand</summary><p>Content here</p></details>',
          ),
    };
  },
});

/**
 * Footer block node.
 */
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
          commands.insertContent('<footer>Footer text</footer>'),
    };
  },
});

/**
 * Math block node.
 */
export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      formula: {
        default: '$$formula$$',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.tg-math' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'tg-math',
        style: 'text-align:center;font-size:16px;padding:8px',
      }),
      node.attrs.formula || '$$formula$$',
    ];
  },

  addCommands() {
    return {
      setMathBlock:
        (formula = '$$formula$$') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { formula },
          }),
    };
  },
});
