/**
 * TelegramFreeRich v5.0 — Secure renderer
 * All API calls go through IPC bridge. Token NEVER in renderer.
 * This is the temporary editor until React+TipTap migration is complete.
 */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const THEME_KEY = 'tfr-theme';

const state = {
  theme: localStorage.getItem(THEME_KEY) || 'dark',
  settings: {},      // Loaded from main process — never contains token
  isRtl: false,
  skipEntityDetection: false,
  mode: 'rich',
};

// ===================== TOAST =====================
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  const container = $('#toast-container');
  if (container) {
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .2s';
      setTimeout(() => t.remove(), 200);
    }, 2500);
  }
}

// ===================== THEME =====================
function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const el = $('#char-count');
  if (!el) return;
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
  const overlay = $('#popup-overlay');
  if (overlay) overlay.classList.add('hidden');
  openPopupId = null;
}

// ===================== EDITOR COMMANDS =====================
function execCmd(cmd) {
  const editor = $('#editor');
  editor.focus();

  switch (cmd) {
    case 'back-formatting': showPopup('#popup-formatting', $('#btn-formatting')); return;
    case 'h1': document.execCommand('formatBlock', false, 'h1'); break;
    case 'h2': document.execCommand('formatBlock', false, 'h2'); break;
    case 'h3': document.execCommand('formatBlock', false, 'h3'); break;
    case 'h4': document.execCommand('formatBlock', false, 'h4'); break;
    case 'h5': document.execCommand('formatBlock', false, 'h5'); break;
    case 'h6': document.execCommand('formatBlock', false, 'h6'); break;
    case 'text': document.execCommand('formatBlock', false, 'p'); break;
    case 'blockquote': document.execCommand('formatBlock', false, 'blockquote'); break;
    case 'pullquote': insertHTML('<blockquote style="border-left-color:var(--warning)"><em>Pull quote text</em></blockquote>'); break;
    case 'code-block': insertHTML('<pre><code class="language-">Code here</code></pre>'); break;
    case 'footer': insertHTML('<footer>Footer text</footer>'); break;
    case 'divider': insertHTML('<hr>'); break;
    case 'math-block': insertHTML('<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$formula$$</div>'); break;
    case 'details': insertHTML('<details><summary>Click to expand</summary><p>Content here</p></details>'); break;
    case 'bold': document.execCommand('bold'); break;
    case 'italic': document.execCommand('italic'); break;
    case 'underline': document.execCommand('underline'); break;
    case 'strikethrough': document.execCommand('strikeThrough'); break;
    case 'spoiler': wrapSelection('span', 'tg-spoiler'); break;
    case 'sub': document.execCommand('subscript'); break;
    case 'sup': document.execCommand('superscript'); break;
    case 'marked': wrapSelection('mark'); break;
    case 'bullet-list': insertHTML('<ul><li>Item</li></ul>'); break;
    case 'ordered-list': insertHTML('<ol><li>Item</li></ol>'); break;
    case 'checklist': insertHTML('<ul><li><input type="checkbox"> Todo</li></ul>'); break;
    case 'table':
      insertHTML('<table><tr><th>H1</th><th>H2</th><th>H3</th></tr><tr><td>cell</td><td>cell</td><td>cell</td></tr><tr><td>cell</td><td>cell</td><td>cell</td></tr></table>');
      break;
    case 'link': showLinkPanel(); return;
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

function insertMedia(type) {
  const url = prompt(`Enter ${type} URL:`, 'https://');
  if (!url) return;
  // Security: validate URL scheme
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    toast('Invalid URL', 'error');
    return;
  }
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

// ===================== HTML TO BLOCKS (bridge to new architecture) =====================
function htmlToBlocks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstChild;
  const blocks = [];

  for (const child of container.children) {
    const block = parseElementToBlock(child);
    if (block) blocks.push(block);
  }

  return blocks;
}

function parseElementToBlock(el) {
  const tag = el.tagName;
  const typeMap = {
    'P': 'paragraph', 'H1': 'heading', 'H2': 'heading', 'H3': 'heading',
    'H4': 'heading', 'H5': 'heading', 'H6': 'heading', 'BLOCKQUOTE': 'blockquote',
    'PRE': 'code_block', 'HR': 'divider', 'UL': 'list', 'OL': 'list',
    'TABLE': 'table', 'DETAILS': 'details', 'FOOTER': 'footer',
  };
  const type = typeMap[tag];
  if (!type) {
    if (tag === 'DIV' && el.classList.contains('tg-math')) {
      return { type: 'math_block', text: el.textContent || '' };
    }
    return null;
  }

  if (type === 'divider') return { type: 'divider' };
  if (type === 'heading') return { type, level: parseInt(tag[1]), text: el.textContent || '' };
  if (type === 'code_block') {
    const code = el.querySelector('code');
    return { type, language: (code?.className || '').replace('language-', ''), text: (code || el).textContent || '' };
  }
  if (type === 'list') {
    const style = tag === 'OL' ? 'numbered' : 'bullet';
    const items = [...el.querySelectorAll(':scope > li')].map(li => {
      const cb = li.querySelector('input[type="checkbox"]');
      return cb ? { text: li.textContent || '', done: cb.checked } : { text: li.textContent || '' };
    });
    return { type, style, items };
  }
  if (type === 'table') {
    const rows = [...el.querySelectorAll('tr')];
    const header = rows[0] ? [...rows[0].querySelectorAll('th, td')].map(c => c.textContent || '') : [];
    const bodyRows = rows.slice(1).map(tr => [...tr.querySelectorAll('td')].map(c => c.textContent || ''));
    return { type, header, rows: bodyRows };
  }
  if (type === 'details') {
    const summary = el.querySelector('summary');
    return { type, summary: summary?.textContent || '', content: el.textContent || '' };
  }
  return { type, text: el.textContent || '' };
}

// ===================== SETTINGS (via IPC — secure) =====================
async function initSettings() {
  // Load settings from main process (never contains token)
  try {
    state.settings = await window.app.loadSettings();
  } catch {
    state.settings = { tokenSet: false, chatId: '', lang: 'en' };
  }

  const overlay = $('#settings-overlay');
  const open = () => {
    $('#input-token').value = '';  // Never show saved token
    $('#input-chat').value = state.settings.chatId || '';
    $('#input-edit-id').value = state.settings.editId || '';
    $('#input-lang').value = state.settings.lang || 'en';
    $('#input-theme').value = state.theme;
    overlay.classList.remove('hidden');
  };

  $('#btn-settings')?.addEventListener('click', open);
  $('#btn-close-settings')?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });

  // Save settings via IPC — token encrypted in main process
  $('#btn-save-settings')?.addEventListener('click', async () => {
    const token = $('#input-token').value.trim();
    const chatId = $('#input-chat').value.trim();
    const editId = $('#input-edit-id').value.trim();
    const lang = $('#input-lang').value;

    // Save via secure IPC
    const settingsToSave = { chatId, lang };
    if (token) settingsToSave.token = token;  // Only send if user entered a new one

    try {
      const result = await window.app.saveSettings(settingsToSave);
      if (!result.ok) {
        toast(result.description || 'Save failed', 'error');
        return;
      }
    } catch {
      toast('Failed to save settings', 'error');
      return;
    }

    state.settings.chatId = chatId;
    state.settings.lang = lang;
    state.settings.editId = editId;
    state.settings.tokenSet = !!token || state.settings.tokenSet;

    // Theme
    const newTheme = $('#input-theme').value;
    if (newTheme !== state.theme) {
      state.theme = newTheme;
      localStorage.setItem(THEME_KEY, state.theme);
      applyTheme();
    }

    updateStatus();
    overlay.classList.add('hidden');
    toast('Settings saved', 'success');
  });

  // Test connection — via IPC (token never in renderer)
  $('#btn-test-connection')?.addEventListener('click', async () => {
    const el = $('#connection-status');
    el.textContent = 'Testing...';
    el.className = '';
    try {
      const data = await window.app.testConnection();
      if (data.ok) {
        el.textContent = `✓ @${data.result.username} connected`;
        el.className = 'ok';
      } else {
        el.textContent = `✗ ${data.description}`;
        el.className = 'error';
      }
    } catch {
      el.textContent = '✗ Network error';
      el.className = 'error';
    }
  });

  updateStatus();
}

function updateStatus() {
  const dot = $('#status-dot');
  if (state.settings.tokenSet) { dot.className = 'status-dot connected'; }
  else { dot.className = 'status-dot'; }
}

// ===================== SEND (via IPC — secure) =====================
async function sendMessage() {
  if (!state.settings.tokenSet) { toast('Configure bot token', 'error'); return; }
  if (!state.settings.chatId) { toast('Set chat ID', 'error'); return; }
  const content = $('#editor').innerHTML.trim();
  if (!content) { toast('Nothing to send', 'error'); return; }

  // Parse editor content to block state
  const blocks = htmlToBlocks(content);

  try {
    const sendBtn = $('#btn-send');
    sendBtn.style.opacity = '0.5';
    sendBtn.disabled = true;

    let result;
    if (state.mode === 'draft') {
      result = await window.app.api('sendRichMessageDraft', {
        chat_id: state.settings.chatId,
        rich_message: { blocks },
      });
    } else if (state.mode === 'edit' && state.settings.editId) {
      result = await window.app.api('editMessageText', {
        chat_id: state.settings.chatId,
        rich_message: { blocks },
        message_id: state.settings.editId,
      });
    } else {
      result = await window.app.api('sendRichMessage', {
        chat_id: state.settings.chatId,
        rich_message: { blocks },
      });
    }

    if (result.ok) {
      toast(state.mode === 'draft' ? 'Draft sent' : state.mode === 'edit' ? 'Edited!' : 'Sent!', 'success');
    } else {
      toast(`Error: ${result.description}`, 'error');
    }

    sendBtn.style.opacity = '1';
    sendBtn.disabled = false;
  } catch {
    toast('Network error', 'error');
    const sendBtn = $('#btn-send');
    sendBtn.style.opacity = '1';
    sendBtn.disabled = false;
  }
}

// ===================== TEST MESSAGE =====================
function loadTestMessage() {
  const e = $('#editor');
  e.innerHTML = `<h2>TelegramFreeRich — Full Feature Test</h2>
<p>Covers all Bot API 10.1/10.2 rich message capabilities.</p>
<hr>
<h3>1. Inline Formatting (25 types)</h3>
<p><strong>Bold</strong> · <em>Italic</em> · <u>Underline</u> · <s>Strikethrough</s> · <span class="tg-spoiler">Spoiler</span></p>
<p><sub>Subscript</sub> · <sup>Superscript</sup> · <mark>Marked</mark> · <code>Inline Code</code></p>
<p><span class="tg-math">E = mc²</span></p>
<p><a href="https://telegram.org">URL/Link</a> · <a href="mailto:user@example.com">Email</a> · <a href="tel:+1234567890">Phone</a></p>
<hr>
<h3>2. Block Elements</h3>
<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>
<blockquote><strong>"Great work requires love."</strong> — Steve Jobs</blockquote>
<pre><code class="language-python">def greet(name): return f"Hello, {name}!"</code></pre>
<ul><li>Bullet item A</li><li>Bullet item B</li></ul>
<ol><li>First</li><li>Second</li><li>Third</li></ol>
<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>
<table><tr><th>Feature</th><th>Ver</th><th>Status</th></tr><tr><td>Bold</td><td>10.1</td><td>Done</td></tr><tr><td>Collage</td><td>10.2</td><td>Done</td></tr></table>
<details><summary>Click to expand</summary><p>Hidden content here with <strong>markdown</strong> inside.</p></details>
<hr>
<footer>Footer text — italic small</footer>
<div class="tg-math" style="text-align:center;font-size:16px;padding:8px">$$\\int_{0}^{2\\pi} \\sin^2(x) dx = \\pi$$</div>
<p><em>— Full test complete —</em></p>`;
  updateCharCount();
  toast('Full test loaded', 'success');
}

// ===================== INIT =====================
function init() {
  applyTheme();

  // Popup toolbar buttons
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

  // Settings (async — loads from main process)
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
