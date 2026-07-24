/**
 * Block types matching Telegram Bot API 10.1 InputRichBlock* classes.
 * @readonly
 * @enum {string}
 */
export const BlockType = Object.freeze({
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  BLOCKQUOTE: 'blockquote',
  PULLQUOTE: 'pullquote',
  CODE_BLOCK: 'code_block',
  DIVIDER: 'divider',
  LIST: 'list',
  TABLE: 'table',
  DETAILS: 'details',
  FOOTER: 'footer',
  PHOTO: 'photo',
  VIDEO: 'video',
  AUDIO: 'audio',
  MATH_BLOCK: 'math_block',
  SLIDESHOW: 'slideshow',
  COLLAGE: 'collage',
  MAP: 'map',
  CHECKLIST: 'checklist',
});

/**
 * Inline text types matching Telegram Bot API RichText* classes.
 * @readonly
 * @enum {string}
 */
export const InlineType = Object.freeze({
  TEXT: 'text',
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'strikethrough',
  SPOILER: 'spoiler',
  MARKED: 'marked',
  SUBSCRIPT: 'subscript',
  SUPERSCRIPT: 'superscript',
  CODE: 'code',
  LINK: 'link',
  MENTION: 'mention',
  HASHTAG: 'hashtag',
  PHONE: 'phone_number',
  EMAIL: 'email',
  BANK_CARD: 'bank_card_number',
  CUSTOM_EMOJI: 'custom_emoji',
  MATH: 'math',
});
