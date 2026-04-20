# Projet Examen - Gestionnaire de Projets

Cette application est une API de gestion de projets et de tâches, permettant la création de projets, le suivi de tâches, et une gestion collaborative sécurisée.

## 🚀 Technologies Utilisées

### Backend
- **Node.js** & **Express** : Framework principal pour l'API.
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité.
- **PostgreSQL** : Base de données relationnelle.
- **JSON Web Tokens (JWT)** : Authentification et sécurisation des routes.
- **Bcrypt** : Hachage sécurisé des mots de passe.
- **Zod** : Validation de schémas et de données.
- **Dotenv**: Gestion des variables d'environnement.

### Frontend
- (Placé dans le dossier `/CLIENT`) - À venir.

---

## 📁 Structure du Projet

```text
projet-examen/
├── CLIENT/              # Code source du front-end
├── SERVER/              # Code source du back-end
│   ├── src/
│   │   ├── config/      # Configuration (DB, Initialisation)
│   │   ├── controllers/ # Logique métier (Auth, Projets)
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
- `POST /login` : Se connecter et recevoir un token.
- `POST /logout` : Déconnexion.

### Projets (`/api/projects`)
- `GET /` : Lister ses projets (Supporte `?search=...`, `?page=1`, `?limit=10`).
- `POST /` : Créer un nouveau projet.
- `GET /:id` : Détails d'un projet (inclut toutes les tâches).
- `PUT /:id` : Modifier un projet (Propriétaire uniquement).
- `DELETE /:id` : Supprimer un projet.

### Tâches
- `GET /api/projects/:id/tasks` : Lister les tâches d'un projet avec filtres.
    - Filtres : `?status=...` (A faire, En cours, Termine), `?search=...`
- `POST /api/projects/:id/tasks` : Ajouter une tâche à un projet.
- `PATCH /api/projects/tasks/:taskId/status` : Changer le statut d'une tâche.

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
   - Renseignez vos informations de connexion PostgreSQL.

4. **Initialisez la base de données :**
   - Le schéma est chargé automatiquement au démarrage ou via `src/database/schema.sql`.

---

## 🏃 Scripts Disponibles

Dans le dossier `SERVER` :

- `npm run dev` : Lance le serveur avec rechargement automatique.
- `npm run build` : Compile le projet TypeScript.
- `npm run start` : Lance l'application compilée.