/**
 * BlockManager — Internal block-state manager for TelegramFreeRich editor.
 *
 * Maintains an ordered array of block objects with undo/redo support.
 * Blocks are plain objects: { id, type, content, children? }
 * This class owns the source of truth; the contenteditable DOM is the UI layer.
 *
 * @module block-manager
 */

'use strict';

/** Generate a short unique id for each block. */
let _idCounter = 0;
function _uid() {
  return 'blk_' + Date.now().toString(36) + '_' + (++_idCounter).toString(36);
}

/**
 * Deep-clone a plain object / array (JSON-safe values only).
 * @param {*} obj
 * @returns {*}
 */
function _deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} Block
 * @property {string}  id        - Unique block identifier.
 * @property {string}  type      - Block type (paragraph, heading, code_block, …).
 * @property {string|Object} content - Text string or structured object (table, list, details, …).
 * @property {Block[]?} [children] - Optional nested blocks (e.g. details body, blockquote children).
 */

class BlockManager {
  constructor() {
    /** @type {Block[]} */
    this._blocks = [];

    /** @type {Array<Block[]>} undo stack (stores snapshots of _blocks) */
    this._undoStack = [];

    /** @type {Array<Block[]>} redo stack */
    this._redoStack = [];

    /** Maximum snapshots kept in undo/redo stacks. */
    this._maxHistory = 100;
  }

  /* ---- snapshot helpers ---- */

  /**
   * Push a snapshot of the current block array onto the undo stack.
   * Clears the redo stack (new branch).
   */
  saveSnapshot() {
    this._undoStack.push(_deepClone(this._blocks));
    if (this._undoStack.length > this._maxHistory) {
      this._undoStack.shift();
    }
    // New action invalidates any redo history.
    this._redoStack = [];
  }

  /**
   * Undo the last change. Returns true if an undo was performed.
   * @returns {boolean}
   */
  undo() {
    if (this._undoStack.length === 0) return false;
    this._redoStack.push(_deepClone(this._blocks));
    this._blocks = this._undoStack.pop();
    return true;
  }

  /**
   * Redo a previously undone change. Returns true if a redo was performed.
   * @returns {boolean}
   */
  redo() {
    if (this._redoStack.length === 0) return false;
    this._undoStack.push(_deepClone(this._blocks));
    this._blocks = this._redoStack.pop();
    return true;
  }

  /* ---- CRUD operations ---- */

  /**
   * Create and insert a new block.
   * @param {string} type      - Block type (e.g. "paragraph", "heading", "code_block").
   * @param {string|Object} content - Block content.
   * @param {number} [index]   - Position to insert at. Defaults to end.
   * @returns {Block} The newly created block.
   */
  addBlock(type, content, index) {
    const block = { id: _uid(), type, content };
    if (typeof index === 'number' && index >= 0 && index <= this._blocks.length) {
      this._blocks.splice(index, 0, block);
    } else {
      this._blocks.push(block);
    }
    return block;
  }

  /**
   * Remove a block by id.
   * @param {string} id
   * @returns {Block|null} The removed block, or null if not found.
   */
  removeBlock(id) {
    const idx = this._blocks.findIndex(b => b.id === id);
    if (idx === -1) return null;
    return this._blocks.splice(idx, 1)[0];
  }

  /**
   * Move a block to a new position in the array.
   * @param {string} id       - Block id.
   * @param {number} newIndex - Target index (0-based, clamped to [0, length-1]).
   * @returns {boolean} True if the move succeeded.
   */
  moveBlock(id, newIndex) {
    const idx = this._blocks.findIndex(b => b.id === id);
    if (idx === -1) return false;

    // Clamp.
    let target = Math.max(0, Math.min(newIndex, this._blocks.length - 1));
    if (target === idx) return false;

    const [block] = this._blocks.splice(idx, 1);
    this._blocks.splice(target, 0, block);
    return true;
  }

  /**
   * Replace the content of an existing block.
   * @param {string} id      - Block id.
   * @param {string|Object} content - New content.
   * @returns {boolean} True if the update succeeded.
   */
  updateBlock(id, content) {
    const block = this._blocks.find(b => b.id === id);
    if (!block) return false;
    block.content = content;
    return true;
  }

  /**
   * Find a block by id.
   * @param {string} id
   * @returns {Block|undefined}
   */
  getBlock(id) {
    return this._blocks.find(b => b.id === id);
  }

  /**
   * Return a shallow copy of the internal blocks array.
   * @returns {Block[]}
   */
  getBlocks() {
    return [...this._blocks];
  }

  /**
   * Replace the entire blocks array (e.g. after a parse from DOM).
   * @param {Block[]} blocks
   */
  setBlocks(blocks) {
    this._blocks = _deepClone(blocks);
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Number of blocks.
   * @returns {number}
   */
  get length() {
    return this._blocks.length;
  }

  /**
   * Clear all blocks and history.
   */
  clear() {
    this.saveSnapshot();
    this._blocks = [];
  }

  /* ---- serialization ---- */

  /**
   * Serialize blocks into a JSON-compatible representation suitable for
   * the Telegram Bot API `sendRichMessage` format.
   *
   * Each block becomes an object with a `type` key and appropriate payload.
   * The markdown string is NOT generated here (that is the serializer's job);
   * instead we return structured block data that can be both displayed
   * and serialized.
   *
   * @returns {Object[]} Array of InputRichBlock* compatible objects.
   */
  serialize() {
    return this._blocks.map(block => _serializeBlock(block));
  }

  /**
   * Deep-clone the full state (blocks + history).
   * @returns {{ blocks: Block[], undoDepth: number, redoDepth: number }}
   */
  toJSON() {
    return {
      blocks: _deepClone(this._blocks),
      undoDepth: this._undoStack.length,
      redoDepth: this._redoStack.length,
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Block → API object conversion                                     */
/* ------------------------------------------------------------------ */

/**
 * Convert a single Block into an API-compatible object.
 * @param {Block} block
 * @returns {Object}
 * @private
 */
function _serializeBlock(block) {
  switch (block.type) {
    case 'heading': {
      const lvl = (block.content && block.content.level) || 1;
      const text = (block.content && block.content.text) || (typeof block.content === 'string' ? block.content : '');
      return { type: 'heading', level: lvl, text };
    }

    case 'paragraph': {
      const text = typeof block.content === 'string' ? block.content : '';
      return { type: 'paragraph', text };
    }

    case 'code_block': {
      if (typeof block.content === 'object' && block.content !== null) {
        return {
          type: 'code_block',
          language: block.content.language || '',
          text: block.content.text || '',
        };
      }
      return { type: 'code_block', language: '', text: String(block.content) };
    }

    case 'blockquote': {
      return { type: 'blockquote', text: typeof block.content === 'string' ? block.content : '' };
    }

    case 'list': {
      if (typeof block.content === 'object' && block.content !== null) {
        return {
          type: 'list',
          style: block.content.style || 'bullet',
          items: block.content.items || [],
        };
      }
      return { type: 'list', style: 'bullet', items: [] };
    }

    case 'table': {
      if (typeof block.content === 'object' && block.content !== null) {
        return {
          type: 'table',
          rows: block.content.rows || [],
          has_header: block.content.hasHeader || false,
        };
      }
      return { type: 'table', rows: [], has_header: false };
    }

    case 'divider':
      return { type: 'divider' };

    case 'details': {
      if (typeof block.content === 'object' && block.content !== null) {
        return {
          type: 'details',
          summary: block.content.summary || '',
          body: block.content.body || '',
        };
      }
      return { type: 'details', summary: '', body: '' };
    }

    case 'photo': {
      if (typeof block.content === 'object' && block.content !== null) {
        return {
          type: 'photo',
          url: block.content.url || '',
          caption: block.content.caption || '',
        };
      }
      return { type: 'photo', url: String(block.content || ''), caption: '' };
    }

    case 'footer': {
      return { type: 'footer', text: typeof block.content === 'string' ? block.content : '' };
    }

    default:
      // Unknown block type — pass through raw.
      return { type: block.type, content: block.content };
  }
}

module.exports = BlockManager;
