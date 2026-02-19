import { z } from 'zod';
import { Request } from 'express';

// 1. Types de base et Unions
type UUID = string;
export type User_Role = 'admin' | 'Membre';
export type Task_Status = 'A faire' | 'En cours' | 'Termine';

// 2. Schémas de validation (Zod)
export const registerSchema = z.object({
    username: z.string().min(3, "username must be 3 characters min").max(50),
    name_display: z.string().min(3, "name display must be 3 character or plus").max(50),
    email: z.string().email("email is not valid"),
    role: z.enum(['admin', 'Membre']).default('Membre'),
    password: z.string().min(8, "password must be at least 8 characters long").max(50)
});

export const login_schema = z.object({
    identifier: z.string().min(3).max(50),
    password: z.string().min(8).max(50)
});

export const projetSchema = z.object({
    title: z.string().min(3).max(50),
    description: z.string().max(512),
    ownerId: z.string().uuid()
});

export const tasksSchema = z.object({
    title: z.string().min(3).max(50),
    description: z.string().max(512),
    statut: z.enum(['A faire', 'En cours', 'Termine']),
    assigned_to: z.string().uuid(), 
    echeance: z.string().datetime() 
});

// 3. Interfaces de données (Base de données)
export interface User {
    id: UUID;
    username: string;
    name_display: string;
    email: string;
    role: User_Role;
    password_hash: string;
    created_at: Date;
}

export interface Project {
    id: UUID;
    title: string;
    description: string;
    owner_id: UUID;
    created_at: Date;
}

export interface Task {
    id: UUID;
    projectId: UUID;
    title: string;
    description: string;
    statut: Task_Status;
    assigned_to: UUID;
    echeance: Date;
    created_at: Date;
}

export interface user_public {
    id: UUID;
    username: string;
    name_display: string;
    email: string;
    role: User_Role;
    created_at: Date;
}

export interface refresh_tokens {
    id: UUID;
    token: string;
    user_id: UUID;
    expires_at: Date;
}

export interface UserPayload {
    id: string;
    username: string;
    role: string;
}

// 4. Types inférés (DTO)
export type register_dto = z.infer<typeof registerSchema>;
export type login_dto = z.infer<typeof login_schema>;
export type project_dto = z.infer<typeof projetSchema>;
export type task_dto = z.infer<typeof tasksSchema>;