/**
 * Unit tests for Block Serializer.
 */
import { describe, it, expect } from 'vitest';
import {
  serializeBlocks,
  serializeInline,
  buildRichMessageBody,
  buildChecklistBody,
  separateChecklists,
} from '../../src/shared/block-serializer.js';
import { BlockType, InlineType } from '../../src/shared/block-types.js';

describe('serializeBlocks', () => {
  it('returns empty array for non-array input', () => {
    expect(serializeBlocks(null)).toEqual([]);
    expect(serializeBlocks(undefined)).toEqual([]);
  });

  it('serializes paragraph', () => {
    const result = serializeBlocks([{ type: BlockType.PARAGRAPH, text: 'Hello' }]);
    expect(result).toEqual([{ type: 'paragraph', text: 'Hello' }]);
  });

  it('serializes heading with level', () => {
    const result = serializeBlocks([{ type: BlockType.HEADING, level: 2, text: 'Title' }]);
    expect(result).toEqual([{ type: 'heading', level: 2, text: 'Title' }]);
  });

  it('serializes code block', () => {
    const result = serializeBlocks([
      { type: BlockType.CODE_BLOCK, language: 'js', text: 'console.log(1)' },
    ]);
    expect(result).toEqual([
      { type: 'preformatted', language: 'js', text: 'console.log(1)' },
    ]);
  });

  it('serializes divider', () => {
    expect(serializeBlocks([{ type: BlockType.DIVIDER }])).toEqual([{ type: 'divider' }]);
  });

  it('serializes list', () => {
    const result = serializeBlocks([
      {
        type: BlockType.LIST,
        style: 'bullet',
        items: [{ text: 'A' }, { text: 'B' }],
      },
    ]);
    expect(result).toEqual([
      { type: 'list', style: 'bullet', items: ['A', 'B'] },
    ]);
  });

  it('serializes table', () => {
    const result = serializeBlocks([
      {
        type: BlockType.TABLE,
        header: ['Col1', 'Col2'],
        rows: [['a', 'b']],
      },
    ]);
    expect(result[0]).toEqual({
      type: 'table',
      header: ['Col1', 'Col2'],
      rows: [['a', 'b']],
    });
  });

  it('filters out checklist blocks', () => {
    const result = serializeBlocks([
      { type: BlockType.PARAGRAPH, text: 'Hi' },
      { type: BlockType.CHECKLIST, items: [{ text: 'Todo', done: false }] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('paragraph');
  });

  it('filters unknown types', () => {
    const result = serializeBlocks([{ type: 'unknown_thing' }]);
    expect(result).toEqual([]);
  });
});

describe('buildRichMessageBody', () => {
  it('builds full request body', () => {
    const body = buildRichMessageBody(
      [{ type: BlockType.PARAGRAPH, text: 'Hi' }],
      '@channel',
      { isRtl: true },
    );
    expect(body.chat_id).toBe('@channel');
    expect(body.rich_message.blocks).toEqual([{ type: 'paragraph', text: 'Hi' }]);
    expect(body.rich_message.is_rtl).toBe(true);
  });
});

describe('buildChecklistBody', () => {
  it('builds checklist request body', () => {
    const body = buildChecklistBody(
      [
        { text: 'Done', done: true },
        { text: 'Todo', done: false },
      ],
      '12345',
    );
    expect(body).toEqual({
      chat_id: '12345',
      checklist: {
        items: [
          { text: 'Done', done: true },
          { text: 'Todo', done: false },
        ],
      },
    });
  });
});

describe('separateChecklists', () => {
  it('splits rich blocks and checklist items', () => {
    const { richBlocks, checklistItems } = separateChecklists([
      { type: BlockType.PARAGRAPH, text: 'Hi' },
      {
        type: BlockType.CHECKLIST,
        items: [
          { text: 'A', done: true },
          { text: 'B', done: false },
        ],
      },
      { type: BlockType.HEADING, level: 1, text: 'T' },
    ]);
    expect(richBlocks).toHaveLength(2);
    expect(checklistItems).toEqual([
      { text: 'A', done: true },
      { text: 'B', done: false },
    ]);
  });
});

describe('serializeInline', () => {
  it('returns null when there are no segments', () => {
    expect(serializeInline(undefined)).toBeNull();
    expect(serializeInline([])).toBeNull();
  });

  it('wraps plain text in a text node', () => {
    expect(serializeInline([{ text: 'hi', marks: [] }])).toEqual([
      { type: InlineType.TEXT, text: 'hi' },
    ]);
  });

  it('nests marks from the inside out', () => {
    expect(
      serializeInline([{ text: 'x', marks: [InlineType.BOLD, InlineType.ITALIC] }]),
    ).toEqual([
      {
        type: InlineType.ITALIC,
        text: { type: InlineType.BOLD, text: { type: InlineType.TEXT, text: 'x' } },
      },
    ]);
  });

  it('emits a link node carrying the url', () => {
    expect(
      serializeInline([{ text: 'chat', marks: [InlineType.LINK], href: 'https://t.me/x' }]),
    ).toEqual([
      {
        type: InlineType.LINK,
        url: 'https://t.me/x',
        text: { type: InlineType.TEXT, text: 'chat' },
      },
    ]);
  });

  it('keeps a link wrapping other marks', () => {
    const [node] = serializeInline([
      { text: 'x', marks: [InlineType.BOLD, InlineType.LINK], href: 'https://a' },
    ]);
    expect(node.type).toBe(InlineType.LINK);
    expect(node.text.type).toBe(InlineType.BOLD);
  });
});

describe('rich_text on serialized blocks', () => {
  it('attaches rich_text to text blocks that carry inline formatting', () => {
    const [block] = serializeBlocks([
      {
        type: BlockType.PARAGRAPH,
        text: 'bold text',
        inline: [
          { text: 'bold', marks: [InlineType.BOLD] },
          { text: ' text', marks: [] },
        ],
      },
    ]);
    expect(block.text).toBe('bold text');
    expect(block.rich_text).toHaveLength(2);
    expect(block.rich_text[0].type).toBe(InlineType.BOLD);
  });

  it('omits rich_text when the block has none', () => {
    const [block] = serializeBlocks([{ type: BlockType.PARAGRAPH, text: 'plain' }]);
    expect(block).toEqual({ type: 'paragraph', text: 'plain' });
  });

  it('supports headings, quotes, asides and footers', () => {
    const inline = [{ text: 'x', marks: [InlineType.UNDERLINE] }];
    const blocks = serializeBlocks([
      { type: BlockType.HEADING, level: 2, text: 'x', inline },
      { type: BlockType.BLOCKQUOTE, text: 'x', inline },
      { type: BlockType.PULLQUOTE, text: 'x', inline },
      { type: BlockType.FOOTER, text: 'x', inline },
    ]);
    for (const block of blocks) {
      expect(block.rich_text, block.type).toHaveLength(1);
    }
  });
});
