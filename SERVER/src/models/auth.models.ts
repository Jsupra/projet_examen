import { User, register_dto, user_public, login, refresh_tokens } from "./types";
import db from "../config/database";
import { Result } from "pg";


//ICI LA MODIFICATION N'A PAS ENCORE ETE FAITE



export const createrUser =async (user: register_dto): Promise<User | null> => {
    
    let {
        username,
        name_display,
        email,
        password
    } = user;

    try {
        const result = await db.query(`INSERT INTO users (username, name_display, email, password_hash) 
                        VALUES ($1, $2, $3, $4) RETURNING *`,  // RETURNING * permet de retourner l'objet inserer avec toutes ses colonnes (meme celle genere par la base de donnee comme id et created_at)
            [username, name_display, email, password]);
        return result.rows[0]
    } catch (err) {
        console.error('Error creating user:', err);
        return null
    }
}


export const findUserByEmail_Name = async (email: string, username: string): Promise<User | null> => {
    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1 OR username = $2`, [email, username]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user:', err);
        return null
    }
}


export const findPassword = async (email: string, username: string) => {
    try {
        const result = await db.query(`SELECT password FROM users WHERE email = $1 OR username = $2`, [email, username]);
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0].password;
    } catch (err) {
        console.log('Error finding user: ', err)
        return null
    }
}

