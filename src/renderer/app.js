/**
 * TelegramFreeRich — Minimal Single-Pane Editor
 * Floating bottom toolbar with 6 dropdown menus, inline rendering
 */

// ===================== STATE =====================
const state = {
  blocks: [],           // Block[]
  selectedBlockId: null,
  sendMode: 'rich',     // rich | draft | edit
  editMessageId: null,
  theme: 'dark',
  settings: {
    token: '',
    tokenSet: false,
    chatId: '',
    lang: 'en',
  },
  // UI state
  openDropdown: null,   // 'formatting' | 'inline' | 'lists' | 'table' | 'link' | 'media' | null
};

let blockIdCounter = 0;
function newId() { return `blk_${++blockIdCounter}_${Date.now()}`; }

// ===================== BLOCK MODEL =====================
function createBlock(type, data = {}) {
  const base = { id: newId(), type, ...data };
  switch (type) {
    case 'paragraph':
      return { ...base, text: data.text || '', html: data.html || '' };
    case 'heading':
      return { ...base, size: data.size || 2, text: data.text || '', html: data.html || '' };
    case 'code-block':
      return { ...base, language: data.language || '', text: data.text || '' };
    case 'bullet-list':
    case 'ordered-list':
      return { ...base, items: data.items || [{ text: '' }] };
    case 'checklist':
      return { ...base, items: data.items || [{ text: '', checked: false }] };
    case 'table':
      return { ...base, cells: data.cells || [
        { cells: ['Header 1', 'Header 2', 'Header 3'], header: true },
        { cells: ['', '', ''], header: false },
        { cells: ['', '', ''], header: false },
      ]};
    case 'blockquote':
      return { ...base, text: data.text || '', html: data.html || '' };
    case 'pull-quote':
      return { ...base, text: data.text || '', html: data.html || '', cite: data.cite || '' };
    case 'details':
      return { ...base, summary: data.summary || 'Details', body: data.body || '', html: data.html || '', open: data.open || false };
    case 'divider':
      return { ...base };
    case 'footer':
      return { ...base, text: data.text || '' };
    case 'image':
    case 'video':
    case 'audio':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    default:
      return { ...base };
  }
}

// ===================== HELPERS =====================
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function syncEditableBlock(block, el) {
  const html = el.innerHTML;
  block.html = html;
  block.text = stripHtml(html);
}

function getBlockIndex(id) {
  return state.blocks.findIndex(b => b.id === id);
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// DOM refs
const blocksContainer = () => $('#blocks-container');
const toastContainer = () => $('#toast-container');

// Toolbar dropdowns
const dropdowns = {
  formatting: () => $('#dropdown-formatting'),
  inline: () => $('#dropdown-inline'),
  lists: () => $('#dropdown-lists'),
  table: () => $('#dropdown-table'),
  link: () => $('#dropdown-link'),
  media: () => $('#dropdown-media'),
};
const toolbarBtns = {
  formatting: () => $('#btn-formatting'),
  inline: () => $('#btn-inline'),
  lists: () => $('#btn-lists'),
  table: () => $('#btn-table'),
  link: () => $('#btn-link'),
  media: () => $('#btn-media'),
};

// Link panel
const linkTextInput = () => $('#link-text');
const linkUrlInput = () => $('#link-url');
const linkCreateBtn = () => $('#link-create');
const linkCancelBtn = () => $('#link-cancel');

// Action bar
const sendBtn = () => $('#btn-send');
const clearBtn = () => $('#btn-clear');

// Settings
const settingsOverlay = () => $('#settings-overlay');

// ===================== RENDER =====================
function renderBlocks() {
  const container = blocksContainer();
  if (!container) return;

  container.innerHTML = '';
  state.blocks.forEach((block, index) => {
    container.appendChild(renderBlock(block, index));
  });

  // Add block button at bottom
  const addBtn = document.createElement('button');
  addBtn.id = 'add-block-btn';
  addBtn.className = 'add-block-btn';
  addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Add Block</span>';
  addBtn.addEventListener('click', () => {
    state.blocks.push(createBlock('paragraph'));
    renderBlocks();
    updateCharCount();
  });
  container.appendChild(addBtn);

  updateCharCount();
}

function renderBlock(block, index) {
  const card = document.createElement('div');
  card.className = `block-card${state.selectedBlockId === block.id ? ' selected' : ''}`;
  card.dataset.type = block.type;
  card.dataset.id = block.id;
  if (block.size) card.dataset.size = block.size;

  // Drag handle
  const drag = document.createElement('div');
  drag.className = 'block-drag';
  drag.textContent = '⋮⋮';
  drag.draggable = true;
  drag.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    card.style.opacity = '0.4';
  });
  drag.addEventListener('dragend', () => { card.style.opacity = '1'; });
  card.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = index;
    if (fromIndex !== toIndex) {
      const [moved] = state.blocks.splice(fromIndex, 1);
      state.blocks.splice(toIndex, 0, moved);
      renderBlocks();
    }
  });
  card.appendChild(drag);

  // Content area
  const contentArea = document.createElement('div');
  contentArea.className = 'block-content';

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'blockquote':
      contentArea.contentEditable = 'true';
      contentArea.innerHTML = block.html || block.text || '';
      contentArea.dataset.placeholder = block.type === 'heading' ? `Heading ${block.size}` : 'Type something...';
      contentArea.addEventListener('input', () => {
        syncEditableBlock(block, contentArea);
        updateCharCount();
      });
      contentArea.addEventListener('focus', () => selectBlock(block.id));
      contentArea.addEventListener('keydown', (e) => handleBlockKeydown(e, block, index));
      break;

    case 'code-block': {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;width:100%;';

      const langInput = document.createElement('input');
      langInput.type = 'text';
      langInput.placeholder = 'language (js, python, ...)';
      langInput.value = block.language;
      langInput.style.cssText = 'padding:8px 12px;border:none;border-bottom:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:12px;outline:none;width:100%;';
      langInput.addEventListener('input', () => { block.language = langInput.value; updateCharCount(); });

      const codeArea = document.createElement('div');
      codeArea.contentEditable = 'true';
      codeArea.textContent = block.text;
      codeArea.style.cssText = 'padding:12px;outline:none;font-family:monospace;min-height:60px;white-space:pre-wrap;tab-size:4;';
      codeArea.addEventListener('input', () => { block.text = codeArea.textContent; updateCharCount(); });
      codeArea.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); } });

      wrapper.appendChild(langInput);
      wrapper.appendChild(codeArea);
      contentArea.appendChild(wrapper);
      contentArea.style.padding = '0';
      break;
    }

    case 'bullet-list':
    case 'ordered-list': {
      const listDiv = document.createElement('div');
      listDiv.className = 'list-items';
      const marker = block.type === 'bullet-list' ? '•' : '1.';
      let counter = 1;
      block.items.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'list-item';
        const m = document.createElement('span');
        m.className = 'list-marker';
        m.textContent = block.type === 'ordered-list' ? `${counter++}.` : marker;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = item.text;
        inp.placeholder = 'List item';
        inp.addEventListener('input', () => { block.items[i].text = inp.value; updateCharCount(); });
        inp.addEventListener('keydown', (e) => handleListKeydown(e, block, i));
        row.appendChild(m);
        row.appendChild(inp);
        listDiv.appendChild(row);
      });
      contentArea.appendChild(listDiv);
      contentArea.style.padding = '8px 16px';
      break;
    }

    case 'checklist': {
      const clDiv = document.createElement('div');
      clDiv.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%;';
      block.items.forEach((item, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = item.checked;
        cb.style.cssText = 'accent-color:var(--accent);';
        cb.addEventListener('change', () => { block.items[i].checked = cb.checked; updateCharCount(); });
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = item.text;
        inp.placeholder = 'Todo item';
        inp.style.cssText = 'flex:1;border:none;background:transparent;color:var(--text);font-size:14px;outline:none;padding:4px 0;';
        inp.addEventListener('input', () => { block.items[i].text = inp.value; updateCharCount(); });
        row.appendChild(cb);
        row.appendChild(inp);
        clDiv.appendChild(row);
      });
      const addCl = document.createElement('button');
      addCl.textContent = '+ Add Item';
      addCl.style.cssText = 'font-size:11px;padding:4px;border:none;background:none;color:var(--text-dim);cursor:pointer;text-align:left;';
      addCl.addEventListener('click', () => { block.items.push({ text: '', checked: false }); renderBlocks(); });
      clDiv.appendChild(addCl);
      contentArea.appendChild(clDiv);
      contentArea.style.padding = '8px 16px';
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
      contentArea.appendChild(table);

      const actions = document.createElement('div');
      actions.className = 'block-table-actions';
      const addRow = document.createElement('button');
      addRow.textContent = '+ Row';
      addRow.addEventListener('click', () => {
        const cols = block.cells[0]?.cells.length || 3;
        block.cells.push({ cells: Array(cols).fill(''), header: false });
        renderBlocks();
      });
      const addCol = document.createElement('button');
      addCol.textContent = '+ Col';
      addCol.addEventListener('click', () => {
        block.cells.forEach(r => r.cells.push(''));
        renderBlocks();
      });
      actions.appendChild(addRow);
      actions.appendChild(addCol);
      contentArea.appendChild(actions);
      contentArea.style.padding = '8px';
      break;
    }

    case 'pull-quote': {
      contentArea.innerHTML = '';
      const pqText = document.createElement('div');
      pqText.contentEditable = 'true';
      pqText.innerHTML = block.html || block.text || '';
      pqText.dataset.placeholder = 'Pull quote text...';
      pqText.addEventListener('input', () => { syncEditableBlock(block, pqText); updateCharCount(); });
      const pqCite = document.createElement('div');
      pqCite.contentEditable = 'true';
      pqCite.textContent = block.cite;
      pqCite.dataset.placeholder = '— Author';
      pqCite.style.cssText = 'font-size:12px;color:var(--text-dim);margin-top:4px;';
      pqCite.addEventListener('input', () => { block.cite = pqCite.textContent; updateCharCount(); });
      contentArea.appendChild(pqText);
      contentArea.appendChild(pqCite);
      break;
    }

    case 'details': {
      const details = document.createElement('details');
      details.open = block.open;
      const header = document.createElement('div');
      header.className = `details-header${block.open ? ' open' : ''}`;
      const chevron = document.createElement('span');
      chevron.className = 'chevron';
      chevron.textContent = '▶';
      const sumInput = document.createElement('input');
      sumInput.type = 'text';
      sumInput.value = block.summary;
      sumInput.placeholder = 'Summary';
      sumInput.style.cssText = 'flex:1;border:none;background:transparent;color:var(--accent);font-size:14px;font-weight:500;outline:none;';
      sumInput.addEventListener('input', () => { block.summary = sumInput.value; updateCharCount(); });
      header.appendChild(chevron);
      header.appendChild(sumInput);
      header.addEventListener('click', (e) => {
        if (e.target !== sumInput) {
          block.open = !block.open;
          details.open = block.open;
          header.classList.toggle('open', block.open);
        }
      });
      const body = document.createElement('div');
      body.className = 'details-body';
      body.contentEditable = 'true';
      body.innerHTML = block.html || block.body || '';
      body.dataset.placeholder = 'Hidden content...';
      body.addEventListener('input', () => { block.html = body.innerHTML; block.body = stripHtml(body.innerHTML); updateCharCount(); });
      details.appendChild(header);
      details.appendChild(body);
      contentArea.appendChild(details);
      contentArea.style.padding = '0';
      break;
    }

    case 'divider':
      contentArea.innerHTML = '<hr>';
      break;

    case 'image':
    case 'video':
    case 'audio': {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;width:100%;';
      const urlInp = document.createElement('input');
      urlInp.type = 'text';
      urlInp.value = block.url;
      urlInp.placeholder = `${block.type} URL (https://...)`;
      urlInp.style.cssText = 'flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
      urlInp.addEventListener('input', () => { block.url = urlInp.value; updateCharCount(); });
      const capInp = document.createElement('input');
      capInp.type = 'text';
      capInp.value = block.caption;
      capInp.placeholder = 'Caption (optional)';
      capInp.style.cssText = 'flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
      capInp.addEventListener('input', () => { block.caption = capInp.value; updateCharCount(); });
      row.appendChild(urlInp);
      row.appendChild(capInp);
      contentArea.appendChild(row);
      contentArea.style.padding = '8px';
      break;
    }

    case 'footer':
      contentArea.contentEditable = 'true';
      contentArea.textContent = block.text;
      contentArea.dataset.placeholder = 'Footer text...';
      contentArea.addEventListener('input', () => { block.text = contentArea.textContent; updateCharCount(); });
      break;
  }

  card.appendChild(contentArea);

  // Delete button
  const actions = document.createElement('div');
  actions.className = 'block-actions';
  const delBtn = document.createElement('button');
  delBtn.title = 'Delete block';
  delBtn.textContent = '×';
  delBtn.addEventListener('click', () => {
    state.blocks = state.blocks.filter(b => b.id !== block.id);
    if (state.selectedBlockId === block.id) state.selectedBlockId = null;
    renderBlocks();
  });
  actions.appendChild(delBtn);
  card.appendChild(actions);

  // Click to select
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.block-actions') && !e.target.closest('.block-drag')) {
      selectBlock(block.id);
    }
  });

  return card;
}

function selectBlock(id) {
  state.selectedBlockId = id;
  $$('.block-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
}

function handleBlockKeydown(e, block, index) {
  if (e.key === 'Enter' && !e.shiftKey && block.type === 'paragraph') {
    e.preventDefault();
    const newBlock = createBlock('paragraph');
    state.blocks.splice(index + 1, 0, newBlock);
    renderBlocks();
    setTimeout(() => selectBlock(newBlock.id), 0);
  }
  if (e.key === 'Backspace' && block.type === 'paragraph' && block.text === '' && state.blocks.length > 1) {
    e.preventDefault();
    state.blocks.splice(index, 1);
    renderBlocks();
  }
}

function handleListKeydown(e, block, i) {
  if (e.key === 'Enter') {
    e.preventDefault();
    block.items.splice(i + 1, 0, { text: '' });
    renderBlocks();
  }
  if (e.key === 'Backspace' && e.target.value === '' && block.items.length > 1) {
    e.preventDefault();
    block.items.splice(i, 1);
    renderBlocks();
  }
}

// ===================== CHAR COUNT =====================
function updateCharCount() {
  const countEl = $('#char-count');
  if (!countEl) return;
  let total = 0;
  state.blocks.forEach(b => { total += JSON.stringify(b).length; });
  countEl.textContent = `${total.toLocaleString()} / 32,768`;
}

// ===================== TOOLBAR DROPDOWNS =====================
function closeAllDropdowns() {
  Object.keys(dropdowns).forEach(key => {
    const el = dropdowns[key]();
    if (el) el.classList.remove('open');
  });
  Object.keys(toolbarBtns).forEach(key => {
    const btn = toolbarBtns[key]();
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
  state.openDropdown = null;
}

function toggleDropdown(name) {
  const dropdown = dropdowns[name]();
  const btn = toolbarBtns[name]();
  if (!dropdown || !btn) return;

  const isOpen = dropdown.classList.contains('open');
  closeAllDropdowns();

  if (!isOpen) {
    dropdown.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    state.openDropdown = name;

    // Position dropdown above toolbar
    const toolbarRect = $('.floating-toolbar').getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    const spaceAbove = toolbarRect.top;
    const spaceBelow = window.innerHeight - toolbarRect.bottom;

    if (spaceAbove > dropdownRect.height + 16) {
      dropdown.style.bottom = 'calc(100% + 8px)';
      dropdown.style.top = 'auto';
    } else {
      dropdown.style.top = 'calc(100% + 8px)';
      dropdown.style.bottom = 'auto';
    }
  }
}

function initToolbar() {
  // Toolbar button clicks
  toolbarBtns.formatting()?.addEventListener('click', () => toggleDropdown('formatting'));
  toolbarBtns.inline()?.addEventListener('click', () => toggleDropdown('inline'));
  toolbarBtns.lists()?.addEventListener('click', () => toggleDropdown('lists'));
  toolbarBtns.table()?.addEventListener('click', () => toggleDropdown('table'));
  toolbarBtns.link()?.addEventListener('click', () => toggleDropdown('link'));
  toolbarBtns.media()?.addEventListener('click', () => toggleDropdown('media'));

  // Dropdown item clicks (event delegation)
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item[role="menuitem"]');
    if (!item) return;

    const cmd = item.dataset.cmd;
    const subCmd = item.dataset.level || item.dataset.subcmd;
    if (cmd) handleToolbarCommand(cmd, subCmd);
    closeAllDropdowns();
  });

  // Close dropdowns on outside click
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.floating-toolbar') && !e.target.closest('.dropdown-menu')) {
      closeAllDropdowns();
    }
  });

  // Link panel
  linkCreateBtn()?.addEventListener('click', createLink);
  linkCancelBtn()?.addEventListener('click', () => {
    linkTextInput().value = '';
    linkUrlInput().value = '';
    closeAllDropdowns();
  });
  linkTextInput()?.addEventListener('keydown', (e) => { if (e.key === 'Enter') createLink(); });
  linkUrlInput()?.addEventListener('keydown', (e) => { if (e.key === 'Enter') createLink(); });

  // Escape key closes dropdowns
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });
}

function handleToolbarCommand(cmd, subCmd) {
  switch (cmd) {
    // Formatting menu
    case 'heading':
      addBlock('heading', { size: parseInt(subCmd) || 2 });
      break;
    case 'paragraph':
      addBlock('paragraph');
      break;
    case 'blockquote':
      addBlock('blockquote');
      break;
    case 'pull-quote':
      addBlock('pull-quote');
      break;
    case 'code-block':
      addBlock('code-block');
      break;
    case 'footer':
      addBlock('footer');
      break;
    case 'divider':
      addBlock('divider');
      break;

    // Inline formatting
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strikethrough':
    case 'code':
    case 'spoiler':
    case 'subscript':
    case 'superscript':
    case 'marked':
      applyInlineFormat(cmd);
      break;

    // Lists
    case 'ordered-list':
      addBlock('ordered-list');
      break;
    case 'bullet-list':
      addBlock('bullet-list');
      break;
    case 'checklist':
      addBlock('checklist');
      break;
    case 'details':
      addBlock('details');
      break;

    // Table
    case 'table':
      addBlock('table');
      break;

    // Media
    case 'image':
      addBlock('image');
      break;
    case 'video':
      addBlock('video');
      break;
    case 'audio':
      addBlock('audio');
      break;
  }
}

function addBlock(type, data = {}) {
  const idx = state.selectedBlockId
    ? getBlockIndex(state.selectedBlockId) + 1
    : state.blocks.length;
  state.blocks.splice(idx, 0, createBlock(type, data));
  renderBlocks();
  setTimeout(() => {
    const cards = $$('.block-card');
    if (cards[idx]) {
      const editable = cards[idx].querySelector('[contenteditable], input');
      if (editable) editable.focus();
    }
  }, 0);
}

function applyInlineFormat(type) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;

  // Find the block element
  let startEl = range.startContainer;
  if (startEl.nodeType === 3) startEl = startEl.parentElement;
  const card = startEl?.closest('.block-card');
  const blkIdx = card ? getBlockIndex(card.dataset.id) : -1;
  const contentEl = card?.querySelector('.block-content');

  let wrapper;
  switch (type) {
    case 'bold': wrapper = document.createElement('strong'); break;
    case 'italic': wrapper = document.createElement('em'); break;
    case 'underline': wrapper = document.createElement('u'); break;
    case 'strikethrough': wrapper = document.createElement('s'); break;
    case 'code': wrapper = document.createElement('code'); break;
    case 'spoiler':
      wrapper = document.createElement('span');
      wrapper.className = 'tg-spoiler';
      break;
    case 'subscript': wrapper = document.createElement('sub'); break;
    case 'superscript': wrapper = document.createElement('sup'); break;
    case 'marked': wrapper = document.createElement('mark'); break;
    default: return;
  }
  wrapper.textContent = selectedText;
  range.deleteContents();
  range.insertNode(wrapper);

  // Update block state
  if (blkIdx !== -1 && contentEl && contentEl.contentEditable === 'true') {
    state.blocks[blkIdx].html = contentEl.innerHTML;
    state.blocks[blkIdx].text = stripHtml(contentEl.innerHTML);
  }
  updateCharCount();
}

function createLink() {
  const text = linkTextInput().value.trim();
  const url = linkUrlInput().value.trim();
  if (!url) { toast('Enter a URL', 'error'); return; }

  const linkHtml = `<a href="${escapeHtml(url)}">${escapeHtml(text || url)}</a>`;

  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    let startEl = range.startContainer;
    if (startEl.nodeType === 3) startEl = startEl.parentElement;
    const card = startEl?.closest('.block-card');
    const contentEl = card?.querySelector('.block-content');
    const blkIdx = card ? getBlockIndex(card.dataset.id) : -1;

    const a = document.createElement('a');
    a.href = url;
    a.textContent = text || url;
    range.deleteContents();
    range.insertNode(a);
    range.collapse(false);

    if (blkIdx !== -1 && contentEl) {
      state.blocks[blkIdx].html = contentEl.innerHTML;
      state.blocks[blkIdx].text = stripHtml(contentEl.innerHTML);
      updateCharCount();
    }
  } else {
    // Insert at end of selected block or new paragraph
    if (state.selectedBlockId) {
      const blkIdx = getBlockIndex(state.selectedBlockId);
      if (blkIdx !== -1) {
        const block = state.blocks[blkIdx];
        if (block.type === 'paragraph' || block.type === 'heading') {
          block.html += (block.html ? ' ' : '') + linkHtml;
        } else {
          state.blocks.splice(blkIdx + 1, 0, createBlock('paragraph', { html: linkHtml }));
        }
        renderBlocks();
      }
    } else {
      state.blocks.push(createBlock('paragraph', { html: linkHtml }));
      renderBlocks();
    }
  }
  linkTextInput().value = '';
  linkUrlInput().value = '';
  closeAllDropdowns();
  toast('Link inserted', 'success');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#039;');
}

// ===================== MARKDOWN CONVERSION =====================
function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  // Bold
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  // Italic
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  // Strikethrough
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  // Underline
  md = md.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
  // Inline code
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  // Spoiler
  md = md.replace(/<span class="tg-spoiler">(.*?)<\/span>/gi, '||$1||');
  // Sub/Sup/Mark - keep as HTML
  md = md.replace(/<sub>(.*?)<\/sub>/gi, '<sub>$1</sub>');
  md = md.replace(/<sup>(.*?)<\/sup>/gi, '<sup>$1</sup>');
  md = md.replace(/<mark>(.*?)<\/mark>/gi, '<mark>$1</mark>');
  // Links
  md = md.replace(/<a href="([^"]*)">(.*?)<\/a>/gi, '[$2]($1)');
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');
  // Decode entities
  md = md.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/&nbsp;/g, ' ');
  return md;
}

function blocksToMarkdown(blocks) {
  const lines = [];
  blocks.forEach(block => {
    switch (block.type) {
      case 'paragraph':
        lines.push(htmlToMarkdown(block.html) || block.text || '');
        lines.push('');
        break;
      case 'heading': {
        const prefix = '#'.repeat(block.size || 2);
        lines.push(`${prefix} ${htmlToMarkdown(block.html) || block.text || ''}`);
        lines.push('');
        break;
      }
      case 'code-block':
        lines.push('```' + (block.language || ''));
        lines.push(block.text || '');
        lines.push('```');
        lines.push('');
        break;
      case 'bullet-list':
        block.items.forEach(item => lines.push(`- ${item.text || ''}`));
        lines.push('');
        break;
      case 'ordered-list':
        block.items.forEach((item, i) => lines.push(`${i + 1}. ${item.text || ''}`));
        lines.push('');
        break;
      case 'checklist':
        block.items.forEach(item => {
          const check = item.checked ? 'x' : ' ';
          lines.push(`- [${check}] ${item.text || ''}`);
        });
        lines.push('');
        break;
      case 'table': {
        if (block.cells.length > 0) {
          const header = block.cells[0];
          lines.push('| ' + header.cells.join(' | ') + ' |');
          lines.push('|' + header.cells.map(() => '---').join('|') + '|');
          for (let i = 1; i < block.cells.length; i++) {
            lines.push('| ' + block.cells[i].cells.join(' | ') + ' |');
          }
          lines.push('');
        }
        break;
      }
      case 'blockquote':
        (htmlToMarkdown(block.html) || block.text || '').split('\n').forEach(line => lines.push(`> ${line}`));
        lines.push('');
        break;
      case 'pull-quote':
        lines.push(`<aside>${htmlToMarkdown(block.html) || block.text || ''}</aside>`);
        if (block.cite) lines.push(`<cite>${block.cite}</cite>`);
        lines.push('');
        break;
      case 'details':
        lines.push('<details>');
        lines.push(`<summary>${block.summary || ''}</summary>`);
        lines.push(htmlToMarkdown(block.html) || block.body || '');
        lines.push('</details>');
        lines.push('');
        break;
      case 'divider':
        lines.push('---');
        lines.push('');
        break;
      case 'footer':
        lines.push(`<footer>${block.text || ''}</footer>`);
        lines.push('');
        break;
      case 'image':
        if (block.url) {
          lines.push(`<img src="${block.url}"/>`);
          if (block.caption) lines.push(`<figcaption>${block.caption}</figcaption>`);
          lines.push('');
        }
        break;
      case 'video':
        if (block.url) {
          lines.push(`<video src="${block.url}"/>`);
          if (block.caption) lines.push(`<figcaption>${block.caption}</figcaption>`);
          lines.push('');
        }
        break;
      case 'audio':
        if (block.url) {
          lines.push(`<audio src="${block.url}"/>`);
          lines.push('');
        }
        break;
    }
  });
  return lines.join('\n').trim();
}

// ===================== API =====================
async function sendRichMessage(blocks) {
  const chatId = state.settings.chatId;
  if (!state.settings.tokenSet || !chatId) { toast('Settings incomplete', 'error'); return; }

  const markdown = blocksToMarkdown(blocks);
  if (!markdown.trim()) { toast('Nothing to send', 'error'); return; }

  const body = { chat_id: chatId, rich_message: { markdown: markdown } };

  try {
    const res = await window.app.api('sendRichMessage', body);
    if (res.ok) toast('Message sent!', 'success');
    else toast(`Error: ${res.description || 'Unknown error'}`, 'error');
  } catch (e) { toast(`API error: ${e.message}`, 'error'); }
}

async function sendDraft(blocks) {
  const chatId = state.settings.chatId;
  if (!state.settings.tokenSet || !chatId) { toast('Settings incomplete', 'error'); return; }

  const markdown = blocksToMarkdown(blocks);
  if (!markdown.trim()) { toast('Nothing to send', 'error'); return; }

  const body = { chat_id: chatId, rich_message: { markdown: markdown } };

  try {
    const res = await window.app.api('sendRichMessageDraft', body);
    if (res.ok) toast('Draft sent (30s)', 'info');
    else toast(`Draft error: ${res.description}`, 'error');
  } catch (e) { toast(`API error: ${e.message}`, 'error'); }
}

async function editMessage(blocks) {
  const chatId = state.settings.chatId;
  const msgId = state.editMessageId;
  if (!state.settings.tokenSet || !chatId || !msgId) { toast('Settings or message ID incomplete', 'error'); return; }

  const markdown = blocksToMarkdown(blocks);
  if (!markdown.trim()) { toast('Nothing to send', 'error'); return; }

  const body = { chat_id: chatId, message_id: parseInt(msgId), rich_message: { markdown: markdown } };

  try {
    const res = await window.app.api('editMessageText', body);
    if (res.ok) toast('Message edited!', 'success');
    else toast(`Edit error: ${res.description}`, 'error');
  } catch (e) { toast(`API error: ${e.message}`, 'error'); }
}

async function testConnection() {
  if (!state.settings.tokenSet) { toast('Enter a bot token first', 'error'); return; }

  const statusEl = $('#connection-status');
  statusEl.textContent = 'Testing...';
  statusEl.className = '';

  try {
    const res = await window.app.testConnection();
    if (res.ok) {
      statusEl.textContent = `Connected: @${res.result.username} (${res.result.first_name})`;
      statusEl.className = 'ok';
      toast('Connection successful', 'success');
    } else {
      statusEl.textContent = `Error: ${res.description}`;
      statusEl.className = 'error';
    }
  } catch (e) {
    statusEl.textContent = `Error: ${e.message}`;
    statusEl.className = 'error';
  }
}

// ===================== SETTINGS =====================
async function loadSettings() {
  try {
    const s = await window.app.loadSettings();
    state.settings.tokenSet = s.tokenSet;
    state.settings.chatId = s.chatId || '';
    state.settings.lang = s.lang || 'en';
  } catch (e) {}
}

async function saveSettings() {
  const token = $('#input-token').value;
  const chatId = $('#input-chat').value;
  const lang = $('#input-lang').value;
  state.settings.chatId = chatId;
  state.settings.lang = lang;
  state.settings.tokenSet = !!token;
  try {
    await window.app.saveSettings({ token, chatId, lang });
    toast('Settings saved (encrypted)', 'success');
  } catch (e) { toast('Failed to save settings: ' + e.message, 'error'); }
  closeSettings();
}

function openSettings() {
  $('#input-chat').value = state.settings.chatId;
  $('#input-lang').value = state.settings.lang;
  $('#input-token').placeholder = state.settings.tokenSet ? '•••••••• (saved encrypted)' : 'Enter bot token';
  settingsOverlay().classList.remove('hidden');
}

function closeSettings() {
  settingsOverlay().classList.add('hidden');
}

// ===================== THEME =====================
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light', state.theme === 'light');
  localStorage.setItem('tfr_theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = $('#btn-theme');
  if (!btn) return;
  if (state.theme === 'dark') {
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
}

function loadTheme() {
  const saved = localStorage.getItem('tfr_theme');
  if (saved) {
    state.theme = saved;
    document.body.classList.toggle('light', saved === 'light');
  }
  updateThemeIcon();
}

// ===================== TOAST =====================
function toast(msg, type = 'info') {
  const container = toastContainer();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===================== SEND HANDLER =====================
function handleSend() {
  switch (state.sendMode) {
    case 'rich': sendRichMessage(state.blocks); break;
    case 'draft': sendDraft(state.blocks); break;
    case 'edit': editMessage(state.blocks); break;
  }
}

// ===================== KEYBOARD SHORTCUTS =====================
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b': e.preventDefault(); applyInlineFormat('bold'); break;
      case 'i': e.preventDefault(); applyInlineFormat('italic'); break;
      case 'u': e.preventDefault(); applyInlineFormat('underline'); break;
      case 'e': e.preventDefault(); applyInlineFormat('code'); break;
      case 'k': e.preventDefault(); toggleDropdown('link'); break;
      case 'enter': if (e.shiftKey) handleSend(); break;
    }
  }
  if (e.key === 'Escape') closeAllDropdowns();
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadTheme();
  initToolbar();

  // Initial block
  if (state.blocks.length === 0) {
    state.blocks.push(createBlock('paragraph', { text: '' }));
  }
  renderBlocks();

  // Send mode (not in new UI, but keep for compatibility)
  $$('input[name="send-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      state.sendMode = r.value;
      const mid = $('#message-id');
      if (mid) mid.style.display = r.value === 'edit' ? 'block' : 'none';
    });
  });

  // Buttons
  sendBtn()?.addEventListener('click', handleSend);
  clearBtn()?.addEventListener('click', () => {
    state.blocks = [createBlock('paragraph')];
    renderBlocks();
    toast('Cleared', 'info');
  });
  $('#btn-settings')?.addEventListener('click', openSettings);
  $('#btn-close-settings')?.addEventListener('click', closeSettings);
  $('#btn-save-settings')?.addEventListener('click', saveSettings);
  $('#btn-test-connection')?.addEventListener('click', testConnection);
  $('#btn-theme')?.addEventListener('click', toggleTheme);

  // Message ID input (for edit mode)
  $('#message-id')?.addEventListener('input', (e) => { state.editMessageId = e.target.value; });

  // Settings overlay close on background click
  settingsOverlay()?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-overlay') closeSettings();
  });
});