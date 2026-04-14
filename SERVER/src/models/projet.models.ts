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


// export const getAllProjects = async (userId: string) => {
//     try {
//         const query = `
//             SELECT * FROM projects WHERE owner_id = $1;
//         `;
//         const result = await db.query(query, [userId]);
//         return result.rows;
//     } catch (err) {
//         console.error("Error getting projects", err);
//         throw err;
//     }
// }


export const getProjectsWithPagination = async (userId: string, limit: number, offset: number) => {
    try {
        // 1. On récupère les projets pour la page actuelle
        const dataQuery = `
            SELECT * FROM projects 
            WHERE owner_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3;
        `;
        
        // 2. On compte le total pour que le frontend sache combien de pages il y a
        const countQuery = `SELECT COUNT(*) FROM projects WHERE owner_id = $1;`;

        const [dataRes, countRes] = await Promise.all([
            db.query(dataQuery, [userId, limit, offset]),
            db.query(countQuery, [userId])
        ]);

        return {
            projects: dataRes.rows,
            total: parseInt(countRes.rows[0].count)
        };
    } catch (err) {
        console.error("Error getting paginated projects", err);
        throw err;
    }
};


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


export const deleteProjectInDb = async (projectId: string, userId: string) => {
    try {
        const query = `
            DELETE FROM projects 
            WHERE id = $1 AND owner_id = $2
            RETURNING *;
        `;
        const result = await db.query(query, [projectId, userId]);
        return result.rows[0]; // Renverra le projet supprimé, ou null s'il n'existe pas/pas à lui
    } catch (err) {
        console.error("Error deleting project", err);
        throw err;
    }
};