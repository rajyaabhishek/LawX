import express from "express";
import { login, logout, signup, getCurrentUser, getMe } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createClerkClient } from '@clerk/backend';

const router = express.Router();
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", protectRoute, getMe);
router.get("/profile/:username", getCurrentUser);

// Health check endpoint for Clerk configuration
router.get("/clerk-health", async (req, res) => {
    try {
        const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
        const secretKeyPreview = process.env.CLERK_SECRET_KEY ? 
            process.env.CLERK_SECRET_KEY.substring(0, 10) + '...' : 'Not set';

        res.json({
            clerkConfigured: hasSecretKey,
            secretKeyPreview,
            environment: process.env.NODE_ENV,
            clerkClientInitialized: !!clerkClient
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to check Clerk configuration",
            details: error.message
        });
    }
});

// Debug endpoint to test Clerk integration
router.get("/debug-clerk", protectRoute, async (req, res) => {
    try {
        console.log("Debug endpoint called");
        console.log("req.user:", req.user);
        
        if (!req.user?.clerkId) {
            return res.json({
                error: "No Clerk ID found in request",
                requestUser: req.user,
                hasClerkId: false
            });
        }

        // Try to fetch user from Clerk
        const clerkUser = await clerkClient.users.getUser(req.user.clerkId);
        
        console.log("Clerk user fetched:", {
            id: clerkUser.id,
            publicMetadata: clerkUser.publicMetadata
        });

        res.json({
            success: true,
            clerkUserId: req.user.clerkId,
            currentMetadata: clerkUser.publicMetadata,
            fullClerkUser: clerkUser
        });
    } catch (error) {
        console.error("Debug endpoint error:", error);
        res.status(500).json({
            error: error.message,
            requestUser: req.user
        });
    }
});

// Test endpoint to manually update metadata
router.post("/test-update-metadata", protectRoute, async (req, res) => {
    try {
        if (!req.user?.clerkId) {
            return res.status(400).json({
                error: "No Clerk ID found"
            });
        }

        console.log("Attempting to update metadata for user:", req.user.clerkId);

        const testSubscription = {
            plan: 'monthly',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paymentId: 'test_payment_' + Date.now(),
            orderId: 'test_order_' + Date.now(),
            amount: 399,
            currency: 'INR'
        };

        await clerkClient.users.updateUserMetadata(req.user.clerkId, {
            publicMetadata: {
                isPremium: true,
                subscription: testSubscription,
                testUpdate: true,
                lastUpdated: new Date().toISOString()
            }
        });

        // Fetch updated user to verify
        const updatedUser = await clerkClient.users.getUser(req.user.clerkId);

        res.json({
            success: true,
            message: "Metadata updated successfully",
            newMetadata: updatedUser.publicMetadata
        });
    } catch (error) {
        console.error("Test update error:", error);
        res.status(500).json({
            error: error.message,
            details: error.response?.data || error.toString()
        });
    }
});

export default router;
