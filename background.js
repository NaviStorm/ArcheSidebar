// --- ÉTAT GLOBAL DE L'EXTENSION ---
let favoriteTabs = {};
let tabHistory = [];

// --- GESTION DE L'HISTORIQUE ---
browser.tabs.onActivated.addListener(activeInfo => {
    tabHistory = tabHistory.filter(id => id !== activeInfo.tabId);
    tabHistory.unshift(activeInfo.tabId);
    if (tabHistory.length > 10) tabHistory.pop();
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    tabHistory = tabHistory.filter(id => id !== tabId);
    delete favoriteTabs[tabId];
    if (!removeInfo.isWindowClosing && tabHistory.length > 0) {
        browser.tabs.update(tabHistory[0], { active: true });
    }
});

// --- GESTION DES MESSAGES (CORRIGÉE) ---
// On déclare l'écouteur comme 'async' pour utiliser 'return' pour les réponses.
browser.runtime.onMessage.addListener(async (request, sender) => {
    switch (request.action) {
        case 'getAppState':
            // On retourne directement la valeur. Le navigateur s'occupe de la promesse.
            return { favoriteTabs };
        
        case 'openFavoriteInTab':
            // On attend que l'onglet soit créé avant de l'ajouter à notre état.
            const newTab = await browser.tabs.create({ url: request.url, active: true });
            favoriteTabs[newTab.id] = request.url;
            // Pas besoin de retourner quoi que ce soit si le volet n'attend pas de réponse.
            return;
    }
});

// --- ACTION DU BOUTON DE L'EXTENSION (INCHANGÉ) ---
browser.browserAction.onClicked.addListener(async () => {
  try {
    const isOpen = await browser.sidebarAction.isOpen({});
    if (isOpen) {
      browser.sidebarAction.close();
    } else {
      browser.sidebarAction.open();
    }
  } catch (e) {
    console.error(`Erreur lors de la gestion du volet: ${e}`);
  }
});