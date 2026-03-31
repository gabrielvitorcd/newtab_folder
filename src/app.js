/* ═══════════════════════════════════════════════════
   FolderTab — app.js
   ═══════════════════════════════════════════════════ */

// ── Storage helpers ──────────────────────────────────
const STORAGE_KEY = 'foldertab_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return defaultData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  // Also try chrome.storage.sync if available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ foldertab: state.data });
  }
}

function defaultData() {
  return {
    folders: {
      root: {
        id: 'root',
        name: 'Root',
        children: ['f-work', 'f-learn'],
        sites: [],
        parentId: null
      },
      'f-work': {
        id: 'f-work',
        name: 'Trabalho',
        children: ['f-devtools'],
        sites: [
          { id: 's1', name: 'GitHub', url: 'https://github.com' },
          { id: 's2', name: 'Linear', url: 'https://linear.app' }
        ],
        parentId: 'root'
      },
      'f-devtools': {
        id: 'f-devtools',
        name: 'Dev Tools',
        children: [],
        sites: [
          { id: 's3', name: 'MDN Docs', url: 'https://developer.mozilla.org' },
          { id: 's4', name: 'Can I Use', url: 'https://caniuse.com' }
        ],
        parentId: 'f-work'
      },
      'f-learn': {
        id: 'f-learn',
        name: 'Aprendizado',
        children: [],
        sites: [
          { id: 's5', name: 'YouTube', url: 'https://youtube.com' },
          { id: 's6', name: 'Coursera', url: 'https://coursera.org' }
        ],
        parentId: 'root'
      }
    }
  };
}

// ── State ────────────────────────────────────────────
const state = {
  data: loadData(),
  currentFolderId: 'root',
  searchQuery: '',
  dragItem: null,        // { type, id, folderId }
  ctxTarget: null,       // { type, id, folderId }
  modalCallback: null,
};

// ── Utilities ────────────────────────────────────────
function uid() {
  return 'i-' + Math.random().toString(36).slice(2, 9);
}

function getFolderPath(folderId) {
  const path = [];
  let id = folderId;
  while (id) {
    const f = state.data.folders[id];
    if (!f) break;
    path.unshift(f);
    id = f.parentId;
  }
  return path;
}

function getAllSites() {
  const results = [];
  function walk(folderId, pathNames) {
    const f = state.data.folders[folderId];
    if (!f) return;
    for (const s of f.sites) {
      results.push({ ...s, folderId, pathNames });
    }
    for (const cid of f.children) {
      const cf = state.data.folders[cid];
      if (cf) walk(cid, [...pathNames, cf.name]);
    }
  }
  walk('root', [state.data.folders['root'].name]);
  return results;
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) { return null; }
}

function siteColor(name) {
  const colors = ['#7c6aff', '#4ade80', '#f0a742', '#f87171', '#38bdf8', '#e879f9', '#fb923c'];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Clock ────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  document.getElementById('date').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Render Sidebar Tree ───────────────────────────────
function renderSidebar() {
  const tree = document.getElementById('sidebar-tree');
  tree.innerHTML = '';
  tree.appendChild(buildTreeNode('root', 0));
}

function buildTreeNode(folderId, depth) {
  const f = state.data.folders[folderId];
  if (!f) return document.createDocumentFragment();

  const wrapper = document.createElement('div');
  wrapper.className = 'tree-node';
  wrapper.dataset.folderId = folderId;

  const row = document.createElement('div');
  row.className = 'tree-row' + (state.currentFolderId === folderId ? ' active' : '');
  row.style.paddingLeft = `${10 + depth * 14}px`;

  const hasChildren = f.children.length > 0;
  const storedOpen = sessionStorage.getItem('open_' + folderId) !== 'false';

  const toggle = document.createElement('div');
  toggle.className = 'tree-toggle' + (hasChildren && storedOpen ? ' open' : '');
  toggle.innerHTML = hasChildren
    ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : '';

  const icon = document.createElement('div');
  icon.className = 'tree-icon';
  icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 7C3 5.9 3.9 5 5 5H10L12 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" stroke="currentColor" stroke-width="1.5" fill="rgba(240,167,66,0.15)"/></svg>`;

  const label = document.createElement('div');
  label.className = 'tree-label';
  label.textContent = folderId === 'root' ? '⌂ Home' : f.name;

  row.appendChild(toggle);
  row.appendChild(icon);
  row.appendChild(label);

  // Click row → navigate
  row.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateTo(folderId);
  });

  // Click toggle → expand/collapse
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = childrenEl.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    sessionStorage.setItem('open_' + folderId, isOpen);
  });

  // Right-click
  row.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showCtxMenu(e, { type: 'folder', id: folderId });
  });

  // Drag-over for drop target
  row.addEventListener('dragover', (e) => {
    if (state.dragItem) { e.preventDefault(); row.style.background = 'rgba(124,106,255,0.15)'; }
  });
  row.addEventListener('dragleave', () => { row.style.background = ''; });
  row.addEventListener('drop', (e) => {
    e.preventDefault();
    row.style.background = '';
    handleDrop(folderId);
  });

  wrapper.appendChild(row);

  const childrenEl = document.createElement('div');
  childrenEl.className = 'tree-children' + (storedOpen ? ' open' : '');
  for (const cid of f.children) {
    childrenEl.appendChild(buildTreeNode(cid, depth + 1));
  }
  wrapper.appendChild(childrenEl);

  return wrapper;
}

// ── Breadcrumb ───────────────────────────────────────
function renderBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = '';
  const path = getFolderPath(state.currentFolderId);
  path.forEach((f, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = '/';
      bc.appendChild(sep);
    }
    const item = document.createElement('span');
    item.className = 'bc-item' + (i === path.length - 1 ? ' current' : '');
    item.textContent = f.id === 'root' ? '⌂' : f.name;
    if (i < path.length - 1) {
      item.addEventListener('click', () => navigateTo(f.id));
    }
    bc.appendChild(item);
  });
}

// ── Render Grid ──────────────────────────────────────
function renderGrid() {
  const f = state.data.folders[state.currentFolderId];
  if (!f) return;

  const grid = document.getElementById('items-grid');
  grid.innerHTML = ''; // Limpa o container principal

  // Função auxiliar para criar uma seção (encapsulamento)
  const createSection = (titleText, items, renderFn) => {
    const section = document.createElement('section');
    section.className = 'grid-group';

    const header = document.createElement('h3');
    header.className = 'grid-section-title';
    header.textContent = titleText;

    const container = document.createElement('div');
    container.className = 'sub-grid-container';

    items.forEach(item => {
      container.appendChild(renderFn(item));
    });

    section.appendChild(header);
    section.appendChild(container);
    return section;
  };

  // Renderiza Seção de Sites
  if (f.sites.length > 0) {
    grid.appendChild(createSection('ACESSO RÁPIDO', f.sites, (site) => createSiteCard(site, f.id)));
  }

  // Renderiza Seção de Pastas
  if (f.children.length > 0) {
    const folderObjects = f.children.map(cid => state.data.folders[cid]).filter(Boolean);
    grid.appendChild(createSection('PASTAS', folderObjects, (folder) => createFolderCard(folder)));
  }
}

function createFolderCard(folder) {
  const el = document.createElement('div');
  el.className = 'grid-item';

  el.dataset.folderId = folder.id;
  el.draggable = true;

  const totalSites = countSites(folder.id);

  el.innerHTML = `
    <div class="item-icon folder-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 7C3 5.9 3.9 5 5 5H10L12 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" stroke="currentColor" stroke-width="1.5" fill="rgba(240,167,66,0.2)"/>
      </svg>
      <span class="folder-count">${totalSites}</span>
    </div>
    <div class="item-label">${escHtml(folder.name)}</div>
  `;

  el.addEventListener('dblclick', () => navigateTo(folder.id));
  el.addEventListener('click', (e) => { e.stopPropagation(); selectItem(el); });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showCtxMenu(e, { type: 'folder', id: folder.id, folderId: folder.parentId });
  });

  // Drag & Drop
  el.addEventListener('dragstart', (e) => {
    state.dragItem = { type: 'folder', id: folder.id, folderId: folder.parentId };
    el.classList.add('dragging');
    showDragGhost(folder.name);
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); hideDragGhost(); state.dragItem = null; });
  el.addEventListener('dragover', (e) => { if (state.dragItem && state.dragItem.id !== folder.id) { e.preventDefault(); el.classList.add('drag-over'); } });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    handleDrop(folder.id);
  });

  return el;
}

function countSites(folderId) {
  const f = state.data.folders[folderId];
  if (!f) return 0;
  let count = f.sites.length;
  for (const cid of f.children) count += countSites(cid);
  return count;
}

function createSiteCard(site, folderId) {
  const el = document.createElement('div');
  el.className = 'grid-item';
  el.dataset.siteId = site.id;
  el.dataset.folderId = folderId;
  el.draggable = true;

  const faviconUrl = getFaviconUrl(site.url);
  const letter = (site.name || site.url)[0].toUpperCase();
  const color = siteColor(site.name);

  el.innerHTML = `
    <div class="item-icon site-icon">
      <img src="${escHtml(faviconUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="fallback-icon" style="background:${color};display:none">${escHtml(letter)}</div>
    </div>
    <div class="item-label">${escHtml(site.name)}</div>
  `;

  el.addEventListener('click', (e) => { e.stopPropagation(); selectItem(el); });
  el.addEventListener('dblclick', () => window.open(site.url, '_blank'));
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showCtxMenu(e, { type: 'site', id: site.id, folderId });
  });

  // Drag
  el.addEventListener('dragstart', (e) => {
    state.dragItem = { type: 'site', id: site.id, folderId };
    el.classList.add('dragging');
    showDragGhost(site.name);
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); hideDragGhost(); state.dragItem = null; });

  return el;
}

function selectItem(el) {
  document.querySelectorAll('.grid-item.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

// ── Navigate ─────────────────────────────────────────
function navigateTo(folderId) {
  state.currentFolderId = folderId;
  state.searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-view').style.display = 'none';
  document.getElementById('folder-view').style.display = 'flex';
  renderBreadcrumb();
  renderGrid();
  renderSidebar();
}

// ── Open All Tabs ─────────────────────────────────────
function openAllTabs(folderId) {
  const f = state.data.folders[folderId];
  if (!f) return;
  let urls = [];
  function collect(fid) {
    const ff = state.data.folders[fid];
    if (!ff) return;
    urls = urls.concat(ff.sites.map(s => s.url));
    ff.children.forEach(collect);
  }
  collect(folderId);
  if (urls.length === 0) { alert('Nenhum site nesta pasta.'); return; }
  if (urls.length > 15) {
    if (!confirm(`Abrir ${urls.length} abas de uma vez?`)) return;
  }
  urls.forEach(url => window.open(url, '_blank'));
}


// ── Open All Tabs ─────────────────────────────────────
function openAllTabsNewWindow(folderId) {
  const f = state.data.folders[folderId];
  if (!f) return;

  let urls = [];
  function collect(fid) {
    const ff = state.data.folders[fid];
    if (!ff) return;
    urls = urls.concat(ff.sites.map(s => s.url));
    ff.children.forEach(collect);
  }

  collect(folderId);

  if (urls.length === 0) { alert('Nenhum site nesta pasta.'); return; }

  if (urls.length > 15) {
    if (!confirm(`Abrir ${urls.length} abas de uma vez?`)) return;
  }

  chrome.windows.create({ url: urls[0], focused: true }, (newWindow) => {

    for (let i = 1; i < urls.length; i++) {
      chrome.tabs.create({
        windowId: newWindow.id,
        url: urls[i],
        active: true // Abre em segundo plano
      });
    }
  });


}

// ── Context Menu ─────────────────────────────────────
function showCtxMenu(e, target) {
  state.ctxTarget = target;
  const menu = document.getElementById('ctx-menu');
  const list = document.getElementById('ctx-list');
  list.innerHTML = '';

  if (target.type === 'folder') {
    const isRoot = target.id === 'root';

    addCtxItem('🗂️ Abrir pasta', () => navigateTo(target.id));
    addCtxItem('🚀 Abrir todas as abas', () => openAllTabs(target.id));
    addCtxItem('🚀 Abrir todas as abas em nova janela', () => openAllTabsNewWindow(target.id));
    addCtxSep();
    addCtxItem('✏️ Renomear', () => promptRename(target.id));
    addCtxItem('📁 Nova subpasta', () => promptNewFolder(target.id));
    addCtxItem('🌐 Novo site aqui', () => promptNewSite(target.id));
    if (!isRoot) {
      addCtxSep();
      addCtxItem('🗑️ Deletar pasta', () => deleteFolder(target.id), true);
    }
  } else if (target.type === 'site') {
    const site = state.data.folders[target.folderId]?.sites.find(s => s.id === target.id);
    if (!site) return;

    addCtxItem('🔗 Abrir site', () => window.open(site.url, '_blank'));
    addCtxItem('✏️ Editar', () => promptEditSite(target.folderId, target.id));
    addCtxSep();
    addCtxItem('🗑️ Remover site', () => deleteSite(target.folderId, target.id), true);
  }

  menu.style.display = 'block';
  const x = Math.min(e.clientX, window.innerWidth - 180);
  const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 10);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function addCtxItem(label, cb, danger = false) {
  const li = document.createElement('li');
  li.innerHTML = label;
  if (danger) li.classList.add('danger');
  li.addEventListener('click', () => { hideCtxMenu(); cb(); });
  document.getElementById('ctx-list').appendChild(li);
}

function addCtxSep() {
  const li = document.createElement('li');
  li.className = 'ctx-sep';
  document.getElementById('ctx-list').appendChild(li);
}

function hideCtxMenu() {
  document.getElementById('ctx-menu').style.display = 'none';
  state.ctxTarget = null;
}

document.addEventListener('click', hideCtxMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideCtxMenu(); closeModal(); } });

// ── Modal ─────────────────────────────────────────────
function openModal(title, bodyHtml, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').style.display = 'flex';
  state.modalCallback = onConfirm;
  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#modal-body input');
    if (first) first.focus();
  }, 50);
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  state.modalCallback = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.getElementById('modal-confirm').addEventListener('click', () => {
  if (state.modalCallback) state.modalCallback();
});

// Enter key in modal inputs
document.getElementById('modal-body').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.modalCallback) state.modalCallback();
});

// ── CRUD Operations ───────────────────────────────────
function promptNewFolder(parentId) {
  openModal('Nova Pasta', `
    <div class="field-group">
      <label>Nome da pasta</label>
      <input id="f-name" class="field-input" placeholder="ex: Pesquisa" maxlength="40"/>
    </div>
  `, () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) return;
    const id = uid();

    state.data.folders[id] = {
      id,
      name,
      children: [],
      sites: [],
      parentId
    };

    state.data.folders[parentId].children.push(id);

    saveData();

    closeModal();

    renderSidebar();

    renderGrid();
  });
}

function promptRename(folderId) {
  const f = state.data.folders[folderId];
  if (!f || folderId === 'root') return;
  openModal('Renomear Pasta', `
    <div class="field-group">
      <label>Novo nome</label>
      <input id="f-rename" class="field-input" value="${escHtml(f.name)}" maxlength="40"/>
    </div>
  `, () => {
    const name = document.getElementById('f-rename').value.trim();
    if (!name) return;
    f.name = name;
    saveData();
    closeModal();
    renderSidebar();
    renderBreadcrumb();
    renderGrid();
  });
}

function deleteFolder(folderId) {
  const f = state.data.folders[folderId];
  if (!f || folderId === 'root') return;

  const parentId = f.parentId;
  const parent = state.data.folders[parentId];
  if (parent) parent.children = parent.children.filter(id => id !== folderId);

  // Recursively delete
  function deleteRec(id) {
    const ff = state.data.folders[id];
    if (!ff) return;
    ff.children.forEach(deleteRec);
    delete state.data.folders[id];
  }
  deleteRec(folderId);

  saveData();
  if (state.currentFolderId === folderId || !state.data.folders[state.currentFolderId]) {
    navigateTo(parentId || 'root');
  } else {
    renderSidebar();
    renderGrid();
  }
}

function promptNewSite(folderId) {
  openModal('Novo Site', `
    <div class="field-group">
      <label>Nome</label>
      <input id="s-name" class="field-input" placeholder="ex: GitHub" maxlength="60"/>
    </div>
    <div class="field-group">
      <label>URL</label>
      <input id="s-url" class="field-input" placeholder="https://..." type="url"/>
    </div>
  `, () => {
    let name = document.getElementById('s-name').value.trim();
    let url = document.getElementById('s-url').value.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    if (!name) name = url;
    const site = { id: uid(), name, url };
    state.data.folders[folderId].sites.push(site);
    saveData();
    closeModal();
    renderGrid();
  });
}

function promptEditSite(folderId, siteId) {
  const f = state.data.folders[folderId];
  const site = f?.sites.find(s => s.id === siteId);
  if (!site) return;
  openModal('Editar Site', `
    <div class="field-group">
      <label>Nome</label>
      <input id="s-name" class="field-input" value="${escHtml(site.name)}" maxlength="60"/>
    </div>
    <div class="field-group">
      <label>URL</label>
      <input id="s-url" class="field-input" value="${escHtml(site.url)}" type="url"/>
    </div>
  `, () => {
    let name = document.getElementById('s-name').value.trim();
    let url = document.getElementById('s-url').value.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    site.name = name || url;
    site.url = url;
    saveData();
    closeModal();
    renderGrid();
  });
}

function deleteSite(folderId, siteId) {
  const f = state.data.folders[folderId];
  if (!f) return;
  f.sites = f.sites.filter(s => s.id !== siteId);
  saveData();
  renderGrid();
}

// ── Toolbar buttons ───────────────────────────────────
document.getElementById('btn-add-site').addEventListener('click', () => promptNewSite(state.currentFolderId));
document.getElementById('btn-add-subfolder').addEventListener('click', () => promptNewFolder(state.currentFolderId));
document.getElementById('btn-new-root-folder').addEventListener('click', () => promptNewFolder('root'));
document.getElementById('btn-open-all').addEventListener('click', () => openAllTabs(state.currentFolderId));

// ── Drag & Drop ───────────────────────────────────────
function showDragGhost(name) {
  const g = document.getElementById('drag-ghost');
  g.textContent = '✦ ' + name;
  g.style.display = 'block';
}
function hideDragGhost() {
  document.getElementById('drag-ghost').style.display = 'none';
}
document.addEventListener('dragover', (e) => {
  const g = document.getElementById('drag-ghost');
  g.style.left = (e.clientX + 14) + 'px';
  g.style.top = (e.clientY + 10) + 'px';
});

function handleDrop(targetFolderId) {
  const d = state.dragItem;
  if (!d) return;

  if (d.type === 'site') {
    if (d.folderId === targetFolderId) return;
    const srcFolder = state.data.folders[d.folderId];
    const tgtFolder = state.data.folders[targetFolderId];
    if (!srcFolder || !tgtFolder) return;
    const idx = srcFolder.sites.findIndex(s => s.id === d.id);
    if (idx === -1) return;
    const [site] = srcFolder.sites.splice(idx, 1);
    tgtFolder.sites.push(site);
    saveData();
    renderGrid();
    renderSidebar();
  }

  if (d.type === 'folder') {
    if (d.id === targetFolderId || d.id === 'root') return;
    // Prevent dropping into own descendant
    if (isDescendant(d.id, targetFolderId)) return;

    const srcParent = state.data.folders[d.folderId];
    const tgtFolder = state.data.folders[targetFolderId];
    const movingFolder = state.data.folders[d.id];
    if (!srcParent || !tgtFolder || !movingFolder) return;

    srcParent.children = srcParent.children.filter(c => c !== d.id);
    tgtFolder.children.push(d.id);
    movingFolder.parentId = targetFolderId;
    saveData();
    renderSidebar();
    renderGrid();
  }
}

function isDescendant(ancestorId, targetId) {
  const f = state.data.folders[targetId];
  if (!f || !f.parentId) return false;
  if (f.parentId === ancestorId) return true;
  return isDescendant(ancestorId, f.parentId);
}

// ── Search ────────────────────────────────────────────
const searchInput = document.getElementById('search-input');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  state.searchQuery = q;
  if (!q) {
    document.getElementById('search-view').style.display = 'none';
    document.getElementById('folder-view').style.display = 'flex';
    return;
  }
  document.getElementById('folder-view').style.display = 'none';
  document.getElementById('search-view').style.display = 'flex';
  renderSearchResults(q);
});

// ⌘K shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

function highlight(text, q) {
  if (!q) return escHtml(text);
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return escHtml(text);
  return escHtml(text.slice(0, idx)) + `<span class="hl">${escHtml(text.slice(idx, idx + q.length))}</span>` + escHtml(text.slice(idx + q.length));
}

function renderSearchResults(q) {
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  const allSites = getAllSites();
  const matches = allSites.filter(s =>
    s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    container.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:12px 0">Nenhum resultado encontrado.</p>';
    return;
  }

  for (const s of matches) {
    const el = document.createElement('div');
    el.className = 'search-result';
    const faviconUrl = getFaviconUrl(s.url);
    const letter = (s.name || s.url)[0].toUpperCase();
    const color = siteColor(s.name);
    const pathStr = s.pathNames.join(' / ');

    el.innerHTML = `
      <div class="item-icon site-icon" style="width:36px;height:36px;flex-shrink:0">
        <img src="${escHtml(faviconUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="fallback-icon" style="background:${color};display:none;width:24px;height:24px;font-size:12px">${escHtml(letter)}</div>
      </div>
      <div class="search-result-info">
        <div class="search-result-name">${highlight(s.name, q)}</div>
        <div class="search-result-path">${escHtml(pathStr)}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:var(--text3)">
        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    el.addEventListener('click', () => window.open(s.url, '_blank'));
    container.appendChild(el);
  }
}

// ── Click outside deselects ───────────────────────────
document.getElementById('items-grid').addEventListener('click', (e) => {
  if (e.target === document.getElementById('items-grid')) {
    document.querySelectorAll('.grid-item.selected').forEach(el => el.classList.remove('selected'));
  }
});

// ── Init ──────────────────────────────────────────────
// Try to restore from chrome.storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get('foldertab', (result) => {
    if (result.foldertab) {
      state.data = result.foldertab;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    }
    boot();
  });
} else {
  boot();
}

function boot() {
  navigateTo('root');
}
