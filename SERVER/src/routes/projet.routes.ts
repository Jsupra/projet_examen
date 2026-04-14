import express from "express";
import { createProject, findAllUsersAllProjects, modify_project, remove_project } from "../controllers/projet.Controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";


const router = express.Router();

router.post("/create", verifyJWT, createProject);
router.get("/user-projects", verifyJWT, findAllUsersAllProjects);
router.put("/update/:id", verifyJWT, modify_project);
router.delete("/delete/:id", verifyJWT, remove_project);

export default router

