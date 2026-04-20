import express from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import projectRoutes from "./projet.routes";
import searchUserRoutes from "./user.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", profileRoutes);
router.use("/users", searchUserRoutes);
router.use("/projects", projectRoutes);

export default router;
