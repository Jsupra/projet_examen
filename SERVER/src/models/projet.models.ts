import db from "../config/database";





export const insertProject = async (title: string, description: string, userId: string) => {
    try {
        const query = `
            INSERT INTO projects (title, description, owner_id, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await db.query(query, [title, description, userId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error creating project", err);
        throw err;
    }
};


export const getAllProjects = async (userId: string) => {
    try {
        const query = `
            SELECT * FROM projects WHERE owner_id = $1;
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error("Error getting projects", err);
        throw err;
    }
}


export const updateProjectInDb = async (projectId: string, userId: string, title: string, description: string) => {
    try {
        const query = `
            UPDATE projects 
            SET title = $1, description = $2, updated_at = NOW()
            WHERE id = $3 AND owner_id = $4
            RETURNING *;
        `;
        const result = await db.query(query, [title, description, projectId, userId]);
        return result.rows[0]; // Renverra undefined si le projet n'existe pas OU n'appartient pas à l'user
    } catch (err) {
        console.error("Error updating project", err);
        throw err;
    }
};