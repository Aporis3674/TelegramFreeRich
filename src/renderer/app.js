/**
 * TelegramFreeRich v2.2 — Telegram-style rich text editor
 * Full Bot API 10.1/10.2 Rich Message support
 * Block-based JSON state → Markdown output
 */

// ===================== STATE =====================
const state = {
  blocks: [],
  selectedBlockId: null,
  mode: 'rich',
  editMessageId: null,
  theme: localStorage.getItem('tfr-theme') || 'dark',
  isRtl: false,
  skipEntityDetection: false,
  settings: {
    token: localStorage.getItem('tfr-token') || '',
    tokenSet: !!localStorage.getItem('tfr-token'),
    chatId: localStorage.getItem('tfr-chat') || '',
    editId: localStorage.getItem('tfr-edit-id') || '',
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
    case 'paragraph': return { ...base, html: data.html || '', text: data.text || '' };
    case 'heading': return { ...base, size: data.size || 2, html: data.html || '', text: data.text || '' };
    case 'code-block': return { ...base, language: data.language || '', text: data.text || '' };
    case 'bullet-list': case 'ordered-list':
      return { ...base, items: data.items || [{ text: '' }], listType: data.listType || (type === 'ordered-list' ? '1' : null) };
    case 'checklist':
      return { ...base, items: data.items || [{ text: '', checked: false }] };
    case 'table':
      return { ...base, cells: data.cells || [
        { cells: ['H1', 'H2', 'H3'], header: true },
        { cells: ['', '', ''], header: false },
        { cells: ['', '', ''], header: false },
      ]};
    case 'blockquote': return { ...base, html: data.html || '', text: data.text || '', credit: data.credit || '' };
    case 'pull-quote': return { ...base, html: data.html || '', text: data.text || '', credit: data.credit || '' };
    case 'details':
      return { ...base, summary: data.summary || 'Details', body: data.body || '', html: data.html || '', open: data.open || false };
    case 'divider': return { ...base };
    case 'footer': return { ...base, text: data.text || '' };
    case 'image': case 'video': case 'audio': case 'animation': case 'voicenote':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    case 'collage': return { ...base, images: data.images || [], caption: data.caption || '' };
    case 'slideshow': return { ...base, images: data.images || [], caption: data.caption || '' };
    case 'map': return { ...base, latitude: data.latitude || 0, longitude: data.longitude || 0, zoom: data.zoom || 15 };
    case 'math-block': return { ...base, expression: data.expression || '' };
    case 'thinking': return { ...base, text: data.text || '' };
    case 'anchor': return { ...base, name: data.name || '' };
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

  // Actions
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

  // Drop
  card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'));
    if (from !== index) { const [m] = state.blocks.splice(from, 1); state.blocks.splice(index, 0, m); renderBlocks(); }
  });

  const content = document.createElement('div');
  content.className = 'block-content';

  switch (block.type) {
    case 'paragraph': case 'heading': case 'blockquote': {
      content.contentEditable = 'true';
      content.innerHTML = block.html || block.text || '';
      content.dataset.placeholder =
        block.type === 'heading' ? `Heading ${block.size}` :
        block.type === 'blockquote' ? 'Quote...' : 'Type something...';
      content.addEventListener('input', () => { syncEditableBlock(block, content); updateCharCount(); });
      content.addEventListener('focus', () => selectBlock(block.id));
      content.addEventListener('keydown', (e) => handleKeydown(e, block, index));
      break;
    }

    case 'code-block': {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;width:100%;';
      const langIn = document.createElement('input');
      langIn.type = 'text'; langIn.placeholder = 'language (js, python...)'; langIn.value = block.language;
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
      const tA = document.createElement('div');
      tA.style.cssText = 'display:flex;gap:6px;padding:6px 0 2px;';
      const addR = document.createElement('button');
      addR.textContent = '+ Row'; addR.style.cssText = 'font-size:11px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--text-dim);cursor:pointer;';
      addR.addEventListener('click', () => { block.cells.push({ cells: Array(block.cells[0]?.cells.length || 3).fill(''), header: false }); renderBlocks(); });
      const addC = document.createElement('button');
      addC.textContent = '+ Col'; addC.style.cssText = addR.style.cssText;
      addC.addEventListener('click', () => { block.cells.forEach(r => r.cells.push('')); renderBlocks(); });
      tA.appendChild(addR); tA.appendChild(addC);
      content.appendChild(tA);
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
      pqCite.contentEditable = 'true'; pqCite.textContent = block.credit;
      pqCite.dataset.placeholder = '— Author';
      pqCite.style.cssText = 'font-size:12px;color:var(--text-dim);margin-top:4px;';
      pqCite.addEventListener('input', () => { block.credit = pqCite.textContent; updateCharCount(); });
      content.appendChild(pqText); content.appendChild(pqCite);
      break;
    }

    case 'details': {
      const header = document.createElement('div');
      header.className = `details-header${block.open ? ' open' : ''}`;
      const chevron = document.createElement('span');
      chevron.className = 'chevron'; chevron.textContent = '▶';
      const sumIn = document.createElement('input');
      sumIn.type = 'text'; sumIn.value = block.summary; sumIn.placeholder = 'Summary';
      sumIn.addEventListener('input', () => { block.summary = sumIn.value; updateCharCount(); });
      header.appendChild(chevron); header.appendChild(sumIn);
      const body = document.createElement('div');
      body.className = 'details-body';
      body.contentEditable = 'true';
      body.innerHTML = block.html || block.body || '';
      body.style.display = block.open ? 'block' : 'none';
      body.addEventListener('input', () => { block.html = body.innerHTML; block.body = stripHtml(body.innerHTML); updateCharCount(); });
      header.addEventListener('click', (e) => { if (e.target !== sumIn) { block.open = !block.open; header.classList.toggle('open', block.open); body.style.display = block.open ? 'block' : 'none'; } });
      content.appendChild(header); content.appendChild(body);
      content.style.padding = '0';
      break;
    }

    case 'divider':
      content.innerHTML = '<hr>';
      break;

    case 'image': case 'video': case 'audio': case 'animation': case 'voicenote': {
      const row = document.createElement('div');
      row.className = 'media-fields';
      const labels = { image: 'Photo', video: 'Video', audio: 'Audio', animation: 'GIF URL', voicenote: 'Voice Note URL' };
      const urlIn = document.createElement('input');
      urlIn.type = 'text'; urlIn.value = block.url; urlIn.placeholder = labels[block.type] + ' URL';
      urlIn.addEventListener('input', () => { block.url = urlIn.value; updateCharCount(); });
      const capIn = document.createElement('input');
      capIn.type = 'text'; capIn.value = block.caption; capIn.placeholder = 'Caption';
      capIn.addEventListener('input', () => { block.caption = capIn.value; updateCharCount(); });
      row.appendChild(urlIn); row.appendChild(capIn);
      content.appendChild(row); content.style.padding = '8px 12px';
      break;
    }

    case 'collage': case 'slideshow': {
      const lbl = block.type === 'collage' ? 'Collage' : 'Slideshow';
      const imgDiv = document.createElement('div');
      imgDiv.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%;';
      (block.images || []).forEach((img, i) => {
        const r = document.createElement('div');
        r.style.cssText = 'display:flex;gap:6px;align-items:center;';
        const urlI = document.createElement('input');
        urlI.type = 'text'; urlI.value = img.url || ''; urlI.placeholder = `Image ${i + 1} URL`;
        urlI.style.cssText = 'flex:1;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:11px;outline:none;';
        urlI.addEventListener('input', () => { block.images[i].url = urlI.value; updateCharCount(); });
        const rm = document.createElement('button');
        rm.textContent = '×'; rm.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;';
        rm.addEventListener('click', () => { block.images.splice(i, 1); renderBlocks(); });
        r.appendChild(urlI); r.appendChild(rm);
        imgDiv.appendChild(r);
      });
      const addImg = document.createElement('button');
      addImg.textContent = '+ Image'; addImg.style.cssText = 'font-size:11px;padding:4px 8px;border:1px dashed var(--border);border-radius:4px;background:transparent;color:var(--text-dim);cursor:pointer;width:fit-content;';
      addImg.addEventListener('click', () => { block.images.push({ url: '' }); renderBlocks(); });
      imgDiv.appendChild(addImg);
      const capIn = document.createElement('input');
      capIn.type = 'text'; capIn.value = block.caption; capIn.placeholder = 'Caption';
      capIn.style.cssText = 'padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
      capIn.addEventListener('input', () => { block.caption = capIn.value; updateCharCount(); });
      content.appendChild(imgDiv); content.appendChild(capIn);
      content.style.padding = '8px 12px';
      break;
    }

    case 'map': {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;width:100%;';
      const lat = document.createElement('input'); lat.type = 'number'; lat.step = 'any'; lat.value = block.latitude;
      lat.placeholder = 'Latitude'; lat.style.cssText = 'flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
      lat.addEventListener('input', () => { block.latitude = parseFloat(lat.value) || 0; updateCharCount(); });
      const lng = document.createElement('input'); lng.type = 'number'; lng.step = 'any'; lng.value = block.longitude;
      lng.placeholder = 'Longitude'; lng.style.cssText = lat.style.cssText;
      lng.addEventListener('input', () => { block.longitude = parseFloat(lng.value) || 0; updateCharCount(); });
      const zm = document.createElement('input'); zm.type = 'number'; zm.min = '1'; zm.max = '20'; zm.value = block.zoom;
      zm.placeholder = 'Zoom'; zm.style.cssText = 'width:60px;' + lat.style.cssText;
      zm.addEventListener('input', () => { block.zoom = parseInt(zm.value) || 15; updateCharCount(); });
      row.appendChild(lat); row.appendChild(lng); row.appendChild(zm);
      content.appendChild(row); content.style.padding = '8px 12px';
      break;
    }

    case 'math-block': {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = block.expression;
      inp.placeholder = 'LaTeX expression: \\frac{a}{b}, \\int_0^1, ...';
      inp.style.cssText = 'width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-family:monospace;font-size:14px;outline:none;';
      inp.addEventListener('input', () => { block.expression = inp.value; updateCharCount(); });
      content.appendChild(inp); content.style.padding = '8px 12px';
      break;
    }

    case 'thinking': {
      const inp = document.createElement('div');
      inp.contentEditable = 'true';
      inp.innerHTML = block.html || block.text || '';
      inp.dataset.placeholder = 'Thinking process...';
      inp.style.cssText = 'font-size:13px;color:var(--text-muted);font-style:italic;';
      inp.addEventListener('input', () => { syncEditableBlock(block, inp); updateCharCount(); });
      content.appendChild(inp);
      content.style.background = 'var(--surface2)';
      content.style.borderRadius = '8px';
      break;
    }

    case 'anchor': {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = block.name;
      inp.placeholder = 'Anchor name (for internal links)';
      inp.style.cssText = 'width:100%;padding:6px 10px;border:1px dashed var(--border);border-radius:4px;background:transparent;color:var(--text-dim);font-size:12px;outline:none;';
      inp.addEventListener('input', () => { block.name = inp.value; updateCharCount(); });
      content.appendChild(inp); content.style.padding = '6px 12px';
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
  card.addEventListener('click', (e) => { if (!e.target.closest('.block-actions')) selectBlock(block.id); });
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
    setTimeout(() => { const c = $$(`[data-id="${nb.id}"] .block-content`)[0]; if (c) c.focus(); }, 0);
  }
  if (e.key === 'Backspace' && block.type === 'paragraph' && block.text === '' && state.blocks.length > 1) {
    e.preventDefault();
    const prev = state.blocks[index - 1];
    state.blocks.splice(index, 1);
    renderBlocks();
    if (prev) setTimeout(() => { const c = $$(`[data-id="${prev.id}"] .block-content`)[0]; if (c) c.focus(); }, 0);
  }
}

function handleListKeydown(e, block, i) {
  if (e.key === 'Enter') { e.preventDefault(); block.items.splice(i + 1, 0, { text: '' }); renderBlocks(); }
  if (e.key === 'Backspace' && e.target.value === '' && block.items.length > 1) { e.preventDefault(); block.items.splice(i, 1); renderBlocks(); }
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const el = $('#char-count');
  if (!el) return;
  let total = 0;
  state.blocks.forEach(b => {
    if (b.type === 'code-block' || b.type === 'math-block') total += (b.text || b.expression || '').length;
    else if (b.type === 'bullet-list' || b.type === 'ordered-list' || b.type === 'checklist')
      total += b.items.reduce((s, it) => s + (it.text || '').length, 0);
    else if (b.type === 'table')
      total += b.cells.reduce((s, r) => s + r.cells.reduce((ss, c) => ss + c.length, 0), 0);
    else if (b.type === 'map') total += 30;
    else total += JSON.stringify(b).length;
  });
  el.textContent = `${total.toLocaleString()} / 32,768`;
  el.style.color = total > 32768 ? 'var(--danger)' : '';
}

// ===================== TOOLBAR =====================
function initToolbar() {
  // Inline + block buttons
  $$('.tb-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      const level = btn.dataset.level;
      if (cmd === 'heading') { insertBlock('heading', { size: parseInt(level) || 2 }); }
      else if (['bullet-list', 'ordered-list', 'checklist', 'blockquote', 'code-block',
                'divider', 'table', 'details', 'image', 'video', 'animation', 'voicenote'].includes(cmd)) {
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
    item.addEventListener('click', () => { insertBlock(item.dataset.cmd); plusMenu.classList.remove('show'); });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.plus-menu') && !e.target.closest('#btn-plus') && !e.target.closest('#btn-plus-bottom'))
      plusMenu.classList.remove('show');
  });

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
    case 'sub': wrapper = document.createElement('sub'); break;
    case 'sup': wrapper = document.createElement('sup'); break;
    case 'marked': wrapper = document.createElement('mark'); break;
    case 'datetime':
      wrapper = document.createElement('span');
      wrapper.className = 'tg-datetime';
      wrapper.dataset.timestamp = Math.floor(Date.now() / 1000);
      wrapper.textContent = new Date().toLocaleString();
      break;
    case 'math-inline':
      wrapper = document.createElement('span');
      wrapper.className = 'tg-math';
      wrapper.textContent = text;
      break;
    case 'emoji':
      wrapper = document.createElement('span');
      wrapper.className = 'tg-emoji';
      wrapper.dataset.emojiId = '0';
      wrapper.textContent = text || '😀';
      break;
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
  const isLight = state.theme === 'light';
  document.body.classList.toggle('light', isLight);
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun && moon) {
    sun.style.display = isLight ? 'none' : '';
    moon.style.display = isLight ? '' : 'none';
  }
}
function initTheme() {
  applyTheme();
  $('#btn-theme')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tfr-theme', state.theme);
    applyTheme();
  });
}

// ===================== MODE =====================
function initModeTabs() {
  $$('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      $$('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === state.mode));
      if (state.mode === 'edit') state.editMessageId = state.settings.editId || null;
    });
  });
}

// ===================== RTL / ENTITY CHECKS =====================
function initFlags() {
  const rtlChk = $('#chk-rtl');
  const entChk = $('#chk-skip-entities');
  if (rtlChk) rtlChk.addEventListener('change', () => { state.isRtl = rtlChk.checked; });
  if (entChk) entChk.addEventListener('change', () => { state.skipEntityDetection = entChk.checked; });
}

// ===================== SETTINGS =====================
function initSettings() {
  const overlay = $('#settings-overlay');
  const open = () => {
    $('#input-token').value = state.settings.token;
    $('#input-chat').value = state.settings.chatId;
    $('#input-edit-id').value = state.settings.editId;
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
    state.settings.editId = $('#input-edit-id').value.trim();
    state.settings.lang = $('#input-lang').value;
    state.settings.tokenSet = !!state.settings.token;
    localStorage.setItem('tfr-token', state.settings.token);
    localStorage.setItem('tfr-chat', state.settings.chatId);
    localStorage.setItem('tfr-edit-id', state.settings.editId);
    localStorage.setItem('tfr-lang', state.settings.lang);
    updateStatus(); close(); toast('Settings saved', 'success');
  });

  $('#btn-test-connection')?.addEventListener('click', async () => {
    const token = $('#input-token').value.trim();
    if (!token) { toast('Enter bot token', 'error'); return; }
    const statusEl = $('#connection-status');
    statusEl.textContent = 'Testing...'; statusEl.className = '';
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok) { statusEl.textContent = `✓ @${data.result.username} connected`; statusEl.className = 'ok'; }
      else { statusEl.textContent = `✗ ${data.description}`; statusEl.className = 'error'; }
    } catch { statusEl.textContent = '✗ Network error'; statusEl.className = 'error'; }
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
function initSend() { $('#btn-send')?.addEventListener('click', sendMessage); }

async function sendMessage() {
  if (!state.settings.tokenSet) { toast('Configure bot token', 'error'); return; }
  if (!state.settings.chatId) { toast('Set chat ID', 'error'); return; }
  if (state.blocks.length === 0) { toast('Nothing to send', 'error'); return; }

  const markdown = blocksToMarkdown();
  const token = state.settings.token;
  const chatId = state.settings.chatId;

  const body = { chat_id: chatId, rich_message: { markdown } };
  if (state.isRtl) body.rich_message.is_rtl = true;
  if (state.skipEntityDetection) body.rich_message.skip_entity_detection = true;

  try {
    const sendBtn = $('#btn-send');
    sendBtn.style.opacity = '0.5'; sendBtn.disabled = true;

    let res;
    if (state.mode === 'draft') {
      body.rich_message = { markdown: blocksToMarkdown(true) };
      res = await fetch(`https://api.telegram.org/bot${token}/sendRichMessageDraft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else if (state.mode === 'edit' && state.editMessageId) {
      res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, message_id: state.editMessageId }),
      });
    } else {
      res = await fetch(`https://api.telegram.org/bot${token}/sendRichMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();
    if (data.ok) toast(state.mode === 'draft' ? 'Draft sent (30s)' : state.mode === 'edit' ? 'Edited!' : 'Sent!', 'success');
    else toast(`Error: ${data.description}`, 'error');
    sendBtn.style.opacity = '1'; sendBtn.disabled = false;
  } catch { toast('Network error', 'error'); $('#btn-send').style.opacity = '1'; $('#btn-send').disabled = false; }
}

// ===================== MARKDOWN CONVERSION =====================
function blocksToMarkdown(draft = false) {
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
        if (block.credit) lines.push(`> — ${block.credit}`);
        lines.push('');
        break;
      case 'pull-quote':
        lines.push(`> ${inlineToMd(block.html || block.text || '')}`);
        if (block.credit) lines.push(`> — ${block.credit}`);
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
        if (!block.cells.length) break;
        lines.push('| ' + block.cells[0].cells.join(' | ') + ' |');
        lines.push('| ' + block.cells[0].cells.map(() => '---').join(' | ') + ' |');
        block.cells.slice(1).forEach(row => lines.push('| ' + row.cells.join(' | ') + ' |'));
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
      case 'image': case 'video': case 'audio': case 'animation': case 'voicenote':
        if (block.url) {
          const cap = block.caption ? ` "${block.caption}"` : '';
          lines.push(`![](${block.url}${cap})`);
        }
        lines.push('');
        break;
      case 'collage':
        lines.push('<tg-collage>');
        (block.images || []).forEach(img => { if (img.url) lines.push(`  <img src="${img.url}"/>`); });
        lines.push('</tg-collage>');
        if (block.caption) lines.push(block.caption);
        lines.push('');
        break;
      case 'slideshow':
        lines.push('<tg-slideshow>');
        (block.images || []).forEach(img => { if (img.url) lines.push(`  <img src="${img.url}"/>`); });
        lines.push('</tg-slideshow>');
        if (block.caption) lines.push(block.caption);
        lines.push('');
        break;
      case 'map':
        lines.push(`<tg-map lat="${block.latitude}" long="${block.longitude}" zoom="${block.zoom}"/>`);
        lines.push('');
        break;
      case 'math-block':
        lines.push(`$$${block.expression}$$`);
        lines.push('');
        break;
      case 'thinking':
        lines.push(`<thinking>${inlineToMd(block.html || block.text || '')}</thinking>`);
        lines.push('');
        break;
      case 'anchor':
        lines.push(`<a name="${block.name}"></a>`);
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
  md = md.replace(/<sub>(.*?)<\/sub>/gi, '<sub>$1</sub>');
  md = md.replace(/<sup>(.*?)<\/sup>/gi, '<sup>$1</sup>');
  md = md.replace(/<mark>(.*?)<\/mark>/gi, '==$1==');
  md = md.replace(/<span class="tg-datetime"[^>]*>(.*?)<\/span>/gi, '<time>$1</time>');
  md = md.replace(/<span class="tg-math"[^>]*>(.*?)<\/span>/gi, '$$$1$$');
  md = md.replace(/<span class="tg-emoji"[^>]*>(.*?)<\/span>/gi, '$1');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/?div[^>]*>/gi, '\n');
  md = md.replace(/<\/?p[^>]*>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  return md.trim();
}

// ===================== TEST MESSAGE =====================
function initTestMessage() {
  $('#btn-test-message')?.addEventListener('click', loadTestMessage);
}

function loadTestMessage() {
  const now = Math.floor(Date.now() / 1000);
  const emojiId = '5365287242976311112'; // TG star emoji ID (public)
  state.blocks = [
    // ====================================================
    // SECTION 1: ALL RichText (Inline) Types = 25 types
    // ====================================================
    createBlock('heading', { size: 1, html:
      'TelegramFreeRich <strong>Rich Text</strong> — All 25 Inline Types' }),
    createBlock('paragraph', { html:
      '1️⃣ <strong>Bold</strong> &bull; 2️⃣ <em>Italic</em> &bull; 3️⃣ <u>Underline</u> &bull; ' +
      '4️⃣ <s>Strikethrough</s> &bull; 5️⃣ <span class="tg-spoiler">Spoiler (tap to reveal)</span>' }),
    createBlock('paragraph', { html:
      '6️⃣ <sub>Subscript</sub> (H₂O) &bull; 7️⃣ <sup>Superscript</sup> (E=mc²) &bull; ' +
      '8️⃣ <mark>Marked/Highlighted</mark> text' }),
    createBlock('paragraph', { html:
      '9️⃣ <code>Inline code</code> &bull; ' +
      '🔟 <time class="tg-datetime" timestamp="' + now + '">' + new Date().toLocaleString() + '</time> (DateTime)' }),
    createBlock('paragraph', { html:
      '1️⃣1️⃣ <span class="tg-math">\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</span> (Math Inline) &bull; ' +
      '1️⃣2️⃣ <span class="tg-emoji" emoji-id="' + emojiId + '">⭐</span> (Custom Emoji)' }),
    createBlock('paragraph', { html:
      '1️⃣3️⃣ <a href="https://telegram.org">URL / Link</a> &bull; ' +
      '1️⃣4️⃣ <a href="mailto:user@example.com">Email Address</a> &bull; ' +
      '1️⃣5️⃣ <a href="tel:+1234567890">Phone Number</a>'}),
    createBlock('paragraph', { html:
      '1️⃣6️⃣ <span class="tg-bankcard">1234 5678 9012 3456</span> (Bank Card) &bull; ' +
      '1️⃣7️⃣ <span class="tg-mention">@username</span> (Mention) &bull; ' +
      '1️⃣8️⃣ <span class="tg-hashtag">#hashtag</span> (Hashtag)' }),
    createBlock('paragraph', { html:
      '1️⃣9️⃣ <span class="tg-cashtag">$STARS</span> (Cashtag) &bull; ' +
      '2️⃣0️⃣ <span class="tg-botcommand">/start@BotFather</span> (Bot Command) &bull; ' +
      '2️⃣1️⃣ <span class="tg-textmention">Text Mention</span> (by user ID)' }),
    createBlock('paragraph', { html:
      '2️⃣2️⃣ <a name="section-top"></a>Anchor (named section) &bull; ' +
      '2️⃣3️⃣ <a href="#section-top">Anchor Link</a> &bull; ' +
      '2️⃣4️⃣ <span class="tg-ref">Reference</span> &bull; ' +
      '2️⃣5️⃣ <a href="#ref-1">Reference Link</a>'}),

    // ====================================================
    // SECTION 2: ALL Block Types = 21 blocks
    // ====================================================
    createBlock('divider'),
    createBlock('heading', { size: 1, html: 'Section 2 — All 21 Block Types' }),
    createBlock('heading', { size: 2, html: '2. Paragraph (already seen above) &amp; Headings H1-H6' }),
    createBlock('heading', { size: 6, html: '2a. Heading H6 — smallest heading' }),
    createBlock('heading', { size: 4, html: '2b. Heading H4 — medium heading' }),
    createBlock('heading', { size: 3, html: '2c. Heading H3 — section heading' }),

    createBlock('heading', { size: 3, html: '2d. Block Quote (with credit)' }),
    createBlock('blockquote', { html: '<strong>"The only way to do great work is to love what you do."</strong>', credit: '— Steve Jobs' }),

    createBlock('heading', { size: 3, html: '2e. Pull Quote (centered)' }),
    createBlock('pull-quote', { html: 'This is a centered pull quote that visually stands out from the main content flow.', credit: 'TelegramFreeRich' }),

    createBlock('heading', { size: 3, html: '2f. Preformatted / Code Block' }),
    createBlock('code-block', { language: 'python', text: 'def fibonacci(n):\n    """Return the nth Fibonacci number."""\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint(fibonacci(10))  # Output: 55' }),

    createBlock('heading', { size: 3, html: '2g. Bullet List &amp; 2h. Ordered List' }),
    createBlock('bullet-list', { items: [
      { text: 'Unordered item A' },
      { text: 'Unordered item B with <code>inline</code>' },
      { text: 'Unordered item C' },
    ]}),
    createBlock('ordered-list', { items: [
      { text: 'First ordered item' },
      { text: 'Second ordered item' },
      { text: 'Third ordered item with <b>bold</b>' },
    ]}),

    createBlock('heading', { size: 3, html: '2i. Checklist' }),
    createBlock('checklist', { items: [
      { text: 'Completed task', checked: true },
      { text: 'In progress task', checked: false },
      { text: 'Pending task with notes', checked: false },
    ]}),

    createBlock('heading', { size: 3, html: '2j. Table' }),
    createBlock('table', { cells: [
      { cells: ['Telegram Bot API', 'Version', 'Rich Text Support', 'Blocks Support'], header: true },
      { cells: ['Bold / Italic', '10.1', '✅', '—'], header: false },
      { cells: ['Table block', '10.1', '—', '✅'], header: false },
      { cells: ['Collage / Slideshow', '10.2', '—', '✅'], header: false },
      { cells: ['Thinking block', '10.2', '—', '✅'], header: false },
    ]}),

    createBlock('heading', { size: 3, html: '2k. Details (spoiler/expandable)' }),
    createBlock('details', { summary: '🔽 Click to expand — hidden content inside', html: 'This content is <strong>hidden</strong> by default. Telegram renders it as a collapsible block. The user can tap to expand and read the full text.', open: false }),

    createBlock('heading', { size: 3, html: '2l. Divider' }),
    createBlock('divider'),

    createBlock('heading', { size: 3, html: '2m. Footer' }),
    createBlock('footer', { text: 'This is a footer block — italic, smaller, separated from the main content.' }),

    createBlock('heading', { size: 3, html: '2n. Math Block (block-level LaTeX)' }),
    createBlock('math-block', { expression: '\\int_{0}^{2\\pi} \\sin^2(x) \\, dx = \\pi' }),

    createBlock('heading', { size: 3, html: '2o. Thinking Block (AI reasoning)' }),
    createBlock('thinking', { text: 'This is a "thinking" block that represents the AI\'s internal chain-of-thought reasoning process. It should appear with a distinct visual style (e.g., grey/italic background) to indicate it is not part of the final response.' }),

    createBlock('heading', { size: 3, html: '2p. Media Blocks (Photo, Video, GIF, Audio, Voice)' }),
    createBlock('paragraph', { html: '⚠️ Photo/Video/GIF/Audio/Voice blocks require file upload via <code>media</code> field (tg://photo?id=). URLs are not supported directly. Use the editor UI to add these blocks when sending from a bot that can upload files.' }),

    createBlock('heading', { size: 3, html: '2q. Collage (multi-image grid)' }),
    createBlock('paragraph', { html: '⚠️ Collage block requires media uploads via <code>media</code> field. Add images through the editor UI when your bot can upload files.' }),

    createBlock('heading', { size: 3, html: '2r. Slideshow (carousel)' }),
    createBlock('paragraph', { html: '⚠️ Slideshow block requires media uploads via <code>media</code> field. Add images through the editor UI when your bot can upload files.' }),

    createBlock('heading', { size: 3, html: '2s. Map (location pin)' }),
    createBlock('map', { latitude: 35.6892, longitude: 51.3890, zoom: 13 }),

    createBlock('heading', { size: 3, html: '2t. Anchor (named position)' }),
    createBlock('anchor', { name: 'section-bottom' }),

    createBlock('heading', { size: 3, html: '2u. List Item (rich nested)' }),
    createBlock('bullet-list', { items: [
      { text: 'Main item with <b>rich text</b> support' },
      { text: 'Sub-item reference <a href="#section-bottom">link to anchor</a>' },
      { text: 'Final item with <code>code</code> inline' },
    ]}),

    // ====================================================
    // SECTION 3: InputRichMessage Features
    // ====================================================
    createBlock('divider'),
    createBlock('heading', { size: 1, html: 'Section 3 — InputRichMessage Features' }),
    createBlock('paragraph', { html:
      '✅ <strong>is_rtl</strong> — Enable below (RTL toggle) for Arabic/Persian/Hebrew text<br/>' +
      '✅ <strong>skip_entity_detection</strong> — Enable below (No Detect toggle) to send raw text without URL/hashtag auto-linking<br/>' +
      '✅ <strong>media field</strong> — Use tg://photo?id= links in markdown for file attachment<br/>' +
      '✅ <strong>Three modes</strong> — Rich (sendRichMessage) / Draft (sendRichMessageDraft, auto-deletes after 30s) / Edit (editMessageText)'}),

    createBlock('footer', { text: 'Generated by TelegramFreeRich — covers all 25 RichText + 21 RichBlock + InputRichMessage features' }),
  ];
  renderBlocks();
  toast('Full API test loaded: 25 RichText + 21 blocks + msg features', 'success');
}
function init() {
  if (state.blocks.length === 0) {
    state.blocks.push(createBlock('heading', { size: 2, html: 'TelegramFreeRich', text: 'TelegramFreeRich' }));
    state.blocks.push(createBlock('paragraph', { html: 'Free rich text editor for Telegram Bot API 10.1/10.2.', text: 'Free rich text editor for Telegram Bot API 10.1/10.2.' }));
    state.blocks.push(createBlock('paragraph', { html: 'All block types: headings, tables, lists, code, math, media, collage, slideshow, maps, thinking, and more.', text: 'All block types: headings, tables, lists, code, math, media, collage, slideshow, maps, thinking, and more.' }));
  }
  renderBlocks();
  initToolbar();
  initTheme();
  initModeTabs();
  initFlags();
  initSettings();
  initSend();
  initTestMessage();
}

document.addEventListener('DOMContentLoaded', init);
