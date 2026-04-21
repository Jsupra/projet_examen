import express from "express";
import { createProject, findAllUsersAllProjects, modify_project, remove_project, create_task, change_task_status, get_project_details, list_project_tasks, get_project_stats, invite_member } from "../controllers/projet.Controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";
import { get_task_comments, post_comment } from "../controllers/comment.controllers";


const router = express.Router();

// Routes pour les projets
router.get("/", verifyJWT, findAllUsersAllProjects); // Lister tous les projets de l'utilisateur
router.post("/", verifyJWT, createProject);          // Créer un projet

router.get("/:id", verifyJWT, get_project_details);  // Détails d'un projet spécifique
router.put("/:id", verifyJWT, modify_project);       // Modifier un projet
router.delete("/:id", verifyJWT, remove_project);    // Supprimer un projet

// Routes pour les tâches au sein des projets
router.post('/:projectId/tasks', verifyJWT, create_task);             // Ajouter une tâche à un projet
router.patch('/tasks/:taskId/status', verifyJWT, change_task_status); // Modifier le statut d'une tâche
router.get('/:projectId/tasks', verifyJWT, list_project_tasks); // Route pour lister les tâches avec filtres optionnels

router.get('/:projectId/stats', verifyJWT, get_project_stats);
router.post('/:projectId/members', verifyJWT, invite_member);


// Routes pour les commentaires
router.post('/:taskId/comments', verifyJWT, post_comment);
router.get('/:taskId/comments', verifyJWT, get_task_comments);

export default router;
