import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { UserPayload } from "../models/types";

dotenv.config();

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const secret = process.env.ACCESS_TOKEN_SECRET || "";
        const decodedToken = jwt.verify(token, secret) as UserPayload;

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}