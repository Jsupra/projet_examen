import { User, register_dto, user_public, refresh_tokens } from "./types";
import db from "../config/database";
import { Result } from "pg";


//ICI LA MODIFICATION N'A PAS ENCORE ETE FAITE



export const createrUser =async (user: register_dto): Promise<User | null> => {
    
    let {
        username,
        name_display,
        email,
        role,
        password
    } = user;

    try {
        const result = await db.query(`INSERT INTO users (username, name_display, email, role, password_hash) 
                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,  // RETURNING * permet de retourner l'objet inserer avec toutes ses colonnes (meme celle genere par la base de donnee comme id et created_at)
            [username, name_display, email, role, password]);
        return result.rows[0]
    } catch (err) {
        console.error('Error creating user:', err);
        return null
    }
}

export const insertRefreshToken = async (user_id: string, token: string) => {
    try {
        const result = await db.query(`INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES($1, $2, NOW() + INTERVAL '7 days') RETURNING *`, [user_id, token]);
        return result.rows[0];
    } catch (err) {
        console.error("Error creating refresh token: ", err);
    }
}


export const findUserByEmail_UserName = async (email?: string, username?: string): Promise<User | null> => {
    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1 OR username = $2`, [email || null, username || null]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user:', err);
        return null
    }
}




