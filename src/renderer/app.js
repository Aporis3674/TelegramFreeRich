/**
 * TelegramFreeRich — Main Renderer Script
 * Block-based WYSIWYG editor for Telegram Bot API 10.1
 */

// ===================== STATE =====================
const state = {
  blocks: [],          // Block[]
  selectedBlockId: null,
  sendMode: 'rich',    // rich | draft | edit
  editMessageId: null,
  theme: 'dark',
  settings: {
    token: '',
    chatId: '',
    lang: 'en',
  },
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
      return { ...base, items: data.items || [{ text: '' }] };
    case 'numbered-list':
      return { ...base, items: data.items || [{ text: '' }] };
    case 'table':
      return { ...base, cells: data.cells || [{ cells: ['H1', 'H2'], header: true }, { cells: ['1', '2'], header: false }] };
    case 'blockquote':
      return { ...base, text: data.text || '' };
    case 'pull-quote':
      return { ...base, text: data.text || '', cite: data.cite || '' };
    case 'details':
      return { ...base, summary: data.summary || 'Details', body: data.body || '', open: false };
    case 'divider':
      return { ...base };
    case 'image':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    case 'video':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    case 'audio':
      return { ...base, url: data.url || '', caption: data.caption || '' };
    case 'slideshow':
      return { ...base, images: data.images || [], caption: data.caption || '' };
    case 'footer':
      return { ...base, text: data.text || '' };
    case 'checklist':
      return { ...base, items: data.items || [{ text: '', checked: false }] };
    default:
      return { ...base };
  }
}

// ===================== HELPERS =====================
/** Strip HTML tags to get plain text */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

/** Update block text/html from a contenteditable element's innerHTML */
function syncEditableBlock(block, el) {
  const html = el.innerHTML;
  block.html = html;
  block.text = stripHtml(html);
}

// ===================== DOM EDITOR =====================
const editorContainer = () => document.getElementById('blocks-container');

function renderBlocks() {
  const container = editorContainer();
  if (!container) return;

  container.innerHTML = '';
  state.blocks.forEach((block, index) => {
    container.appendChild(renderBlock(block, index));
  });

  // Add "add block" button at bottom
  const addBtn = document.createElement('button');
  addBtn.id = 'add-block-btn';
  addBtn.textContent = '+ Add Block';
  addBtn.addEventListener('click', () => {
    state.blocks.push(createBlock('paragraph'));
    renderBlocks();
    updatePreview();
  });
  container.appendChild(addBtn);

  updatePreview();
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

  // Block content
  const contentArea = document.createElement('div');
  contentArea.className = 'block-content';

  switch (block.type) {
    case 'paragraph':
      contentArea.contentEditable = 'true';
      contentArea.innerHTML = block.html || block.text || '';
      contentArea.dataset.placeholder = 'Type something...';
      contentArea.addEventListener('input', () => {
        syncEditableBlock(block, contentArea);
        updatePreview();
      });
      contentArea.addEventListener('focus', () => selectBlock(block.id));
      break;

    case 'heading':
      contentArea.contentEditable = 'true';
      contentArea.innerHTML = block.html || block.text || '';
      contentArea.dataset.placeholder = `Heading ${block.size}`;
      contentArea.addEventListener('input', () => {
        syncEditableBlock(block, contentArea);
        updatePreview();
      });
      contentArea.addEventListener('focus', () => selectBlock(block.id));
      break;

    case 'code-block': {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.width = '100%';

      const langInput = document.createElement('input');
      langInput.type = 'text';
      langInput.placeholder = 'language (js, python, ...)';
      langInput.value = block.language;
      langInput.style.cssText = 'padding:4px 8px;border:none;border-bottom:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:11px;outline:none;width:100%;';
      langInput.addEventListener('input', () => {
        block.language = langInput.value;
        updatePreview();
      });

      const codeArea = document.createElement('div');
      codeArea.contentEditable = 'true';
      codeArea.textContent = block.text;
      codeArea.style.cssText = 'padding:8px 0;outline:none;font-family:monospace;min-height:40px;white-space:pre-wrap;tab-size:4;';
      codeArea.addEventListener('input', () => {
        block.text = codeArea.textContent;
        updatePreview();
      });

      wrapper.appendChild(langInput);
      wrapper.appendChild(codeArea);
      contentArea.appendChild(wrapper);
      contentArea.style.padding = '0';
      break;
    }

    case 'bullet-list':
    case 'numbered-list': {
      const listDiv = document.createElement('div');
      listDiv.className = 'list-items';
      const marker = block.type === 'bullet-list' ? '•' : '1.';
      let counter = 1;
      block.items.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'list-item';
        const m = document.createElement('span');
        m.className = 'list-marker';
        m.textContent = block.type === 'numbered-list' ? `${counter++}.` : marker;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = item.text;
        inp.placeholder = 'List item';
        inp.addEventListener('input', () => {
          block.items[i].text = inp.value;
          updatePreview();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            block.items.splice(i + 1, 0, { text: '' });
            renderBlocks();
          }
          if (e.key === 'Backspace' && inp.value === '' && block.items.length > 1) {
            e.preventDefault();
            block.items.splice(i, 1);
            renderBlocks();
          }
        });
        row.appendChild(m);
        row.appendChild(inp);
        listDiv.appendChild(row);
      });
      contentArea.appendChild(listDiv);
      contentArea.style.padding = '8px 12px';
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
          cell.addEventListener('input', () => {
            block.cells[ri].cells[ci] = cell.textContent;
            updatePreview();
          });
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
        const cols = block.cells[0]?.cells.length || 2;
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

    case 'blockquote':
      contentArea.contentEditable = 'true';
      contentArea.innerHTML = block.html || block.text || '';
      contentArea.dataset.placeholder = 'Blockquote text...';
      contentArea.addEventListener('input', () => {
        syncEditableBlock(block, contentArea);
        updatePreview();
      });
      contentArea.addEventListener('focus', () => selectBlock(block.id));
      break;

    case 'pull-quote': {
      contentArea.innerHTML = '';
      const pqText = document.createElement('div');
      pqText.contentEditable = 'true';
      pqText.innerHTML = block.html || block.text || '';
      pqText.dataset.placeholder = 'Pull quote text...';
      pqText.addEventListener('input', () => { syncEditableBlock(block, pqText); updatePreview(); });
      const pqCite = document.createElement('div');
      pqCite.contentEditable = 'true';
      pqCite.textContent = block.cite;
      pqCite.dataset.placeholder = '— Author';
      pqCite.style.cssText = 'font-size:12px;color:var(--text-dim);margin-top:4px;';
      pqCite.addEventListener('input', () => { block.cite = pqCite.textContent; updatePreview(); });
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
      sumInput.addEventListener('input', () => {
        block.summary = sumInput.value;
        updatePreview();
      });
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
      body.addEventListener('input', () => { block.html = body.innerHTML; block.body = stripHtml(body.innerHTML); updatePreview(); });
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
      urlInp.addEventListener('input', () => { block.url = urlInp.value; updatePreview(); });
      const capInp = document.createElement('input');
      capInp.type = 'text';
      capInp.value = block.caption;
      capInp.placeholder = 'Caption (optional)';
      capInp.style.cssText = 'flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
      capInp.addEventListener('input', () => { block.caption = capInp.value; updatePreview(); });
      row.appendChild(urlInp);
      row.appendChild(capInp);
      contentArea.appendChild(row);
      contentArea.style.padding = '8px';
      break;
    }

    case 'slideshow': {
      const slideDiv = document.createElement('div');
      slideDiv.style.cssText = 'width:100%;';
      block.images.forEach((img, i) => {
        const imgRow = document.createElement('div');
        imgRow.style.cssText = 'display:flex;gap:4px;margin-bottom:4px;';
        const imgInp = document.createElement('input');
        imgInp.type = 'text';
        imgInp.value = img.url || '';
        imgInp.placeholder = `Image ${i + 1} URL`;
        imgInp.style.cssText = 'flex:1;padding:4px 8px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);font-size:12px;outline:none;';
        imgInp.addEventListener('input', () => { block.images[i].url = imgInp.value; updatePreview(); });
        const rmBtn = document.createElement('button');
        rmBtn.textContent = '×';
        rmBtn.style.cssText = 'border:none;background:none;color:var(--danger);cursor:pointer;font-size:14px;';
        rmBtn.addEventListener('click', () => { block.images.splice(i, 1); renderBlocks(); });
        imgRow.appendChild(imgInp);
        imgRow.appendChild(rmBtn);
        slideDiv.appendChild(imgRow);
      });
      const addImg = document.createElement('button');
      addImg.textContent = '+ Add Image';
      addImg.style.cssText = 'font-size:11px;padding:4px 8px;border:1px dashed var(--border);border-radius:4px;background:transparent;color:var(--text-dim);cursor:pointer;width:100%;margin-top:4px;';
      addImg.addEventListener('click', () => { block.images.push({ url: '' }); renderBlocks(); });
      slideDiv.appendChild(addImg);
      contentArea.appendChild(slideDiv);
      contentArea.style.padding = '8px';
      break;
    }

    case 'footer':
      contentArea.contentEditable = 'true';
      contentArea.textContent = block.text;
      contentArea.dataset.placeholder = 'Footer text...';
      contentArea.addEventListener('input', () => {
        block.text = contentArea.textContent;
        updatePreview();
      });
      break;

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
        cb.addEventListener('change', () => { block.items[i].checked = cb.checked; updatePreview(); });
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = item.text;
        inp.placeholder = 'Todo item';
        inp.style.cssText = 'flex:1;border:none;background:transparent;color:var(--text);font-size:14px;outline:none;padding:4px 0;';
        inp.addEventListener('input', () => { block.items[i].text = inp.value; updatePreview(); });
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
      contentArea.style.padding = '8px 12px';
      break;
    }
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
    renderBlocks();
  });
  actions.appendChild(delBtn);
  card.appendChild(actions);

  return card;
}

function selectBlock(id) {
  state.selectedBlockId = id;
  document.querySelectorAll('.block-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });
}

// ===================== TOOLBAR =====================
function initToolbar() {
  document.querySelectorAll('.tbtn').forEach(btn => {
    // Prevent focus loss from contenteditable when clicking toolbar
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => handleToolbarCommand(btn));
  });
}

function handleToolbarCommand(btn) {
  const cmd = btn.dataset.cmd;

  switch (cmd) {
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strikethrough':
    case 'code':
      applyInlineToSelected(cmd);
      break;
    case 'spoiler':
      applyInlineToSelected('spoiler');
      break;
    case 'heading':
      addBlock('heading', { size: parseInt(btn.dataset.level || '2') });
      break;
    case 'bullet-list':
      addBlock('bullet-list');
      break;
    case 'numbered-list':
      addBlock('numbered-list');
      break;
    case 'checklist':
      addBlock('checklist');
      break;
    case 'code-block':
      addBlock('code-block');
      break;
    case 'table':
      addBlock('table');
      break;
    case 'details':
      addBlock('details');
      break;
    case 'divider':
      addBlock('divider');
      break;
    case 'footnote':
      addBlock('footer');
      break;
    case 'image':
      addBlock('image');
      break;
    case 'video':
      addBlock('video');
      break;
    case 'audio':
      addBlock('audio');
      break;
    case 'slideshow':
      addBlock('slideshow', { images: [{ url: '' }, { url: '' }] });
      break;
  }
}

function addBlock(type, data = {}) {
  const idx = state.selectedBlockId
    ? state.blocks.findIndex(b => b.id === state.selectedBlockId) + 1
    : state.blocks.length;
  state.blocks.splice(idx, 0, createBlock(type, data));
  renderBlocks();
  // Focus the new block
  setTimeout(() => {
    const cards = document.querySelectorAll('.block-card');
    if (cards[idx]) {
      const content = cards[idx].querySelector('[contenteditable], input');
      if (content) content.focus();
    }
  }, 0);
}

function applyInlineToSelected(type) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;

  // Save reference to block BEFORE DOM mutation
  // Walk up from startContainer (text node) to find the .block-card element
  let startEl = range.startContainer;
  if (startEl && startEl.nodeType === 3) startEl = startEl.parentElement;
  const card = startEl?.closest?.('.block-card');
  const blkIdx = card ? state.blocks.findIndex(b => b.id === card.dataset.id) : -1;
  const contentEl = card ? card.querySelector('.block-content') : null;

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
    default: return;
  }
  wrapper.textContent = selectedText;
  range.deleteContents();
  range.insertNode(wrapper);

  // Update block state after DOM mutation
  if (blkIdx !== -1 && contentEl && contentEl.contentEditable === 'true') {
    state.blocks[blkIdx].html = contentEl.innerHTML;
    state.blocks[blkIdx].text = stripHtml(contentEl.innerHTML);
  }
  updatePreview();
}

// ===================== PREVIEW =====================
function updatePreview() {
  const previewEl = document.getElementById('preview-content');
  if (!previewEl) return;

  previewEl.innerHTML = '';
  let charCount = 0;

  state.blocks.forEach(block => {
    const wrapper = document.createElement('div');
    wrapper.className = 'block-hover';

    switch (block.type) {
      case 'paragraph':
        // Render HTML to preserve inline formatting
        wrapper.innerHTML = block.html || block.text || '';
        break;
      case 'heading': {
        const h = document.createElement(`h${Math.min(block.size || 2, 6)}`);
        h.innerHTML = block.html || block.text || '';
        wrapper.appendChild(h);
        break;
      }
      case 'code-block': {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = block.text;
        if (block.language) code.className = `language-${block.language}`;
        pre.appendChild(code);
        wrapper.appendChild(pre);
        break;
      }
      case 'bullet-list': {
        const ul = document.createElement('ul');
        block.items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.text;
          ul.appendChild(li);
        });
        wrapper.appendChild(ul);
        break;
      }
      case 'numbered-list': {
        const ol = document.createElement('ol');
        block.items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.text;
          ol.appendChild(li);
        });
        wrapper.appendChild(ol);
        break;
      }
      case 'checklist': {
        block.items.forEach(item => {
          const row = document.createElement('div');
          row.className = 'checklist-item';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = item.checked;
          cb.disabled = true;
          const span = document.createElement('span');
          span.textContent = item.text;
          row.appendChild(cb);
          row.appendChild(span);
          wrapper.appendChild(row);
        });
        break;
      }
      case 'table': {
        const table = document.createElement('table');
        block.cells.forEach((row) => {
          const tr = document.createElement('tr');
          row.cells.forEach(cellText => {
            const cell = document.createElement(row.header ? 'th' : 'td');
            cell.textContent = cellText;
            tr.appendChild(cell);
          });
          table.appendChild(tr);
        });
        wrapper.appendChild(table);
        break;
      }
      case 'blockquote': {
        const bq = document.createElement('blockquote');
        bq.innerHTML = block.html || block.text || '';
        wrapper.appendChild(bq);
        break;
      }
      case 'pull-quote': {
        const aside = document.createElement('aside');
        aside.innerHTML = block.html || block.text || '';
        if (block.cite) {
          const cite = document.createElement('cite');
          cite.textContent = `\n— ${block.cite}`;
          aside.appendChild(cite);
        }
        wrapper.appendChild(aside);
        break;
      }
      case 'details': {
        const det = document.createElement('details');
        det.open = block.open;
        const sum = document.createElement('summary');
        sum.textContent = block.summary;
        const inner = document.createElement('div');
        inner.className = 'details-inner';
        inner.innerHTML = block.html || block.body || '';
        det.appendChild(sum);
        det.appendChild(inner);
        wrapper.appendChild(det);
        break;
      }
      case 'divider': {
        const hr = document.createElement('hr');
        wrapper.appendChild(hr);
        break;
      }
      case 'image': {
        if (block.url) {
          const img = document.createElement('img');
          img.src = block.url;
          img.style.cssText = 'max-width:100%;border-radius:8px;';
          wrapper.appendChild(img);
        }
        if (block.caption) {
          const cap = document.createElement('div');
          cap.style.cssText = 'font-size:12px;color:var(--text-muted);margin-top:4px;';
          cap.textContent = block.caption;
          wrapper.appendChild(cap);
        }
        break;
      }
      case 'video': {
        if (block.url) {
          const vid = document.createElement('video');
          vid.src = block.url;
          vid.controls = true;
          vid.style.cssText = 'max-width:100%;border-radius:8px;';
          wrapper.appendChild(vid);
        }
        break;
      }
      case 'audio': {
        if (block.url) {
          const aud = document.createElement('audio');
          aud.src = block.url;
          aud.controls = true;
          aud.style.cssText = 'width:100%;';
          wrapper.appendChild(aud);
        }
        break;
      }
      case 'slideshow': {
        if (block.images.length) {
          const slideshow = document.createElement('div');
          slideshow.style.cssText = 'display:flex;gap:4px;overflow-x:auto;';
          block.images.forEach(img => {
            if (img.url) {
              const sImg = document.createElement('img');
              sImg.src = img.url;
              sImg.style.cssText = 'height:150px;border-radius:8px;flex-shrink:0;';
              slideshow.appendChild(sImg);
            }
          });
          wrapper.appendChild(slideshow);
        }
        break;
      }
      case 'footer': {
        const footer = document.createElement('div');
        footer.style.cssText = 'font-size:12px;color:var(--text-dim);margin-top:8px;';
        footer.textContent = block.text;
        wrapper.appendChild(footer);
        break;
      }
    }

    previewEl.appendChild(wrapper);
    charCount += JSON.stringify(block).length;
  });

  document.getElementById('char-count').textContent =
    `${charCount.toLocaleString()} / 32,768`;
}

// ===================== CONVERT TO MARKDOWN =====================
/** Convert HTML to Telegram markdown */
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
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');
  // Decode entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&nbsp;/g, ' ');
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
        block.items.forEach(item => {
          lines.push(`- ${item.text || ''}`);
        });
        lines.push('');
        break;
      case 'numbered-list':
        block.items.forEach((item, i) => {
          lines.push(`${i + 1}. ${item.text || ''}`);
        });
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
        (htmlToMarkdown(block.html) || block.text || '').split('\n').forEach(line => {
          lines.push(`> ${line}`);
        });
        lines.push('');
        break;
      case 'pull-quote':
        lines.push(`<aside>${htmlToMarkdown(block.html) || block.text || ''}</aside>`);
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
          const caption = block.caption || '';
          lines.push(`![${caption}](${block.url})`);
          lines.push('');
        }
        break;
      case 'video':
        if (block.url) {
          const caption = block.caption || '';
          lines.push(`![${caption}](${block.url})`);
          lines.push('');
        }
        break;
      case 'audio':
        if (block.url) {
          const caption = block.caption || '';
          lines.push(`![${caption}](${block.url})`);
          lines.push('');
        }
        break;
      case 'slideshow':
        if (block.images && block.images.length) {
          block.images.forEach(img => {
            if (img.url) lines.push(`![](${img.url})`);
          });
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

  const body = {
    chat_id: chatId,
    rich_message: { markdown: markdown },
  };

  try {
    const res = await window.app.api('sendRichMessage', body);
    if (res.ok) {
      toast('Message sent!', 'success');
    } else {
      toast(`Error: ${res.description || 'Unknown error'}`, 'error');
    }
  } catch (e) {
    toast(`API error: ${e.message}`, 'error');
  }
}

async function sendDraft(blocks) {
  const chatId = state.settings.chatId;
  if (!state.settings.tokenSet || !chatId) { toast('Settings incomplete', 'error'); return; }

  const markdown = blocksToMarkdown(blocks);
  if (!markdown.trim()) { toast('Nothing to send', 'error'); return; }

  const body = {
    chat_id: chatId,
    rich_message: { markdown: markdown },
  };

  try {
    const res = await window.app.api('sendRichMessageDraft', body);
    if (res.ok) toast('Draft sent (30s)', 'info');
    else toast(`Draft error: ${res.description}`, 'error');
  } catch (e) {
    toast(`API error: ${e.message}`, 'error');
  }
}

async function editMessage(blocks) {
  const chatId = state.settings.chatId;
  const msgId = state.editMessageId;
  if (!state.settings.tokenSet || !chatId || !msgId) { toast('Settings or message ID incomplete', 'error'); return; }

  const markdown = blocksToMarkdown(blocks);
  if (!markdown.trim()) { toast('Nothing to send', 'error'); return; }

  const body = {
    chat_id: chatId,
    message_id: parseInt(msgId),
    rich_message: { markdown: markdown },
  };

  try {
    const res = await window.app.api('editMessageText', body);
    if (res.ok) toast('Message edited!', 'success');
    else toast(`Edit error: ${res.description}`, 'error');
  } catch (e) {
    toast(`API error: ${e.message}`, 'error');
  }
}

async function testConnection() {
  if (!state.settings.tokenSet) { toast('Enter a bot token first', 'error'); return; }

  const statusEl = document.getElementById('connection-status');
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

// ===================== SEND HANDLER =====================
function handleSend() {
  switch (state.sendMode) {
    case 'rich':
      sendRichMessage(state.blocks);
      break;
    case 'draft':
      sendDraft(state.blocks);
      break;
    case 'edit':
      editMessage(state.blocks);
      break;
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
  const token = document.getElementById('input-token').value;
  const chatId = document.getElementById('input-chat').value;
  const lang = document.getElementById('input-lang').value;
  state.settings.chatId = chatId;
  state.settings.lang = lang;
  state.settings.tokenSet = !!token;
  try {
    await window.app.saveSettings({ token, chatId, lang });
    toast('Settings saved (encrypted)', 'success');
  } catch (e) {
    toast('Failed to save settings: ' + e.message, 'error');
  }
  updatePreview();
}

function openSettings() {
  document.getElementById('input-chat').value = state.settings.chatId;
  document.getElementById('input-lang').value = state.settings.lang;
  document.getElementById('input-token').placeholder = state.settings.tokenSet ? '•••••••• (saved encrypted)' : 'Enter bot token';
  document.getElementById('settings-overlay').classList.remove('hidden');
}

// ===================== THEME =====================
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light', state.theme === 'light');
  localStorage.setItem('tfr_theme', state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  if (state.theme === 'dark') {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
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
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===================== KEYBOARD SHORTCUTS =====================
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'b') { e.preventDefault(); applyInlineToSelected('bold'); }
  if (e.ctrlKey && e.key === 'i') { e.preventDefault(); applyInlineToSelected('italic'); }
  if (e.ctrlKey && e.key === 'u') { e.preventDefault(); applyInlineToSelected('underline'); }
  if (e.ctrlKey && e.key === 'e') { e.preventDefault(); applyInlineToSelected('code'); }
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadTheme();
  initToolbar();

  // Add initial blocks
  if (state.blocks.length === 0) {
    state.blocks.push(createBlock('paragraph', { text: '' }));
  }
  renderBlocks();

  // Send mode
  document.querySelectorAll('input[name="send-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      state.sendMode = r.value;
      document.getElementById('message-id').style.display =
        r.value === 'edit' ? 'block' : 'none';
    });
  });

  // Buttons
  document.getElementById('btn-send').addEventListener('click', handleSend);
  document.getElementById('btn-clear').addEventListener('click', () => {
    state.blocks = [createBlock('paragraph')];
    renderBlocks();
    toast('Cleared', 'info');
  });
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    document.getElementById('settings-overlay').classList.add('hidden');
  });
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-test-connection').addEventListener('click', testConnection);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  // Message ID input
  document.getElementById('message-id').addEventListener('input', (e) => {
    state.editMessageId = e.target.value;
  });

  // Settings overlay close on background click
  document.getElementById('settings-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'settings-overlay') {
      document.getElementById('settings-overlay').classList.add('hidden');
    }
  });
});
