/**
 * Unit tests for the editor action registry.
 * A recording proxy stands in for the TipTap editor, so every action's command
 * chain can be asserted without mounting ProseMirror.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  FORMAT_ACTIONS,
  FORMULA_ACTIONS,
  LINK_ACTION,
  LIST_ACTIONS,
  MEDIA_ACTIONS,
  TABLE_ACTIONS,
  TEXT_STYLE_ACTIONS,
  allActions,
  filterActions,
  isActionActive,
  isActionEnabled,
  toggleLink,
} from '../../src/renderer/lib/editor-actions.js';
import en from '../../src/renderer/i18n/en.json';
import fa from '../../src/renderer/i18n/fa.json';

/**
 * @param {{ active?: string[], attrs?: object }} [state]
 */
function mockEditor(state = {}) {
  const calls = [];
  const chain = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'run') return () => true;
        return (...args) => {
          if (prop !== 'focus') calls.push({ name: String(prop), args });
          return chain;
        };
      },
    },
  );

  return {
    calls,
    names: () => calls.map((c) => c.name),
    chain: () => chain,
    isActive: (name) => (state.active || []).includes(name),
    getAttributes: () => state.attrs || {},
    can: () => ({ undo: () => true, redo: () => true }),
  };
}

function mockCtx(overrides = {}) {
  return {
    askText: vi.fn(async () => 'https://example.com/a.png'),
    pickFile: vi.fn(async () => '/tmp/a.png'),
    toggleRtl: vi.fn(),
    isRtl: false,
    notify: vi.fn(),
    ...overrides,
  };
}

const GROUPS = {
  format: FORMAT_ACTIONS,
  textStyle: TEXT_STYLE_ACTIONS,
  list: LIST_ACTIONS,
  table: TABLE_ACTIONS,
  media: MEDIA_ACTIONS,
  formula: FORMULA_ACTIONS,
};

describe('registry shape', () => {
  it('every action has an id, label key, icon and run function', () => {
    for (const [group, actions] of Object.entries(GROUPS)) {
      for (const action of actions) {
        expect(typeof action.id, `${group}.id`).toBe('string');
        expect(typeof action.i18nKey, `${group}:${action.id}.i18nKey`).toBe('string');
        expect(typeof action.icon, `${group}:${action.id}.icon`).toBe('function');
        expect(typeof action.run, `${group}:${action.id}.run`).toBe('function');
      }
    }
  });

  it('ids are unique across the palette', () => {
    const ids = allActions().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every label key is translated in both locales', () => {
    for (const action of [...allActions(), LINK_ACTION]) {
      expect(en[action.i18nKey], `en:${action.i18nKey}`).toBeTruthy();
      expect(fa[action.i18nKey], `fa:${action.i18nKey}`).toBeTruthy();
      if (action.note) {
        expect(en[action.note]).toBeTruthy();
        expect(fa[action.note]).toBeTruthy();
      }
    }
  });

  it('excludes the RTL toggle from the palette but keeps it in the text menu', () => {
    expect(allActions().some((a) => a.id === 'rtl')).toBe(false);
    expect(TEXT_STYLE_ACTIONS.some((a) => a.id === 'rtl')).toBe(true);
  });
});

describe('inline formatting actions', () => {
  it('runs the matching toggle command', () => {
    const expected = {
      bold: 'toggleBold',
      italic: 'toggleItalic',
      underline: 'toggleUnderline',
      strike: 'toggleStrike',
      spoiler: 'toggleSpoiler',
      highlight: 'toggleHighlight',
      code: 'toggleCode',
      subscript: 'toggleSubscript',
      superscript: 'toggleSuperscript',
      clearFormat: 'unsetAllMarks',
    };
    for (const action of FORMAT_ACTIONS) {
      const editor = mockEditor();
      action.run(editor, mockCtx());
      expect(editor.names(), action.id).toEqual([expected[action.id]]);
    }
  });

  it('reports active marks', () => {
    const bold = FORMAT_ACTIONS.find((a) => a.id === 'bold');
    expect(isActionActive(bold, mockEditor({ active: ['bold'] }))).toBe(true);
    expect(isActionActive(bold, mockEditor())).toBe(false);
  });
});

describe('text style actions', () => {
  it('toggles headings with the right level', () => {
    const h3 = TEXT_STYLE_ACTIONS.find((a) => a.id === 'heading3');
    const editor = mockEditor();
    h3.run(editor, mockCtx());
    expect(editor.calls).toEqual([{ name: 'toggleHeading', args: [{ level: 3 }] }]);
  });

  it('covers all six heading levels', () => {
    const levels = TEXT_STYLE_ACTIONS.filter((a) => a.id.startsWith('heading')).map((a) => a.id);
    expect(levels).toEqual(['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6']);
  });

  it('routes the RTL entry through the context, not the editor', () => {
    const rtl = TEXT_STYLE_ACTIONS.find((a) => a.id === 'rtl');
    const editor = mockEditor();
    const ctx = mockCtx();
    rtl.run(editor, ctx);
    expect(ctx.toggleRtl).toHaveBeenCalledOnce();
    expect(editor.calls).toEqual([]);
    expect(isActionActive(rtl, editor, { isRtl: true })).toBe(true);
  });

  it('inserts dividers, footers, details and pull quotes', () => {
    const expected = {
      paragraph: 'setParagraph',
      blockquote: 'toggleBlockquote',
      pullquote: 'togglePullQuote',
      codeBlock: 'toggleCodeBlock',
      footer: 'setFooter',
      details: 'setDetails',
      divider: 'setHorizontalRule',
    };
    for (const [id, command] of Object.entries(expected)) {
      const editor = mockEditor();
      TEXT_STYLE_ACTIONS.find((a) => a.id === id).run(editor, mockCtx());
      expect(editor.names(), id).toEqual([command]);
    }
  });
});

describe('list actions', () => {
  it('maps each list style to its command', () => {
    const expected = {
      bulletList: 'toggleBulletList',
      orderedList: 'toggleOrderedList',
      checklist: 'toggleTaskList',
    };
    for (const action of LIST_ACTIONS) {
      const editor = mockEditor();
      action.run(editor, mockCtx());
      expect(editor.names(), action.id).toEqual([expected[action.id]]);
    }
  });
});

describe('table actions', () => {
  it('inserts a 3×3 table with a header row', () => {
    const editor = mockEditor();
    TABLE_ACTIONS.find((a) => a.id === 'insertTable').run(editor, mockCtx());
    expect(editor.calls).toEqual([
      { name: 'insertTable', args: [{ rows: 3, cols: 3, withHeaderRow: true }] },
    ]);
  });

  it('enables row/column edits only inside a table', () => {
    const inside = mockEditor({ active: ['table'] });
    const outside = mockEditor();
    const addRow = TABLE_ACTIONS.find((a) => a.id === 'addRow');
    expect(isActionEnabled(addRow, inside)).toBe(true);
    expect(isActionEnabled(addRow, outside)).toBe(false);
    expect(isActionEnabled(addRow, null)).toBe(false);
  });

  it('treats insertTable as always available', () => {
    expect(isActionEnabled(TABLE_ACTIONS[0], mockEditor())).toBe(true);
  });
});

describe('media actions', () => {
  it('inserts an image from a sanitized URL', async () => {
    const editor = mockEditor();
    const ctx = mockCtx();
    await MEDIA_ACTIONS.find((a) => a.id === 'imageUrl').run(editor, ctx);
    expect(editor.calls).toEqual([
      { name: 'setImage', args: [{ src: 'https://example.com/a.png' }] },
    ]);
  });

  it('rejects javascript: URLs and reports it', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => 'javascript:alert(1)') });
    await MEDIA_ACTIONS.find((a) => a.id === 'imageUrl').run(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.unsafeUrl', 'error');
  });

  it('does nothing when the prompt is dismissed', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => null) });
    await MEDIA_ACTIONS.find((a) => a.id === 'video').run(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).not.toHaveBeenCalled();
  });

  it('inserts a file-picked image as a file:// source', async () => {
    const editor = mockEditor();
    await MEDIA_ACTIONS.find((a) => a.id === 'imageFile').run(editor, mockCtx());
    expect(editor.calls).toEqual([{ name: 'setImage', args: [{ src: 'file:///tmp/a.png' }] }]);
  });

  it('splits gallery URLs on commas', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => 'https://a.jpg, https://b.jpg') });
    await MEDIA_ACTIONS.find((a) => a.id === 'collage').run(editor, ctx);
    expect(editor.calls).toEqual([
      {
        name: 'setGalleryBlock',
        args: [{ kind: 'collage', images: ['https://a.jpg', 'https://b.jpg'] }],
      },
    ]);
  });

  it('parses map coordinates and rejects malformed input', async () => {
    const map = MEDIA_ACTIONS.find((a) => a.id === 'map');

    const good = mockEditor();
    await map.run(good, mockCtx({ askText: vi.fn(async () => '35.6892, 51.389') }));
    expect(good.calls).toEqual([
      { name: 'setMapBlock', args: [{ latitude: 35.6892, longitude: 51.389 }] },
    ]);

    const bad = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => 'somewhere nice') });
    await map.run(bad, ctx);
    expect(bad.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.invalidCoords', 'error');
  });
});

describe('formula actions', () => {
  it('inserts block and inline formulas', async () => {
    const block = mockEditor();
    await FORMULA_ACTIONS.find((a) => a.id === 'mathBlock').run(
      block,
      mockCtx({ askText: vi.fn(async () => 'a^2+b^2') }),
    );
    expect(block.calls).toEqual([{ name: 'setMathBlock', args: ['a^2+b^2'] }]);

    const inline = mockEditor();
    await FORMULA_ACTIONS.find((a) => a.id === 'mathInline').run(
      inline,
      mockCtx({ askText: vi.fn(async () => 'x_1') }),
    );
    expect(inline.calls).toEqual([{ name: 'insertInlineMath', args: ['x_1'] }]);
  });
});

describe('toggleLink', () => {
  it('removes an existing link', async () => {
    const editor = mockEditor({ active: ['link'] });
    await toggleLink(editor, mockCtx());
    expect(editor.names()).toEqual(['unsetLink']);
  });

  it('asks for a URL and prefills the current href', async () => {
    const editor = mockEditor({ attrs: { href: 'https://old' } });
    const ctx = mockCtx({ askText: vi.fn(async () => 'https://new') });
    await toggleLink(editor, ctx);
    expect(ctx.askText.mock.calls[0][0].value).toBe('https://old');
    expect(editor.calls).toEqual([{ name: 'setLink', args: [{ href: 'https://new' }] }]);
  });

  it('refuses unsafe schemes', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => ' JavaScript:alert(1)') });
    await toggleLink(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.unsafeUrl', 'error');
  });

  it('does nothing when cancelled', async () => {
    const editor = mockEditor();
    await toggleLink(editor, mockCtx({ askText: vi.fn(async () => null) }));
    expect(editor.calls).toEqual([]);
  });
});

describe('filterActions', () => {
  const translate = (key) => en[key] || key;

  it('returns everything for an empty query', () => {
    expect(filterActions(allActions(), '   ', translate)).toHaveLength(allActions().length);
  });

  it('matches translated labels case-insensitively', () => {
    const ids = filterActions(allActions(), 'SPOILER', translate).map((a) => a.id);
    expect(ids).toContain('spoiler');
  });

  it('matches action ids too', () => {
    const ids = filterActions(allActions(), 'checklist', translate).map((a) => a.id);
    expect(ids).toEqual(['checklist']);
  });

  it('returns nothing for a miss', () => {
    expect(filterActions(allActions(), 'zzzz', translate)).toEqual([]);
  });
});

describe('isActionActive', () => {
  it('is false without an isActive predicate', () => {
    expect(isActionActive({ id: 'x' }, mockEditor())).toBe(false);
  });

  it('swallows predicate errors', () => {
    const action = {
      id: 'boom',
      isActive: () => {
        throw new Error('nope');
      },
    };
    expect(isActionActive(action, mockEditor())).toBe(false);
  });
});
