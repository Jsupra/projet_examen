# Projet Examen - Application Blog

Cette application est un système de blog dynamique permettant la gestion des utilisateurs, l'authentification sécurisée et le partage d'articles.

## 🚀 Technologies Utilisées

### Backend
- **Node.js** & **Express** : Framework principal pour l'API.
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité.
- **PostgreSQL** : Base de données relationnelle.
- **JSON Web Tokens (JWT)** : Pour l'authentification et la sécurisation des routes.
- **Bcrypt** : Hacage des mots de passe.
- **Zod** : Validaton de schémas et de donnée.
- **Dotenv**: Geston devariblesd'environnement.

### Frontend
- (Placé dan le dosser `/CLIENT`) - À venir.

---

## 📁 Structure du Projet

```text
projet-exaen/
├── CLIENT/              # Code source du front-end (React/Vite...)
├── SERVER/              # Code source du back-end (Exress/TS)
│   ├── src/
│   │   ├── config/      # Configuration (DB, etc.)
│   │   ├── controlers/ # Logiqumétier des routes
│   │   ├── dataase/    # Schémas SQL et migrations
│   │   ├── middlewares/ # Middlewares (Auth, validation)
│   │   ├── models/      # Types TS et requêtes DB
│   │   └── routes/      # Définition des points d'entrée d'API
│   ├── server.ts        # Point d'entrée de l'appicatin
│   └── tsconfi.json    # Configuration TypeScript
└── README.md            # Documentationdu projet
```

---

## 🛠️ Instllation

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](htts://www.ostgresq.org/) instllée confguré.

### Dépliement du Backed

1. **Accédeza dossier server :**
   ```bash
   cd SERVER
   ```

2. **Installez le dépendances :**
   ```bash
   npm nstall
   ```

3. **Cofiurez les variables d'environnement :**
   - Copiez le fichier `.env.example`n `.env` :
     ```bash
     cp .env.eamle .env
     ```
   - Modifiez le fichier `.env` avec vos infomations de connxion PotgreSQL.

4. **Initialiez labse de donées :**
   - Utilisez le fichier `src/atabase/schema.sql`our créer les tables nécessaires dans votre base PeSQL.

---

## 🏃 Scripts Disponibles

Dans l dossier `ERVER` :

- `npm run dev` : Lance le serveur de développement avec rechargement automatiue (Nodemon).
- `npm run build` : Compile le projet TypeScript en JavaScript (dans eossier `dist`).
- `npm run start` : Lance l'application compilée.

---

## 🔐 Authentificion

L'API utilise des tokens JWT pour sécuriser l'accès. Lors de la connexion, un token est généré et doit être inclus dns les en-têtes des requêtes protégée :
`Authorization: Bearer <votre_token>