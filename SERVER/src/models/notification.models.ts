import db from "../config/database";

export const createNotification = async (userId: string, content: string, type: string) => {
    const query = `
        INSERT INTO notifications (user_id, content, type)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await db.query(query, [userId, content, type]);
    return result.rows[0];
};

export const getUserNotifications = async (userId: string) => {
    const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
};

export const markAsRead = async (notificationId: string, userId: string) => {
    const query = `
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = $1 AND user_id = $2
        RETURNING *;
    `;
    const result = await db.query(query, [notificationId, userId]);
    return result.rows[0];
};
