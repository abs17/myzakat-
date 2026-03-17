# 🚐 LivrAIson — Gestionnaire de Tournées de Livraison

Application web mobile-first pour gérer des tournées de livraison, optimisée pour une utilisation terrain.

**Point de départ par défaut :** Mosquée Assalam, 138 Avenue de la Liberté, 94700 Maisons-Alfort

---

## 📁 Structure du Projet

```
delivery-app/
├── index.html              # Point d'entrée principal (SPA)
├── manifest.json           # PWA manifest (installable)
│
├── css/
│   └── styles.css          # Tous les styles (design system complet)
│
├── js/
│   ├── app.js              # État global, logique métier, utilitaires
│   ├── dashboard.js        # Page d'accueil / tableau de bord
│   ├── deliveries.js       # Liste des livraisons (CRUD complet)
│   ├── roadmap.js          # Itinéraire / feuille de route
│   └── settings.js         # Paramètres de l'application
│
└── data/
    └── deliveries.json     # Données de démonstration (8 livraisons)
```

---

## 🚀 Lancer en Local

### Option 1 — Python (recommandé, zéro installation)

```bash
cd delivery-app
python3 -m http.server 8080
```
→ Ouvrir : http://localhost:8080

### Option 2 — Node.js / npx

```bash
cd delivery-app
npx serve .
```
→ Ouvrir : http://localhost:3000

### Option 3 — Live Server (VS Code)

1. Installer l'extension **Live Server** dans VS Code
2. Clic droit sur `index.html` → **Open with Live Server**

### ⚠️ Important

**Ne pas ouvrir `index.html` directement** via `file://` dans le navigateur : le chargement du fichier JSON `data/deliveries.json` nécessite un serveur HTTP (même local).

---

## 📱 Fonctionnalités

### Pages
| Page | Description |
|------|-------------|
| 🏠 Tableau de bord | Statistiques, prochains arrêts, actions rapides |
| 📦 Livraisons | Liste complète avec recherche, filtres et CRUD |
| 🗺️ Itinéraire | Feuille de route avec timeline, GPS intégré |
| ⚙️ Réglages | Configuration dépôt, chauffeur, données |

### Règles UX respectées
- ✅ **Actions primaires toujours en bas à droite** (FAB expandable)
- ✅ **Aucune suppression sans confirmation** (modal de confirmation systématique)
- ✅ **Haptic feedback** sur confirmation de livraison (vibration subtile)

### Gestion des livraisons
- Ajouter, modifier, supprimer une livraison
- Changer le statut : `En attente → En route → Livré / Échoué`
- Appel téléphonique direct
- Navigation GPS Google Maps (un arrêt ou tournée complète)

### Données
- Stockage local via `localStorage` (fonctionne offline après premier chargement)
- Export JSON complet
- Import JSON (remplace ou complète les données)
- Réinitialisation aux données de démonstration

---

## 🗺️ Configuration du Point de Départ

Le dépôt par défaut est :
- **Mosquée Assalam**
- 138 Avenue de la Liberté, 94700 Maisons-Alfort

Pour le modifier :
1. Aller dans **⚙️ Réglages**
2. Cliquer sur **📍 Point de départ**
3. Modifier le nom, l'adresse, le code postal, la ville
4. Sauvegarder

Le changement se reflète immédiatement sur la page **Itinéraire** et dans les liens Google Maps.

---

## 📋 Format du fichier JSON

Pour importer vos propres livraisons, respectez ce format :

```json
{
  "meta": {
    "depot": {
      "name": "Mon Dépôt",
      "address": "138 Avenue de la Liberté",
      "city": "Maisons-Alfort",
      "postcode": "94700"
    },
    "driver": {
      "name": "Omar B.",
      "plate": "DF-741-GK"
    }
  },
  "deliveries": [
    {
      "id": "LIV-001",
      "recipient": "Prénom NOM",
      "phone": "+33 6 12 34 56 78",
      "address": "12 Rue des Écoles",
      "city": "Maisons-Alfort",
      "postcode": "94700",
      "status": "pending",
      "priority": "normal",
      "items": "Description du colis",
      "notes": "Instructions de livraison",
      "scheduled": "2025-03-17T09:00:00",
      "delivered_at": null,
      "stop_order": 1
    }
  ]
}
```

### Valeurs valides
| Champ | Valeurs |
|-------|---------|
| `status` | `pending`, `in_transit`, `delivered`, `failed` |
| `priority` | `normal`, `urgent`, `low` |
| `stop_order` | Entier positif (ordre de passage) |

---

## 🎨 Design System

- **Police d'affichage :** Syne (titres, chiffres)
- **Police mono :** IBM Plex Mono (IDs, horaires, codes)
- **Police corps :** IBM Plex Sans
- **Couleur principale :** `#f5a623` (ambre/orange)
- **Thème :** Dark industrial / console de dispatching

---

## 🔧 Personnalisation

### Changer les couleurs
Modifier les variables CSS dans `css/styles.css` :
```css
:root {
  --accent: #f5a623;      /* Couleur principale */
  --green:  #22d07a;      /* Livré */
  --red:    #ff4d6d;      /* Échoué / Urgent */
  --blue:   #4da6ff;      /* En route */
}
```

### Ajouter une page
1. Ajouter `<div id="page-monepage" class="page">` dans `index.html`
2. Créer `js/monepage.js` avec un objet `const MaPage = { render() { ... } }`
3. Inclure le script dans `index.html`
4. Ajouter un `case 'monepage': MaPage.render(); break;` dans `App.render()` (`js/app.js`)
5. Ajouter un bouton `.nav-item` dans la nav avec `data-nav="monepage"`

---

## 📲 Installation PWA

Sur mobile (iOS/Android) :
1. Ouvrir dans Safari / Chrome
2. **Partager → Ajouter à l'écran d'accueil** (iOS)
3. **Menu → Installer l'application** (Android/Chrome)

L'app se lance alors en plein écran comme une app native.

---

## 🧑‍💻 Technologies

- HTML5 / CSS3 / JavaScript ES6+ (Vanilla, zéro framework)
- localStorage pour la persistance
- Google Maps Directions API (liens natifs, sans clé API)
- Vibration API (haptic feedback)
- PWA (manifest + meta tags)
