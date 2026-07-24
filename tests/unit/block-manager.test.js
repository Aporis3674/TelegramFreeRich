/**
 * Unit tests for BlockManager.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockManager } from '../../src/shared/block-manager.js';
import { BlockType } from '../../src/shared/block-types.js';

describe('BlockManager', () => {
  /** @type {BlockManager} */
  let mgr;

  beforeEach(() => {
    mgr = new BlockManager();
  });

  it('starts empty', () => {
    expect(mgr.length).toBe(0);
    expect(mgr.blocks).toEqual([]);
    expect(mgr.canUndo).toBe(false);
    expect(mgr.canRedo).toBe(false);
  });

  it('adds a block and generates an id', () => {
    const block = mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'Hello' });
    expect(mgr.length).toBe(1);
    expect(block.id).toBeTruthy();
    expect(block.type).toBe(BlockType.PARAGRAPH);
    expect(block.text).toBe('Hello');
  });

  it('adds block after a given index', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'B' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'C' }, 0);
    expect(mgr.blocks.map((b) => b.text)).toEqual(['A', 'C', 'B']);
  });

  it('removes a block by id', () => {
    const a = mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'B' });
    expect(mgr.removeBlock(a.id)).toBe(true);
    expect(mgr.length).toBe(1);
    expect(mgr.blocks[0].text).toBe('B');
  });

  it('returns false when removing unknown id', () => {
    expect(mgr.removeBlock('nope')).toBe(false);
  });

  it('updates a block', () => {
    const a = mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    expect(mgr.updateBlock(a.id, { text: 'Updated' })).toBe(true);
    expect(mgr.getBlock(a.id).text).toBe('Updated');
    // id should never be overwritten
    expect(mgr.getBlock(a.id).id).toBe(a.id);
  });

  it('moves a block', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'B' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'C' });
    mgr.moveBlock(0, 2);
    expect(mgr.blocks.map((b) => b.text)).toEqual(['B', 'C', 'A']);
  });

  it('supports undo and redo', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    expect(mgr.canUndo).toBe(true);
    mgr.undo();
    expect(mgr.length).toBe(0);
    expect(mgr.canRedo).toBe(true);
    mgr.redo();
    expect(mgr.length).toBe(1);
    expect(mgr.blocks[0].text).toBe('A');
  });

  it('clears redo stack on new action after undo', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'B' });
    mgr.undo();
    expect(mgr.canRedo).toBe(true);
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'C' });
    expect(mgr.canRedo).toBe(false);
  });

  it('notifies listeners on change', () => {
    const cb = vi.fn();
    const unsub = mgr.onChange(cb);
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'B' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('clears all blocks', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    mgr.clear();
    expect(mgr.length).toBe(0);
    expect(mgr.canUndo).toBe(true);
  });

  it('replaceAll sets blocks with ids', () => {
    mgr.replaceAll([
      { type: BlockType.HEADING, level: 1, text: 'Title' },
      { type: BlockType.PARAGRAPH, text: 'Body' },
    ]);
    expect(mgr.length).toBe(2);
    expect(mgr.blocks[0].id).toBeTruthy();
    expect(mgr.blocks[0].type).toBe(BlockType.HEADING);
  });

  it('toJSON returns a deep clone', () => {
    mgr.addBlock({ type: BlockType.PARAGRAPH, text: 'A' });
    const json = mgr.toJSON();
    json[0].text = 'mutated';
    expect(mgr.blocks[0].text).toBe('A');
  });
});
