import { Router } from "express";
import { get_my_notifications, search_users } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";


export const router = Router();


router.get('/search', verifyJWT, search_users);
router.get('/notifications', verifyJWT, get_my_notifications);

export default router;