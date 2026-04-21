import db from "../config/database";


export const searchUsersInDb = async (query: string, excludeUserId: string) => {
    try {
        const searchTerm = `%${query}%`;
        const sql = `
            SELECT id, name_display, email 
            FROM users 
            WHERE (name_display ILIKE $1 OR email ILIKE $1 OR username ILIKE $1)
            AND id != $2
            LIMIT 10;
        `;
        const result = await db.query(sql, [searchTerm, excludeUserId]);
        return result.rows;
    } catch (err) {
        console.error("Error searching users", err);
        throw err;
    }
};

export const markNotificationAsReadInDb = async (notificationId: string, userId: string) => {
    try {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;
        const result = await db.query(query, [notificationId, userId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error marking notification as read", err);
        throw err;
    }
};