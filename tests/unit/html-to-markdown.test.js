/**
 * Comprehensive tests for htmlToMarkdown()
 * Tests ALL inline types, ALL block types, and edge cases.
 * Uses Node.js assert. Prints PASS/FAIL per test, summary at end.
 */
var assert = require('assert');

// ===================== COPY OF FUNCTION UNDER TEST =====================

function decodeEntities(s) {
  // Simple Node.js fallback — no DOM
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function htmlToMarkdown(html) {
  var md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, function (_, inner) {
    return inner.split('\n').map(function (l) { return '> ' + l.replace(/<[^>]+>/g, ''); }).join('\n') + '\n';
  });
  md = md.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function (_, code) {
    return '```\n' + decodeEntities(code.trim()) + '\n```\n';
  });
  md = md.replace(/<hr\s*\/?>/gi, '---\n');
  md = md.replace(/<details[^>]*><summary[^>]*>(.*?)<\/summary>([\s\S]*?)<\/details>/gi,
    '<details><summary>$1</summary>\n$2\n</details>\n');
  md = md.replace(/<div class="tg-math"[^>]*>\$\$(.*?)\$\$<\/div>/gi, '$$$1$$\n');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, function (_, items) {
    var lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    return lis ? lis.map(function (li) {
      var text = li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '');
      var checked = li.includes('checked');
      return checked ? '- [x] ' + text : '- ' + text;
    }).join('\n') + '\n' : '';
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, function (_, items) {
    var lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    return lis ? lis.map(function (li, i) {
      return (i + 1) + '. ' + li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '');
    }).join('\n') + '\n' : '';
  });
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, function (_, table) {
    var rows = [];
    var trs = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trs) return '';
    trs.forEach(function (tr, ri) {
      var cells = [];
      var regex = ri === 0 ? /<th[^>]*>([\s\S]*?)<\/th>/gi : /<td[^>]*>([\s\S]*?)<\/td>/gi;
      var m;
      while ((m = regex.exec(tr)) !== null) cells.push(m[1].replace(/<[^>]+>/g, ''));
      rows.push('| ' + cells.join(' | ') + ' |');
      if (ri === 0) rows.push('| ' + cells.map(function () { return '---'; }).join(' | ') + ' |');
    });
    return rows.join('\n') + '\n';
  });
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<span class="tg-spoiler">(.*?)<\/span>/gi, '||$1||');
  md = md.replace(/<sub>(.*?)<\/sub>/gi, '<sub>$1</sub>');
  md = md.replace(/<sup>(.*?)<\/sup>/gi, '<sup>$1</sup>');
  md = md.replace(/<mark>(.*?)<\/mark>/gi, '==$1==');
  md = md.replace(/<span class="tg-math">(.*?)<\/span>/gi, '$$$1$$');
  md = md.replace(/<footer>(.*?)<\/footer>/gi, '_$1_');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  md = decodeEntities(md);
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

// ===================== TEST FRAMEWORK =====================

var passed = 0;
var failed = 0;
var errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (e) {
    failed++;
    errors.push({ name: name, error: e });
    console.log('  FAIL: ' + name);
    console.log('        ' + e.message);
  }
}

function eq(actual, expected) {
  assert.strictEqual(actual, expected,
    '\n  Expected: ' + JSON.stringify(expected) +
    '\n  Actual:   ' + JSON.stringify(actual));
}

// ===================== BLOCK TYPE TESTS =====================

console.log('\n=== Block Types ===');

test('h1', function () {
  eq(htmlToMarkdown('<h1>Title</h1>'), '# Title');
});

test('h2', function () {
  eq(htmlToMarkdown('<h2>Subtitle</h2>'), '## Subtitle');
});

test('h3', function () {
  eq(htmlToMarkdown('<h3>Section</h3>'), '### Section');
});

test('h4', function () {
  eq(htmlToMarkdown('<h4>Subsection</h4>'), '#### Subsection');
});

test('h5', function () {
  eq(htmlToMarkdown('<h5>Detail</h5>'), '##### Detail');
});

test('h6', function () {
  eq(htmlToMarkdown('<h6>Micro</h6>'), '###### Micro');
});

test('h1 with attributes', function () {
  eq(htmlToMarkdown('<h1 id="top" class="title">Title</h1>'), '# Title');
});

test('h2 with nested inline', function () {
  eq(htmlToMarkdown('<h2>Hello <strong>World</strong></h2>'), '## Hello **World**');
});

test('blockquote single line', function () {
  eq(htmlToMarkdown('<blockquote>Quote text</blockquote>'), '> Quote text');
});

test('blockquote multi line', function () {
  var input = '<blockquote>Line one\nLine two</blockquote>';
  eq(htmlToMarkdown(input), '> Line one\n> Line two');
});

test('blockquote with nested bold', function () {
  var input = '<blockquote><strong>Important</strong> note</blockquote>';
  // The blockquote regex strips tags from inner content before adding >
  // The bold is inside blockquote, so blockquote regex runs first and strips <strong>
  var result = htmlToMarkdown(input);
  // Blockquote inner: <strong>Important</strong> note → > <strong>Important</strong> note
  // Then inner tags stripped → > Important note
  assert.ok(result.indexOf('Important note') !== -1, 'Should contain "Important note"');
});

test('pre code block (no class)', function () {
  var input = '<pre><code>console.log("hi");</code></pre>';
  eq(htmlToMarkdown(input), '```\nconsole.log("hi");\n```');
});

test('pre code block with language class', function () {
  var input = '<pre><code class="language-python">x = 1</code></pre>';
  eq(htmlToMarkdown(input), '```\nx = 1\n```');
});

test('pre code block multiline', function () {
  var input = '<pre><code class="language-js">line1\nline2\nline3</code></pre>';
  eq(htmlToMarkdown(input), '```\nline1\nline2\nline3\n```');
});

test('hr (self-closing)', function () {
  eq(htmlToMarkdown('<hr>'), '---');
});

test('hr with slash', function () {
  eq(htmlToMarkdown('<hr />'), '---');
});

test('details with summary', function () {
  var input = '<details><summary>Click me</summary>Hidden text</details>';
  eq(htmlToMarkdown(input), 'Click me\nHidden text');
});

test('div.tg-math block', function () {
  var input = '<div class="tg-math" style="text-align:center">$$x^2$$</div>';
  // JS replace: $$ in replacement string = literal $, so $$$1$$ = $<captured>$
  eq(htmlToMarkdown(input), '$x^2$');
});

test('ul bullet list', function () {
  var input = '<ul><li>Apple</li><li>Banana</li></ul>';
  eq(htmlToMarkdown(input), '- Apple\n- Banana');
});

test('ol ordered list', function () {
  var input = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
  eq(htmlToMarkdown(input), '1. First\n2. Second\n3. Third');
});

test('ul checklist (checked)', function () {
  var input = '<ul><li><input type="checkbox" checked> Done</li></ul>';
  // <input> stripped leaves " Done" with leading space
  eq(htmlToMarkdown(input), '- [x]  Done');
});

test('ul checklist (unchecked)', function () {
  var input = '<ul><li><input type="checkbox"> Todo</li></ul>';
  // <input> stripped leaves " Todo" with leading space
  eq(htmlToMarkdown(input), '-  Todo');
});

test('table simple', function () {
  var input = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
  eq(htmlToMarkdown(input), '| A | B |\n| --- | --- |\n| 1 | 2 |');
});

test('table 3x3', function () {
  var input = '<table><tr><th>H1</th><th>H2</th><th>H3</th></tr>' +
    '<tr><td>a</td><td>b</td><td>c</td></tr>' +
    '<tr><td>d</td><td>e</td><td>f</td></tr></table>';
  var expected = '| H1 | H2 | H3 |\n| --- | --- | --- |\n| a | b | c |\n| d | e | f |';
  eq(htmlToMarkdown(input), expected);
});

test('table with nested tags in cells', function () {
  var input = '<table><tr><th><strong>Bold</strong></th></tr><tr><td><em>Italic</em></td></tr></table>';
  eq(htmlToMarkdown(input), '| Bold |\n| --- |\n| Italic |');
});

// ===================== INLINE TYPE TESTS =====================

console.log('\n=== Inline Types (all 25 Bot API types) ===');

// 1. Bold (strong tag)
test('bold via <strong>', function () {
  eq(htmlToMarkdown('<strong>bold</strong>'), '**bold**');
});

// 2. Bold (b tag)
test('bold via <b>', function () {
  eq(htmlToMarkdown('<b>bold</b>'), '**bold**');
});

// 3. Italic (em tag)
test('italic via <em>', function () {
  eq(htmlToMarkdown('<em>italic</em>'), '*italic*');
});

// 4. Italic (i tag)
test('italic via <i>', function () {
  eq(htmlToMarkdown('<i>italic</i>'), '*italic*');
});

// 5. Underline
test('underline via <u>', function () {
  // The u regex replaces <u>X</u> with <u>X</u> (no-op), then final tag strip removes it
  eq(htmlToMarkdown('<u>underlined</u>'), 'underlined');
});

// 6. Strikethrough (s tag)
test('strikethrough via <s>', function () {
  eq(htmlToMarkdown('<s>struck</s>'), '~~struck~~');
});

// 7. Strikethrough (del tag)
test('strikethrough via <del>', function () {
  eq(htmlToMarkdown('<del>deleted</del>'), '~~deleted~~');
});

// 8. Spoiler
test('spoiler', function () {
  eq(htmlToMarkdown('<span class="tg-spoiler">secret</span>'), '||secret||');
});

// 9. Subscript
test('subscript', function () {
  // sub regex is no-op replacement, then final tag strip removes it
  eq(htmlToMarkdown('<sub>H₂</sub>'), 'H₂');
});

// 10. Superscript
test('superscript', function () {
  // sup regex is no-op replacement, then final tag strip removes it
  eq(htmlToMarkdown('<sup>x²</sup>'), 'x²');
});

// 11. Marked/Highlight
test('marked', function () {
  eq(htmlToMarkdown('<mark>highlighted</mark>'), '==highlighted==');
});

// 12. Inline code
test('inline code', function () {
  eq(htmlToMarkdown('<code>fn()</code>'), '`fn()`');
});

// 13. Link (URL)
test('link', function () {
  eq(htmlToMarkdown('<a href="https://t.me">Telegram</a>'), '[Telegram](https://t.me)');
});

// 14. Email link
test('email link', function () {
  eq(htmlToMarkdown('<a href="mailto:user@example.com">Email</a>'), '[Email](mailto:user@example.com)');
});

// 15. Phone link
test('phone link', function () {
  eq(htmlToMarkdown('<a href="tel:+1234567890">Call</a>'), '[Call](tel:+1234567890)');
});

// 16. Image
test('image', function () {
  eq(htmlToMarkdown('<img src="https://example.com/pic.jpg">'), '![](https://example.com/pic.jpg)');
});

// 17. Image with self-closing
test('image self-closing', function () {
  eq(htmlToMarkdown('<img src="https://example.com/pic.png" alt="pic"/>'), '![](https://example.com/pic.png)');
});

// 18. Math inline (span.tg-math)
test('inline math', function () {
  var input = '<span class="tg-math">E=mc²</span>';
  // JS replace: $$ in replacement string = literal $, so $$$1$$ = $<captured>$
  eq(htmlToMarkdown(input), '$E=mc²$');
});

// 19. Footer
test('footer', function () {
  eq(htmlToMarkdown('<footer>Footer text</footer>'), '_Footer text_');
});

// 20. Line break
test('line break <br>', function () {
  eq(htmlToMarkdown('Hello<br>World'), 'Hello\nWorld');
});

// 21. Line break <br/>
test('line break <br/>', function () {
  eq(htmlToMarkdown('Hello<br/>World'), 'Hello\nWorld');
});

// 22. Plain text (no tags) — Bank Card
test('plain text (bank card)', function () {
  eq(htmlToMarkdown('1234 5678 9012 3456'), '1234 5678 9012 3456');
});

// 23. @username styled span (not tg-spoiler/tg-math)
test('@username styled span', function () {
  var input = '<span style="color:var(--accent)">@username</span>';
  eq(htmlToMarkdown(input), '@username');
});

// 24. #hashtag styled span
test('#hashtag styled span', function () {
  var input = '<span style="color:var(--accent)">#hashtag</span>';
  eq(htmlToMarkdown(input), '#hashtag');
});

// 25. $STARS styled span
test('$STARS styled span', function () {
  var input = '<span style="color:var(--success)">$STARS</span>';
  eq(htmlToMarkdown(input), '$STARS');
});

// ===================== EDGE CASES =====================

console.log('\n=== Edge Cases ===');

test('empty string', function () {
  eq(htmlToMarkdown(''), '');
});

test('plain text no tags', function () {
  eq(htmlToMarkdown('Hello world'), 'Hello world');
});

test('HTML entities decoded', function () {
  eq(htmlToMarkdown('&amp; &lt; &gt;'), '& < >');
});

test('HTML entities in code block', function () {
  var input = '<pre><code>x &amp; y</code></pre>';
  eq(htmlToMarkdown(input), '```\nx & y\n```');
});

test('nested inline: bold + italic', function () {
  // strong regex: .*? matches <em>both</em> → **<em>both</em>**
  // Then em regex: <em>both</em> → *both*
  // Final: ***both***
  eq(htmlToMarkdown('<strong><em>both</em></strong>'), '***both***');
});

test('bold with attributes on strong tag', function () {
  // <strong> has no attributes in the regex — only (.*?) is matched
  // The regex is <strong>(.*?)<\/strong> — no [^>]* on the opening tag
  // So this will NOT match <strong class="x">
  var input = '<p><strong class="bold">text</strong></p>';
  // <p> is stripped at the end, <strong class="bold"> won't match <strong>
  // so it remains as <strong class="bold">text</strong> → <strong class="bold">text</strong>
  // then remaining tag strip removes tags → text
  eq(htmlToMarkdown(input), 'text');
});

test('link with extra attributes', function () {
  var input = '<a href="https://t.me" target="_blank" rel="noopener">Click</a>';
  eq(htmlToMarkdown(input), '[Click](https://t.me)');
});

test('multiple blockquotes in sequence', function () {
  var input = '<blockquote>First</blockquote><blockquote>Second</blockquote>';
  eq(htmlToMarkdown(input), '> First\n> Second');
});

test('multiple h1s', function () {
  var input = '<h1>A</h1><h1>B</h1>';
  eq(htmlToMarkdown(input), '# A\n# B');
});

test('list with inline bold', function () {
  var input = '<ul><li><strong>Bold</strong> item</li></ul>';
  // ul li regex strips tags, so bold tags removed → Bold item
  eq(htmlToMarkdown(input), '- Bold item');
});

test('multiple newlines collapsed', function () {
  var input = 'A\n\n\n\nB';
  eq(htmlToMarkdown(input), 'A\n\nB');
});

test('mixed block and inline', function () {
  var input = '<h2>Title</h2><p><strong>Bold</strong> text</p>';
  // <p> has no handler, stripped by final regex — no extra newline added
  eq(htmlToMarkdown(input), '## Title\n**Bold** text');
});

test('div tags converted to newlines', function () {
  var input = '<div>Hello</div><div>World</div>';
  // Leading \n is trimmed by the final .trim()
  eq(htmlToMarkdown(input), 'Hello\n\nWorld');
});

test('whitespace trimmed from result', function () {
  eq(htmlToMarkdown('  Hello  '), 'Hello');
});

test('trailing newlines trimmed', function () {
  eq(htmlToMarkdown('<br><br>Hello<br><br>'), 'Hello');
});

test('complex nested document', function () {
  var input = '<h1>Doc</h1><p>Para with <strong>bold</strong> and <em>italic</em></p><hr><blockquote>Quote</blockquote><pre><code>x=1</code></pre>';
  var result = htmlToMarkdown(input);
  assert.ok(result.indexOf('# Doc') !== -1, 'Should have h1');
  assert.ok(result.indexOf('**bold**') !== -1, 'Should have bold');
  assert.ok(result.indexOf('*italic*') !== -1, 'Should have italic');
  assert.ok(result.indexOf('---') !== -1, 'Should have hr');
  assert.ok(result.indexOf('> Quote') !== -1, 'Should have blockquote');
  assert.ok(result.indexOf('```\nx=1\n```') !== -1, 'Should have code block');
});

// ===================== SUMMARY =====================

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('Total:   ' + (passed + failed) + ' tests');
console.log('========================================');

if (failed > 0) {
  console.log('\nFailed tests:');
  errors.forEach(function (e) {
    console.log('  ✗ ' + e.name + ': ' + e.error.message);
  });
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  process.exit(0);
}
