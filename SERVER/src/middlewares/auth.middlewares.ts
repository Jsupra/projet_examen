import { Request, Response } from "express";
import * as z from "zod";
import { ZodObject } from "zod";


export const validation = (schema: ZodObject) => (req: Request, res: Response, next: Function) => {

    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
    }
    req.body = result.data;

    next();
}