import express from "express";
import { createProject, findAllUsersAllProjects, modify_project, remove_project, create_task, change_task_status, get_project_details } from "../controllers/projet.Controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";


const router = express.Router();

router.post("/create", verifyJWT, createProject); // route pour creer un projet
router.post('/:projectId/tasks', verifyJWT, create_task); // route pour creer une tache
router.get("/user-projects", verifyJWT, findAllUsersAllProjects); //route pour afficher tous les projets de l'utilisateur
router.get('/:id', verifyJWT, get_project_details); // route pour afficher un projet specifique
router.put("/update/:id", verifyJWT, modify_project); // route pour modifier un projet
router.patch('/tasks/:taskId/status', verifyJWT, change_task_status); // route pour modifier le statut d'une tache
router.delete("/delete/:id", verifyJWT, remove_project); // route pour supprimer un projet

export default router

