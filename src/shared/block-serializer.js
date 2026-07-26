/**
 * Block Serializer — Converts Block State (JSON[]) to Telegram Bot API 10.1 format.
 * @module shared/block-serializer
 */

import { BlockType, InlineType } from './block-types.js';

/**
 * Convert one inline segment into a nested `RichText*` object.
 * Marks wrap from the inside out, so `['bold','italic']` becomes
 * `{ type: 'italic', text: { type: 'bold', text: { type: 'plain', … } } }`.
 * @param {{ text: string, marks?: string[], href?: string }} segment
 * @returns {object}
 */
function serializeSegment(segment) {
  /** @type {object} */
  let node = { type: InlineType.TEXT, text: segment.text };

  for (const mark of segment.marks || []) {
    if (mark === InlineType.LINK) continue; // handled below, needs the url
    node = { type: mark, text: node };
  }

  if (segment.href) {
    node = { type: InlineType.LINK, url: segment.href, text: node };
  }
  return node;
}

/**
 * Convert inline segments into the `rich_text` array of a block.
 * @param {Array<object>|undefined} segments
 * @returns {object[]|null}
 */
export function serializeInline(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return segments.map(serializeSegment);
}

/**
 * Attach `rich_text` to a serialized block when the source block carries
 * inline formatting.
 * @param {object} apiBlock
 * @param {object} block
 * @returns {object}
 */
function withInline(apiBlock, block) {
  const richText = serializeInline(block.inline);
  return richText ? { ...apiBlock, rich_text: richText } : apiBlock;
}

/**
 * Serialize an array of Block objects to Telegram InputRichBlock* format.
 * @param {import('./block-manager.js').Block[]} blocks
 * @returns {object[]} Array of API-compatible block objects.
 */
export function serializeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(serializeBlock).filter(Boolean);
}

/**
 * Serialize a single Block to its API representation.
 * @param {import('./block-manager.js').Block} block
 * @returns {object|null}
 */
function serializeBlock(block) {
  switch (block.type) {
    case BlockType.PARAGRAPH:
      return withInline({ type: 'paragraph', text: block.text || '' }, block);

    case BlockType.HEADING:
      return withInline(
        { type: 'heading', level: block.level || 2, text: block.text || '' },
        block,
      );

    case BlockType.BLOCKQUOTE:
      return withInline({ type: 'blockquote', text: block.text || '' }, block);

    case BlockType.PULLQUOTE:
      return withInline(
        {
          type: 'aside',
          text: block.text || '',
          attribution: block.attribution || '',
        },
        block,
      );

    case BlockType.CODE_BLOCK:
      return {
        type: 'preformatted',
        language: block.language || '',
        text: block.text || '',
      };

    case BlockType.DIVIDER:
      return { type: 'divider' };

    case BlockType.LIST:
      return {
        type: 'list',
        style: block.style || 'bullet',
        items: (block.items || []).map((item) =>
          typeof item === 'string' ? item : item.text || ''
        ),
      };

    case BlockType.TABLE:
      return {
        type: 'table',
        header: block.header || [],
        rows: block.rows || [],
      };

    case BlockType.DETAILS:
      return {
        type: 'details',
        summary: block.summary || '',
        content: block.content || '',
      };

    case BlockType.FOOTER:
      return withInline({ type: 'footer', text: block.text || '' }, block);

    case BlockType.PHOTO:
      return { type: 'photo', url: block.url || '', caption: block.caption || '' };

    case BlockType.VIDEO:
      return { type: 'video', url: block.url || '', caption: block.caption || '' };

    case BlockType.AUDIO:
      return { type: 'audio', url: block.url || '', caption: block.caption || '' };

    case BlockType.MATH_BLOCK:
      return { type: 'math', text: block.text || '' };

    case BlockType.SLIDESHOW:
      return { type: 'slideshow', images: block.images || [] };

    case BlockType.COLLAGE:
      return { type: 'collage', images: block.images || [] };

    case BlockType.MAP:
      return {
        type: 'map',
        latitude: block.latitude || 0,
        longitude: block.longitude || 0,
      };

    case BlockType.CHECKLIST:
      // Checklist is sent via separate API — serializer marks it but
      // the caller must use serializeChecklist() for the actual send.
      return null;

    default:
      console.warn(`[BlockSerializer] Unknown block type: ${block.type}`);
      return null;
  }
}

/**
 * Build the full sendRichMessage request body.
 * @param {import('./block-manager.js').Block[]} blocks - Non-checklist blocks.
 * @param {string} chatId
 * @param {object} [options]
 * @param {boolean} [options.isRtl]
 * @param {boolean} [options.skipEntityDetection]
 * @returns {object} Full API request body.
 */
export function buildRichMessageBody(blocks, chatId, options = {}) {
  const body = {
    chat_id: chatId,
    rich_message: {
      blocks: serializeBlocks(blocks),
    },
  };
  if (options.isRtl) body.rich_message.is_rtl = true;
  if (options.skipEntityDetection) body.rich_message.skip_entity_detection = true;
  return body;
}

/**
 * Build the full sendChecklist request body.
 * Checklist is a SEPARATE API call — not part of Rich Message.
 * @param {Array<{text: string, done: boolean}>} items
 * @param {string} chatId
 * @returns {object} Full API request body for sendChecklist.
 */
export function buildChecklistBody(items, chatId) {
  return {
    chat_id: chatId,
    checklist: {
      items: items.map((item) => ({
        text: item.text || '',
        done: !!item.done,
      })),
    },
  };
}

/**
 * Separate blocks into rich blocks and checklist items.
 * @param {import('./block-manager.js').Block[]} blocks
 * @returns {{ richBlocks: Block[], checklistItems: Array<{text: string, done: boolean}> }}
 */
export function separateChecklists(blocks) {
  const richBlocks = [];
  const checklistItems = [];

  for (const block of blocks) {
    if (block.type === BlockType.CHECKLIST) {
      const items = block.items || [];
      for (const item of items) {
        checklistItems.push({
          text: typeof item === 'string' ? item : item.text || '',
          done: typeof item === 'object' ? !!item.done : false,
        });
      }
    } else {
      richBlocks.push(block);
    }
  }

  return { richBlocks, checklistItems };
}
