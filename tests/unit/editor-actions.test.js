/**
 * Unit tests for the editor action registry.
 * A recording proxy stands in for the TipTap editor, so every action's command
 * chain can be asserted without mounting ProseMirror.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  EXTRA_ACTIONS,
  FORMAT_ACTIONS,
  FORMULA_ACTION,
  HEADING_ACTIONS,
  LINK_ACTION,
  LIST_ACTIONS,
  MEDIA_ACTIONS,
  TABLE_ACTIONS,
  TEXT_STYLE_ACTIONS,
  allActions,
  filterActions,
  insertFormula,
  insertLink,
  insertTable,
  isActionActive,
  isActionEnabled,
  mediaKindForUrl,
  parseCoords,
  parseUrlList,
} from '../../src/renderer/lib/editor-actions.js';
import en from '../../src/renderer/i18n/en.json';
import fa from '../../src/renderer/i18n/fa.json';

/**
 * @param {{ active?: string[], attrs?: object, selection?: object, text?: string }} [state]
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
    state: {
      selection: state.selection || { from: 0, to: 0, empty: true },
      doc: { textBetween: () => state.text || '' },
    },
  };
}

function mockCtx(overrides = {}) {
  return {
    askText: vi.fn(async () => 'https://example.com/a.png'),
    askLink: vi.fn(async () => ({ text: 'Telegram', url: 'https://t.me/x' })),
    notify: vi.fn(),
    ...overrides,
  };
}

/* ═══════════════════ registry shape ═══════════════════ */

const GROUPS = {
  formatting: TEXT_STYLE_ACTIONS,
  style: FORMAT_ACTIONS,
  list: LIST_ACTIONS,
  media: MEDIA_ACTIONS,
  table: TABLE_ACTIONS,
  extra: EXTRA_ACTIONS,
};

describe('registry shape', () => {
  it('every action has an id, label key, icon and a run function or children', () => {
    for (const [group, actions] of Object.entries(GROUPS)) {
      for (const action of actions) {
        expect(typeof action.id, `${group}.id`).toBe('string');
        expect(typeof action.i18nKey, `${group}:${action.id}`).toBe('string');
        expect(typeof action.icon, `${group}:${action.id}.icon`).toBe('function');
        const runnable = typeof action.run === 'function' || Array.isArray(action.children);
        expect(runnable, `${group}:${action.id} runnable`).toBe(true);
      }
    }
  });

  it('carries no Premium badges any more', () => {
    for (const action of [...allActions(), ...TABLE_ACTIONS, LINK_ACTION, FORMULA_ACTION]) {
      expect(action.premium, action.id).toBeUndefined();
    }
  });

  it('ids are unique across the palette', () => {
    const ids = allActions().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every label key is translated in both locales', () => {
    const everything = [...allActions(), ...TABLE_ACTIONS, LINK_ACTION, FORMULA_ACTION];
    for (const action of everything) {
      expect(en[action.i18nKey], `en:${action.i18nKey}`).toBeTruthy();
      expect(fa[action.i18nKey], `fa:${action.i18nKey}`).toBeTruthy();
      if (action.note) {
        expect(en[action.note], `en:${action.note}`).toBeTruthy();
        expect(fa[action.note], `fa:${action.note}`).toBeTruthy();
      }
    }
  });
});

/* ═══════════════════ 1. Formatting (Aa) ═══════════════════ */

describe('the Aa menu', () => {
  it('lists heading, text, quote, pull quote, attribution, code block, footer and divider', () => {
    expect(TEXT_STYLE_ACTIONS.map((a) => a.id)).toEqual([
      'heading',
      'paragraph',
      'blockquote',
      'pullquote',
      'attribution',
      'codeBlock',
      'footer',
      'divider',
    ]);
  });

  it('offers the attribution only inside a quote', () => {
    const action = TEXT_STYLE_ACTIONS.find((a) => a.id === 'attribution');
    expect(isActionEnabled(action, mockEditor({ active: ['blockquote'] }))).toBe(true);
    expect(isActionEnabled(action, mockEditor({ active: ['pullQuote'] }))).toBe(true);
    expect(isActionEnabled(action, mockEditor({ active: ['paragraph'] }))).toBe(false);
  });

  it('shows a tick once a quote names a source', () => {
    const action = TEXT_STYLE_ACTIONS.find((a) => a.id === 'attribution');
    expect(action.isActive(mockEditor({ active: ['blockquote'], attrs: {} }))).toBe(false);
    expect(
      action.isActive(mockEditor({ active: ['blockquote'], attrs: { attribution: 'Durov' } })),
    ).toBe(true);
  });

  it('writes the trimmed answer onto the quote, and ignores a cancelled prompt', async () => {
    const action = TEXT_STYLE_ACTIONS.find((a) => a.id === 'attribution');

    const editor = mockEditor({ active: ['blockquote'], attrs: { attribution: 'Old' } });
    await action.run(editor, mockCtx({ askText: vi.fn(async () => '  Durov  ') }));
    expect(editor.calls).toEqual([{ name: 'setQuoteAttribution', args: ['Durov'] }]);

    const cancelled = mockEditor({ active: ['blockquote'] });
    await action.run(cancelled, mockCtx({ askText: vi.fn(async () => null) }));
    expect(cancelled.calls).toEqual([]);
  });

  it('can take the attribution back off a quote', async () => {
    // Emptying the field and pressing OK is '', not null — a real answer, and
    // a different one from cancelling. Treating them alike left no way to
    // remove an attribution once it had been set.
    const action = TEXT_STYLE_ACTIONS.find((a) => a.id === 'attribution');
    const editor = mockEditor({ active: ['blockquote'], attrs: { attribution: 'Old' } });
    await action.run(editor, mockCtx({ askText: vi.fn(async () => '') }));
    expect(editor.calls).toEqual([{ name: 'setQuoteAttribution', args: [''] }]);
  });

  it('nests all six heading levels under Heading', () => {
    const heading = TEXT_STYLE_ACTIONS[0];
    expect(heading.children).toHaveLength(6);
    expect(heading.children.map((a) => a.id)).toEqual(HEADING_ACTIONS.map((a) => a.id));
    expect(heading.run).toBeUndefined();
  });

  it('toggles the requested heading level', () => {
    const editor = mockEditor();
    HEADING_ACTIONS[2].run(editor, mockCtx());
    expect(editor.calls).toEqual([{ name: 'toggleHeading', args: [{ level: 3 }] }]);
  });

  it('maps the remaining entries to their commands', () => {
    const expected = {
      paragraph: 'setParagraph',
      blockquote: 'toggleBlockquote',
      pullquote: 'togglePullQuote',
      codeBlock: 'toggleCodeBlock',
      footer: 'setFooter',
      divider: 'setHorizontalRule',
    };
    for (const [id, command] of Object.entries(expected)) {
      const editor = mockEditor();
      TEXT_STYLE_ACTIONS.find((a) => a.id === id).run(editor, mockCtx());
      expect(editor.names(), id).toEqual([command]);
    }
  });
});

/* ═══════════════════ 2. Text style (B) ═══════════════════ */

describe('the B menu', () => {
  it('lists exactly the eight inline styles, in order', () => {
    expect(FORMAT_ACTIONS.map((a) => a.id)).toEqual([
      'bold',
      'italic',
      'underline',
      'strike',
      'spoiler',
      'subscript',
      'superscript',
      'marked',
    ]);
  });

  it('runs the matching toggle command', () => {
    const expected = {
      bold: 'toggleBold',
      italic: 'toggleItalic',
      underline: 'toggleUnderline',
      strike: 'toggleStrike',
      spoiler: 'toggleSpoiler',
      subscript: 'toggleSubscript',
      superscript: 'toggleSuperscript',
      marked: 'toggleHighlight',
    };
    for (const action of FORMAT_ACTIONS) {
      const editor = mockEditor();
      action.run(editor, mockCtx());
      expect(editor.names(), action.id).toEqual([expected[action.id]]);
    }
  });

  it('reports active marks', () => {
    const bold = FORMAT_ACTIONS[0];
    expect(isActionActive(bold, mockEditor({ active: ['bold'] }))).toBe(true);
    expect(isActionActive(bold, mockEditor())).toBe(false);
  });
});

/* ═══════════════════ 3. Lists ═══════════════════ */

describe('the list menu', () => {
  it('lists ordered, bulleted, checklist and details', () => {
    expect(LIST_ACTIONS.map((a) => a.id)).toEqual([
      'orderedList',
      'bulletList',
      'checklist',
      'details',
    ]);
  });

  it('maps each entry to its command', () => {
    const expected = {
      orderedList: 'toggleOrderedList',
      bulletList: 'toggleBulletList',
      checklist: 'toggleTaskList',
      details: 'setDetails',
    };
    for (const action of LIST_ACTIONS) {
      const editor = mockEditor();
      action.run(editor, mockCtx());
      expect(editor.names(), action.id).toEqual([expected[action.id]]);
    }
  });
});

/* ═══════════════════ 4. Table ═══════════════════ */

describe('table', () => {
  it('inserts a 3×3 table with a header row in one click', () => {
    const editor = mockEditor();
    insertTable(editor);
    expect(editor.calls).toEqual([
      { name: 'insertTable', args: [{ rows: 3, cols: 3, withHeaderRow: true }] },
    ]);
  });

  it('offers row/column edits in the bubble menu', () => {
    const expected = {
      addRow: 'addRowAfter',
      addColumn: 'addColumnAfter',
      deleteRow: 'deleteRow',
      deleteColumn: 'deleteColumn',
      deleteTable: 'deleteTable',
    };
    for (const action of TABLE_ACTIONS) {
      const editor = mockEditor();
      action.run(editor, mockCtx());
      expect(editor.names(), action.id).toEqual([expected[action.id]]);
    }
  });
});

/* ═══════════════════ 5. Link ═══════════════════ */

describe('insertLink', () => {
  it('prefills the panel with the selected text and the current href', async () => {
    const editor = mockEditor({
      selection: { from: 1, to: 5, empty: false },
      text: 'chat',
      attrs: { href: 'https://old' },
    });
    const ctx = mockCtx();
    await insertLink(editor, ctx);
    expect(ctx.askLink).toHaveBeenCalledWith({ text: 'chat', url: 'https://old' });
  });

  it('inserts the text carrying a link mark', async () => {
    const editor = mockEditor();
    await insertLink(editor, mockCtx());
    expect(editor.calls).toEqual([
      {
        name: 'insertContent',
        args: [
          {
            type: 'text',
            text: 'Telegram',
            marks: [{ type: 'link', attrs: { href: 'https://t.me/x' } }],
          },
        ],
      },
    ]);
  });

  it('falls back to the URL when no text is given', async () => {
    const editor = mockEditor();
    await insertLink(editor, mockCtx({ askLink: vi.fn(async () => ({ text: '  ', url: 'https://a' })) }));
    expect(editor.calls[0].args[0].text).toBe('https://a');
  });

  it('refuses unsafe schemes', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askLink: vi.fn(async () => ({ text: 'x', url: ' JavaScript:alert(1)' })) });
    await insertLink(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.unsafeUrl', 'error');
  });

  it('does nothing when the panel is cancelled', async () => {
    const editor = mockEditor();
    await insertLink(editor, mockCtx({ askLink: vi.fn(async () => null) }));
    expect(editor.calls).toEqual([]);
  });
});

/* ═══════════════════ 6. Media ═══════════════════ */

describe('media helpers', () => {
  it('detects the block type from the file extension', () => {
    expect(mediaKindForUrl('https://a/b.MP4')).toBe('video');
    expect(mediaKindForUrl('https://a/b.mov?x=1')).toBe('video');
    expect(mediaKindForUrl('https://a/song.mp3')).toBe('audio');
    expect(mediaKindForUrl('https://a/song.ogg#t=1')).toBe('audio');
    expect(mediaKindForUrl('https://a/pic.jpg')).toBe('photo');
    expect(mediaKindForUrl('https://a/no-extension')).toBe('photo');
  });

  it('splits and sanitizes URL lists', () => {
    expect(parseUrlList(' https://a.jpg , https://b.jpg ')).toEqual([
      'https://a.jpg',
      'https://b.jpg',
    ]);
    expect(parseUrlList('javascript:alert(1)')).toEqual([]);
    expect(parseUrlList('')).toEqual([]);
  });
});

describe('the media menu', () => {
  it('offers exactly photo-or-video, audio file, location and caption', () => {
    expect(MEDIA_ACTIONS.map((a) => a.id)).toEqual([
      'photoOrVideo',
      'audioFile',
      'location',
      'caption',
    ]);
  });

  it('offers the caption only on a media node', () => {
    const action = MEDIA_ACTIONS.find((a) => a.id === 'caption');
    for (const node of ['image', 'mediaBlock', 'galleryBlock']) {
      expect(isActionEnabled(action, mockEditor({ active: [node] })), node).toBe(true);
    }
    expect(isActionEnabled(action, mockEditor({ active: ['paragraph'] }))).toBe(false);
  });

  it('asks for the caption then its credit, and stops on either cancel', async () => {
    const action = MEDIA_ACTIONS.find((a) => a.id === 'caption');

    const editor = mockEditor({ active: ['image'], attrs: { caption: 'Old', credit: '' } });
    const answers = ['  Clip title  ', ' Ada '];
    await action.run(editor, mockCtx({ askText: vi.fn(async () => answers.shift()) }));
    expect(editor.calls).toEqual([{ name: 'setMediaCaption', args: ['Clip title', 'Ada'] }]);

    const atCaption = mockEditor({ active: ['image'] });
    await action.run(atCaption, mockCtx({ askText: vi.fn(async () => null) }));
    expect(atCaption.calls).toEqual([]);

    const atCredit = mockEditor({ active: ['image'] });
    const second = ['Clip', null];
    await action.run(atCredit, mockCtx({ askText: vi.fn(async () => second.shift()) }));
    expect(atCredit.calls).toEqual([]);
  });

  it('can take a caption and its credit back off', async () => {
    const action = MEDIA_ACTIONS.find((a) => a.id === 'caption');

    const cleared = mockEditor({ active: ['image'], attrs: { caption: 'Old', credit: 'Ada' } });
    const empties = ['', ''];
    await action.run(cleared, mockCtx({ askText: vi.fn(async () => empties.shift()) }));
    expect(cleared.calls).toEqual([{ name: 'setMediaCaption', args: ['', ''] }]);

    // Dropping only the credit keeps the caption.
    const creditOnly = mockEditor({ active: ['image'], attrs: { caption: 'Old', credit: 'Ada' } });
    const mixed = ['Old', ''];
    await action.run(creditOnly, mockCtx({ askText: vi.fn(async () => mixed.shift()) }));
    expect(creditOnly.calls).toEqual([{ name: 'setMediaCaption', args: ['Old', ''] }]);
  });

  const photoOrVideo = () => MEDIA_ACTIONS.find((a) => a.id === 'photoOrVideo');

  it('inserts a single image', async () => {
    const editor = mockEditor();
    await photoOrVideo().run(editor, mockCtx());
    expect(editor.calls).toEqual([
      { name: 'setImage', args: [{ src: 'https://example.com/a.png' }] },
    ]);
  });

  it('inserts a single video as a media block', async () => {
    const editor = mockEditor();
    await photoOrVideo().run(editor, mockCtx({ askText: vi.fn(async () => 'https://a/clip.mp4') }));
    expect(editor.calls).toEqual([
      { name: 'setMediaBlock', args: [{ kind: 'video', src: 'https://a/clip.mp4' }] },
    ]);
  });

  it('turns two or more files into a slideshow', async () => {
    const editor = mockEditor();
    await photoOrVideo().run(
      editor,
      mockCtx({ askText: vi.fn(async () => 'https://a.jpg, https://b.jpg') }),
    );
    expect(editor.calls).toEqual([
      {
        name: 'setGalleryBlock',
        args: [{ kind: 'slideshow', images: ['https://a.jpg', 'https://b.jpg'] }],
      },
    ]);
  });

  it('rejects unsafe media URLs', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => 'javascript:alert(1)') });
    await photoOrVideo().run(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.unsafeUrl', 'error');
  });

  it('inserts an audio file', async () => {
    const editor = mockEditor();
    await MEDIA_ACTIONS.find((a) => a.id === 'audioFile').run(
      editor,
      mockCtx({ askText: vi.fn(async () => 'https://a/song.mp3') }),
    );
    expect(editor.calls).toEqual([
      { name: 'setMediaBlock', args: [{ kind: 'audio', src: 'https://a/song.mp3' }] },
    ]);
  });

  it('parses a location and rejects malformed coordinates', async () => {
    const location = MEDIA_ACTIONS.find((a) => a.id === 'location');

    const good = mockEditor();
    await location.run(good, mockCtx({ askText: vi.fn(async () => '35.6892, 51.389') }));
    expect(good.calls).toEqual([
      { name: 'setMapBlock', args: [{ latitude: 35.6892, longitude: 51.389 }] },
    ]);

    const bad = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => 'somewhere nice') });
    await location.run(bad, ctx);
    expect(bad.calls).toEqual([]);
    expect(ctx.notify).toHaveBeenCalledWith('toast.invalidCoords', 'error');
  });

  it('refuses a point that is not on the globe', async () => {
    const location = MEDIA_ACTIONS.find((a) => a.id === 'location');
    for (const input of ['999, 0', '0, -181', '-91, 10', '35.6892', '1, 2, 3', '35 degrees, 51']) {
      const editor = mockEditor();
      const ctx = mockCtx({ askText: vi.fn(async () => input) });
      await location.run(editor, ctx);
      expect(editor.calls, input).toEqual([]);
      expect(ctx.notify, input).toHaveBeenCalledWith('toast.invalidCoords', 'error');
    }
  });

  it('accepts the edges of the globe', () => {
    expect(parseCoords('-90, 180')).toEqual({ latitude: -90, longitude: 180 });
    expect(parseCoords(' 0 , 0 ')).toEqual({ latitude: 0, longitude: 0 });
    expect(parseCoords('90,-180')).toEqual({ latitude: 90, longitude: -180 });
  });

  it('does nothing when a prompt is dismissed', async () => {
    const editor = mockEditor();
    const ctx = mockCtx({ askText: vi.fn(async () => null) });
    await photoOrVideo().run(editor, ctx);
    expect(editor.calls).toEqual([]);
    expect(ctx.notify).not.toHaveBeenCalled();
  });
});

/* ═══════════════════ 7. Formula ═══════════════════ */

describe('insertFormula', () => {
  it('inserts a math block from the entered formula', async () => {
    const editor = mockEditor();
    await insertFormula(editor, mockCtx({ askText: vi.fn(async () => 'a^2+b^2') }));
    expect(editor.calls).toEqual([{ name: 'setMathBlock', args: ['a^2+b^2'] }]);
  });

  it('does nothing when cancelled', async () => {
    const editor = mockEditor();
    await insertFormula(editor, mockCtx({ askText: vi.fn(async () => null) }));
    expect(editor.calls).toEqual([]);
  });
});

/* ═══════════════════ palette ═══════════════════ */

describe('allActions', () => {
  it('flattens heading levels and drops the parent entry', () => {
    const ids = allActions().map((a) => a.id);
    expect(ids).toContain('heading3');
    expect(ids).not.toContain('heading');
  });

  it('includes the palette-only extras', () => {
    const ids = allActions().map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(['code', 'clearFormat', 'mathInline', 'collage', 'insertTable']),
    );
  });

  it('includes link and formula', () => {
    const ids = allActions().map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['link', 'formula']));
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

describe('state helpers', () => {
  it('treats actions without an `enabled` predicate as enabled', () => {
    expect(isActionEnabled(FORMAT_ACTIONS[0], mockEditor())).toBe(true);
    expect(isActionEnabled(FORMAT_ACTIONS[0], null)).toBe(false);
  });

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
