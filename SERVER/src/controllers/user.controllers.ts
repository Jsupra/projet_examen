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