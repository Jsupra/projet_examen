import express from "express";
import { login, register, logout, refreshToken } from "../controllers/auth.Controllers";
import { validation } from "../middlewares/auth.middlewares";
import { login_schema, registerSchema } from "../models/types";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Gestion des comptes utilisateurs et des sessions
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un nouveau compte
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, name_display, email, password]
 *             properties:
 *               username: { type: string }
 *               name_display: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 */
router.post("/register", validation(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, description: "Email ou Username" }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne l'accessToken
 */
router.post("/login", validation(login_schema), login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Se déconnecter
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post("/logout", verifyJWT, logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renouveler le token d'accès
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Nouveau token généré
 */
router.post("/refresh", refreshToken);

export default router;