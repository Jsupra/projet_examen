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



export const getProjectsWithPagination = async (
    userId: string, 
    limit: number, 
    offset: number, 
    search?: string,
    sortBy: string = 'created_at',
    order: string = 'DESC'
) => {
    try {
        const searchTerm = search ? `%${search}%` : null;

        // Sécurité : On vérifie les colonnes de tri
        const allowedColumns = ['created_at', 'title'];
        const safeSortBy = allowedColumns.includes(sortBy) ? sortBy : 'created_at';
        const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const dataQuery = `
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.statut = 'Termine') as completed_tasks
            FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE (p.owner_id = $1 OR pm.user_id = $1)
              AND ($4::text IS NULL OR p.title ILIKE $4)
            GROUP BY p.id
            ORDER BY p.${safeSortBy} ${safeOrder}
            LIMIT $2 OFFSET $3;
        `;
        
        const countQuery = `
            SELECT COUNT(DISTINCT p.id) FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE (p.owner_id = $1 OR pm.user_id = $1)
              AND ($2::text IS NULL OR p.title ILIKE $2);
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
        // Sécurité : Si assignedTo est une chaîne vide, on met null pour PostgreSQL
        const finalAssignedTo = assignedTo && assignedTo.trim() !== '' ? assignedTo : null;
        
        const query = `
            INSERT INTO tasks (project_id, title, description, assigned_to, echeance)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await db.query(query, [projectId, title, description, finalAssignedTo, echeance]);
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


export const getProjectByIdInDb = async (projectId: string, userId: string) => {
    try {
        const query = `
            SELECT 
                p.id, p.title, p.description, p.owner_id, p.created_at, p.updated_at,
                (
                    SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                        'id', t.id, 'title', t.title, 'description', t.description,
                        'statut', t.statut, 'echeance', t.echeance, 'assigned_to', t.assigned_to
                    )), '[]') FROM tasks t WHERE t.project_id = p.id
                ) AS tasks,
                (
                    SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
                        'id', u.id, 'username', u.username, 'email', u.email
                    )), '[]') FROM users u 
                    JOIN project_members pm ON u.id = pm.user_id 
                    WHERE pm.project_id = p.id
                ) AS members,
                (
                   SELECT JSON_BUILD_OBJECT('id', u.id, 'username', u.username)
                   FROM users u WHERE u.id = p.owner_id
                ) as owner
            FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
            GROUP BY p.id;
        `;
        const result = await db.query(query, [projectId, userId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error getting project by id", err);
        throw err;
    }
};


export const getFilteredTasks = async (
    projectId: string, 
    status?: string, 
    search?: string, 
    sortBy: string = 'echeance', 
    order: 'ASC' | 'DESC' = 'ASC'
) => {
    // Sécurité : On vérifie que le sortBy fait partie des colonnes autorisées
    const allowedColumns = ['echeance', 'statut', 'title', 'created_at'];
    const safeSortBy = allowedColumns.includes(sortBy) ? sortBy : 'echeance';
    const safeOrder = order === 'DESC' ? 'DESC' : 'ASC';

    const query = `
        SELECT t.*, u.name_display AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1
          AND ($2::text IS NULL OR t.statut = $2::Task_Statut)
          AND ($3::text IS NULL OR t.title ILIKE $3)
        ORDER BY t.${safeSortBy} ${safeOrder};
    `;
    
    const searchTerm = search ? `%${search}%` : null;
    const result = await db.query(query, [projectId, status || null, searchTerm]);
    return result.rows;
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



export const inviteMemberToProject = async (projectId: string, targetUserId: string, inviterName: string) => {
    const client = await db.connect(); // On utilise un client pour la transaction
    try {
        await client.query('BEGIN');

        // 1. Ajouter le membre
        const memberQuery = `
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ($1, $2, 'membre')
            ON CONFLICT DO NOTHING
            RETURNING *;
        `;
        const memberRes = await client.query(memberQuery, [projectId, targetUserId]);

        // 2. Créer la notification
        const notifQuery = `
            INSERT INTO notifications (user_id, content, type)
            VALUES ($1, $2, 'invitation');
        `;
        const notifContent = `${inviterName} vous a invité à collaborer sur un projet.`;
        await client.query(notifQuery, [targetUserId, notifContent]);

        await client.query('COMMIT');
        return memberRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getUserProjectsInDb = async (userId: string) => {
    try {
        const query = `
            SELECT p.* FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.owner_id = $1 OR pm.user_id = $1
            GROUP BY p.id;
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    } catch (err) {
        console.error("Error getting user projects", err);
        throw err;
    }
};


export const deleteTaskInDb = async (taskId: string) => {
    try {
        const query = `DELETE FROM tasks WHERE id = $1 RETURNING *;`;
        const result = await db.query(query, [taskId]);
        return result.rows[0];
    } catch (err) {
        console.error("Error deleting task", err);
        throw err;
    }
};

