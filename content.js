let sidebar = null;

// --- Point d'entrée principal : l'écouteur de messages ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'updateVisibility':
            if (request.settings.sidebarVisible) {
                createSidebar(request.settings);
            } else {
                removeSidebar();
            }
            break;
        case 'updatePosition':
            if (sidebar) {
                updateSidebarPosition(request.position);
            }
            break;
        case 'refreshLists':
            if (sidebar) {
                loadBookmarks();
                loadTabs();
            }
            break;
    }
});

// Au chargement initial de la page, demander au background si le volet doit être affiché
chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
    if (chrome.runtime.lastError) {
        console.log("Impossible de communiquer avec le script de fond (peut-être une page interne). C'est normal.");
        return;
    }
    if (settings && settings.sidebarVisible) {
        createSidebar(settings);
    }
});


// --- Fonctions de gestion du DOM ---

function createSidebar(settings) {
    if (sidebar) return; // Le volet existe déjà, on ne fait rien.

    sidebar = document.createElement('div');
    sidebar.id = 'newarche-sidebar';
    sidebar.className = `newarche-sidebar newarche-${settings.sidebarPosition}`;
    sidebar.innerHTML = `
      <div class="newarche-header">
        <div class="newarche-controls">
          <button id="newarche-position-toggle" title="Changer de côté">⇄</button>
          <button id="newarche-close" title="Fermer">×</button>
        </div>
      </div>
      <div class="newarche-url-bar">
        <input type="text" id="newarche-url-input" placeholder="Entrez une URL ou une recherche...">
        <button id="newarche-go-btn">Go</button>
      </div>
      <div class="newarche-separator"></div>
      <div class="newarche-bookmarks-container" style="height: ${settings.bookmarkHeight}%">
        <div class="newarche-section-title">Favoris</div>
        <div class="newarche-bookmarks" id="newarche-bookmarks"><div class="newarche-loading">Chargement...</div></div>
      </div>
      <div class="newarche-resizer" id="newarche-resizer"></div>
      <div class="newarche-tabs-container">
        <div class="newarche-section-title">Onglets <button id="newarche-new-tab" title="Nouvel onglet">+</button></div>
        <div class="newarche-tabs" id="newarche-tabs"><div class="newarche-loading">Chargement...</div></div>
      </div>
    `;
    
    document.body.appendChild(sidebar);
    adjustBodyMargin(settings.sidebarPosition);
    
    initializeSidebarEvents();
    loadBookmarks();
    loadTabs();
}

function removeSidebar() {
    if (sidebar) {
        sidebar.remove();
        sidebar = null;
        adjustBodyMargin(null); // Rétablir les marges
    }
}

function updateSidebarPosition(position) {
    if (!sidebar) return;
    sidebar.className = `newarche-sidebar newarche-${position}`;
    adjustBodyMargin(position);
}

function adjustBodyMargin(position) {
    const sidebarWidth = '300px';
    document.body.style.transition = 'margin 0.3s ease';
    if (position === 'left') {
        document.body.style.marginLeft = sidebarWidth;
        document.body.style.marginRight = '0';
    } else if (position === 'right') {
        document.body.style.marginLeft = '0';
        document.body.style.marginRight = sidebarWidth;
    } else {
        document.body.style.marginLeft = '0';
        document.body.style.marginRight = '0';
    }
}

// --- Fonctions d'événements et de chargement des données ---

function initializeSidebarEvents() {
    document.getElementById('newarche-close').addEventListener('click', () => chrome.runtime.sendMessage({ action: 'toggleSidebar' }));
    
    document.getElementById('newarche-position-toggle').addEventListener('click', () => {
        const newPos = sidebar.classList.contains('newarche-left') ? 'right' : 'left';
        chrome.runtime.sendMessage({ action: 'setSidebarPosition', position: newPos });
    });
    
    const urlInput = document.getElementById('newarche-url-input');
    const goBtn = document.getElementById('newarche-go-btn');
    const navigate = () => {
        if (urlInput.value.trim()) {
            chrome.runtime.sendMessage({ action: 'navigateToUrl', url: urlInput.value });
        }
    };
    goBtn.addEventListener('click', navigate);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });
    
    document.getElementById('newarche-new-tab').addEventListener('click', () => chrome.runtime.sendMessage({ action: 'createTab' }));
    
    initializeResizer();
}

function initializeResizer() {
    const resizer = document.getElementById('newarche-resizer');
    const bookmarksContainer = document.querySelector('.newarche-bookmarks-container');
    let isResizing = false;

    const startResize = (e) => {
        isResizing = true;
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    };

    const resize = (e) => {
        if (!isResizing) return;
        const sidebarRect = sidebar.getBoundingClientRect();
        let newHeight = e.clientY - sidebarRect.top;
        let percentage = (newHeight / sidebarRect.height) * 100;
        percentage = Math.max(10, Math.min(90, percentage));
        bookmarksContainer.style.height = `${percentage}%`;
    };

    const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        const newHeightPercentage = parseFloat(bookmarksContainer.style.height);
        chrome.runtime.sendMessage({ action: 'setBookmarkHeight', height: newHeightPercentage });
    };
    
    resizer.addEventListener('mousedown', startResize);
}

function loadBookmarks() {
    chrome.runtime.sendMessage({ action: 'getBookmarks' }, (response) => {
        if (response && response.bookmarks) displayBookmarks(response.bookmarks);
    });
}

function displayBookmarks(bookmarks) {
    const container = document.getElementById('newarche-bookmarks');
    if (!container) return;
    container.innerHTML = '';
    bookmarks.forEach(bookmark => {
        const item = document.createElement('div');
        item.className = 'newarche-bookmark-item';
        item.innerHTML = `
            <div class="newarche-bookmark-content" title="${bookmark.title}\n${bookmark.url}">
                <img src="https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(bookmark.url)}" class="newarche-favicon">
                <span class="newarche-bookmark-title">${bookmark.title || bookmark.url}</span>
            </div>`;
        item.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'openBookmark', url: bookmark.url }));
        container.appendChild(item);
    });
}

function loadTabs() {
    chrome.runtime.sendMessage({ action: 'getTabs' }, (response) => {
        if (response && response.tabs) displayTabs(response.tabs);
    });
}

// ===================================================================
// ===                FONCTION CORRIGÉE CI-DESSOUS                 ===
// ===================================================================
function displayTabs(tabs) {
    const container = document.getElementById('newarche-tabs');
    if (!container) return;
    container.innerHTML = '';
    
    // On retire l'appel à `chrome.tabs.getCurrent` qui était la source du bug.
    // On boucle directement sur la liste des onglets reçue.
    tabs.forEach(tab => {
        // La propriété `tab.active` nous dit si l'onglet est celui qui est actuellement visible.
        const item = document.createElement('div');
        item.className = `newarche-tab-item ${tab.active ? 'active' : ''}`;
        
        item.innerHTML = `
            <div class="newarche-tab-content" title="${tab.title}\n${tab.url}">
                <img src="${tab.favIconUrl || 'icons/toto.svg'}" class="newarche-favicon">
                <span class="newarche-tab-title">${tab.title || 'Nouvel onglet'}</span>
            </div>
            <button class="newarche-close-tab" title="Fermer l'onglet">×</button>`;
        
        item.querySelector('.newarche-tab-content').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'switchToTab', tabId: tab.id });
        });
        
        item.querySelector('.newarche-close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id });
        });
        
        container.appendChild(item);
    });
}