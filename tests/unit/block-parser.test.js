/**
 * Unit tests for Block Parser.
 */
import { describe, it, expect } from 'vitest';
import { parseBlockElement, parseAllBlocks } from '../../src/shared/block-parser.js';
import { BlockType } from '../../src/shared/block-types.js';

function el(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.firstElementChild;
}

describe('parseBlockElement', () => {
  it('parses paragraph', () => {
    const result = parseBlockElement(el('<p>Hello world</p>'));
    expect(result).toEqual({ type: BlockType.PARAGRAPH, text: 'Hello world' });
  });

  it('parses heading with level', () => {
    const result = parseBlockElement(el('<h2>Title</h2>'));
    expect(result).toEqual({ type: BlockType.HEADING, level: 2, text: 'Title' });
  });

  it('parses divider', () => {
    expect(parseBlockElement(el('<hr>'))).toEqual({ type: BlockType.DIVIDER });
  });

  it('parses blockquote', () => {
    const result = parseBlockElement(el('<blockquote>Quote me</blockquote>'));
    expect(result.type).toBe(BlockType.BLOCKQUOTE);
    expect(result.text).toBe('Quote me');
  });

  it('parses code block with language', () => {
    const result = parseBlockElement(
      el('<pre><code class="language-python">print(1)</code></pre>'),
    );
    expect(result).toEqual({
      type: BlockType.CODE_BLOCK,
      language: 'python',
      text: 'print(1)',
    });
  });

  it('parses bullet list', () => {
    const result = parseBlockElement(el('<ul><li>A</li><li>B</li></ul>'));
    expect(result.type).toBe(BlockType.LIST);
    expect(result.style).toBe('bullet');
    expect(result.items).toEqual([{ text: 'A' }, { text: 'B' }]);
  });

  it('parses ordered list', () => {
    const result = parseBlockElement(el('<ol><li>First</li><li>Second</li></ol>'));
    expect(result.style).toBe('numbered');
  });

  it('parses checklist items with checkbox', () => {
    const result = parseBlockElement(
      el('<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>'),
    );
    expect(result.items[0].done).toBe(true);
    expect(result.items[1].done).toBe(false);
  });

  it('parses table', () => {
    const result = parseBlockElement(
      el('<table><tr><th>H1</th><th>H2</th></tr><tr><td>a</td><td>b</td></tr></table>'),
    );
    expect(result.type).toBe(BlockType.TABLE);
    expect(result.header).toEqual(['H1', 'H2']);
    expect(result.rows).toEqual([['a', 'b']]);
  });

  it('parses details', () => {
    const result = parseBlockElement(
      el('<details><summary>Click</summary><p>Hidden</p></details>'),
    );
    expect(result.type).toBe(BlockType.DETAILS);
    expect(result.summary).toBe('Click');
  });

  it('parses math block', () => {
    const result = parseBlockElement(el('<div class="tg-math">$$x^2$$</div>'));
    expect(result).toEqual({ type: BlockType.MATH_BLOCK, text: '$$x^2$$' });
  });

  it('parses footer', () => {
    const result = parseBlockElement(el('<footer>Footnote</footer>'));
    expect(result).toEqual({ type: BlockType.FOOTER, text: 'Footnote' });
  });

  it('returns null for unknown elements', () => {
    expect(parseBlockElement(el('<span>x</span>'))).toBeNull();
  });
});

describe('parseAllBlocks', () => {
  it('parses multiple children', () => {
    const container = el('<div><h1>Title</h1><p>Body</p><hr></div>');
    const blocks = parseAllBlocks(container);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe(BlockType.HEADING);
    expect(blocks[1].type).toBe(BlockType.PARAGRAPH);
    expect(blocks[2].type).toBe(BlockType.DIVIDER);
  });

  it('returns empty for null container', () => {
    expect(parseAllBlocks(null)).toEqual([]);
  });
});
