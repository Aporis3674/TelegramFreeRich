/**
 * Unit tests for the inline (RichText) parser.
 */
import { describe, it, expect } from 'vitest';
import {
  detectEntity,
  hasFormatting,
  parseInlineSegments,
  segmentsToText,
} from '../../src/shared/inline-parser.js';
import { InlineType } from '../../src/shared/block-types.js';

function el(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.firstElementChild;
}

describe('parseInlineSegments', () => {
  it('returns a single plain segment for unformatted text', () => {
    expect(parseInlineSegments(el('<p>hello</p>'))).toEqual([{ text: 'hello', marks: [] }]);
  });

  it('maps every tag to its inline type', () => {
    const segments = parseInlineSegments(
      el(
        '<p><strong>b</strong><em>i</em><u>u</u><s>s</s><code>c</code>' +
          '<mark>m</mark><sub>sub</sub><sup>sup</sup></p>',
      ),
    );
    expect(segments.map((s) => s.marks[0])).toEqual([
      InlineType.BOLD,
      InlineType.ITALIC,
      InlineType.UNDERLINE,
      InlineType.STRIKETHROUGH,
      InlineType.CODE,
      InlineType.MARKED,
      InlineType.SUBSCRIPT,
      InlineType.SUPERSCRIPT,
    ]);
  });

  it('nests marks in document order', () => {
    const segments = parseInlineSegments(el('<p><strong><em>both</em></strong></p>'));
    expect(segments).toEqual([{ text: 'both', marks: [InlineType.BOLD, InlineType.ITALIC] }]);
  });

  it('captures link targets', () => {
    const segments = parseInlineSegments(el('<p><a href="https://t.me/x">chat</a></p>'));
    expect(segments).toEqual([
      { text: 'chat', marks: [InlineType.LINK], href: 'https://t.me/x' },
    ]);
  });

  it('recognises spoiler and inline math spans', () => {
    const segments = parseInlineSegments(
      el('<p><span data-spoiler>shh</span><span data-inline-math>a^2</span></p>'),
    );
    expect(segments[0].marks).toEqual([InlineType.SPOILER]);
    expect(segments[1].marks).toEqual([InlineType.MATH]);
  });

  it('ignores unstyled spans', () => {
    expect(parseInlineSegments(el('<p><span>x</span></p>'))).toEqual([{ text: 'x', marks: [] }]);
  });

  it('turns <br> into a newline in the same segment', () => {
    expect(parseInlineSegments(el('<p>a<br>b</p>'))).toEqual([{ text: 'a\nb', marks: [] }]);
  });

  it('merges adjacent runs that share the same marks', () => {
    const segments = parseInlineSegments(el('<p><strong>a</strong><strong>b</strong></p>'));
    expect(segments).toEqual([{ text: 'ab', marks: [InlineType.BOLD] }]);
  });

  it('drops empty text nodes', () => {
    expect(parseInlineSegments(el('<p><strong></strong>x</p>'))).toEqual([
      { text: 'x', marks: [] },
    ]);
  });

  it('handles a null root', () => {
    expect(parseInlineSegments(null)).toEqual([]);
  });
});

describe('hasFormatting', () => {
  it('is false for plain segments', () => {
    expect(hasFormatting([{ text: 'a', marks: [] }])).toBe(false);
  });

  it('is true when a mark or link is present', () => {
    expect(hasFormatting([{ text: 'a', marks: ['bold'] }])).toBe(true);
    expect(hasFormatting([{ text: 'a', marks: [], href: 'https://x' }])).toBe(true);
  });
});

describe('segmentsToText', () => {
  it('concatenates segment text', () => {
    expect(segmentsToText([{ text: 'ab' }, { text: 'cd' }])).toBe('abcd');
  });
});

describe('detectEntity', () => {
  it('detects Telegram entities', () => {
    expect(detectEntity('@durov')).toBe(InlineType.MENTION);
    expect(detectEntity('#tag')).toBe(InlineType.HASHTAG);
    expect(detectEntity('/start')).toBe(InlineType.BOT_COMMAND);
    expect(detectEntity('a@b.com')).toBe(InlineType.EMAIL);
    expect(detectEntity('+98 912 345 6789')).toBe(InlineType.PHONE);
  });

  it('returns null for ordinary text', () => {
    expect(detectEntity('just words')).toBeNull();
    expect(detectEntity('@ab')).toBeNull();
  });
});
