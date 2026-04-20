import express from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./profile.routes";
import projectRoutes from "./projet.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);

export default router;
