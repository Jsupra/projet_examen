import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { findUserByEmail_UserName, createrUser, insertRefreshToken, checkUserExistence, deleteRefreshToken } from "../models/auth.models";
import { register_dto, login_dto } from "../models/types";
import dotenv from "dotenv";
import { handleAccessToken, handleRefreshToken } from "../../utils/jwt.utils";
import { email } from "zod";
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
        const { username, name_display, email, role, password } = req.body; // recuperation des donnees 
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

        // creation du user data
        const userData: register_dto = {
            username: lowerCaseUsername,
            name_display: name_display,
            email: lowerCaseEmail,
            role,
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


// export const getHashByIdentifier = async (req: Request, res: Response) => {
//     try {
//         const { identifier } = req.body;
//         const user = await findUserByEmail_UserName(identifier);
//         if (!user) {
//             return res.status(404).json({
//                 error: "user not found"
//             })
//         }
//         return res.status(200).json({
//            user
//         })
//     } catch (error) {
//         console.error(error)
//         return res.status(500).json({
//             error: "internal servor error"
//         })
//     }
// };