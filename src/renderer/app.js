/**
 * TelegramFreeRich 3.0.0 — Compact free-form editor
 * Bottom toolbar with 6 dropdown icons, single contenteditable, minimal UI.
 */

const THEME_KEY = 'tfr-theme';
const state = {
  theme: localStorage.getItem(THEME_KEY) || 'dark',
  settings: { tokenSet: false, chatId: '', editId: '', lang: 'en' },
  isRtl: false,
  skipEntityDetection: false,
  mode: 'rich',
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .2s'; setTimeout(() => t.remove(), 200); }, 2500);
}

// ===================== THEME =====================
function applyTheme() {
  const isLight = state.theme === 'light';
  document.body.classList.toggle('light', isLight);
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const el = $('#char-count'); if (!el) return;
  const text = ($('#editor').textContent || '');
  el.textContent = `${text.length.toLocaleString()} / 32,768`;
  el.style.color = text.length > 32768 ? 'var(--danger)' : '';
}

// ===================== POPUP MENU SYSTEM =====================
let openPopupId = null;

function showPopup(id, anchorEl) {
  closeAllPopups();
  const popup = $(id);
  if (!popup) return;
  popup.classList.remove('hidden');
  const rect = anchorEl.getBoundingClientRect();
  let top = rect.top - popup.offsetHeight - 8;
  let left = rect.left + (rect.width - popup.offsetWidth) / 2;
  if (top < 4) top = rect.bottom + 8;
  if (left < 4) left = 4;
  if (left + popup.offsetWidth > window.innerWidth - 4) left = window.innerWidth - popup.offsetWidth - 4;
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
  openPopupId = id;
  $('#popup-overlay').classList.remove('hidden');
}

function closeAllPopups() {
  $$('.popup-menu').forEach(p => p.classList.add('hidden'));
  $('#popup-overlay').classList.add('hidden');
  openPopupId = null;
}

// ===================== EDITOR COMMANDS =====================
function execCmd(cmd) {
  const editor = $('#editor');
  editor.focus();

  switch (cmd) {
    // Heading submenu
    case 'back-formatting': showPopup('#popup-formatting', $('#btn-formatting')); return;
    case 'h1': document.execCommand('formatBlock', false, 'h1'); break;
    case 'h2': document.execCommand('formatBlock', false, 'h2'); break;
    case 'h3': document.execCommand('formatBlock', false, 'h3'); break;
    case 'h4': document.execCommand('formatBlock', false, 'h4'); break;
    case 'h5': document.execCommand('formatBlock', false, 'h5'); break;
    case 'h6': document.execCommand('formatBlock', false, 'h6'); break;

    // Formatting menu
    case 'text': document.execCommand('formatBlock', false, 'p'); break;
    case 'blockquote': document.execCommand('formatBlock', false, 'blockquote'); break;
    case 'pullquote': insertHTML('<blockquote style="border-left-color:var(--warning)"><em>Pull quote text</em></blockquote>'); break;
    case 'code-block': insertHTML('<pre><code class="language-">Code here</code></pre>'); break;
    case 'footer': insertHTML('<footer>Footer text</footer>'); break;
    case 'divider': insertHTML('<hr>'); break;
    case 'math-block': insertHTML('<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$formula$$</div>'); break;
    case 'details': insertHTML('<details><summary>Click to expand</summary><p>Content here</p></details>'); break;

    // Text style
    case 'bold': document.execCommand('bold'); break;
    case 'italic': document.execCommand('italic'); break;
    case 'underline': document.execCommand('underline'); break;
    case 'strikethrough': document.execCommand('strikeThrough'); break;
    case 'spoiler': wrapSelection('span', 'tg-spoiler'); break;
    case 'sub': document.execCommand('subscript'); break;
    case 'sup': document.execCommand('superscript'); break;
    case 'marked': wrapSelection('mark'); break;

    // List menu
    case 'bullet-list': insertHTML('<ul><li>Item</li></ul>'); break;
    case 'ordered-list': insertHTML('<ol><li>Item</li></ol>'); break;
    case 'checklist': insertHTML('<ul><li><input type="checkbox"> Todo</li></ul>'); break;

    // Table — insert directly
    case 'table':
      insertHTML('<table><tr><th>H1</th><th>H2</th><th>H3</th></tr><tr><td>cell</td><td>cell</td><td>cell</td></tr><tr><td>cell</td><td>cell</td><td>cell</td></tr></table>');
      break;

    // Link — show panel
    case 'link': showLinkPanel(); return;

    // Media
    case 'image': insertMedia('photo/video', '.jpg/.mp4'); break;
    case 'audio': insertMedia('audio', '.mp3'); break;
  }

  setTimeout(updateCharCount, 50);
  closeAllPopups();
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
  const nr = document.createRange(); nr.selectNodeContents(el); sel.addRange(nr);
}

function insertHTML(html) {
  document.execCommand('insertHTML', false, html + '<br>');
}

function insertMedia(type, ext) {
  const url = prompt(`Enter ${type} URL (should end with ${ext}):`, 'https://');
  if (!url) return;
  if (type === 'photo/video') {
    document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:300px;border-radius:8px" alt="media"><br>`);
  } else {
    document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">📎 ${type}: ${url}</a><br>`);
  }
  closeAllPopups();
}

// ===================== LINK PANEL =====================
function showLinkPanel() {
  closeAllPopups();
  const sel = window.getSelection();
  const text = sel && sel.rangeCount ? sel.getRangeAt(0).toString() : '';
  $('#link-text').value = text;
  $('#link-url').value = '';
  showPopup('#link-panel', $('#btn-link'));
  setTimeout(() => $('#link-text').focus(), 50);
}

function createLink() {
  const text = $('#link-text').value.trim() || 'link text';
  const url = $('#link-url').value.trim();
  if (!url) { toast('Enter a URL', 'error'); return; }
  const editor = $('#editor');
  editor.focus();
  const a = document.createElement('a');
  a.href = url; a.textContent = text; a.target = '_blank';
  const sel = window.getSelection();
  if (sel && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(a);
    const nr = document.createRange(); nr.selectNodeContents(a); sel.removeAllRanges(); sel.addRange(nr);
  } else {
    editor.appendChild(a);
  }
  closeAllPopups();
  updateCharCount();
}

// ===================== MARKDOWN CONVERSION =====================
function editorToMarkdown() {
  return htmlToMarkdown($('#editor').innerHTML);
}

function htmlToMarkdown(html) {
  let md = html;
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
    return lis ? lis.map((li, i) => `${i + 1}. ${li.replace(/<li[^>]*>/i, '').replace(/<\/li>/i, '').replace(/<[^>]+>/g, '')}`).join('\n') + '\n' : '';
  });
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, table) => {
    const rows = [];
    const trs = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    if (!trs) return '';
    trs.forEach((tr, ri) => {
      const cells = []; const regex = ri === 0 ? /<th[^>]*>([\s\S]*?)<\/th>/gi : /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let m; while ((m = regex.exec(tr)) !== null) cells.push(m[1].replace(/<[^>]+>/g, ''));
      rows.push('| ' + cells.join(' | ') + ' |');
      if (ri === 0) rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
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

function decodeEntities(s) { const el = document.createElement('div'); el.innerHTML = s; return el.textContent || ''; }

// ===================== TEST MESSAGE =====================
function loadTestMessage() {
  const e = $('#editor');
  e.innerHTML = `<h2>TelegramFreeRich — Full Feature Test</h2>
<p>Covers all Bot API 10.1/10.2 rich message capabilities.</p>
<hr>
<h3>1. Inline Formatting (25 types)</h3>
<p><strong>Bold</strong> · <em>Italic</em> · <u>Underline</u> · <s>Strikethrough</s> · <span class="tg-spoiler">Spoiler</span></p>
<p><sub>Subscript</sub> · <sup>Superscript</sup> · <mark>Marked</mark> · <code>Inline Code</code></p>
<p><span class="tg-math">E = mc²</span> · <time>${new Date().toLocaleString()}</time></p>
<p><a href="https://telegram.org">URL/Link</a> · <a href="mailto:user@example.com">Email</a> · <a href="tel:+1234567890">Phone</a></p>
<p>1234 5678 9012 3456 (Bank Card) · <span style="color:var(--accent)">@username</span> · <span style="color:var(--accent)">#hashtag</span> · <span style="color:var(--success)">$STARS</span> · <span style="color:var(--accent)">@botfather</span> · Reference</p>
<hr>
<h3>2. Block Elements</h3>
<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>
<blockquote><strong>"Great work requires love."</strong> — Steve Jobs</blockquote>
<pre><code class="language-python">def greet(name): return f"Hello, {name}!"</code></pre>
<ul><li>Bullet item A</li><li>Bullet item B</li></ul>
<ol><li>First</li><li>Second</li><li>Third</li></ol>
<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>
<table><tr><th>Feature</th><th>Ver</th><th>Status</th></tr><tr><td>Bold</td><td>10.1</td><td>✅</td></tr><tr><td>Collage</td><td>10.2</td><td>✅</td></tr></table>
<details><summary>Click to expand</summary><p>Hidden content here with <strong>markdown</strong> inside.</p></details>
<hr>
<footer>Footer text — italic small</footer>
<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$\\int_{0}^{2\\pi} \\sin^2(x) dx = \\pi$$</div>
<p><em>— Full test complete —</em></p>`;
  updateCharCount();
  toast('Full test loaded', 'success');
}

// ===================== SETTINGS =====================
function initSettings() {
  // Load settings from main process (token NEVER enters renderer)
  window.app?.loadSettings().then(s => {
    if (s) { state.settings = { ...state.settings, ...s }; updateStatus(); }
  });

  const overlay = $('#settings-overlay');
  const open = async () => {
    const s = await window.app?.loadSettings();
    if (s) { state.settings = { ...state.settings, ...s }; }
    $('#input-token').value = state.settings.tokenSet ? '••••••••' : '';
    $('#input-chat').value = state.settings.chatId || '';
    $('#input-edit-id').value = state.settings.editId || '';
    $('#input-lang').value = state.settings.lang || 'en';
    $('#input-theme').value = state.theme;
    overlay.classList.remove('hidden');
  };
  $('#btn-settings')?.addEventListener('click', open);
  $('#btn-close-settings')?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });

  $('#btn-save-settings')?.addEventListener('click', async () => {
    const payload = {
      chatId: $('#input-chat').value.trim(),
      editId: $('#input-edit-id').value.trim(),
      lang: $('#input-lang').value,
    };
    // Only send token if user actually typed a new one (not the dots placeholder)
    const tokenInput = $('#input-token').value.trim();
    if (tokenInput && tokenInput !== '••••••••') payload.token = tokenInput;
    await window.app?.saveSettings(payload);
    const s = await window.app?.loadSettings();
    if (s) state.settings = { ...state.settings, ...s };
    const newTheme = $('#input-theme').value;
    if (newTheme !== state.theme) { state.theme = newTheme; localStorage.setItem(THEME_KEY, state.theme); applyTheme(); }
    updateStatus(); overlay.classList.add('hidden'); toast('Settings saved', 'success');
  });

  $('#btn-test-connection')?.addEventListener('click', async () => {
    const el = $('#connection-status'); el.textContent = 'Testing...'; el.className = '';
    try {
      const data = await window.app?.testConnection();
      if (data?.ok) { el.textContent = `✓ @${data.result.username} connected`; el.className = 'ok'; }
      else { el.textContent = `✗ ${data?.description || 'Unknown error'}`; el.className = 'error'; }
    } catch { el.textContent = '✗ Network error'; el.className = 'error'; }
  });

  updateStatus();
}

function updateStatus() {
  const dot = $('#status-dot');
  if (state.settings.tokenSet) { dot.className = 'status-dot connected'; }
  else { dot.className = 'status-dot'; }
}

// ===================== SEND =====================
async function sendMessage() {
  if (!state.settings.tokenSet) { toast('Configure bot token', 'error'); return; }
  if (!state.settings.chatId) { toast('Set chat ID', 'error'); return; }
  const content = $('#editor').innerHTML.trim();
  if (!content) { toast('Nothing to send', 'error'); return; }

  const markdown = editorToMarkdown();
  const richBody = { chat_id: state.settings.chatId, rich_message: { markdown } };
  if (state.isRtl) richBody.rich_message.is_rtl = true;
  if (state.skipEntityDetection) richBody.rich_message.skip_entity_detection = true;

  try {
    const sendBtn = $('#btn-send'); sendBtn.style.opacity = '0.5'; sendBtn.disabled = true;
    let method, payload;
    if (state.mode === 'draft') {
      method = 'sendRichMessageDraft'; payload = richBody;
    } else if (state.mode === 'edit' && state.settings.editId) {
      method = 'editMessageText'; payload = { ...richBody, message_id: state.settings.editId };
    } else {
      method = 'sendRichMessage'; payload = richBody;
    }
    const data = await window.app?.api(method, payload);
    if (data.ok) toast(state.mode === 'draft' ? 'Draft sent' : state.mode === 'edit' ? 'Edited!' : 'Sent!', 'success');
    else toast(`Error: ${data.description}`, 'error');
    sendBtn.style.opacity = '1'; sendBtn.disabled = false;
  } catch (e) { toast(`Error: ${e.message}`, 'error'); $('#btn-send').style.opacity = '1'; $('#btn-send').disabled = false; }
}

// ===================== INIT =====================
function init() {
  applyTheme();

  // --- Popup toolbar buttons ---
  $('#btn-formatting')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-formatting', e.currentTarget); });
  $('#btn-text-style')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-text-style', e.currentTarget); });
  $('#btn-list')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-list', e.currentTarget); });
  $('#btn-table')?.addEventListener('click', (e) => { e.stopPropagation(); execCmd('table'); });
  $('#btn-link')?.addEventListener('click', (e) => { e.stopPropagation(); showLinkPanel(); });
  $('#btn-media')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-media', e.currentTarget); });

  // Heading submenu
  $('[data-cmd="heading"]')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-heading', e.currentTarget); });

  // All popup items
  $$('.pm-item').forEach(item => {
    if (item.dataset.cmd && !item.classList.contains('pm-back') && item.dataset.cmd !== 'heading') {
      item.addEventListener('click', (e) => { e.stopPropagation(); execCmd(item.dataset.cmd); });
    }
  });

  // Back button in heading submenu
  $('[data-cmd="back-formatting"]')?.addEventListener('click', (e) => { e.stopPropagation(); showPopup('#popup-formatting', $('#btn-formatting')); });

  // Link panel
  $('.lp-cancel')?.addEventListener('click', closeAllPopups);
  $('.lp-create')?.addEventListener('click', createLink);
  $('#link-url')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') createLink(); });

  // Close popups on overlay click
  $('#popup-overlay')?.addEventListener('click', closeAllPopups);

  // Clear button
  $('#btn-clear')?.addEventListener('click', () => {
    if (confirm('Clear all content?')) { $('#editor').innerHTML = ''; updateCharCount(); toast('Cleared'); }
  });

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

  // Editor input
  $('#editor')?.addEventListener('input', updateCharCount);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); execCmd('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); execCmd('italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); execCmd('underline'); }
    if (e.key === 'Escape') closeAllPopups();
  });

  updateCharCount();
}

document.addEventListener('DOMContentLoaded', init);
