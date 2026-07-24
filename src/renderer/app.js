/**
 * TelegramFreeRich v3.0 — Free-form rich text editor with chat sessions
 * Single contenteditable, no block system. Markdown conversion via HTML.
 */

// ===================== STATE =====================
const CHATS_KEY = 'tfr-chats';
const SETTINGS_KEY = 'tfr-settings';
const THEME_KEY = 'tfr-theme';

const state = {
  chats: JSON.parse(localStorage.getItem(CHATS_KEY) || '[]'),
  activeChatId: null,
  theme: localStorage.getItem(THEME_KEY) || 'dark',
  settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
  isRtl: false,
  skipEntityDetection: false,
  mode: 'rich',
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function save() { localStorage.setItem(CHATS_KEY, JSON.stringify(state.chats)); }
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .2s'; setTimeout(() => t.remove(), 200); }, 2500);
}

// ===================== CHAT MANAGEMENT =====================
function createChat(name) {
  const chat = { id: `chat_${Date.now()}`, name: name || 'New Chat', content: '', created: Date.now() };
  state.chats.unshift(chat);
  state.activeChatId = chat.id;
  save();
  renderChatList();
  loadActiveChat();
  return chat;
}

function deleteChat(id) {
  state.chats = state.chats.filter(c => c.id !== id);
  if (state.activeChatId === id) {
    state.activeChatId = state.chats.length ? state.chats[0].id : null;
  }
  save();
  renderChatList();
  loadActiveChat();
}

function renameChat(id, newName) {
  const chat = state.chats.find(c => c.id === id);
  if (chat) { chat.name = newName || 'Untitled'; save(); renderChatList(); updateChatTitle(); }
}

function switchChat(id) {
  saveCurrentChatContent();
  state.activeChatId = id;
  save();
  renderChatList();
  loadActiveChat();
  updateChatTitle();
}

function saveCurrentChatContent() {
  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (chat) { chat.content = $('#editor').innerHTML; save(); }
}

function loadActiveChat() {
  const chat = state.chats.find(c => c.id === state.activeChatId);
  const editor = $('#editor');
  if (chat) {
    editor.innerHTML = chat.content || '';
  } else {
    editor.innerHTML = '';
  }
  updateCharCount();
}

function updateChatTitle() {
  const chat = state.chats.find(c => c.id === state.activeChatId);
  const el = $('#chat-title-display');
  if (el) el.textContent = chat ? chat.name : 'No Chat Selected';
}

// ===================== RENDER CHAT LIST =====================
function renderChatList() {
  const list = $('#chat-list');
  if (!list) return;
  list.innerHTML = '';
  state.chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `chat-item${chat.id === state.activeChatId ? ' active' : ''}`;
    item.addEventListener('click', () => switchChat(chat.id));

    const name = document.createElement('span');
    name.className = 'chat-item-name';
    name.textContent = chat.name;

    const actions = document.createElement('div');
    actions.className = 'chat-item-actions';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'chat-item-btn';
    renameBtn.textContent = '✏';
    renameBtn.title = 'Rename';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text'; input.value = chat.name; input.className = 'rename-input';
      name.replaceWith(input); input.focus(); input.select();
      const finish = () => { renameChat(chat.id, input.value.trim()); };
      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (ke) => { if (ke.key === 'Enter') finish(); if (ke.key === 'Escape') { renderChatList(); } });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'chat-item-btn danger';
    deleteBtn.textContent = '🗑';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(name);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

// ===================== THEME =====================
function applyTheme() {
  const isLight = state.theme === 'light';
  document.body.classList.toggle('light', isLight);
  const sun = $('#icon-sun'), moon = $('#icon-moon');
  if (sun && moon) { sun.style.display = isLight ? 'none' : ''; moon.style.display = isLight ? '' : 'none'; }
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const el = $('#char-count');
  if (!el) return;
  const text = $('#editor').textContent || '';
  el.textContent = `${text.length.toLocaleString()} / 32,768`;
  el.style.color = text.length > 32768 ? 'var(--danger)' : '';
}

// ===================== TOOLBAR COMMANDS =====================
function execCmd(cmd) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  switch (cmd) {
    case 'bold': document.execCommand('bold'); break;
    case 'italic': document.execCommand('italic'); break;
    case 'underline': document.execCommand('underline'); break;
    case 'strikethrough': document.execCommand('strikeThrough'); break;
    case 'code': wrapSelection('code'); break;
    case 'spoiler': wrapSelection('span', 'tg-spoiler'); break;
    case 'sub': document.execCommand('subscript'); break;
    case 'sup': document.execCommand('superscript'); break;
    case 'marked': wrapSelection('mark'); break;
    case 'math-inline': wrapSelection('span', 'tg-math'); break;
    case 'link': insertLink(); break;
    case 'heading': insertHeading(); break;
    case 'bullet-list': insertHTML('<ul><li>Item</li></ul>'); break;
    case 'ordered-list': insertHTML('<ol><li>Item</li></ol>'); break;
    case 'checklist': insertHTML('<ul><li><input type="checkbox"> Todo</li></ul>'); break;
    case 'blockquote': document.execCommand('formatBlock', false, 'blockquote'); break;
    case 'code-block': insertHTML('<pre><code class="language-">Code here</code></pre>'); break;
    case 'table': insertHTML('<table><tr><th>H1</th><th>H2</th><th>H3</th></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>'); break;
    case 'divider': insertHTML('<hr>'); break;
    case 'details': insertHTML('<details><summary>Click to expand</summary>Content here</details>'); break;
    case 'math-block': insertHTML('<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$formula$$</div>'); break;
    case 'image': insertMedia('image', '.jpg'); break;
    case 'video': insertMedia('video', '.mp4'); break;
    case 'animation': insertMedia('animation', '.gif'); break;
    case 'audio': insertMedia('audio', '.mp3'); break;
    case 'voicenote': insertMedia('voicenote', '.ogg'); break;
    case 'map': insertHTML('<div class="tg-map">📍 Map: lat, long, zoom</div>'); break;
    case 'collage': insertHTML('<div class="tg-map">⊞ Collage: add image URLs</div>'); break;
    case 'slideshow': insertHTML('<div class="tg-map">▶⊞ Slideshow: add image URLs</div>'); break;
  }
  setTimeout(updateCharCount, 50);
}

function wrapSelection(tag, className) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const text = sel.getRangeAt(0).toString();
  if (!text) return;
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(el);
  sel.removeAllRanges();
  const nr = document.createRange();
  nr.selectNodeContents(el);
  sel.addRange(nr);
}

function insertLink() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const text = sel.getRangeAt(0).toString() || 'link text';
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;
  const a = document.createElement('a');
  a.href = url; a.textContent = text; a.target = '_blank';
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(a);
  const nr = document.createRange();
  nr.selectNodeContents(a);
  sel.removeAllRanges();
  sel.addRange(nr);
}

function insertHeading() {
  const level = prompt('Heading level (1-6):', '2');
  if (!level) return;
  const h = parseInt(level) || 2;
  document.execCommand('formatBlock', false, `h${Math.min(6, Math.max(1, h))}`);
}

function insertHTML(html) {
  document.execCommand('insertHTML', false, html + '<br>');
}

function insertMedia(type, ext) {
  const url = prompt(`Enter ${type} URL (should end with ${ext}):`, 'https://');
  if (!url) return;
  if (type === 'image' || type === 'animation') {
    document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:300px;border-radius:8px" alt="${type}"><br>`);
  } else {
    document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">📎 ${type}: ${url}</a><br>`);
  }
}

// ===================== MARKDOWN CONVERSION =====================
function editorToMarkdown() {
  const html = $('#editor').innerHTML;
  return htmlToMarkdown(html);
}

function htmlToMarkdown(html) {
  let md = html;
  // Block elements
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, inner) => inner.split('\n').map(l => `> ${l.replace(/<[^>]+>/g, '')}`).join('\n') + '\n');
  md = md.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => '```\n' + decodeEntities(code.trim()) + '\n```\n');
  md = md.replace(/<hr\s*\/?>/gi, '---\n');
  md = md.replace(/<details[^>]*><summary[^>]*>(.*?)<\/summary>([\s\S]*?)<\/details>/gi, '<details><summary>$1</summary>\n$2\n</details>\n');
  md = md.replace(/<div class="tg-math"[^>]*>\$\$(.*?)\$\$<\/div>/gi, '$$$1$$\n');
  md = md.replace(/<div class="tg-map"[^>]*>.*?([\d.-]+)[,\s]+([\d.-]+)[,\s]+([\d.-]+).*?<\/div>/gi, '<tg-map lat="$1" long="$2" zoom="$3"/>\n');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    const lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    return lis ? lis.map(li => {
      const text = li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '');
      const checked = li.includes('checked');
      return checked ? `- [x] ${text}` : `- ${text}`;
    }).join('\n') + '\n' : '';
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    const lis = items.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    return lis ? lis.map((li, i) => {
      const text = li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '');
      return `${i + 1}. ${text}`;
    }).join('\n') + '\n' : '';
  });
  // Table
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, table) => {
    const rows = [];
    const trs = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trs) return '';
    trs.forEach((tr, ri) => {
      const cells = [];
      const isHeader = ri === 0;
      const cellTag = isHeader ? 'th' : 'td';
      const cellRegex = new RegExp(`<${cellTag}[^>]*>([\\s\\S]*?)<\\/${cellTag}>`, 'gi');
      let m; while ((m = cellRegex.exec(tr)) !== null) cells.push(m[1].replace(/<[^>]+>/g, ''));
      rows.push('| ' + cells.join(' | ') + ' |');
      if (ri === 0) rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    });
    return rows.join('\n') + '\n';
  });
  // Map tag
  md = md.replace(/<div class="tg-map">📍 Map: ([\d.-]+), ([\d.-]+), ([\d.-]+)<\/div>/gi, '<tg-map lat="$1" long="$2" zoom="$3"/>\n');
  md = md.replace(/<div class="tg-map">[^<]*<\/div>/gi, '');
  // Inline elements
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
  md = md.replace(/<span class="tg-datetime"[^>]*>(.*?)<\/span>/gi, '<time>$1</time>');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  md = decodeEntities(md);
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

function decodeEntities(s) { const el = document.createElement('div'); el.innerHTML = s; return el.textContent || ''; }

// ===================== SETTINGS =====================
function initSettings() {
  const overlay = $('#settings-overlay');
  const open = () => {
    $('#input-token').value = state.settings.token || '';
    $('#input-chat').value = state.settings.chatId || '';
    $('#input-edit-id').value = state.settings.editId || '';
    overlay.classList.remove('hidden');
  };
  const close = () => overlay.classList.add('hidden');

  $('#btn-settings')?.addEventListener('click', open);
  $('#btn-settings-bottom')?.addEventListener('click', open);
  $('#btn-close-settings')?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  $('#btn-save-settings')?.addEventListener('click', () => {
    state.settings.token = $('#input-token').value.trim();
    state.settings.chatId = $('#input-chat').value.trim();
    state.settings.editId = $('#input-edit-id').value.trim();
    state.settings.tokenSet = !!state.settings.token;
    saveSettings();
    updateStatus(); close(); toast('Settings saved', 'success');
  });

  $('#btn-test-connection')?.addEventListener('click', async () => {
    const token = $('#input-token').value.trim();
    if (!token) { toast('Enter bot token', 'error'); return; }
    const el = $('#connection-status');
    el.textContent = 'Testing...'; el.className = '';
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok) { el.textContent = `✓ @${data.result.username} connected`; el.className = 'ok'; }
      else { el.textContent = `✗ ${data.description}`; el.className = 'error'; }
    } catch { el.textContent = '✗ Network error'; el.className = 'error'; }
  });
  updateStatus();
}

function updateStatus() {
  const dot = $('#status-dot'), text = $('#status-text');
  if (state.settings.tokenSet) {
    dot.className = 'status-dot connected';
    text.textContent = state.settings.chatId ? `→ ${state.settings.chatId}` : 'Bot connected';
  } else { dot.className = 'status-dot'; text.textContent = 'Connect bot'; }
}

// ===================== SEND =====================
async function sendMessage() {
  if (!state.settings.tokenSet) { toast('Configure bot token', 'error'); return; }
  if (!state.settings.chatId) { toast('Set chat ID', 'error'); return; }
  const content = $('#editor').innerHTML.trim();
  if (!content) { toast('Nothing to send', 'error'); return; }

  const markdown = editorToMarkdown();
  const body = { chat_id: state.settings.chatId, rich_message: { markdown } };
  if (state.isRtl) body.rich_message.is_rtl = true;
  if (state.skipEntityDetection) body.rich_message.skip_entity_detection = true;

  try {
    const sendBtn = $('#btn-send');
    sendBtn.style.opacity = '0.5'; sendBtn.disabled = true;
    let res;
    if (state.mode === 'draft') {
      res = await fetch(`https://api.telegram.org/bot${state.settings.token}/sendRichMessageDraft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    } else if (state.mode === 'edit' && state.settings.editId) {
      res = await fetch(`https://api.telegram.org/bot${state.settings.token}/editMessageText`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, message_id: state.settings.editId }),
      });
    } else {
      res = await fetch(`https://api.telegram.org/bot${state.settings.token}/sendRichMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    }
    const data = await res.json();
    if (data.ok) toast(state.mode === 'draft' ? 'Draft sent' : state.mode === 'edit' ? 'Edited!' : 'Sent!', 'success');
    else toast(`Error: ${data.description}`, 'error');
    sendBtn.style.opacity = '1'; sendBtn.disabled = false;
  } catch { toast('Network error', 'error'); $('#btn-send').style.opacity = '1'; $('#btn-send').disabled = false; }
}

// ===================== TEST MESSAGE =====================
function loadTestMessage() {
  const editor = $('#editor');
  editor.innerHTML = `<h1>TelegramFreeRich <strong>Full Test</strong></h1>

<h2>Section 1 — All 25 Inline Types</h2>

<p>1. <strong>Bold</strong> &bull; 2. <em>Italic</em> &bull; 3. <u>Underline</u> &bull; 4. <s>Strikethrough</s> &bull; 5. <span class="tg-spoiler">Spoiler</span></p>

<p>6. <sub>Subscript</sub> (H₂O) &bull; 7. <sup>Superscript</sup> (E=mc²) &bull; 8. <mark>Marked/Highlighted</mark></p>

<p>9. <code>Inline code</code> &bull; 10. <time class="tg-datetime">${new Date().toLocaleString()}</time> (DateTime)</p>

<p>11. <span class="tg-math">\\frac{a}{b}</span> (Math Inline) &bull; 12. ⭐ (Custom Emoji)</p>

<p>13. <a href="https://telegram.org">URL / Link</a> &bull; 14. <a href="mailto:user@example.com">Email</a> &bull; 15. <a href="tel:+1234567890">Phone</a></p>

<p>16. 1234 5678 9012 3456 (Bank Card) &bull; 17. <span style="color:var(--accent)">@username</span> (Mention) &bull; 18. <span style="color:var(--accent)">#hashtag</span> (Hashtag)</p>

<p>19. <span style="color:var(--success)">$STARS</span> (Cashtag) &bull; 20. <span style="color:var(--accent)">/start@BotFather</span> (Bot Command) &bull; 21. Text Mention</p>

<p>22. <a name="anchor-top"></a>Anchor &bull; 23. <a href="#anchor-top">Anchor Link</a> &bull; 24. Reference &bull; 25. <a href="#ref">Ref Link</a></p>

<hr>

<h2>Section 2 — All Block Types (21 types)</h2>

<h3>2a. Headings H1-H6</h3>
<h1>H1 — Largest</h1>
<h2>H2 — Section</h2>
<h3>H3 — Subsection</h3>
<h4>H4 — Medium</h4>
<h5>H5 — Small</h5>
<h6>H6 — Smallest</h6>

<h3>2b. Block Quote</h3>
<blockquote><strong>"The only way to do great work is to love what you do."</strong> — Steve Jobs</blockquote>

<h3>2c. Code Block</h3>
<pre><code class="language-python">def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fibonacci(10))</code></pre>

<h3>2d. Lists</h3>
<ul>
<li>Unordered item A</li>
<li>Unordered item B with <code>code</code></li>
<li>Unordered item C</li>
</ul>
<ol>
<li>First ordered item</li>
<li>Second ordered item</li>
<li>Third with <strong>bold</strong></li>
</ol>

<h3>2e. Checklist</h3>
<ul>
<li><input type="checkbox" checked> Completed task</li>
<li><input type="checkbox"> In progress task</li>
<li><input type="checkbox"> Pending task</li>
</ul>

<h3>2f. Table</h3>
<table>
<tr><th>Feature</th><th>Version</th><th>Status</th></tr>
<tr><td>Bold / Italic</td><td>10.1</td><td>✅</td></tr>
<tr><td>Table block</td><td>10.1</td><td>✅</td></tr>
<tr><td>Collage</td><td>10.2</td><td>✅</td></tr>
<tr><td>Map</td><td>10.2</td><td>✅</td></tr>
</table>

<h3>2g. Details (Collapsible)</h3>
<details>
<summary>🔽 Click to expand — hidden content</summary>
<p>This content is <strong>hidden</strong> by default. Telegram renders it as a collapsible block.</p>
<table>
<tr><th>Key</th><th>Value</th></tr>
<tr><td>A</td><td>1</td></tr>
</table>
</details>

<h3>2h. Divider</h3>
<hr>

<h3>2i. Footer</h3>
<p><em>This is footer-style text — italic and smaller.</em></p>

<h3>2j. Math Block</h3>
<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$\\int_{0}^{2\\pi} \\sin^2(x) dx = \\pi$$</div>

<h3>2k. Map</h3>
<div class="tg-map">📍 Tehran: 35.6892, 51.3890, zoom 13</div>

<h3>2l. Anchor</h3>
<a name="section-end"></a>
<p><em>Anchor named "section-end" positioned here.</em></p>

<hr>

<h2>Section 3 — InputRichMessage Features</h2>
<p>✅ <strong>is_rtl</strong> — RTL toggle below<br>
✅ <strong>skip_entity_detection</strong> — No Detect toggle below<br>
✅ <strong>media field</strong> — tg://photo?id= for file uploads<br>
✅ <strong>Three modes</strong> — Rich / Draft / Edit</p>

<p><em>Generated by TelegramFreeRich — covers all Bot API 10.1/10.2 rich message features</em></p>`;
  updateCharCount();
  toast('Full test loaded', 'success');
}

// ===================== INIT =====================
function init() {
  // Theme
  applyTheme();
  $('#btn-theme')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, state.theme);
    applyTheme();
  });

  // Chat sidebar toggle
  $('#btn-sidebar-toggle')?.addEventListener('click', () => $('#chat-sidebar').classList.toggle('open'));

  // New chat buttons
  const newChat = () => { createChat('Chat ' + (state.chats.length + 1)); };
  $('#btn-new-chat')?.addEventListener('click', newChat);
  $('#btn-new-chat-sidebar')?.addEventListener('click', newChat);

  // Toolbar
  $$('.tb-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => execCmd(btn.dataset.cmd));
  });

  // Test button
  $('#btn-test-message')?.addEventListener('click', loadTestMessage);

  // Settings
  initSettings();

  // Send
  $('#btn-send')?.addEventListener('click', sendMessage);

  // Mode tabs
  $$('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      $$('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === state.mode));
    });
  });

  // RTL / entity flags
  $('#chk-rtl')?.addEventListener('change', (e) => { state.isRtl = e.target.checked; });
  $('#chk-skip-entities')?.addEventListener('change', (e) => { state.skipEntityDetection = e.target.checked; });

  // Chat title rename on click
  $('#chat-title-display')?.addEventListener('click', () => {
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (!chat) return;
    const name = prompt('Rename chat:', chat.name);
    if (name) renameChat(chat.id, name);
  });

  // Editor input → save + char count
  $('#editor')?.addEventListener('input', () => {
    updateCharCount();
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (chat) { chat.content = $('#editor').innerHTML; save(); }
  });

  // Auto-save on content change
  $('#editor')?.addEventListener('blur', () => saveCurrentChatContent());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); execCmd('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); execCmd('italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); execCmd('underline'); }
  });

  // Load chats
  renderChatList();
  if (state.chats.length) {
    state.activeChatId = state.chats[0].id;
    loadActiveChat();
    updateChatTitle();
    renderChatList();
  } else {
    createChat('Welcome');
    $('#editor').innerHTML = '<h2>TelegramFreeRich v3.0</h2><p>Free-form rich text editor for Telegram Bot API 10.1/10.2.</p><p>Start typing or click <strong>✓</strong> to load the full test message.</p><p>Use the <strong>+</strong> button (top right) to create new chats.</p>';
    updateCharCount();
  }
}

document.addEventListener('DOMContentLoaded', init);
