/**
 * Block Serializer — Converts Block State (JSON[]) to Telegram Bot API 10.1 format.
 * @module shared/block-serializer
 */

import { BlockType } from './block-types.js';

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
      return { type: 'paragraph', text: block.text || '' };

    case BlockType.HEADING:
      return { type: 'heading', level: block.level || 2, text: block.text || '' };

    case BlockType.BLOCKQUOTE:
      return { type: 'blockquote', text: block.text || '' };

    case BlockType.PULLQUOTE:
      return {
        type: 'aside',
        text: block.text || '',
        attribution: block.attribution || '',
      };

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
      return { type: 'footer', text: block.text || '' };

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
