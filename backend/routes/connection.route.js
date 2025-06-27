import express from "express";
import { protectRoute, optionalAuth, trackActivity } from "../middleware/auth.middleware.js";
import {
	acceptConnectionRequest,
	getConnectionRequests,
	getConnectionStatus,
	getUserConnections,
	rejectConnectionRequest,
	removeConnection,
	sendConnectionRequest,
} from "../controllers/connection.controller.js";

const router = express.Router();

router.post("/request/:userId", protectRoute, sendConnectionRequest);
router.put("/accept/:requestId", protectRoute, acceptConnectionRequest);
router.put("/reject/:requestId", protectRoute, rejectConnectionRequest);
// View-only routes with optional auth (guests can see connections, auth users can interact)
router.get("/requests", optionalAuth, trackActivity, getConnectionRequests);
router.get("/", optionalAuth, trackActivity, getUserConnections);
router.get("/status/:userId", optionalAuth, trackActivity, getConnectionStatus);

// Protected routes (require authentication for actions)
router.delete("/:userId", protectRoute, removeConnection);

export default router;
