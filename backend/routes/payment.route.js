import express from "express";
import { 
    createPaymentOrder, 
    verifyPayment, 
    handleWebhook,
    getSubscriptionPlans,
    getUserSubscription,
    cancelSubscription
} from "../controllers/payment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get available subscription plans
router.get("/plans", getSubscriptionPlans);

// Debug endpoint - check Cashfree configuration
router.get("/debug", (req, res) => {
    const cashfreeAppId = process.env.REACT_APP_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
    const cashfreeSecretKey = process.env.REACT_APP_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
    const cashfreeEnvironment = process.env.REACT_APP_CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENVIRONMENT;
    
    res.json({
        hasAppId: !!cashfreeAppId,
        hasSecretKey: !!cashfreeSecretKey,
        appIdLength: cashfreeAppId ? cashfreeAppId.length : 0,
        secretLength: cashfreeSecretKey ? cashfreeSecretKey.length : 0,
        environment: cashfreeEnvironment || 'not set',
        appIdStart: cashfreeAppId ? cashfreeAppId.substring(0, 10) + '...' : 'none',
        variables: {
            REACT_APP_CASHFREE_APP_ID: !!process.env.REACT_APP_CASHFREE_APP_ID,
            CASHFREE_APP_ID: !!process.env.CASHFREE_APP_ID,
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Get user's current subscription
router.get("/subscription", protectRoute, getUserSubscription);

// Create payment order for premium subscription
router.post("/create-order", protectRoute, createPaymentOrder);

// Verify payment after completion
router.post("/verify", protectRoute, verifyPayment);

// Handle payment webhooks from Cashfree
router.post("/webhook", handleWebhook);

// Cancel subscription
router.post("/cancel", protectRoute, cancelSubscription);

export default router; 