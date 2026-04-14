import dotenv from "dotenv";
import { Request, Response } from "express";
import { insertProject, getProjectsWithPagination, updateProjectInDb, deleteProjectInDb } from "../models/projet.models";


export const createProject = async (req: Request, res: Response) => {
    try {
        const {title, description} = req.body;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "unauthorized : user ID missing" });

        if (!title) return res.status(400).json({ error: "title is required" });
        if (!description) return res.status(400).json({ error: "description is required" });
        
        const newProject = await insertProject(title, description, userId);
        if(!newProject) return res.status(500).json({ error: "internal server error" });

        return res.status(201).json({ message: "project created successfully", project: newProject });
        

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
    
}

// export const findAllUsersAllProjects = async (req: Request, res: Response) => {
//     try {
//         const userId = req.user?.id; 
//         if (!userId) return res.status(401).json({ error: "unauthorized : user ID missing" });

//         const projects = await getProjectsWithPagination(userId);
        
//         return res.status(200).json({ 
//             message: "projects fetched successfully", 
//             count: projects.length, // Pratique pour le frontend
//             projects: projects 
//         });
        
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "internal server error" });
//     }
// };

export const findAllUsersAllProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "unauthorized" });

        // On récupère les paramètres de l'URL, avec des valeurs par défaut
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { projects, total } = await getProjectsWithPagination(userId, limit, offset);

        return res.status(200).json({
            message: "projects fetched successfully",
            data: projects,
            pagination: {
                totalItems: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                itemsPerPage: limit
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "internal server error" });
    }
};

export const modify_project = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string; // L'ID du projet dans l'URL
        const { title, description } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const updatedProject = await updateProjectInDb(id, userId, title, description);

        if (!updatedProject) {
            return res.status(403).json({ 
                error: "Forbidden: Project not found or you don't have permission to edit it" 
            });
        }

        return res.status(200).json({
            message: "Project updated successfully",
            project: updatedProject
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const remove_project = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as {id: string};
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const deletedProject = await deleteProjectInDb(id, userId);

        if (!deletedProject) {
            return res.status(403).json({ 
                error: "Forbidden: Project not found or unauthorized deletion" 
            });
        }

        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};