import db from "../config/database";
import { Task_Status } from "./types";





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


export const getProjectsWithPagination = async (userId: string, limit: number, offset: number, search?: string) => {
    try {
        const searchTerm = search ? `%${search}%` : null;

        // 1. On récupère les projets filtrés pour la page actuelle
        const dataQuery = `
            SELECT * FROM projects 
            WHERE owner_id = $1 
              AND ($4::text IS NULL OR title ILIKE $4)
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3;
        `;
        
        // 2. On compte le total filtré pour la pagination
        const countQuery = `
            SELECT COUNT(*) FROM projects 
            WHERE owner_id = $1 
              AND ($2::text IS NULL OR title ILIKE $2);
        `;

        const [dataRes, countRes] = await Promise.all([
            db.query(dataQuery, [userId, limit, offset, searchTerm]),
            db.query(countQuery, [userId, searchTerm])
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


export const insertTask = async (
    projectId: string, 
    title: string, 
    description: string, 
    assignedTo: string, 
    echeance: Date
) => {
    try {
        const query = `
            INSERT INTO tasks (project_id, title, description, assigned_to, echeance)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await db.query(query, [projectId, title, description, assignedTo, echeance]);
        return result.rows[0];
    } catch (err) {
        console.error("Error inserting task", err);
        throw err;
    }
};


export const updateTaskStatus = async (taskId: string, newStatus: Task_Status) => {
    try {
        const query = `
            UPDATE tasks 
            SET statut = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        const result = await db.query(query, [newStatus, taskId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error updating task status", err);
        throw err;
    }
};



// export const getProjectByIdInDb = async (projectId: string, userId: string) => {
//     const query = `
//         SELECT p.*, 
//                COALESCE(JSON_AGG(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS tasks
//         FROM projects p
//         LEFT JOIN tasks t ON p.id = t.project_id
//         WHERE p.id = $1 AND p.owner_id = $2
//         GROUP BY p.id;
//     `;

//     /* LEFT JOIN : Permet d'afficher le projet même s'il n'a pas encore de tâches.
//     JSON_AGG : Rassemble toutes les tâches du projet dans un tableau.
//     COALESCE(..., '[]') : Si le projet n'a pas de tâches, cela renvoie un tableau vide [] au lieu de null. */
//     const result = await db.query(query, [projectId, userId]);
//     return result.rows[0];
// };



export const getProjectByIdInDb = async (projectId: string, userId: string) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.title, 
                p.description, 
                p.owner_id,
                p.created_at,
                p.updated_at,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', t.id,
                            'title', t.title,
                            'description', t.description,
                            'statut', t.statut,
                            'echeance', t.echeance,
                            'assigned_to', u.id,
                            'assigned_to_name', u.name_display
                        )
                    ) FILTER (WHERE t.id IS NOT NULL), 
                    '[]'
                ) AS tasks
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE p.id = $1 AND p.owner_id = $2
            GROUP BY p.id;
        `;
        const result = await db.query(query, [projectId, userId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error getting project by id", err);
        throw err;
    }
};


export const getFilteredTasks = async (projectId: string, status?: string, search?: string) => {
    try {
        const query = `
            SELECT t.*, u.name_display AS assigned_to_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = $1
              AND ($2::text IS NULL OR t.statut = $2::Task_Statut)
              AND ($3::text IS NULL OR t.title ILIKE $3)
            ORDER BY t.echeance ASC;
        `;
        
        const searchTerm = search ? `%${search}%` : null;
        
        const result = await db.query(query, [projectId, status || null, searchTerm]);
        return result.rows;
    } catch (err) {
        console.error("Error getting filtered tasks", err);
        throw err;
    }
};


export const getProjectStatsInDb = async (projectId: string) => {
    const query = `
        SELECT 
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE statut = 'A faire') as todo_count,
            COUNT(*) FILTER (WHERE statut = 'En cours') as doing_count,
            COUNT(*) FILTER (WHERE statut = 'Termine') as done_count,
            CASE 
                WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE statut = 'Termine')::float / COUNT(*)) * 100)
                ELSE 0 
            END as progress_percentage
        FROM tasks
        WHERE project_id = $1;
    `;
    const result = await db.query(query, [projectId]);
    return result.rows[0];
};

