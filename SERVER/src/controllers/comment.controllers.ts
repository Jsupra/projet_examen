import { Request, Response } from "express";
import db from "../config/database";
import { addCommentInDb, getTaskCommentsFromDb } from "../models/comments.models";
import { logActivity } from "./activity.controllers";
import { io } from "../config/socket";
import { createNotification } from "../models/notification.models";


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
            `SELECT t.id, t.project_id, t.title FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN project_members pm ON p.id = pm.project_id
             WHERE t.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
            [taskId, userId]
        );

        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "Interdit de commenter cette tâche" });
        }

        const { project_id, title } = accessCheck.rows[0];

        const comment = await addCommentInDb(taskId, userId, content);

        // Log de commentaire
        await logActivity(project_id, userId, 'TASK_COMMENT', `a ajouté un commentaire sur la tâche "${title}"`);

        // Notification Persistante (Base de données)
        // 1. Récupérer les membres du projet pour les notifier (sauf l'auteur)
        const membersResult = await db.query(
            "SELECT user_id FROM project_members WHERE project_id = $1 AND user_id != $2",
            [project_id, userId]
        );
        const ownerResult = await db.query(
            "SELECT owner_id FROM projects WHERE id = $1 AND owner_id != $2",
            [project_id, userId]
        );

        const recipients = new Set([...membersResult.rows.map(r => r.user_id), ...ownerResult.rows.map(r => r.owner_id)]);
        const notifContent = `Nouveau commentaire de ${req.user?.username} sur la tâche "${title}"`;
        
        for (const recipientId of recipients) {
            await createNotification(recipientId, notifContent, 'TASK_COMMENT');
        }

        // 2. Notification Temps Réel (Socket)
        io.to(project_id).emit('new-comment', {
            taskId,
            author: req.user?.username,
            content: content,
            message: notifContent
        });

        return res.status(201).json(comment);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de l'envoi du commentaire" });
    }
};