import { Router } from "express";
import { get_my_notifications, search_users, mark_notification_as_read, get_all_users, update_user_role, get_user_projects } from "../controllers/user.controllers";
import { verifyJWT, isAdmin } from "../middlewares/authenticationToken.middlewares";

export const router = Router();

router.get('/search', verifyJWT, search_users);
router.get('/notifications', verifyJWT, get_my_notifications);
router.patch('/notifications/:notificationId/read', verifyJWT, mark_notification_as_read);

// Admin Routes
router.get('/all_users', verifyJWT, isAdmin, get_all_users);
router.patch('/:userId/role', verifyJWT, isAdmin, update_user_role);
router.get('/:userId/projects', verifyJWT, isAdmin, get_user_projects);

export default router;