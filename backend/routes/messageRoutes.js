import express from "express";
import { getConversations, getMessages, sendMessage } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:otherUserId", protectRoute, getMessages);
router.post("/", protectRoute, sendMessage);

export default router;
