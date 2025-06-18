// /Users/tandreu/StudioProjects/NewArche/sidebar.js

// --- Références aux éléments du DOM ---
const sidebarElement = document.getElementById('newarche-sidebar');
const navBackBtn = document.getElementById('nav-back');
const navForwardBtn = document.getElementById('nav-forward');
const navReloadBtn = document.getElementById('nav-reload');
const urlInput = document.getElementById('newarche-url-input');
const bookmarksList = document.getElementById('newarche-bookmarks');
const tabsList = document.getElementById('newarche-tabs');
const resizer = document.getElementById('newarche-resizer');
const bookmarksContainer = document.querySelector('.newarche-bookmarks-container');
const bookmarksHeader = document.getElementById('bookmarks-header');
const tabsHeader = document.getElementById('tabs-header'); // Nouvelle référence


// --- GESTION DU THÈME (CORRIGÉE AVEC L'APPROCHE HYBRIDE) ---

// Fonction utilitaire pour calculer la luminance d'une couleur.
function getLuminance(cssColor) {
    const tempDiv = document.createElement('div');
    tempDiv.style.color = cssColor;
    document.body.appendChild(tempDiv);
    const style = window.getComputedStyle(tempDiv);
    const rgbString = style.getPropertyValue('color');
    document.body.removeChild(tempDiv);
    const rgb = rgbString.match(/\d+/g);
    if (!rgb) return 255;
    return 0.2126 * parseInt(rgb[0]) + 0.7152 * parseInt(rgb[1]) + 0.0722 * parseInt(rgb[2]);
}

// La fonction principale de mise à jour du thème, maintenant asynchrone.
async function updateTheme() {
    try {
        const theme = await browser.theme.getCurrent();
        console.log("Mise à jour du thème, infos reçues de l'API :", theme);

        // Méthode 1: Thème personnalisé explicite
        if (theme && theme.colors && theme.colors.toolbar && theme.colors.toolbar_text) {
            const backgroundLuminance = getLuminance(theme.colors.toolbar);
            const textLuminance = getLuminance(theme.colors.toolbar_text);
            console.log(`Détection via API : Fond Lum=${backgroundLuminance.toFixed(2)}, Texte Lum=${textLuminance.toFixed(2)}`);
            if (textLuminance > backgroundLuminance) {
                document.body.classList.add('theme-dark');
            } else {
                document.body.classList.remove('theme-dark');
            }
            return; // On a trouvé, on s'arrête là.
        }

        // Méthode 2: Fallback pour le thème par défaut / système
        console.log("Détection via Fallback (matchMedia)");
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }
    } catch (e) {
        console.error("Erreur lors de la mise à jour du thème:", e);
    }
}


// --- Initialisation ---
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    // On lance la mise à jour du thème sans attendre pour ne pas bloquer le reste.
    updateTheme();
    
    const data = await browser.storage.local.get(['bookmarkHeight', 'bookmarksCollapsed']);
    
    // Appliquer la hauteur sauvegardée
    bookmarksContainer.style.height = `${data.bookmarkHeight || 50}%`;
    
    // Appliquer l'état plié/déplié sauvegardé
    if (data.bookmarksCollapsed) {
        bookmarksContainer.classList.add('collapsed');
    }
    
    attachEventListeners();
    await refreshAllLists();
}


// --- Écouteurs d'événements ---
function attachEventListeners() {
    // On écoute les deux types de changements de thème.
    browser.theme.onUpdated.addListener(updateTheme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

    // Ajout de l'écouteur pour plier/déplier les favoris
    bookmarksHeader.addEventListener('click', toggleBookmarks);

    navBackBtn.addEventListener('click', async () => {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.goBack(activeTab.id);
    });
    navForwardBtn.addEventListener('click', async () => {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.goForward(activeTab.id);
    });
    navReloadBtn.addEventListener('click', async () => {
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        browser.tabs.reload(activeTab.id);
    });

    const navigate = async () => {
        const urlValue = urlInput.value.trim();
        if (urlValue) {
            let url;
            try {
                new URL(urlValue.startsWith('http') ? urlValue : `https://${urlValue}`);
                url = urlValue.startsWith('http') ? urlValue : `https://${urlValue}`;
            } catch (_) {
                url = `https://www.google.com/search?q=${encodeURIComponent(urlValue)}`;
            }
            const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
            browser.tabs.update(activeTab.id, { url });
        }
    };
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(); });

    // Remplacement de l'ancien bouton par le nouvel en-tête cliquable
    tabsHeader.addEventListener('click', () => browser.tabs.create({}));

    const debouncedRefresh = debounce(refreshAllLists, 150);
    browser.tabs.onUpdated.addListener(debouncedRefresh);
    browser.tabs.onRemoved.addListener(debouncedRefresh);
    browser.tabs.onCreated.addListener(debouncedRefresh);
    browser.tabs.onActivated.addListener(debouncedRefresh);
    browser.bookmarks.onChanged.addListener(debouncedRefresh);
    browser.bookmarks.onCreated.addListener(debouncedRefresh);
    browser.bookmarks.onRemoved.addListener(debouncedRefresh);
    
    initializeResizer();
}

// --- Nouvelle fonction pour gérer le pliage des favoris ---
async function toggleBookmarks() {
    const isCollapsed = bookmarksContainer.classList.toggle('collapsed');
    await browser.storage.local.set({ bookmarksCollapsed: isCollapsed });
}


// --- Fonctions de rafraîchissement et d'affichage ---
async function refreshAllLists() {
    try {
        const [appState, allTabs] = await Promise.all([
            browser.runtime.sendMessage({ action: 'getAppState' }),
            browser.tabs.query({ currentWindow: true })
        ]);

        const activeTab = allTabs.find(t => t.active);
        if (activeTab && document.activeElement !== urlInput) {
             urlInput.value = activeTab.url;
        }

        await Promise.all([
            displayBookmarks(appState, allTabs), 
            displayTabs(appState, allTabs)
        ]);
    } catch (e) {
        if (e.message.includes("Receiving end does not exist") || e.message.includes("Could not establish connection")) {
            console.warn("Le background script n'est pas encore prêt. On réessaie dans 200ms.");
            setTimeout(refreshAllLists, 200);
        } else {
            console.error("Erreur lors du rafraîchissement des listes:", e);
        }
    }
}

async function displayBookmarks(appState, allTabs) {
    const tree = await browser.bookmarks.getTree();
    bookmarksList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const openFavoritesByUrl = {};
    for (const [tabId, url] of Object.entries(appState.favoriteTabs)) {
        openFavoritesByUrl[url] = parseInt(tabId, 10);
    }

    function processNode(node) {
        if (isValidHttpUrl(node.url)) {
            const item = document.createElement('div');
            const openTabId = openFavoritesByUrl[node.url];
            const isActive = allTabs.some(t => t.id === openTabId && t.active);
            item.className = `newarche-bookmark-item ${openTabId ? 'active-bookmark' : ''} ${isActive ? 'active' : ''}`;

            const content = document.createElement('div');
            content.className = 'newarche-bookmark-content';
            content.title = `${node.title}\n${node.url}`;
            const img = document.createElement('img');
            img.className = 'newarche-favicon';
            img.src = `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(node.url)}`;
            img.addEventListener('error', e => { e.target.src = 'icons/toto.svg'; });
            const title = document.createElement('span');
            title.className = 'newarche-bookmark-title';
            title.textContent = node.title || node.url;
            content.appendChild(img);
            content.appendChild(title);

            // Le bouton de fermeture est maintenant ajouté à l'intérieur de l'élément de contenu
            // pour un meilleur alignement et une meilleure expérience utilisateur.
            if (openTabId) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'newarche-close-tab';
                closeBtn.title = 'Fermer l\'onglet';
                closeBtn.innerHTML = '×';
                closeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    browser.tabs.remove(openTabId);
                });
                content.appendChild(closeBtn);
            }
            item.appendChild(content);

            item.addEventListener('click', () => {
                if (openTabId) {
                    browser.tabs.update(openTabId, { active: true });
                } else {
                    browser.runtime.sendMessage({ action: 'openFavoriteInTab', url: node.url });
                }
            });
            fragment.appendChild(item);
        }
        if (node.children) node.children.forEach(processNode);
    }
    tree.forEach(processNode);
    bookmarksList.appendChild(fragment);
}

async function displayTabs(appState, allTabs) {
    tabsList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const favoriteTabIds = Object.keys(appState.favoriteTabs).map(id => parseInt(id, 10));
    const regularTabs = allTabs.filter(tab => !favoriteTabIds.includes(tab.id));

    regularTabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = `newarche-tab-item ${tab.active ? 'active' : ''}`;
        
        const content = document.createElement('div');
        content.className = 'newarche-tab-content';
        content.title = `${tab.title}\n${tab.url}`;
        
        const img = document.createElement('img');
        img.className = 'newarche-favicon';
        img.src = (tab.favIconUrl && isValidHttpUrl(tab.favIconUrl)) ? tab.favIconUrl : 'icons/toto.svg';
        img.addEventListener('error', e => { e.target.src = 'icons/toto.svg'; });
        
        const title = document.createElement('span');
        title.className = 'newarche-tab-title';
        title.textContent = tab.title || 'Nouvel onglet';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'newarche-close-tab';
        closeBtn.title = 'Fermer l\'onglet';
        closeBtn.innerHTML = '×';
        
        content.appendChild(img);
        content.appendChild(title);
        content.appendChild(closeBtn); // Le bouton est maintenant à l'intérieur du contenu
        item.appendChild(content);
        
        content.addEventListener('click', () => {
            browser.windows.update(tab.windowId, { focused: true });
            browser.tabs.update(tab.id, { active: true });
        });
        
        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            browser.tabs.remove(tab.id);
        });
        
        fragment.appendChild(item);
    });
    tabsList.appendChild(fragment);
}


// --- Fonctions utilitaires ---
function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:"
    } catch (_) {
        return false;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeResizer() {
    let isResizing = false;
    const startResize = e => {
        isResizing = true;
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        e.preventDefault();
    };
    const resize = e => {
        if (!isResizing) return;
        let newHeight = e.clientY - bookmarksContainer.getBoundingClientRect().top;
        let percentage = (newHeight / sidebarElement.clientHeight) * 100;
        percentage = Math.max(10, Math.min(90, percentage));
        bookmarksContainer.style.height = `${percentage}%`;
    };
    const stopResize = async () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = 'auto';
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
        const newHeightPercentage = parseFloat(bookmarksContainer.style.height);
        await browser.storage.local.set({ bookmarkHeight: newHeightPercentage });
    };
    resizer.addEventListener('mousedown', startResize);
}