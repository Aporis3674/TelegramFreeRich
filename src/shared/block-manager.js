/**
 * BlockManager — Manages an ordered array of Block objects with undo/redo.
 * Pure data layer — no DOM manipulation.
 * @module shared/block-manager
 */

import { generateId, deepClone } from './utils.js';
import { MAX_UNDO_DEPTH } from './constants.js';

/**
 * @typedef {Object} Block
 * @property {string} id - Unique block identifier.
 * @property {string} type - Block type from BlockType enum.
 * @property {*} content - Block-specific content.
 */

export class BlockManager {
  /** @type {Block[]} */
  #blocks = [];

  /** @type {Block[][]} */
  #undoStack = [];

  /** @type {Block[][]} */
  #redoStack = [];

  /** @type {Set<Function>} */
  #listeners = new Set();

  /** @returns {ReadonlyArray<Block>} Current blocks. */
  get blocks() { return this.#blocks; }

  /** @returns {boolean} Whether undo is available. */
  get canUndo() { return this.#undoStack.length > 0; }

  /** @returns {boolean} Whether redo is available. */
  get canRedo() { return this.#redoStack.length > 0; }

  /** @returns {number} Number of blocks. */
  get length() { return this.#blocks.length; }

  /**
   * Subscribe to block changes.
   * @param {Function} callback - Called with (blocks) on every change.
   * @returns {Function} Unsubscribe function.
   */
  onChange(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  /**
   * Replace all blocks (e.g., after DOM parse or load).
   * @param {Block[]} blocks
   */
  replaceAll(blocks) {
    this.#pushUndo();
    this.#blocks = blocks.map((b) => ({
      ...b,
      id: b.id || generateId(),
    }));
    this.#notify();
  }

  /**
   * Add a new block after a given index (or at end).
   * @param {Block} block - Block to add (id will be generated if missing).
   * @param {number} [afterIndex=-1] - Index to insert after. -1 = append.
   * @returns {Block} The added block with its generated id.
   */
  addBlock(block, afterIndex = -1) {
    this.#pushUndo();
    const newBlock = { ...block, id: block.id || generateId() };
    if (afterIndex < 0) {
      this.#blocks.push(newBlock);
    } else {
      this.#blocks.splice(afterIndex + 1, 0, newBlock);
    }
    this.#notify();
    return newBlock;
  }

  /**
   * Remove a block by id.
   * @param {string} id
   * @returns {boolean} True if block was found and removed.
   */
  removeBlock(id) {
    const idx = this.#blocks.findIndex((b) => b.id === id);
    if (idx < 0) return false;
    this.#pushUndo();
    this.#blocks.splice(idx, 1);
    this.#notify();
    return true;
  }

  /**
   * Update block content by id.
   * @param {string} id
   * @param {Partial<Block>} updates - Fields to merge into the block.
   * @returns {boolean} True if block was found and updated.
   */
  updateBlock(id, updates) {
    const idx = this.#blocks.findIndex((b) => b.id === id);
    if (idx < 0) return false;
    this.#pushUndo();
    this.#blocks[idx] = { ...this.#blocks[idx], ...updates, id }; // Never overwrite id
    this.#notify();
    return true;
  }

  /**
   * Move a block from one position to another.
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  moveBlock(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= this.#blocks.length) return;
    if (toIndex < 0 || toIndex >= this.#blocks.length) return;
    this.#pushUndo();
    const [block] = this.#blocks.splice(fromIndex, 1);
    this.#blocks.splice(toIndex, 0, block);
    this.#notify();
  }

  /**
   * Get a block by id.
   * @param {string} id
   * @returns {Block|null}
   */
  getBlock(id) {
    return this.#blocks.find((b) => b.id === id) || null;
  }

  /**
   * Get the index of a block by id.
   * @param {string} id
   * @returns {number} Index, or -1 if not found.
   */
  getBlockIndex(id) {
    return this.#blocks.findIndex((b) => b.id === id);
  }

  /** Undo the last change. */
  undo() {
    if (!this.canUndo) return;
    this.#redoStack.push(deepClone(this.#blocks));
    this.#blocks = this.#undoStack.pop();
    this.#notify();
  }

  /** Redo the last undone change. */
  redo() {
    if (!this.canRedo) return;
    this.#undoStack.push(deepClone(this.#blocks));
    this.#blocks = this.#redoStack.pop();
    this.#notify();
  }

  /** Clear all blocks. */
  clear() {
    if (this.#blocks.length === 0) return;
    this.#pushUndo();
    this.#blocks = [];
    this.#notify();
  }

  /**
   * Get blocks as a plain JSON array (for serialization/storage).
   * @returns {Block[]}
   */
  toJSON() {
    return deepClone(this.#blocks);
  }

  // ---- Private ----

  #pushUndo() {
    this.#undoStack.push(deepClone(this.#blocks));
    this.#redoStack = []; // Clear redo on new action
    if (this.#undoStack.length > MAX_UNDO_DEPTH) {
      this.#undoStack.shift();
    }
  }

  #notify() {
    this.#listeners.forEach((cb) => {
      try { cb(this.#blocks); } catch (e) { console.error('BlockManager listener error:', e); }
    });
  }
}
