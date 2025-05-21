import express from "express";
import { 
    getPublicProfile, 
    getSuggestedConnections, 
    updateProfile,
    searchUsers 
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Search users
router.get("/search", protectRoute, searchUsers);

// User suggestions
router.get("/suggestions", protectRoute, getSuggestedConnections);

// Get user profile by username
router.get("/:username", protectRoute, getPublicProfile);

// Update user profile
router.put("/profile", protectRoute, updateProfile);

// Export the router
export default router;
