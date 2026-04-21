import express from "express";
import { list_notifications, read_notification } from "../controllers/notification.controllers";
import { verifyJWT } from "../middlewares/authenticationToken.middlewares";

const router = express.Router();

router.get("/", verifyJWT, list_notifications);
router.patch("/:id/read", verifyJWT, read_notification);

export default router;
