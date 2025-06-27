import express from "express";
import { getConversations, getMessages, sendMessage, markMessagesAsSeen } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/:conversationId/seen", protectRoute, markMessagesAsSeen);
router.post("/", protectRoute, sendMessage);

export default router;
