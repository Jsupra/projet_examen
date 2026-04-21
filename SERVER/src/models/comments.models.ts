import db from "../config/database";


export const addCommentInDb = async (taskId: string, authorId: string, content: string) => {
    const query = `
        INSERT INTO task_comments (task_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const result = await db.query(query, [taskId, authorId, content]);
    return result.rows[0];
};

export const getTaskCommentsFromDb = async (taskId: string) => {
    const query = `
        SELECT c.*, u.name_display as author_name
        FROM task_comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC;
    `;
    const result = await db.query(query, [taskId]);
    return result.rows;
};