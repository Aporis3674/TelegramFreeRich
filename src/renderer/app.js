/**
 * TelegramFreeRich v2.0 — Telegram-style rich text editor
 * Single contenteditable per block, block-based JSON state → Markdown output
 */

// ===================== STATE =====================
const state = {
  blocks: [],
  selectedBlockId: null,
  mode: 'rich',
  editMessageId: null,
  theme: localStorage.getItem('tfr-theme') || 'dark',
  settings: {
    token: localStorage.getItem('tfr-token') || '',
    tokenSet: !!localStorage.getItem('tfr-token'),
    chatId: localStorage.getItem('tfr-chat') || '',
    lang: localStorage.getItem('tfr-lang') || 'en',
  },
};

let blockIdCounter = 0;
const newId = () => `blk_${++blockIdCounter}_${Date.now()}`;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===================== BLOCK MODEL =====================
function createBlock(type, data = {}) {
  const base = { id: newId(), type, ...data };
  switch (type) {
    case 'paragraph': return { ...base, text: data.text || '', html: data.html || '' };
    case 'heading': return { ...base, size: data.size || 2, text: data.text || '', html: data.html || '' };
    case 'code-block': return { ...base, language: data.language || '', text: data.text || '' };
    case 'bullet-list': case 'ordered-list':
      return { ...base, items: data.items || [{ text: '' }] };
    case 'checklist':
      return { ...base, items: data.items || [{ text: '', checked: false }] };
    case 'table':
      return { ...base, cells: data.cells || [
        { cells: ['H1', 'H2', 'H3'], header: true },
        { cells: ['', '', ''], header: false },
        { cells: ['', '', ''], header: false },
      ]};
    case 'blockquote': return { ...base, text: data.text || '', html: data.html || '' };
    case 'pull-quote': return { ...base, text: data.text || '', html: data.html || '', cite: data.cite || '' };
    case 'details':
      return { ...base, summary: data.summary || 'Details', body: data.body || '', html: data.html || '', open: data.open || false };
    case 'divider': return { ...base };
    case 'footer': return { ...base, text: data.text || '' };
    case 'image': case 'video': case 'audio':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    default: return { ...base };
  }
}

// ===================== HELPERS =====================
function stripHtml(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; }
function syncEditableBlock(block, el) { block.html = el.innerHTML; block.text = stripHtml(el.innerHTML); }
function getBlockIndex(id) { return state.blocks.findIndex(b => b.id === id); }
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function toast(msg, type = 'info') {
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.2s'; setTimeout(() => t.remove(), 200); }, 2500);
}

// ===================== RENDER =====================
function renderBlocks() {
  const container = $('#blocks-container');
  if (!container) return;
  container.innerHTML = '';
  state.blocks.forEach((block, index) => container.appendChild(renderBlock(block, index)));
  updateCharCount();
}

function renderBlock(block, index) {
  const card = document.createElement('div');
  card.className = `block-card${state.selectedBlockId === block.id ? ' selected' : ''}`;
  card.dataset.type = block.type;
  card.dataset.id = block.id;
  if (block.size) card.dataset.size = block.size;

  // Actions (drag + delete)
  const actions = document.createElement('div');
  actions.className = 'block-actions';
  const dragBtn = document.createElement('button');
  dragBtn.className = 'ba-btn ba-drag';
  dragBtn.textContent = '⋮⋮';
  dragBtn.draggable = true;
  dragBtn.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', index.toString()); card.style.opacity = '0.4'; });
  dragBtn.addEventListener('dragend', () => { card.style.opacity = '1'; });
  const delBtn = document.createElement('button');
  delBtn.className = 'ba-btn del';
  delBtn.textContent = '×';
  delBtn.addEventListener('click', () => {
    state.blocks = state.blocks.filter(b => b.id !== block.id);
    if (state.selectedBlockId === block.id) state.selectedBlockId = null;
    renderBlocks();
  });
  actions.appendChild(dragBtn);
  actions.appendChild(delBtn);
  card.appendChild(actions);

  // Drop target
  card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'));
    if (from !== index) {
      const [moved] = state.blocks.splice(from, 1);
      state.blocks.splice(index, 0, moved);
      renderBlocks();
    }
  });

  // Content
  const content = document.createElement('div');
  content.className = 'block-content';

  switch (block.type) {
    case 'paragraph': case 'heading': case 'blockquote': {
      content.contentEditable = 'true';
      content.innerHTML = block.html || block.text || '';
      content.dataset.placeholder = block.type === 'heading' ? `Heading ${block.size}` : 'Type something...';
      content.addEventListener('input', () => { syncEditableBlock(block, content); updateCharCount(); });
      content.addEventListener('focus', () => selectBlock(block.id));
      content.addEventListener('keydown', (e) => handleKeydown(e, block, index));
      break;
    }

    case 'code-block': {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;width:100%;';
      const langIn = document.createElement('input');
      langIn.type = 'text'; langIn.placeholder = 'language'; langIn.value = block.language;
      langIn.style.cssText = 'padding:6px 10px;border:none;border-bottom:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:11px;outline:none;width:100%;';
      langIn.addEventListener('input', () => { block.language = langIn.value; updateCharCount(); });
      const codeArea = document.createElement('div');
      codeArea.contentEditable = 'true';
      codeArea.textContent = block.text;
      codeArea.style.cssText = 'padding:12px;outline:none;font-family:monospace;min-height:50px;white-space:pre-wrap;tab-size:4;';
      codeArea.addEventListener('input', () => { block.text = codeArea.textContent; updateCharCount(); });
      codeArea.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); } });
      wrap.appendChild(langIn);
      wrap.appendChild(codeArea);
      content.appendChild(wrap);
      content.style.padding = '0';
      break;
    }

    case 'bullet-list': case 'ordered-list': {
      const listDiv = document.createElement('div');
      listDiv.className = 'list-items';
      block.items.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'list-item';
        const marker = document.createElement('span');
        marker.className = 'list-marker';
        marker.textContent = block.type === 'ordered-list' ? `${i + 1}.` : '•';
        const inp = document.createElement('input');
        inp.type = 'text'; inp.value = item.text; inp.placeholder = 'List item';
        inp.addEventListener('input', () => { block.items[i].text = inp.value; updateCharCount(); });
        inp.addEventListener('keydown', (e) => handleListKeydown(e, block, i));
        row.appendChild(marker);
        row.appendChild(inp);
        listDiv.appendChild(row);
      });
      content.appendChild(listDiv);
      content.style.padding = '6px 12px';
      break;
    }

    case 'checklist': {
      const clDiv = document.createElement('div');
      clDiv.className = 'checklist-items';
      block.items.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'checklist-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = item.checked;
        cb.addEventListener('change', () => { block.items[i].checked = cb.checked; updateCharCount(); });
        const inp = document.createElement('input');
        inp.type = 'text'; inp.value = item.text; inp.placeholder = 'Todo';
        inp.addEventListener('input', () => { block.items[i].text = inp.value; updateCharCount(); });
        row.appendChild(cb);
        row.appendChild(inp);
        clDiv.appendChild(row);
      });
      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add item';
      addBtn.style.cssText = 'font-size:11px;padding:4px 12px;border:none;background:none;color:var(--text-dim);cursor:pointer;';
      addBtn.addEventListener('click', () => { block.items.push({ text: '', checked: false }); renderBlocks(); });
      clDiv.appendChild(addBtn);
      content.appendChild(clDiv);
      content.style.padding = '6px 0';
      break;
    }

    case 'table': {
      const table = document.createElement('table');
      table.className = 'block-table';
      block.cells.forEach((row, ri) => {
        const tr = document.createElement('tr');
        row.cells.forEach((cellText, ci) => {
          const cell = document.createElement(row.header ? 'th' : 'td');
          cell.contentEditable = 'true';
          cell.textContent = cellText;
          cell.addEventListener('input', () => { block.cells[ri].cells[ci] = cell.textContent; updateCharCount(); });
          tr.appendChild(cell);
        });
        table.appendChild(tr);
      });
      content.appendChild(table);
      const tActions = document.createElement('div');
      tActions.style.cssText = 'display:flex;gap:6px;padding:6px 0 2px;';
      const addRow = document.createElement('button');
      addRow.textContent = '+ Row';
      addRow.style.cssText = 'font-size:11px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--text-dim);cursor:pointer;';
      addRow.addEventListener('click', () => {
        const cols = block.cells[0]?.cells.length || 3;
        block.cells.push({ cells: Array(cols).fill(''), header: false });
        renderBlocks();
      });
      const addCol = document.createElement('button');
      addCol.textContent = '+ Col';
      addCol.style.cssText = addRow.style.cssText;
      addCol.addEventListener('click', () => {
        block.cells.forEach(r => r.cells.push(''));
        renderBlocks();
      });
      tActions.appendChild(addRow);
      tActions.appendChild(addCol);
      content.appendChild(tActions);
      content.style.padding = '8px';
      break;
    }

    case 'pull-quote': {
      const pqText = document.createElement('div');
      pqText.contentEditable = 'true';
      pqText.innerHTML = block.html || block.text || '';
      pqText.dataset.placeholder = 'Pull quote...';
      pqText.addEventListener('input', () => { syncEditableBlock(block, pqText); updateCharCount(); });
      const pqCite = document.createElement('div');
      pqCite.contentEditable = 'true';
      pqCite.textContent = block.cite;
      pqCite.dataset.placeholder = '— Author';
      pqCite.style.cssText = 'font-size:12px;color:var(--text-dim);margin-top:4px;';
      pqCite.addEventListener('input', () => { block.cite = pqCite.textContent; updateCharCount(); });
      content.appendChild(pqText);
      content.appendChild(pqCite);
      break;
    }

    case 'details': {
      const header = document.createElement('div');
      header.className = `details-header${block.open ? ' open' : ''}`;
      const chevron = document.createElement('span');
      chevron.className = 'chevron';
      chevron.textContent = '▶';
      const sumIn = document.createElement('input');
      sumIn.type = 'text'; sumIn.value = block.summary; sumIn.placeholder = 'Summary';
      sumIn.addEventListener('input', () => { block.summary = sumIn.value; updateCharCount(); });
      header.appendChild(chevron);
      header.appendChild(sumIn);
      header.addEventListener('click', (e) => {
        if (e.target !== sumIn) {
          block.open = !block.open;
          header.classList.toggle('open', block.open);
          body.style.display = block.open ? 'block' : 'none';
        }
      });
      const body = document.createElement('div');
      body.className = 'details-body';
      body.contentEditable = 'true';
      body.innerHTML = block.html || block.body || '';
      body.dataset.placeholder = 'Hidden content...';
      body.style.display = block.open ? 'block' : 'none';
      body.addEventListener('input', () => { block.html = body.innerHTML; block.body = stripHtml(body.innerHTML); updateCharCount(); });
      content.appendChild(header);
      content.appendChild(body);
      content.style.padding = '0';
      break;
    }

    case 'divider':
      content.innerHTML = '<hr>';
      break;

    case 'image': case 'video': case 'audio': {
      const row = document.createElement('div');
      row.className = 'media-fields';
      const urlIn = document.createElement('input');
      urlIn.type = 'text'; urlIn.value = block.url; urlIn.placeholder = `${block.type} URL`;
      urlIn.addEventListener('input', () => { block.url = urlIn.value; updateCharCount(); });
      const capIn = document.createElement('input');
      capIn.type = 'text'; capIn.value = block.caption; capIn.placeholder = 'Caption';
      capIn.addEventListener('input', () => { block.caption = capIn.value; updateCharCount(); });
      row.appendChild(urlIn);
      row.appendChild(capIn);
      content.appendChild(row);
      content.style.padding = '8px 12px';
      break;
    }

    case 'footer':
      content.contentEditable = 'true';
      content.textContent = block.text;
      content.dataset.placeholder = 'Footer...';
      content.addEventListener('input', () => { block.text = content.textContent; updateCharCount(); });
      break;
  }

  card.appendChild(content);

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.block-actions')) selectBlock(block.id);
  });

  return card;
}

function selectBlock(id) {
  state.selectedBlockId = id;
  $$('.block-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
}

function handleKeydown(e, block, index) {
  if (e.key === 'Enter' && !e.shiftKey && block.type === 'paragraph') {
    e.preventDefault();
    const nb = createBlock('paragraph');
    state.blocks.splice(index + 1, 0, nb);
    renderBlocks();
    setTimeout(() => {
      const card = $$(`[data-id="${nb.id}"] .block-content`)[0];
      if (card) card.focus();
    }, 0);
  }
  if (e.key === 'Backspace' && block.type === 'paragraph' && block.text === '' && state.blocks.length > 1) {
    e.preventDefault();
    const prev = state.blocks[index - 1];
    state.blocks.splice(index, 1);
    renderBlocks();
    if (prev) {
      setTimeout(() => {
        const card = $$(`[data-id="${prev.id}"] .block-content`)[0];
        if (card) card.focus();
      }, 0);
    }
  }
}

function handleListKeydown(e, block, i) {
  if (e.key === 'Enter') { e.preventDefault(); block.items.splice(i + 1, 0, { text: '' }); renderBlocks(); }
  if (e.key === 'Backspace' && e.target.value === '' && block.items.length > 1) {
    e.preventDefault(); block.items.splice(i, 1); renderBlocks();
  }
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const el = $('#char-count');
  if (!el) return;
  let total = 0;
  state.blocks.forEach(b => {
    if (b.type === 'code-block') total += (b.text || '').length;
    else if (b.type === 'bullet-list' || b.type === 'ordered-list' || b.type === 'checklist')
      total += b.items.reduce((s, it) => s + (it.text || '').length, 0);
    else if (b.type === 'table')
      total += b.cells.reduce((s, r) => s + r.cells.reduce((ss, c) => ss + c.length, 0), 0);
    else total += JSON.stringify(b).length;
  });
  el.textContent = `${total.toLocaleString()} / 32,768`;
  el.style.color = total > 32768 ? 'var(--danger)' : '';
}

// ===================== TOOLBAR =====================
function initToolbar() {
  // Inline + heading buttons
  $$('.tb-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      const level = btn.dataset.level;
      if (cmd === 'heading') { insertBlock('heading', { size: parseInt(level) || 2 }); }
      else if (cmd === 'bullet-list' || cmd === 'ordered-list' || cmd === 'checklist' ||
               cmd === 'blockquote' || cmd === 'code-block' || cmd === 'divider' ||
               cmd === 'table' || cmd === 'details' || cmd === 'image' || cmd === 'video') {
        insertBlock(cmd);
      } else {
        applyInline(cmd);
      }
    });
  });

  // Plus menu
  const plusBtn = $('#btn-plus');
  const plusBtn2 = $('#btn-plus-bottom');
  const plusMenu = $('#plus-menu');
  function togglePlus() { plusMenu.classList.toggle('show'); }
  if (plusBtn) plusBtn.addEventListener('click', togglePlus);
  if (plusBtn2) plusBtn2.addEventListener('click', togglePlus);
  $$('.pm-item[data-cmd]').forEach(item => {
    item.addEventListener('click', () => {
      insertBlock(item.dataset.cmd);
      plusMenu.classList.remove('show');
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.plus-menu') && !e.target.closest('#btn-plus') && !e.target.closest('#btn-plus-bottom'))
      plusMenu.classList.remove('show');
  });

  // Undo/Redo
  $('#btn-undo')?.addEventListener('click', () => document.execCommand('undo'));
  $('#btn-redo')?.addEventListener('click', () => document.execCommand('redo'));
}

function insertBlock(type, data = {}) {
  const idx = state.selectedBlockId ? getBlockIndex(state.selectedBlockId) + 1 : state.blocks.length;
  state.blocks.splice(idx, 0, createBlock(type, data));
  renderBlocks();
  setTimeout(() => {
    const card = $$('.block-content')[idx];
    if (card && card.contentEditable === 'true') card.focus();
  }, 0);
}

function applyInline(type) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const text = sel.getRangeAt(0).toString();
  if (!text) return;
  let wrapper;
  switch (type) {
    case 'bold': wrapper = document.createElement('strong'); break;
    case 'italic': wrapper = document.createElement('em'); break;
    case 'underline': wrapper = document.createElement('u'); break;
    case 'strikethrough': wrapper = document.createElement('s'); break;
    case 'code': wrapper = document.createElement('code'); break;
    case 'spoiler': wrapper = document.createElement('span'); wrapper.className = 'tg-spoiler'; break;
    default: return;
  }
  wrapper.textContent = text;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(wrapper);
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  sel.addRange(newRange);
  updateCharCount();
}

// ===================== THEME =====================
function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
  const btn = $('#btn-theme');
  if (btn) btn.title = state.theme === 'dark' ? 'Switch to light' : 'Switch to dark';
}

function initTheme() {
  applyTheme();
  $('#btn-theme')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tfr-theme', state.theme);
    applyTheme();
  });
}

// ===================== MODE TABS =====================
function initModeTabs() {
  $$('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      $$('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === state.mode));
      $('#btn-send').title = state.mode === 'rich' ? 'Send Rich Message' : state.mode === 'draft' ? 'Send Draft' : 'Edit Message';
    });
  });
}

// ===================== SETTINGS =====================
function initSettings() {
  const overlay = $('#settings-overlay');
  const open = () => {
    $('#input-token').value = state.settings.token;
    $('#input-chat').value = state.settings.chatId;
    $('#input-lang').value = state.settings.lang;
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
    state.settings.lang = $('#input-lang').value;
    state.settings.tokenSet = !!state.settings.token;
    localStorage.setItem('tfr-token', state.settings.token);
    localStorage.setItem('tfr-chat', state.settings.chatId);
    localStorage.setItem('tfr-lang', state.settings.lang);
    updateStatus();
    close();
    toast('Settings saved', 'success');
  });

  $('#btn-test-connection')?.addEventListener('click', async () => {
    const token = $('#input-token').value.trim();
    if (!token) { toast('Enter bot token', 'error'); return; }
    const statusEl = $('#connection-status');
    statusEl.textContent = 'Testing...';
    statusEl.className = '';
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        statusEl.textContent = `✓ @${data.result.username} connected`;
        statusEl.className = 'ok';
      } else {
        statusEl.textContent = `✗ ${data.description || 'Failed'}`;
        statusEl.className = 'error';
      }
    } catch (err) {
      statusEl.textContent = `✗ Network error`;
      statusEl.className = 'error';
    }
  });

  updateStatus();
}

function updateStatus() {
  const dot = $('#status-dot');
  const text = $('#status-text');
  if (state.settings.tokenSet) {
    dot.className = 'status-dot connected';
    text.textContent = state.settings.chatId ? `→ ${state.settings.chatId}` : 'Bot connected';
  } else {
    dot.className = 'status-dot';
    text.textContent = 'Connect bot to send';
  }
}

// ===================== SEND =====================
function initSend() {
  $('#btn-send')?.addEventListener('click', sendMessage);
}

async function sendMessage() {
  if (!state.settings.tokenSet) { toast('Configure bot token in settings', 'error'); return; }
  if (!state.settings.chatId) { toast('Set chat ID in settings', 'error'); return; }
  if (state.blocks.length === 0) { toast('Nothing to send', 'error'); return; }

  const markdown = blocksToMarkdown();
  const token = state.settings.token;
  const chatId = state.settings.chatId;

  try {
    const sendBtn = $('#btn-send');
    sendBtn.style.opacity = '0.5';
    sendBtn.disabled = true;

    if (state.mode === 'draft') {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendRichMessageDraft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, markdown }),
      });
      const data = await res.json();
      if (data.ok) toast('Draft sent (30s preview)', 'success');
      else toast(`Error: ${data.description}`, 'error');
    } else if (state.mode === 'edit' && state.editMessageId) {
      const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: state.editMessageId, markdown, rich_message: { markdown } }),
      });
      const data = await res.json();
      if (data.ok) toast('Message edited', 'success');
      else toast(`Error: ${data.description}`, 'error');
    } else {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, markdown }),
      });
      const data = await res.json();
      if (data.ok) toast('Message sent!', 'success');
      else toast(`Error: ${data.description}`, 'error');
    }

    sendBtn.style.opacity = '1';
    sendBtn.disabled = false;
  } catch (err) {
    toast('Network error', 'error');
    $('#btn-send').style.opacity = '1';
    $('#btn-send').disabled = false;
  }
}

// ===================== MARKDOWN CONVERSION =====================
function blocksToMarkdown() {
  const lines = [];
  state.blocks.forEach(block => {
    switch (block.type) {
      case 'paragraph':
        lines.push(block.html ? inlineToMd(block.html) : (block.text || ''));
        lines.push('');
        break;
      case 'heading':
        lines.push(`${'#'.repeat(block.size)} ${inlineToMd(block.html || block.text || '')}`);
        lines.push('');
        break;
      case 'blockquote':
        (inlineToMd(block.html || block.text || '').split('\n').forEach(l => lines.push(`> ${l}`)));
        lines.push('');
        break;
      case 'pull-quote':
        lines.push(`> ${inlineToMd(block.html || block.text || '')}`);
        if (block.cite) lines.push(`> — ${block.cite}`);
        lines.push('');
        break;
      case 'code-block':
        lines.push('```' + (block.language || ''));
        lines.push(block.text || '');
        lines.push('```');
        lines.push('');
        break;
      case 'bullet-list':
        block.items.forEach(item => lines.push(`- ${item.text}`));
        lines.push('');
        break;
      case 'ordered-list':
        block.items.forEach((item, i) => lines.push(`${i + 1}. ${item.text}`));
        lines.push('');
        break;
      case 'checklist':
        block.items.forEach(item => lines.push(`- [${item.checked ? 'x' : ' '}] ${item.text}`));
        lines.push('');
        break;
      case 'table': {
        if (block.cells.length === 0) break;
        const header = block.cells[0];
        lines.push('| ' + header.cells.join(' | ') + ' |');
        lines.push('| ' + header.cells.map(() => '---').join(' | ') + ' |');
        block.cells.slice(1).forEach(row => {
          lines.push('| ' + row.cells.join(' | ') + ' |');
        });
        lines.push('');
        break;
      }
      case 'details':
        lines.push('<details>');
        lines.push(`<summary>${block.summary}</summary>`);
        lines.push(block.html ? inlineToMd(block.html) : block.body || '');
        lines.push('</details>');
        lines.push('');
        break;
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
      case 'footer':
        lines.push(`_${block.text}_`);
        lines.push('');
        break;
      case 'image':
        if (block.url) lines.push(`![${block.caption || ''}](${block.url})`);
        lines.push('');
        break;
      case 'video':
        if (block.url) lines.push(`![${block.caption || ''}](${block.url})`);
        lines.push('');
        break;
      case 'audio':
        if (block.url) lines.push(`![audio](${block.url})`);
        lines.push('');
        break;
    }
  });
  return lines.join('\n').trim();
}

function inlineToMd(html) {
  if (!html) return '';
  let md = html;
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<span class="tg-spoiler">(.*?)<\/span>/gi, '||$1||');
  md = md.replace(/<sub>(.*?)<\/sub>/gi, '$1');
  md = md.replace(/<sup>(.*?)<\/sup>/gi, '$1');
  md = md.replace(/<mark>(.*?)<\/mark>/gi, '$1');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<\/?p[^>]*>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  return md.trim();
}

// ===================== INIT =====================
function init() {
  // Default blocks
  if (state.blocks.length === 0) {
    state.blocks.push(createBlock('heading', { size: 2, text: 'Welcome to FreeRich', html: 'Welcome to FreeRich' }));
    state.blocks.push(createBlock('paragraph', { text: 'A free rich text editor for Telegram Bot API.', html: 'A free rich text editor for Telegram Bot API.' }));
    state.blocks.push(createBlock('paragraph', { text: 'Format your messages with headings, lists, tables, code blocks and more.', html: 'Format your messages with headings, lists, tables, code blocks and more.' }));
  }

  renderBlocks();
  initToolbar();
  initTheme();
  initModeTabs();
  initSettings();
  initSend();
}

document.addEventListener('DOMContentLoaded', init);
