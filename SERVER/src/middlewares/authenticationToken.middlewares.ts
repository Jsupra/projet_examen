import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { UserPayload } from "../../types/express";

dotenv.config();

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const isLogout = req.originalUrl.includes("/logout");

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            if (isLogout) return next();
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            if (isLogout) return next();
            return res.status(401).json({ error: "Unauthorized" });
        }

        const secret = process.env.ACCESS_TOKEN_SECRET || "";
        
        // Si la route est "/logout", on ignore l'expiration pour permettre la déconnexion
        const decodedToken = jwt.verify(token, secret, { ignoreExpiration: isLogout }) as UserPayload;

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error(error);
        if (isLogout) return next();
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}



export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    // On vérifie d'abord si l'utilisateur existe (c'est-à-dire s'il est passé par verifyJWT)
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Ensuite, on vérifie son rôle
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: requires admin privileges" });
    }

    next();
};

// export const verifyRefreshToken = (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

//         const token = authHeader.split(' ')[1];
//         if (!token) return res.status(401).json({ error: "Unauthorized" });

//         const secret = process.env.REFRESH_TOKEN_SECRET || "";
//         const decodedToken = jwt.verify(token, secret) as UserPayload;

//         req.user = decodedToken;
//         next();
//     } catch (error) {
//         console.error(error);
//         return res.status(401).json({ error: "Invalid or expired token" });
//     }
// }