import express, { Request, Response } from "express";
import { login, register } from "../controllers/auth.Controllers";
import { validation } from "../middlewares/auth.middlewares";
import { login_schema, registerSchema } from "../models/types";

const router = express.Router();

router.post("/register", validation(registerSchema), register);
router.post("/login", validation(login_schema), login)

export default router;