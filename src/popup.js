// ── Popup Logic ────────────────────────────────────────
const STORAGE_KEY = 'foldertab_data';

let currentTab = null;
let allTabs = [];
let selectedFolderId = null;

// Carrega dados do storage
async function loadData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        resolve(result[STORAGE_KEY]);
      } else {
        resolve(null);
      }
    });
  });
}

// Salva dados no storage
function saveData(data) {
  chrome.storage.sync.set({ [STORAGE_KEY]: data });
}

// Gera ID único
function uid() {
  return 'i-' + Math.random().toString(36).slice(2, 9);
}

// Escapa HTML
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Cores para fallback do favicon
function siteColor(name) {
  const colors = ['#7c6aff', '#4ade80', '#f0a742', '#f87171', '#38bdf8', '#e879f9', '#fb923c'];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

// Pega favicon do Google
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) { return null; }
}

// Mostra loading
function showLoading(show) {
  document.getElementById('loading').classList.toggle('show', show);
}

// Navegação entre telas
function showView(viewId) {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('save-site-view').style.display = 'none';
  document.getElementById('save-window-view').style.display = 'none';
  document.getElementById('confirmation').style.display = 'none';
  document.getElementById('success').style.display = 'none';
  document.getElementById(viewId).style.display = (viewId === 'main-menu') ? 'flex' : 'block';
}

// Renderiza info do site atual (salvar site)
function renderCurrentSite(tab) {
  const title = tab.title || 'Site sem título';
  const url = tab.url || '';

  document.getElementById('site-url').textContent = url;

  const faviconUrl = getFaviconUrl(url);
  const fallback = document.getElementById('site-fallback');
  const favicon = document.getElementById('site-favicon');

  fallback.style.background = siteColor(title);
  fallback.textContent = title[0].toUpperCase();

  favicon.src = faviconUrl;
}

// Renderiza lista de pastas
function renderFolders(data) {
  const list = document.getElementById('folders-list');
  list.innerHTML = '';

  function createFolderItem(folderId, depth = 0) {
    const f = data.folders[folderId];
    if (!f) return;

    // Pula a pasta root (Acesso Rápido)
    if (folderId === 'root') {
      // Renderiza apenas as subpastas
      for (const cid of f.children) {
        createFolderItem(cid, depth);
      }
      return;
    }

    const item = document.createElement('div');
    item.className = 'folder-item';
    item.style.paddingLeft = `${10 + depth * 16}px`;

    item.innerHTML = `
      <div class="folder-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3 7C3 5.9 3.9 5 5 5H10L12 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" stroke="currentColor" stroke-width="1.5" fill="rgba(240,167,66,0.15)"/>
        </svg>
      </div>
      <span class="folder-name">${escHtml(f.name)}</span>
    `;

    item.addEventListener('click', () => {
      selectFolder(folderId, f.name);
    });

    list.appendChild(item);

    for (const cid of f.children) {
      createFolderItem(cid, depth + 1);
    }
  }

  createFolderItem('root');
}

// Seleciona pasta e mostra confirmação
function selectFolder(folderId, folderName) {
  selectedFolderId = folderId;

  document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('selected'));
  const folderItem = event?.target?.closest('.folder-item');
  if (folderItem) {
    folderItem.classList.add('selected');
  }

  showConfirmation(folderName);
}

// Mostra tela de confirmação
function showConfirmation(folderName) {
  document.getElementById('save-site-view').style.display = 'none';
  document.getElementById('confirmation').style.display = 'flex';

  document.getElementById('confirm-folder-name').textContent = folderName;
  document.getElementById('confirm-site-title').textContent = currentTab?.title || '';
}

// Esconde confirmação
function hideConfirmation() {
  document.getElementById('confirmation').style.display = 'none';
  document.getElementById('save-site-view').style.display = 'block';
  selectedFolderId = null;

  document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('selected'));
}

// Confirma e adiciona o site
async function confirmAdd() {
  if (!selectedFolderId || !currentTab) return;

  const data = await loadData();

  if (!data) {
    alert('Dados não encontrados. Abra a New Tab primeiro para inicializar.');
    return;
  }

  const folder = data.folders[selectedFolderId];
  if (!folder) {
    alert('Pasta não encontrada');
    return;
  }

  const exists = folder.sites.some(s => s.url === currentTab.url);
  if (exists) {
    alert('Este site já está nesta pasta!');
    hideConfirmation();
    return;
  }

  const site = {
    id: uid(),
    name: currentTab.title || currentTab.url,
    url: currentTab.url
  };

  folder.sites.push(site);
  saveData(data);

  showSuccess();
}

// Mostra tela de sucesso
function showSuccess() {
  document.getElementById('confirmation').style.display = 'none';
  document.getElementById('success').style.display = 'flex';

  setTimeout(() => {
    window.close();
  }, 1200);
}

// Renderiza lista de abas para "Salvar Janela"
function renderTabsList() {
  const list = document.getElementById('tabs-list');
  list.innerHTML = '';

  const validTabs = allTabs.filter(tab => {
    // Remove NewTab da lista
    if (tab.url.includes('newtab.html') || tab.url.includes('chrome://newtab')) {
      return false;
    }
    return true;
  });

  document.querySelector('.tabs-count').textContent = `${validTabs.length} aba${validTabs.length !== 1 ? 's' : ''} encontrada${validTabs.length !== 1 ? 's' : ''}`;

  validTabs.forEach((tab, index) => {
    const item = document.createElement('div');
    item.className = 'tab-item';

    const faviconUrl = getFaviconUrl(tab.url);
    const fallbackColor = siteColor(tab.title || tab.url);
    const firstLetter = (tab.title || tab.url)[0].toUpperCase();

    item.innerHTML = `
      <input type="checkbox" data-tab-index="${index}" checked />
      <img class="tab-favicon" src="${escHtml(faviconUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="tab-fallback" style="background:${fallbackColor};display:none">${firstLetter}</div>
      <input type="text" value="${escHtml(tab.title || tab.url)}" data-tab-name="${index}" />
    `;

    list.appendChild(item);
  });
}

// Criar nova pasta com abas selecionadas
async function createFolderFromTabs() {
  const folderName = document.getElementById('new-folder-name').value.trim();

  if (!folderName) {
    alert('Digite um nome para a pasta');
    return;
  }

  // Coleta abas selecionadas
  const selectedTabs = [];
  const checkboxes = document.querySelectorAll('#tabs-list input[type="checkbox"]');
  const nameInputs = document.querySelectorAll('#tabs-list input[type="text"]');

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const index = parseInt(checkbox.dataset.tabIndex);
      const nameInput = nameInputs[index];
      selectedTabs.push({
        url: allTabs[index].url,
        name: nameInput ? nameInput.value.trim() : allTabs[index].title
      });
    }
  });

  if (selectedTabs.length === 0) {
    alert('Selecione pelo menos uma aba');
    return;
  }

  const data = await loadData();

  if (!data) {
    alert('Dados não encontrados. Abra a New Tab primeiro para inicializar.');
    return;
  }

  // Cria nova pasta
  const newFolderId = uid();
  const newFolder = {
    id: newFolderId,
    name: folderName,
    parentId: 'root',
    children: [],
    sites: selectedTabs.map(tab => ({
      id: uid(),
      name: tab.name || tab.url,
      url: tab.url
    }))
  };

  data.folders[newFolderId] = newFolder;
  data.folders['root'].children.push(newFolderId);

  saveData(data);

  showSuccess();
}

// Inicializa
async function init() {
  showLoading(true);

  try {
    // Pega aba atual
    currentTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

    // Pega todas as abas da janela
    allTabs = await chrome.tabs.query({ currentWindow: true });

    if (!currentTab) {
      document.getElementById('loading').innerHTML = '<span>Erro ao carregar aba</span>';
      return;
    }

    // Renderiza info do site
    renderCurrentSite(currentTab);

    // Carrega dados
    const data = await loadData();

    if (!data) {
      showLoading(false);
      document.getElementById('main-menu').innerHTML = `
        <p style="color:var(--text3);font-size:12px;text-align:center;padding:20px">
          Abra a New Tab primeiro para inicializar os dados.
        </p>
      `;
      return;
    }

    // Renderiza pastas
    renderFolders(data);

    // Renderiza lista de abas
    renderTabsList();

  } catch (err) {
    console.error('Erro:', err);
    document.getElementById('loading').innerHTML = '<span>Erro ao carregar</span>';
  } finally {
    showLoading(false);
  }
}

// Event listeners - Menu principal
document.getElementById('btn-save-site').addEventListener('click', () => {
  showView('save-site-view');
});

document.getElementById('btn-save-window').addEventListener('click', () => {
  showView('save-window-view');
});

// Event listeners - Salvar Site
document.getElementById('btn-add-to-root').addEventListener('click', () => {
  selectedFolderId = 'root';
  showConfirmation('Acesso Rápido');
});

document.getElementById('btn-back-main').addEventListener('click', () => {
  showView('main-menu');
});

// Event listeners - Salvar Janela
document.getElementById('select-all-tabs').addEventListener('change', (e) => {
  const checkboxes = document.querySelectorAll('#tabs-list input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = e.target.checked);
});

document.getElementById('btn-back-main-window').addEventListener('click', () => {
  showView('main-menu');
});

document.getElementById('btn-create-folder').addEventListener('click', createFolderFromTabs);

// Event listeners - Confirmação
document.getElementById('btn-confirm-cancel').addEventListener('click', hideConfirmation);
document.getElementById('btn-confirm-add').addEventListener('click', confirmAdd);

// Inicia
init();
