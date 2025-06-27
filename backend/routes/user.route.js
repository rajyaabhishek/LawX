import express from "express";
import { 
    getPublicProfile, 
    getPublicProfileByClerkId,
    getSuggestedConnections, 
    updateProfile,
    searchUsers,
    searchConnectedUsers,
    becomeLawyer,
    getCurrentUser,
    upgradeToPremium,
    ensureUserExists
} from "../controllers/user.controller.js";
import { protectRoute, optionalAuth, trackActivity } from "../middleware/auth.middleware.js";

const router = express.Router();

// IMPORTANT: Specific routes MUST come before generic parameter routes like /:username

// Get current user profile (must come before /:username)
router.get("/me", protectRoute, getCurrentUser);

// Update user profile
router.put("/profile", protectRoute, updateProfile);

// Search and suggestions routes
router.get("/search", optionalAuth, trackActivity, searchUsers);
router.get("/search/connected", protectRoute, trackActivity, searchConnectedUsers);
router.get("/suggestions", optionalAuth, trackActivity, getSuggestedConnections);

// Clerk-specific routes
router.get("/clerk/:clerkId", optionalAuth, trackActivity, getPublicProfileByClerkId);
router.post("/ensure/:clerkId", protectRoute, ensureUserExists);

// User actions
router.post("/become-lawyer", protectRoute, becomeLawyer);
router.post("/upgrade-premium", protectRoute, upgradeToPremium);

// Debug route to check premium status
router.get("/debug/premium-status", protectRoute, async (req, res) => {
	try {
		const user = req.user;
		
		res.status(200).json({
			success: true,
			debug: {
				userId: user._id,
				clerkId: user.clerkId,
				isPremium: user.isPremium,
				isVerified: user.isVerified,
				subscription: user.subscription,
				clerkMetadata: user.clerkUser?.publicMetadata,
				mongoData: {
					isPremium: user.isPremium,
					isVerified: user.isVerified,
					subscription: user.subscription
				}
			}
		});
	} catch (error) {
		console.error("Error in debug premium status:", error);
		res.status(500).json({ 
			success: false, 
			message: "Debug failed",
			error: error.message 
		});
	}
});

// Generic username route (MUST be last among GET routes)
router.get("/:username", optionalAuth, trackActivity, getPublicProfile);

// Export the router
export default router;
