import db from "../config/database";

export const logActivity = async (
    projectId: string,
    userId: string,
    type: string,
    description: string
) => {
    try {
        const query = `
            INSERT INTO activity_logs (project_id, user_id, action_type, description)
            VALUES ($1, $2, $3, $4)
        `;
        await db.query(query, [projectId, userId, type, description]);
    } catch (error) {
        // On ne bloque pas l'application si l'historique échoue, on log juste l'erreur
        console.error("Erreur ActivityLog:", error);
    }
};