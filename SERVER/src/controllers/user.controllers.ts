import { NextFunction, Request, Response } from "express";
import { searchUsersInDb, markNotificationAsReadInDb } from "../models/user.models";
import db from "../config/database";


export const search_users = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string;
        const currentUserId = req.user?.id as string;

        if (!q || q.length < 2) {
            return res.status(200).json([]);
        }

        const users = await searchUsersInDb(q, currentUserId);
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la recherche" });
    }
};


export const get_my_notifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as string;
        
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
};

export const mark_notification_as_read = async (req: Request, res: Response) => {
    try {
        const notificationId = req.params.notificationId as string;
        const userId = req.user?.id as string;

        const updatedNotif = await markNotificationAsReadInDb(notificationId, userId);

        if (!updatedNotif) {
            return res.status(404).json({ error: "Notification introuvable ou vous n'avez pas l'autorisation" });
        }

        return res.status(200).json({ message: "Notification marquée comme lue", notification: updatedNotif });
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

// --- ADMIN ONLY ---

export const get_all_users = async (req: Request, res: Response) => {
    try {
        const result = await db.query(
            "SELECT id, username, email, name_display, role FROM users ORDER BY username ASC"
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
};

export const update_user_role = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'Membre'].includes(role)) {
            return res.status(400).json({ error: "Rôle invalide. Utilisez 'admin' ou 'Membre'." });
        }

        const result = await db.query(
            "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role",
            [role, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la mise à jour du rôle" });
    }
};

export const get_user_projects = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const result = await db.query(
            `SELECT
                p.id, p.title, p.description, p.created_at,
                COUNT(t.id) AS total_tasks,
                COUNT(t.id) FILTER (WHERE t.statut = 'Termine') AS completed_tasks
             FROM projects p
             LEFT JOIN project_members pm ON p.id = pm.project_id
             LEFT JOIN tasks t ON t.project_id = p.id
             WHERE p.owner_id = $1 OR pm.user_id = $1
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [userId]
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la récupération des projets" });
    }
};