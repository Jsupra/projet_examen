import express from "express";
import { get_profile, get_all_users  } from "../controllers/auth.Controllers";
import { verifyJWT, isAdmin } from "../middlewares/authenticationToken.middlewares";

const router = express.Router();



router.get("/profile", verifyJWT, get_profile);
router.get("/all_users", verifyJWT, isAdmin, get_all_users);


export default router;