import express from "express";
import { protectRoute, optionalAuth, trackActivity } from "../middleware/auth.middleware.js";
import {
	deleteNotification,
	getUserNotifications,
	markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Notifications are user-specific, so keep them protected but provide graceful fallback
router.get("/", optionalAuth, trackActivity, getUserNotifications);

router.put("/:id/read", protectRoute, markNotificationAsRead);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
