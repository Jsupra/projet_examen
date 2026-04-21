import { Request, Response } from "express";
import { getUserNotifications, markAsRead } from "../models/notification.models";

export const list_notifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id as string;
        const notifications = await getUserNotifications(userId);
        return res.status(200).json(notifications);
    } catch (error) {
        return res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
};

export const read_notification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = req.user?.id as string;
        const updated = await markAsRead(id, userId);
        
        if (!updated) return res.status(404).json({ error: "Notification introuvable" });
        
        return res.status(200).json({ message: "Marquée comme lue" });
    } catch (error) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};
