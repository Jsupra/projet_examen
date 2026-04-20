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