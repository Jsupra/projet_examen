import express from "express";
import { createProject, findAllUsersAllProjects, modify_project, remove_project, create_task, change_task_status, get_project_details, list_project_tasks, get_project_stats, invite_member, get_project_history } from "../controllers/projet.Controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";
import { get_task_comments, post_comment } from "../controllers/comment.controllers";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Projets
 *     description: Gestion des projets et collaboration
 *   - name: Tâches
 *     description: Gestion des tâches au sein des projets
 *   - name: Commentaires
 *     description: Discussion sur les tâches
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Lister tous les projets de l'utilisateur
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des projets récupérée
 */
router.get("/", verifyJWT, findAllUsersAllProjects); 

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Créer un projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Projet créé
 */
router.post("/", verifyJWT, createProject);          

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Détails d'un projet spécifique
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détails du projet (incluant les tâches)
 */
router.get("/:id", verifyJWT, get_project_details);  

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Modifier un projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Projet mis à jour
 */
router.put("/:id", verifyJWT, modify_project);       

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Supprimer un projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Projet supprimé
 */
router.delete("/:id", verifyJWT, remove_project);    

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Ajouter une tâche à un projet
 *     tags: [Tâches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               assigned_to: { type: string }
 *               echeance: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Tâche créée
 */
router.post('/:projectId/tasks', verifyJWT, create_task);             

/**
 * @swagger
 * /projects/tasks/{taskId}/status:
 *   patch:
 *     summary: Modifier le statut d'une tâche
 *     tags: [Tâches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [statut]
 *             properties:
 *               statut: { type: string, enum: [A faire, En cours, Termine] }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.patch('/tasks/:taskId/status', verifyJWT, change_task_status); 

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Lister les tâches d'un projet avec filtres
 *     tags: [Tâches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des tâches récupérée
 */
router.get('/:projectId/tasks', verifyJWT, list_project_tasks); 

/**
 * @swagger
 * /projects/{projectId}/stats:
 *   get:
 *     summary: Statistiques d'avancement du projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stats du projet
 */
router.get('/:projectId/stats', verifyJWT, get_project_stats);

/**
 * @swagger
 * /projects/{projectId}/members:
 *   post:
 *     summary: Inviter un membre au projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetUserId]
 *             properties:
 *               targetUserId: { type: string }
 *     responses:
 *       201:
 *         description: Membre ajouté
 */
router.post('/:projectId/members', verifyJWT, invite_member);

/**
 * @swagger
 * /projects/{taskId}/comments:
 *   post:
 *     summary: Ajouter un commentaire à une tâche
 *     tags: [Commentaires]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Commentaire ajouté
 */
router.post('/:taskId/comments', verifyJWT, post_comment);

/**
 * @swagger
 * /projects/{taskId}/comments:
 *   get:
 *     summary: Voir les commentaires d'une tâche
 *     tags: [Commentaires]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des commentaires récupérée
 */
router.get('/:taskId/comments', verifyJWT, get_task_comments);

/**
 * @swagger
 * /projects/{projectId}/history:
 *   get:
 *     summary: Historique d'activité du projet
 *     tags: [Projets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Journal d'activité récupéré
 */
router.get('/:projectId/history', verifyJWT, get_project_history);

export default router;
