import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { findUserByEmail_UserName, createrUser, insertRefreshToken, checkUserExistence, deleteRefreshToken, findUserById, findAllUsers, findRefreshToken } from "../models/auth.models";
import { register_dto, login_dto } from "../models/types";
import dotenv from "dotenv";
import { handleAccessToken, handleRefreshToken } from "../../utils/jwt.utils";
dotenv.config()



// function pour mettre en minuscule
function lowerCase(text: string) {
    if (!text) return text;
    return text.toLowerCase();
}

// register controller
export const register = async (req: Request, res: Response) => {
    try {
        // donnees a recevoir depuis le fontend pour le register
        const { username, name_display, email, password } = req.body; // recuperation des donnees 
        const lowerCaseUsername = lowerCase(username);
        const lowerCaseEmail = lowerCase(email);

        // verification de l'utilisateur
        const User = await checkUserExistence(lowerCaseEmail, lowerCaseUsername);
        if (User) {
            return res.status(400).json({
                error: 'user already exist'
            })
        }

        // hashage du mot de passe
        const password_hash = await bcrypt.hash(password, 10);

        let final_role: "Membre" | "admin" = "Membre"; // dire explicitement à TypeScript que la variable final_role ne peut
                                                    // contenir QUE les valeurs "Membre" ou "admin".
        
        const admin_key = req.headers['x-admin-key'];

        if (admin_key && admin_key == process.env.ADMIN_SIGNUP_KEY) {
            final_role = "admin";
        }

        // creation du user data
        const userData: register_dto = {
            username: lowerCaseUsername,
            name_display: name_display,
            email: lowerCaseEmail,
            role : final_role,
            password: password_hash
        };

        const newUser = await createrUser(userData);
        // verification de la creation du user
        if (newUser === null) return res.status(500).json({ error: 'internal servor error' })
        return res.status(201).json({ Message: 'user create successully' })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'internal servor error' })
    }

}


// login controller
export const login = async (req: Request, res: Response) => {

    try {
        // donnees a recevoir depuis le fontend pour le login
        const { identifier, password } = req.body; // identifier peut etre un email ou un username

        // verification des donnees
        if (identifier === null) return res.status(400).json({ error: "identifier is required" })
        if (password === null) return res.status(400).json({ error: "password is required" })

        const loginData: login_dto = {
            identifier: identifier.toLowerCase(),
            password: password
        }

        // RECUPERATION DES DONNEES USER
        const User = await findUserByEmail_UserName(loginData.identifier);

        // verification de l'utilisateur
        if (!User) {
            return res.status(404).json({ error: "invalid credentials" })
        }

        // verification du mot de passe
        const password_hash = User.password_hash
        const isMatch = await bcrypt.compare(password, password_hash);
        if (!isMatch) {
            return res.status(401).json({
                error: "invalid credentials"
            })
        }

        // stocakge des secret et verification de ceux ci 
        const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
        const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
        if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
            console.error("Error: ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined");
            return res.status(500).json({
                error: "internal servor error"
            })
        }

        // creation du jwt
        const accessToken = handleAccessToken(User.id, User.username, User.role, ACCESS_TOKEN_SECRET);
        const refreshToken = handleRefreshToken(User.id, User.username, User.role, REFRESH_TOKEN_SECRET);


        // suppression du refresh token precedent
        const deleteRefreshTokenLog = await deleteRefreshToken(User.id);

        // insertion du nouveau refresh token
        const refreshTokenLog = await insertRefreshToken(User.id, refreshToken);
        if (refreshTokenLog) {
            console.log("Refresh token created successfully");
        } else {
            console.error("Error: Refresh token not created");
            return res.status(500).json({
                error: "internal servor error"
            })
        }


        // stockage du token dans les cookies 
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // empeche le javascript d'acceder au cookie (securite xss)
            secure: true, // uniquement via http (en prod)
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: "Login success",
            accessToken: accessToken,
            user: {
                username: User.username,
                name_display: User.name_display,
                email: User.email,
                role: User.role
            }
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: "internal servor error"
        })
    }
}


export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        // S'il n'y a pas d'ID (par ex. si le token était manquant ou invalide), 
        // on ignore simplement la suppression en base de données.
        if (userId) {
            const deleteRefreshTokenLog = await deleteRefreshToken(userId);
            if (!deleteRefreshTokenLog) console.error("Could not delete refresh token for user: ", userId);
        }
    
        // On supprime quoi qu'il arrive le cookie chez l'utilisateur
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });
        return res.status(200).json({ message: "Logout success" });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: "internal servor error during logout"
        })
    }
}

export const get_profile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "unauthorized" });

        const user= await findUserById(userId);
        if (!user) return res.status(404).json({ error: "user not found" });

        return res.status(200).json({
            username: user.username,
            name_display: user.name_display,
            email: user.email,
            role: user.role
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error : "internal server error during finding information"
        })
    }
}

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ error: "Refresh token missing" });

        const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
        const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

        if (!REFRESH_TOKEN_SECRET || !ACCESS_TOKEN_SECRET) {
            return res.status(500).json({ error: "Internal server error: secrets missing" });
        }

        // 1. Verifier la validité du token JWT
        const jwt = require("jsonwebtoken");
        let payload: any;
        try {
            payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        // 2. Verifier si le token est bien en base de données (sécurité)
        const tokenInDb = await findRefreshToken(payload.id);
        if (!tokenInDb || tokenInDb.token !== refreshToken) {
            return res.status(403).json({ error: "Refresh token not recognized" });
        }

        // 3. Generer un nouvel access token
        const newAccessToken = handleAccessToken(payload.id, payload.username, payload.role, ACCESS_TOKEN_SECRET);

        return res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error during token refresh" });
    }
}

export const get_all_users = async (req: Request, res: Response) => {
    try {
        const users = await findAllUsers();
        if (!users) return res.status(404).json({ error: "users not found" });
        return res.status(200).json({
            users
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "internal servor error during finding information"
        })
    }
}
