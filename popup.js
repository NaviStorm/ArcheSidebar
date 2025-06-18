let currentSettings = {};

// On utilise browser.*, qui est le standard pour Firefox et retourne des Promises.
function loadSettings() {
    browser.runtime.sendMessage({ action: 'getSettings' })
        .then(response => {
            if (response) {
                currentSettings = response;
                initializeEvents();
                updateUI();
            }
        })
        .catch(error => {
            console.error("Erreur de communication avec le background script:", error);
            document.body.innerHTML = "Erreur de chargement. Essayez de recharger l'extension.";
        });
}

document.addEventListener('DOMContentLoaded', loadSettings);

function initializeEvents() {
    document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
    // Les boutons de position ont été retirés du HTML car ils sont obsolètes.
}

function updateUI() {
    const status = document.getElementById('status');
    const toggleBtn = document.getElementById('toggle-sidebar');

    if (currentSettings.sidebarVisible) {
        status.textContent = 'Volet ouvert';
        status.className = 'status active';
        toggleBtn.textContent = 'Fermer le volet';
    } else {
        status.textContent = 'Volet fermé';
        status.className = 'status inactive';
        toggleBtn.textContent = 'Ouvrir le volet';
    }
}

function toggleSidebar() {
    browser.runtime.sendMessage({ action: 'toggleSidebar' })
        .then(response => {
            if (response) {
                currentSettings.sidebarVisible = response.visible;
                updateUI();
            }
        });
}

function resetSettings() {
    browser.runtime.sendMessage({ action: 'resetSettings' })
        .then(response => {
            if (response) {
                currentSettings.sidebarVisible = response.sidebarVisible;
                updateUI();
            }
        });
}