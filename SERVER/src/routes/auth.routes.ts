import express from "express";
import { login, register, logout } from "../controllers/auth.Controllers";
import { validation } from "../middlewares/auth.middlewares";
import { login_schema, registerSchema } from "../models/types";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";

const router = express.Router();

router.post("/register", validation(registerSchema), register);
router.post("/login", validation(login_schema), login);
router.post("/logout", verifyJWT, logout);

// router.get("/test", getHashByIdentifier)

export default router;