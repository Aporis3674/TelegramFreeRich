/**
 * Unit tests for the Rich HTML serializer.
 *
 * These pin the wire format documented for Bot API 10.1: `sendRichMessage`
 * takes `rich_message: { html | markdown }` — never a `blocks` array — and the
 * HTML may only use the documented tag vocabulary.
 */
import { describe, it, expect } from 'vitest';
import {
  LIMITS,
  buildChecklistBody,
  buildDraftBody,
  buildEditBody,
  buildInputRichMessage,
  buildRichMessageBody,
  checkChecklist,
  checkLimits,
  escapeText,
  isPrivateChatId,
  safeUrl,
  serializeEditorHtml,
} from '../../src/shared/html-serializer.js';

/** @param {string} editorHtml */
const ser = (editorHtml) => serializeEditorHtml(editorHtml);
/** @param {string} editorHtml */
const html = (editorHtml) => ser(editorHtml).html;

describe('inline formatting', () => {
  it('maps every editor mark to its API tag', () => {
    expect(html('<p><strong>b</strong></p>')).toBe('<p><b>b</b></p>');
    expect(html('<p><em>i</em></p>')).toBe('<p><i>i</i></p>');
    expect(html('<p><u>u</u></p>')).toBe('<p><u>u</u></p>');
    expect(html('<p><s>s</s></p>')).toBe('<p><s>s</s></p>');
    expect(html('<p><code>c</code></p>')).toBe('<p><code>c</code></p>');
    expect(html('<p><mark>m</mark></p>')).toBe('<p><mark>m</mark></p>');
    expect(html('<p><sub>x</sub><sup>y</sup></p>')).toBe('<p><sub>x</sub><sup>y</sup></p>');
  });

  it('turns the spoiler span into <tg-spoiler>', () => {
    expect(html('<p><span data-spoiler="">shh</span></p>')).toBe('<p><tg-spoiler>shh</tg-spoiler></p>');
  });

  it('turns inline math into <tg-math>', () => {
    expect(html('<p><span data-inline-math="">a^2</span></p>')).toBe('<p><tg-math>a^2</tg-math></p>');
  });

  it('keeps nesting order', () => {
    expect(html('<p><strong><em>x</em></strong></p>')).toBe('<p><b><i>x</i></b></p>');
  });

  it('unwraps spans it does not know', () => {
    expect(html('<p><span style="color:red">x</span></p>')).toBe('<p>x</p>');
  });

  it('turns <br> into a newline', () => {
    expect(html('<p>a<br>b</p>')).toBe('<p>a\nb</p>');
  });

  it('escapes text', () => {
    expect(html('<p>a &lt; b &amp; c</p>')).toBe('<p>a &lt; b &amp; c</p>');
    expect(escapeText('<script>')).toBe('&lt;script&gt;');
  });
});

describe('links', () => {
  it('keeps http, https, mailto, tel, tg and anchors', () => {
    for (const url of [
      'https://t.me/x',
      'http://a.test',
      'mailto:a@b.c',
      'tel:+123456789',
      'tg://user?id=1',
      '#anchor',
    ]) {
      expect(html(`<p><a href="${url}">t</a></p>`), url).toBe(`<p><a href="${url}">t</a></p>`);
    }
  });

  it('drops the anchor but keeps the text for unsafe schemes', () => {
    expect(html('<p><a href="javascript:alert(1)">t</a></p>')).toBe('<p>t</p>');
    expect(html('<p><a href="data:text/html,x">t</a></p>')).toBe('<p>t</p>');
  });

  it('escapes quotes in the href', () => {
    expect(html('<p><a href="https://a/?q=&quot;x&quot;">t</a></p>')).toContain('&quot;');
  });
});

describe('blocks', () => {
  it('keeps headings, paragraphs, footers and dividers', () => {
    expect(html('<h2>T</h2>')).toBe('<h2>T</h2>');
    expect(html('<h6>T</h6>')).toBe('<h6>T</h6>');
    expect(html('<footer>f</footer>')).toBe('<footer>f</footer>');
    expect(html('<hr>')).toBe('<hr/>');
  });

  it('unwraps a lone paragraph inside a list item', () => {
    expect(html('<ul><li><p>a</p></li></ul>')).toBe('<ul><li>a</li></ul>');
    expect(html('<ul><li><p>a</p><p>b</p></li></ul>')).toBe('<ul><li><p>a</p><p>b</p></li></ul>');
  });

  it('keeps lists and preserves an ordered list start', () => {
    expect(html('<ul><li>a</li><li>b</li></ul>')).toBe('<ul><li>a</li><li>b</li></ul>');
    expect(html('<ol start="3"><li>a</li></ol>')).toBe('<ol start="3"><li>a</li></ol>');
  });

  it('writes a code block with its language', () => {
    expect(html('<pre><code class="language-js">x = 1;</code></pre>')).toBe(
      '<pre><code class="language-js">x = 1;</code></pre>',
    );
  });

  it('writes a code block without a language', () => {
    expect(html('<pre><code>plain</code></pre>')).toBe('<pre>plain</pre>');
  });

  it('escapes code block contents', () => {
    expect(html('<pre><code>a &lt; b</code></pre>')).toBe('<pre>a &lt; b</pre>');
  });

  it('keeps a quote and turns a pull quote into <aside>', () => {
    expect(html('<blockquote><p>q</p></blockquote>')).toBe('<blockquote><p>q</p></blockquote>');
    expect(html('<blockquote data-pullquote=""><p>q</p></blockquote>')).toBe(
      '<aside><p>q</p></aside>',
    );
  });

  it('adds <cite> for an attribution, on both quote kinds', () => {
    expect(html('<blockquote data-pullquote="" data-attribution="Durov"><p>q</p></blockquote>')).toBe(
      '<aside><p>q</p><cite>Durov</cite></aside>',
    );
    expect(html('<blockquote data-attribution="Durov"><p>q</p></blockquote>')).toBe(
      '<blockquote><p>q</p><cite>Durov</cite></blockquote>',
    );
  });

  it('escapes the attribution', () => {
    expect(html('<blockquote data-attribution="a &lt; b"><p>q</p></blockquote>')).toBe(
      '<blockquote><p>q</p><cite>a &lt; b</cite></blockquote>',
    );
  });

  it('leaves out an empty <cite>', () => {
    expect(html('<blockquote data-attribution=""><p>q</p></blockquote>')).toBe(
      '<blockquote><p>q</p></blockquote>',
    );
  });

  it('writes an open <details> with its summary', () => {
    expect(html('<details><summary>More</summary><p>body</p></details>')).toBe(
      '<details open><summary>More</summary><p>body</p></details>',
    );
  });

  it('writes a block formula', () => {
    expect(html('<div class="tg-math" data-formula="E=mc^2">$$E=mc^2$$</div>')).toBe(
      '<tg-math-block>E=mc^2</tg-math-block>',
    );
  });

  it('strips the $$ fence when there is no data-formula', () => {
    expect(html('<div class="tg-math">$$x^2$$</div>')).toBe('<tg-math-block>x^2</tg-math-block>');
  });

  it('drops empty blocks', () => {
    expect(html('<p></p>')).toBe('');
  });

  it('unwraps unknown elements but keeps their content', () => {
    expect(html('<section><p>x</p></section>')).toBe('<p>x</p>');
  });
});

describe('tables', () => {
  it('writes rows with header cells and a bordered table', () => {
    expect(
      html('<table><tbody><tr><th><p>H</p></th><td><p>c</p></td></tr></tbody></table>'),
    ).toBe('<table bordered><tr><th>H</th><td>c</td></tr></table>');
  });

  it('keeps inline formatting inside cells but flattens blocks', () => {
    expect(html('<table><tr><td><p><strong>b</strong></p></td></tr></table>')).toBe(
      '<table bordered><tr><td><b>b</b></td></tr></table>',
    );
  });

  it('caps columns at the documented maximum', () => {
    const cells = Array.from({ length: 25 }, (_, i) => `<td>${i}</td>`).join('');
    const out = html(`<table><tr>${cells}</tr></table>`);
    expect((out.match(/<td>/g) || []).length).toBe(LIMITS.TABLE_COLUMNS);
  });

  it('drops an empty table', () => {
    expect(html('<table></table>')).toBe('');
  });
});

describe('media', () => {
  it('writes photo, video and audio blocks', () => {
    expect(html('<img src="https://a/p.jpg">')).toBe('<img src="https://a/p.jpg"/>');
    expect(html('<video src="https://a/v.mp4"></video>')).toBe(
      '<video src="https://a/v.mp4"></video>',
    );
    expect(html('<audio src="https://a/s.mp3"></audio>')).toBe(
      '<audio src="https://a/s.mp3"></audio>',
    );
  });

  it('captions media with <figcaption>, and its credit with <cite>', () => {
    expect(html('<img src="https://a/p.jpg" data-caption="A view">')).toBe(
      '<img src="https://a/p.jpg"/><figcaption>A view</figcaption>',
    );
    expect(
      html('<video src="https://a/v.mp4" data-caption="Clip" data-credit="Ada"></video>'),
    ).toBe(
      '<video src="https://a/v.mp4"></video><figcaption>Clip<cite>Ada</cite></figcaption>',
    );
    // A credit with no caption is still a caption element.
    expect(html('<audio src="https://a/s.mp3" data-credit="Ada"></audio>')).toBe(
      '<audio src="https://a/s.mp3"></audio><figcaption><cite>Ada</cite></figcaption>',
    );
  });

  it('captions a gallery from inside the wrapper', () => {
    expect(
      html(
        '<div class="tg-gallery" data-kind="slideshow" data-images="https://a.jpg"' +
          ' data-caption="Trip" data-credit="Ada"></div>',
      ),
    ).toBe(
      '<tg-slideshow><img src="https://a.jpg"/>' +
        '<figcaption>Trip<cite>Ada</cite></figcaption></tg-slideshow>',
    );
  });

  it('writes no <figcaption> when there is nothing to say', () => {
    expect(html('<img src="https://a/p.jpg" data-caption="" data-credit="">')).toBe(
      '<img src="https://a/p.jpg"/>',
    );
  });

  it('escapes the caption and the credit', () => {
    expect(html('<img src="https://a/p.jpg" data-caption="a &lt; b" data-credit="c &amp; d">')).toBe(
      '<img src="https://a/p.jpg"/><figcaption>a &lt; b<cite>c &amp; d</cite></figcaption>',
    );
  });

  it('accepts only http(s) media, per the documented restriction', () => {
    expect(html('<img src="file:///tmp/a.png">')).toBe('');
    expect(html('<img src="javascript:alert(1)">')).toBe('');
    expect(html('<img src="tg://user?id=1">')).toBe('');
  });

  it('writes galleries as collage or slideshow', () => {
    expect(
      html('<div class="tg-gallery" data-kind="collage" data-images="https://a.jpg,https://b.jpg"></div>'),
    ).toBe('<tg-collage><img src="https://a.jpg"/><img src="https://b.jpg"/></tg-collage>');
    expect(
      html('<div class="tg-gallery" data-kind="slideshow" data-images="https://a.jpg"></div>'),
    ).toBe('<tg-slideshow><img src="https://a.jpg"/></tg-slideshow>');
  });

  it('falls back to child images for a gallery', () => {
    expect(html('<div class="tg-gallery" data-kind="collage"><img src="https://a.jpg"></div>')).toBe(
      '<tg-collage><img src="https://a.jpg"/></tg-collage>',
    );
  });

  it('writes a map with lat/long and a valid zoom', () => {
    const out = html('<div class="tg-map" data-lat="35.6892" data-lon="51.389"></div>');
    expect(out).toBe('<tg-map lat="35.6892" long="51.389" zoom="13"/>');
    const zoom = Number((out.match(/zoom="(\d+)"/) || [])[1]);
    expect(zoom).toBeGreaterThanOrEqual(LIMITS.MAP_ZOOM_MIN);
    expect(zoom).toBeLessThanOrEqual(LIMITS.MAP_ZOOM_MAX);
  });

  it('drops a map without coordinates', () => {
    expect(html('<div class="tg-map"></div>')).toBe('');
  });

  it('drops a map pointing off the globe', () => {
    // Telegram refuses it, and the error it returns names no block.
    expect(html('<div class="tg-map" data-lat="999" data-lon="0"></div>')).toBe('');
    expect(html('<div class="tg-map" data-lat="0" data-lon="-181"></div>')).toBe('');
    expect(html('<div class="tg-map" data-lat="-90" data-lon="180"></div>')).toBe(
      '<tg-map lat="-90" long="180" zoom="13"/>',
    );
  });

  it('counts media', () => {
    const out = ser('<img src="https://a.jpg"><div class="tg-gallery" data-images="https://b.jpg,https://c.jpg"></div>');
    expect(out.media).toBe(3);
  });
});

describe('checklists', () => {
  it('pulls task items out of the body', () => {
    const out = ser(
      '<p>intro</p><ul data-type="taskList"><li data-checked="true">done</li>' +
        '<li data-checked="false">todo</li></ul>',
    );
    expect(out.html).toBe('<p>intro</p>');
    expect(out.checklist).toEqual([
      { text: 'done', done: true },
      { text: 'todo', done: false },
    ]);
  });

  it('recognises checkbox inputs too', () => {
    const out = ser('<ul><li><input type="checkbox" checked> a</li><li><input type="checkbox"> b</li></ul>');
    expect(out.checklist.map((i) => i.done)).toEqual([true, false]);
    expect(out.html).toBe('');
  });

  it('leaves ordinary lists alone', () => {
    const out = ser('<ul><li>a</li></ul>');
    expect(out.checklist).toEqual([]);
    expect(out.html).toBe('<ul><li>a</li></ul>');
  });

  it('renders task items as Rich HTML checkboxes inside the body', () => {
    // `<li><input type="checkbox">` is documented Rich HTML, so Telegram draws
    // real checkboxes — in a channel too, unlike sendChecklist.
    const out = serializeEditorHtml(
      '<p>intro</p><ul data-type="taskList"><li data-checked="true">done</li>' +
        '<li data-checked="false">todo</li></ul>',
      { inlineChecklist: true },
    );
    expect(out.html).toBe(
      '<p>intro</p><ul><li><input type="checkbox" checked>done</li>' +
        '<li><input type="checkbox">todo</li></ul>',
    );
    expect(out.inlinedChecklist).toBe(true);
    // Still reported, so the caller can say which form was sent.
    expect(out.checklist).toEqual([
      { text: 'done', done: true },
      { text: 'todo', done: false },
    ]);
  });

  it('does not claim an inlined checklist when the document has none', () => {
    const out = serializeEditorHtml('<p>hi</p>', { inlineChecklist: true });
    expect(out.inlinedChecklist).toBe(false);
    expect(out.html).toBe('<p>hi</p>');
  });

  it('reads the markup TipTap actually emits for a task list', () => {
    // TaskItem wraps the text in a <div><p>, next to a <label> holding the
    // checkbox — the label contributes no text, so the item text is clean.
    const tiptap =
      '<ul data-type="taskList">' +
      '<li data-checked="true" data-type="taskItem">' +
      '<label><input type="checkbox" checked="checked"><span></span></label>' +
      '<div><p>hello</p></div></li>' +
      '<li data-checked="false" data-type="taskItem">' +
      '<label><input type="checkbox"><span></span></label>' +
      '<div><p>world</p></div></li></ul>';
    expect(ser(tiptap).checklist).toEqual([
      { text: 'hello', done: true },
      { text: 'world', done: false },
    ]);
    expect(serializeEditorHtml(tiptap, { inlineChecklist: true }).html).toBe(
      '<ul><li><input type="checkbox" checked>hello</li>' +
        '<li><input type="checkbox">world</li></ul>',
    );
  });

  it('escapes task text when inlining', () => {
    const out = serializeEditorHtml('<ul data-type="taskList"><li>a &lt; b</li></ul>', {
      inlineChecklist: true,
    });
    expect(out.html).toBe('<ul><li><input type="checkbox">a &lt; b</li></ul>');
  });
});

describe('request bodies', () => {
  it('sends html inside rich_message, never blocks', () => {
    const body = buildRichMessageBody('<p>hi</p>', '@chan');
    expect(body).toEqual({ chat_id: '@chan', rich_message: { html: '<p>hi</p>' } });
    expect(body.rich_message.blocks).toBeUndefined();
    expect(Object.keys(body.rich_message)).toEqual(['html']);
  });

  it('adds is_rtl and skip_entity_detection only when asked', () => {
    expect(buildInputRichMessage('<p>x</p>', { isRtl: true, skipEntityDetection: true })).toEqual({
      html: '<p>x</p>',
      is_rtl: true,
      skip_entity_detection: true,
    });
    expect(buildInputRichMessage('<p>x</p>', {})).toEqual({ html: '<p>x</p>' });
  });

  it('builds a draft body with a numeric chat and a non-zero draft id', () => {
    const body = buildDraftBody('<p>x</p>', '12345', 1);
    expect(body).toEqual({ chat_id: 12345, draft_id: 1, rich_message: { html: '<p>x</p>' } });
    expect(body.draft_id).not.toBe(0);
  });

  it('builds an edit body with a numeric message id', () => {
    expect(buildEditBody('<p>x</p>', '@chan', '42')).toEqual({
      chat_id: '@chan',
      message_id: 42,
      rich_message: { html: '<p>x</p>' },
    });
  });

  it('builds a checklist as InputChecklist: a title plus tasks with ids', () => {
    // "items" with a "done" flag is not a shape the API accepts; it answered
    // `can't parse InputChecklist: Can't find field "title"`.
    const body = buildChecklistBody([{ text: 'a', done: true }, { text: 'b' }], '12345', {
      title: 'Groceries',
      businessConnectionId: 'biz_1',
    });
    expect(body).toEqual({
      chat_id: '12345',
      business_connection_id: 'biz_1',
      checklist: {
        title: 'Groceries',
        tasks: [
          { id: 1, text: 'a' },
          { id: 2, text: 'b' },
        ],
      },
    });
  });

  it('gives every task a positive unique id', () => {
    const tasks = buildChecklistBody([{ text: 'a' }, { text: 'b' }, { text: 'c' }], '1').checklist
      .tasks;
    const ids = tasks.map((task) => task.id);
    expect(ids).toEqual([1, 2, 3]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...ids)).toBeGreaterThan(0);
  });

  it('drops the done flag — a task cannot be sent already ticked', () => {
    const tasks = buildChecklistBody([{ text: 'a', done: true }], '1').checklist.tasks;
    expect(tasks[0]).toEqual({ id: 1, text: 'a' });
    expect('done' in tasks[0]).toBe(false);
  });

  it('omits business_connection_id when there is none to send', () => {
    expect(buildChecklistBody([{ text: 'a' }], '1')).not.toHaveProperty(
      'business_connection_id',
    );
  });

  it('caps tasks and task text at the documented limits', () => {
    const many = Array.from({ length: LIMITS.CHECKLIST_TASKS + 5 }, (_, i) => ({
      text: `t${i}`,
    }));
    expect(buildChecklistBody(many, '1').checklist.tasks).toHaveLength(LIMITS.CHECKLIST_TASKS);

    const long = buildChecklistBody([{ text: 'x'.repeat(200) }], '1').checklist.tasks[0];
    expect(long.text).toHaveLength(LIMITS.CHECKLIST_TASK_CHARS);
  });
});

describe('checkChecklist', () => {
  it('accepts a checklist inside every limit', () => {
    expect(checkChecklist([{ text: 'a' }])).toEqual({ ok: true });
  });

  it('reports why a checklist cannot be sent', () => {
    expect(checkChecklist([]).reason).toBe('empty');
    expect(
      checkChecklist(Array.from({ length: LIMITS.CHECKLIST_TASKS + 1 }, () => ({ text: 'a' })))
        .reason,
    ).toBe('tasks');
    expect(checkChecklist([{ text: 'x'.repeat(LIMITS.CHECKLIST_TASK_CHARS + 1) }]).reason).toBe(
      'taskChars',
    );
  });
});

describe('limits', () => {
  it('accepts a message inside every limit', () => {
    expect(checkLimits({ chars: 10, blocks: 2, media: 0 })).toEqual({ ok: true });
  });

  it('reports which limit was exceeded', () => {
    expect(checkLimits({ chars: LIMITS.CHARS + 1, blocks: 1, media: 0 }).reason).toBe('chars');
    expect(checkLimits({ chars: 1, blocks: LIMITS.BLOCKS + 1, media: 0 }).reason).toBe('blocks');
    expect(checkLimits({ chars: 1, blocks: 1, media: LIMITS.MEDIA + 1 }).reason).toBe('media');
  });

  it('counts blocks and characters', () => {
    const out = ser('<h1>Title</h1><p>Body</p><hr>');
    expect(out.blocks).toBe(3);
    expect(out.chars).toBe('TitleBody'.length);
  });
});

describe('helpers', () => {
  it('detects a private chat id', () => {
    expect(isPrivateChatId('123456789')).toBe(true);
    expect(isPrivateChatId('@channel')).toBe(false);
    expect(isPrivateChatId('-1001234567890')).toBe(false);
  });

  it('safeUrl refuses unknown schemes', () => {
    expect(safeUrl('https://a')).toBe('https://a');
    expect(safeUrl('javascript:x')).toBe('');
    expect(safeUrl('/relative')).toBe('');
    expect(safeUrl('')).toBe('');
  });
});

describe('a full document', () => {
  it('serializes the demo message the app ships in its screenshot', () => {
    const out = ser(
      '<h2>Bot API 10.1</h2>' +
        '<p>Formatting is <strong>free</strong> through the Bot API.</p>' +
        '<ul><li>Headings, quotes, tables</li></ul>' +
        '<ul data-type="taskList"><li data-checked="false">Ship it</li></ul>' +
        '<pre><code class="language-js">sendRichMessage({})</code></pre>',
    );
    expect(out.html).toBe(
      '<h2>Bot API 10.1</h2>' +
        '<p>Formatting is <b>free</b> through the Bot API.</p>' +
        '<ul><li>Headings, quotes, tables</li></ul>' +
        '<pre><code class="language-js">sendRichMessage({})</code></pre>',
    );
    expect(out.checklist).toEqual([{ text: 'Ship it', done: false }]);
    expect(checkLimits(out).ok).toBe(true);
  });
});
