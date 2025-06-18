NewArche - Extension Firefox
Une extension Firefox qui ajoute un volet latéral personnalisable avec barre d'URL, favoris et gestion des onglets.

Fonctionnalités
Volet latéral configurable (gauche/droite)
Barre d'URL intégrée pour navigation rapide
Gestion des favoris avec ouverture dans de nouveaux onglets
Liste des onglets avec fermeture et navigation
Redimensionnement de la zone favoris avec la souris
Onglets favoris : mise en surbrillance dans la section favoris
Historique des onglets : retour automatique au dernier onglet actif
Installation
Méthode 1 : Installation manuelle (développement)
Télécharger les fichiers :
Créez un dossier NewArche sur votre ordinateur
Sauvegardez tous les fichiers fournis dans ce dossier :
manifest.json
background.js
content.js
sidebar.css
popup.html
popup.js
Installer dans Firefox :
Ouvrez Firefox
Tapez about:debugging dans la barre d'adresse
Cliquez sur "Ce Firefox" dans le menu de gauche
Cliquez sur "Charger un module temporaire"
Sélectionnez le fichier manifest.json dans votre dossier NewArche
Utilisation :
L'icône NewArche apparaît dans la barre d'outils
Cliquez dessus pour ouvrir/fermer le volet latéral
Utilisez le popup pour configurer la position et les paramètres
Méthode 2 : Installation permanente
Pour une installation permanente, l'extension doit être signée par Mozilla :

Empaqueter l'extension :
Compressez tous les fichiers dans un fichier ZIP
Assurez-vous que manifest.json est à la racine du ZIP
Soumettre à Mozilla :
Créez un compte développeur sur addons.mozilla.org
Soumettez votre extension pour révision
Une fois approuvée, elle sera disponible sur le store Firefox
Utilisation
Ouverture/Fermeture
Cliquez sur l'icône NewArche dans la barre d'outils
Ou utilisez le bouton "×" dans le volet pour le fermer
Navigation
Barre d'URL : Tapez une URL et appuyez sur Entrée ou cliquez sur "Go"
Favoris : Cliquez sur un favori pour ouvrir un nouvel onglet
Onglets : Cliquez sur un onglet pour le rendre actif
Configuration
Position : Utilisez le bouton "⇄" pour basculer entre gauche/droite
Taille des favoris : Glissez le séparateur entre favoris et onglets
Popup : Cliquez sur l'icône pour accéder aux paramètres avancés
Fonctionnalités spéciales
Onglets favoris
Quand vous cliquez sur un favori, un nouvel onglet s'ouvre
Cet onglet n'apparaît pas dans la section "Onglets"
Il reste en surbrillance dans la section "Favoris"
Un bouton "-" permet de fermer cet onglet
Gestion des onglets
L'onglet actif est toujours en surbrillance
Fermer un onglet active automatiquement l'avant-dernier onglet utilisé
Le bouton "+" permet de créer un nouvel onglet
Structure des fichiers
NewArche/
├── manifest.json          # Configuration de l'extension
├── background.js          # Script d'arrière-plan
├── content.js            # Script de contenu injecté
├── sidebar.css           # Styles du volet latéral
├── popup.html            # Interface de configuration
├── popup.js              # Script du popup
└── README.md             # Documentation
Développement
Modification du code
Modifiez les fichiers selon vos besoins
Rechargez l'extension dans about:debugging
Actualisez la page pour voir les changements
Débogage
Utilisez la console développeur de Firefox (F12)
Les erreurs de l'extension apparaissent dans la console
Utilisez about:debugging pour voir les logs du background script
Permissions utilisées
L'extension demande les permissions suivantes :

tabs : Gestion des onglets
bookmarks : Accès aux favoris
storage : Sauvegarde des paramètres
activeTab : Interaction avec l'onglet actif
<all_urls> : Injection du volet sur tous les sites
Compatibilité
Firefox : Version 60 et supérieure (Manifest V2)
Système : Windows, macOS, Linux
Résolution : Optimisé pour écrans de 1024px et plus
Résolution de problèmes
Le volet ne s'affiche pas
Vérifiez que l'extension est bien chargée dans about:debugging
Actualisez la page web
Vérifiez la console pour les erreurs
Les favoris ne se chargent pas
Assurez-vous que Firefox a accès aux favoris
Vérifiez les permissions de l'extension
Problèmes de style
Videz le cache du navigateur
Rechargez l'extension
Vérifiez que le fichier sidebar.css est bien chargé
Contribuer
Forkez le projet
Créez une branche pour votre fonctionnalité
Committez vos changements
Créez une Pull Request
Licence
Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

Changelog
Version 1.0.0
Première version
Volet latéral configurable
Gestion des favoris et onglets
Redimensionnement de la zone favoris
Système d'onglets favoris
