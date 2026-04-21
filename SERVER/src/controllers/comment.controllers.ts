import { Request, Response } from "express";
import db from "../config/database";
import { addCommentInDb, getTaskCommentsFromDb } from "../models/comments.models";


// --- RÉCUPÉRER LES COMMENTAIRES ---
export const get_task_comments = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params as { taskId: string };
        const userId = req.user?.id as string;
        
        // Optionnel : Tu peux ajouter un accessCheck ici aussi 
         const accessCheck = await db.query(
            `SELECT t.id FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN project_members pm ON p.id = pm.project_id
             WHERE t.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
            [taskId, userId]
        );
        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "Interdit de commenter cette tâche" });
        }

        const comments = await getTaskCommentsFromDb(taskId);
        return res.status(200).json(comments);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors du chargement des commentaires" });
    }
};

// --- POSTER UN COMMENTAIRE ---
export const post_comment = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params as {taskId: string};
        const { content } = req.body;
        const userId = req.user?.id as string;

        // Vérification de sécurité (Propriétaire ou Membre)
        const accessCheck = await db.query(
            `SELECT t.id FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN project_members pm ON p.id = pm.project_id
             WHERE t.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
            [taskId, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "Interdit de commenter cette tâche" });
        }

        const comment = await addCommentInDb(taskId, userId, content);
        return res.status(201).json(comment);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de l'envoi du commentaire" });
    }
};