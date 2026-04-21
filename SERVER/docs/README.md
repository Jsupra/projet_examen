# Projet Examen - Gestionnaire de Projets

Cette application est une API de gestion de projets collaborative complète avec notifications en temps réel, historique d'activité et sécurité avancée.

## 🚀 Technologies Utilisées

### Backend
- **Node.js** & **Express** : Framework principal pour l'API.
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité.
- **PostgreSQL** : Base de données relationnelle.
- **JSON Web Tokens (JWT)** : Authentification et sécurisation des routes.
- **Bcrypt** : Hachage sécurisé des mots de passe.
- **Zod** : Validation de schémas et de données.
- **Dotenv**: Gestion des variables d'environnement.
- **Socket.io**: Notifications en temps réel.

### Frontend
- (Placé dans le dossier `/CLIENT`) - À venir.

---

## 📁 Structure du Projet

```text
projet-examen/
├── CLIENT/              # Code source du front-end
├── SERVER/              # Code source du back-end
│   ├── src/
│   │   ├── config/      # Configuration (DB, Socket, Initialisation)
│   │   ├── controllers/ # Logique métier (Auth, Projets, Notifications)
│   │   ├── database/    # Schémas SQL et migrations
│   │   ├── middlewares/ # Authentification et rôles
│   │   ├── models/      # Requêtes SQL et Types TS
│   │   └── routes/      # Définition des points d'entrée (REST)
│   ├── server.ts        # Point d'entrée de l'application
│   └── tsconfig.json    # Configuration TypeScript
└── README.md            # Documentation du projet
```

---

## 📡 API Endpoints

Toutes les routes (sauf auth) nécessitent un Header `Authorization: Bearer <token>`.

### Authentification (`/api/auth`)
- `POST /register` : Créer un compte.
- `POST /login` : Se connecter et recevoir un token (AccessToken + RefreshToken en cookie).
- `POST /refresh` : Renouveler l'AccessToken expiré.
- `POST /logout` : Déconnexion sécurisée.

### Utilisateurs & Profil (`/api/users`)
- `GET /profile` : Récupérer son propre profil.
- `GET /all_users` : (Admin uniquement) Récupérer tous les utilisateurs.
- `GET /search?q=...` : Rechercher des utilisateurs (pour les invitations).

### Notifications (`/api/notifications`)
- `GET /` : Récupérer ses notifications (Historique des alertes).
- `PATCH /:id/read` : Marquer une notification comme lue.

### Projets (`/api/projects`)
- `GET /` : Lister ses projets créés et rejoints (Pagination, Recherche, Tri).
- `POST /` : Créer un nouveau projet.
- `GET /:id` : Détails d'un projet (inclut toutes les tâches).
- `PUT /:id` : Modifier un projet (Propriétaire uniquement).
- `DELETE /:id` : Supprimer un projet.
- `GET /:id/stats` : Statistiques d'avancement (pourcentage, compte des tâches).
- `GET /:id/history` : Journal d'activité (Audit log du projet).
- `POST /:id/members` : Inviter un utilisateur au projet.

### Tâches & Commentaires
- `GET /api/projects/:id/tasks` : Lister les tâches d'un projet avec filtres.
    - Filtres : `?status=...`, `?search=...`, `?sortBy=...`, `?order=...`
- `POST /api/projects/:id/tasks` : Ajouter une tâche à un projet.
- `PATCH /api/projects/tasks/:taskId/status` : Changer le statut d'une tâche.
- `GET /api/projects/:taskId/comments` : Voir les commentaires d'une tâche.
- `POST /api/projects/:taskId/comments` : Ajouter un commentaire (Notifie les membres).

---

## 🛠️ Installation

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) installé et configuré.

### Déploiement du Backend

1. **Accédez au dossier server :**
   ```bash
   cd SERVER
   ```

2. **Installez les dépendances :**
   ```bash
   npm install
   ```

3. **Configurez les variables d'environnement :**
   - Créez un fichier `.env` basé sur `.env.example`.
   - Renseignez vos informations de connexion PostgreSQL et vos secrets JWT.

4. **Initialisez la base de données :**
   - Le schéma est chargé automatiquement au démarrage.

---

## 🏃 Scripts Disponibles

Dans le dossier `SERVER` :

- `npm run dev` : Lance le serveur avec rechargement automatique.
- `npm run build` : Compile le projet TypeScript.
- `npm run start` : Lance l'application compilée.