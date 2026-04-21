import { Router } from "express";
import { get_my_notifications, search_users, mark_notification_as_read } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";

export const router = Router();

router.get('/search', verifyJWT, search_users);
router.get('/notifications', verifyJWT, get_my_notifications);
router.patch('/notifications/:notificationId/read', verifyJWT, mark_notification_as_read);

export default router;