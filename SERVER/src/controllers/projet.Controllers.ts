
import { Request, Response } from "express";
import {
    insertProject, getProjectsWithPagination, updateProjectInDb, deleteProjectInDb, insertTask,
    updateTaskStatus, getProjectByIdInDb, getFilteredTasks, getProjectStatsInDb, inviteMemberToProject
} from "../models/projet.models";
import db from "../config/database";

export const createProject = async (req: Request, res: Response) => {
    try {
        const {title, description} = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "unauthorized : user ID missing" });

        if (!title) return res.status(400).json({ error: "title is required" });
        if (!description) return res.status(400).json({ error: "description is required" });
        
        const newProject = await insertProject(title, description, userId);
        if(!newProject) return res.status(500).json({ error: "internal server error" });

        return res.status(201).json({ message: "project created successfully", project: newProject });
        

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
    
}

export const findAllUsersAllProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "unauthorized" });

        // On récupère les paramètres de l'URL, avec des valeurs par défaut
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        const { projects, total } = await getProjectsWithPagination(userId, limit, offset, search);

        return res.status(200).json({
            message: "projects fetched successfully",
            data: projects,
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                itemsPerPage: limit
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "internal server error" });
    }
};

export const modify_project = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string; // L'ID du projet dans l'URL
        const { title, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const updatedProject = await updateProjectInDb(id, userId, title, description);

        if (!updatedProject) {
            return res.status(403).json({ 
                error: "Forbidden: Project not found or you don't have permission to edit it" 
            });
        }

        return res.status(200).json({
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const remove_project = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as {id: string};
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const deletedProject = await deleteProjectInDb(id, userId);

        if (!deletedProject) {
            return res.status(403).json({ 
                error: "Forbidden: Project not found or unauthorized deletion" 
            });
        }

        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};


export const create_task = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params as {projectId: string};
        const { title, description, assigned_to, echeance } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // VERIFICATION : On cherche si le projet appartient à l'utilisateur
        const projectCheck = await db.query(
            "SELECT owner_id FROM projects WHERE id = $1",
            [projectId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        const isOwner = projectCheck.rows[0].owner_id === userId;
        const isAdmin = userRole === 'admin';

        // Si c'est ni l'admin, ni le proprio => erreur
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: "Seul le propriétaire peut ajouter des tâches" });
        }

        // Si c'veut dire que c'est bon, on appelle le service
        const newTask = await insertTask(projectId, title, description, assigned_to, echeance);
        
        return res.status(201).json(newTask);
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};


export const change_task_status = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params as { taskId: string };
        const { statut } = req.body; // 'A faire', 'En cours' ou 'Termine'
        const userId = req.user?.id;

        // 1. On récupère la tâche pour savoir qui est le proprio du projet ET qui est assigné
        const checkQuery = `
            SELECT t.assigned_to, p.owner_id 
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = $1
        `;
        const taskCheck = await db.query(checkQuery, [taskId]);

        if (taskCheck.rows.length === 0) {
            return res.status(404).json({ error: "Tâche introuvable" });
        }

        const { assigned_to, owner_id } = taskCheck.rows[0];

        // 2. Sécurité : Est-ce que l'utilisateur est le proprio, l'assigné ou l'admin ?
        const isAllowed = userId === owner_id || userId === assigned_to || req.user?.role === 'admin';

        if (!isAllowed) {
            return res.status(403).json({ error: "Vous n'avez pas le droit de modifier cette tâche" });
        }

        // 3. Mise à jour
        const updatedTask = await updateTaskStatus(taskId, statut);
        return res.status(200).json(updatedTask);
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};



export const get_project_details = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as {id: string};
        const userId = req.user?.id;

        const project = await getProjectByIdInDb(id, userId as string);

        if (!project) {
            return res.status(404).json({ error: "Projet introuvable" });
        }

        return res.status(200).json(project);
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};


export const list_project_tasks = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId as string;
        const userId = req.user?.id as string;

        // --- NOUVEAUTÉ NIVEAU 2 : TRI ---
        const statut = (req.query.statut || req.query.status) as string;
        const search = req.query.search as string;
        const sortBy = (req.query.sortBy as string) || 'echeance'; // Tri par défaut
        const order = (req.query.order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // --- SÉCURITÉ MISE À JOUR (Proprio OU Membre) ---
        const accessCheck = await db.query(
            `SELECT p.id 
             FROM projects p 
             LEFT JOIN project_members pm ON p.id = pm.project_id 
             WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
            [projectId, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "Accès refusé : vous n'êtes pas membre de ce projet" });
        }

        // 2. Appel au service avec les nouveaux paramètres de tri
        const tasks = await getFilteredTasks(
            projectId, 
            statut, 
            search,
            sortBy,
            order as 'ASC' | 'DESC'
        );

        return res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching project tasks:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};



export const get_project_stats = async (req: Request, res: Response) => {
    try {
        // Correction ici : on s'assure que projectId est bien traité comme une string
        const { projectId } = req.params as {projectId: string}; 
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) return res.status(401).json({ error: "Non autorisé" });

        // Vérification d'accès : Proprio ou Admin
        const accessCheck = await db.query(
            "SELECT id FROM projects WHERE id = $1 AND (owner_id = $2 OR $3 = 'admin')",
            [projectId, userId, userRole]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "Accès refusé" });
        }

        const stats = await getProjectStatsInDb(projectId);
        return res.status(200).json(stats);
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};


export const invite_member = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId as string;
        const targetUserId = req.body.targetUserId as string; // L'ID récupéré via la recherche
        const ownerId = req.user?.id as string;
        const inviterName = req.user?.username as string; // On utilise username car name_display n'est pas dans le JWT

        // Sécurité : Est-ce bien le propriétaire du projet ?
        const projectCheck = await db.query(
            "SELECT id FROM projects WHERE id = $1 AND owner_id = $2",
            [projectId, ownerId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Seul le propriétaire peut inviter des membres" });
        }

        const result = await inviteMemberToProject(projectId, targetUserId, inviterName);
        
        return res.status(201).json({ message: "Invitation envoyée et membre ajouté", result });
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de l'invitation" });
    }
};