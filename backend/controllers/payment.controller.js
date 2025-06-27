import crypto from 'crypto';
import { Cashfree } from 'cashfree-pg';
import { createClerkClient } from '@clerk/backend';
import User from '../models/user.model.js';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Initialize Cashfree - Using unified variable names for frontend/backend compatibility
const cashfreeAppId = process.env.REACT_APP_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID;
const cashfreeSecretKey = process.env.REACT_APP_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
const cashfreeEnvironment = process.env.REACT_APP_CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENVIRONMENT;

if (!cashfreeAppId || !cashfreeSecretKey) {
    console.error('❌ Cashfree credentials not found in environment variables');
    console.log('Please ensure you have set:');
    console.log('- REACT_APP_CASHFREE_APP_ID');
    console.log('- REACT_APP_CASHFREE_SECRET_KEY');
    console.log('- REACT_APP_CASHFREE_ENVIRONMENT');
} else {
    Cashfree.XClientId = cashfreeAppId;
    Cashfree.XClientSecret = cashfreeSecretKey;
    Cashfree.XEnvironment = process.env.NODE_ENV === 'production' 
        ? Cashfree.Environment.PRODUCTION 
        : Cashfree.Environment.SANDBOX;
    console.log('✅ Cashfree configured successfully');
    console.log(`App ID: ${cashfreeAppId.substring(0, 10)}...`);
    console.log(`Environment: ${cashfreeEnvironment || 'sandbox'}`);
}

// Subscription plans with pricing
// Supported Cashfree currencies: INR, USD (limited), EUR, GBP, AUD, CAD, SGD
// For Indian accounts, INR is recommended and most widely supported
const SUBSCRIPTION_PLANS = {
    monthly: {
        id: 'monthly',
        name: 'Monthly Premium',
        price: 5.00, // USD price
        currency: 'USD',
        duration: 30, // days
        description: 'Monthly premium subscription with full access to all features'
    },
    yearly: {
        id: 'yearly',
        name: 'Yearly Premium',
        price: 50.00, // USD price
        currency: 'USD',
        duration: 365, // days
        description: 'Yearly premium subscription with full access to all features (Save 25%!)'
    }
};

function generateOrderId() {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(uniqueId);
    const orderId = hash.digest('hex');
    return orderId.substr(0, 12);
}

export const getSubscriptionPlans = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            plans: SUBSCRIPTION_PLANS
        });
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch subscription plans" 
        });
    }
};

export const getUserSubscription = async (req, res) => {
    try {
        const userId = req.user.clerkId;
        const user = await clerkClient.users.getUser(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const subscription = user.publicMetadata?.subscription || null;
        const isPremium = user.publicMetadata?.isPremium || false;

        res.status(200).json({
            success: true,
            subscription: subscription,
            isPremium: isPremium
        });
    } catch (error) {
        console.error("Error fetching user subscription:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch subscription details" 
        });
    }
};

export const createPaymentOrder = async (req, res) => {
    try {
        // Check if Cashfree is properly configured
        if (!cashfreeAppId || !cashfreeSecretKey) {
            return res.status(500).json({
                success: false,
                message: "Payment gateway not configured. Please set up Cashfree credentials.",
                details: "Missing REACT_APP_CASHFREE_APP_ID or REACT_APP_CASHFREE_SECRET_KEY environment variables"
            });
        }

        const { planId } = req.body;
        const userId = req.user?.clerkId || req.user?._id; // Fallback to MongoDB _id if clerkId not available

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        if (!planId || !SUBSCRIPTION_PLANS[planId]) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription plan"
            });
        }

        let clerkUser = null;
        let customerDetails = {
            customer_id: userId,
            customer_phone: "9999999999",
            customer_name: "Customer",
            customer_email: "customer@example.com"
        };

        // Try to get user details from Clerk if clerkId is available
        if (req.user?.clerkId) {
            try {
                clerkUser = await clerkClient.users.getUser(req.user.clerkId);
                customerDetails = {
                    customer_id: req.user.clerkId,
                    customer_phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || "9999999999",
                    customer_name: clerkUser.fullName || clerkUser.firstName || "Customer",
                    customer_email: clerkUser.emailAddresses?.[0]?.emailAddress || "customer@example.com"
                };
            } catch (clerkError) {
                console.log("Failed to fetch Clerk user, using fallback data:", clerkError.message);
                // Use fallback data from MongoDB user
                customerDetails = {
                    customer_id: userId,
                    customer_phone: req.user.phone || "9999999999",
                    customer_name: req.user.name || "Customer",
                    customer_email: req.user.email || "customer@example.com"
                };
            }
        } else {
            // Use MongoDB user data as fallback
            customerDetails = {
                customer_id: userId,
                customer_phone: req.user.phone || "9999999999",
                customer_name: req.user.name || "Customer",
                customer_email: req.user.email || "customer@example.com"
            };
        }
        
        const plan = SUBSCRIPTION_PLANS[planId];
        const orderId = generateOrderId();

        const request = {
            "order_amount": plan.price,
            "order_currency": plan.currency,
            "order_id": orderId,
            "customer_details": customerDetails,
            "order_meta": {
                "plan": planId,
                "plan_name": plan.name,
                "user_id": userId,
                "return_url": process.env.NODE_ENV === 'production'
                    ? `${process.env.CLIENT_URL}/premium/success?order_id={order_id}`
                    : `http://localhost:5173/premium/success?order_id={order_id}`,
                "notify_url": process.env.NODE_ENV === 'production'
                    ? `${process.env.SERVER_URL}/api/v1/payments/webhook`
                    : "http://localhost:5000/api/v1/payments/webhook"
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        
        if (response.data) {
            res.status(200).json({
                success: true,
                payment_session_id: response.data.payment_session_id,
                order_id: response.data.order_id,
                plan: plan
            });
        } else {
            throw new Error('Invalid response from payment gateway');
        }

    } catch (error) {
        console.error("Error creating payment order:", error);
        res.status(500).json({ 
            success: false,
            message: error.response?.data?.message || "Failed to create payment order",
            details: error.response?.data || error.message
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.clerkId || req.user?._id;

        if (!orderId) {
            return res.status(400).json({ 
                success: false,
                message: 'Order ID is required' 
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        // Fetch payment details from Cashfree
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        const payments = response.data;

        if (!payments || payments.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No payment found for this order' 
            });
        }

        const payment = payments[0];
        
        if (payment.payment_status === 'SUCCESS') {
            console.log('🎉 Payment verification: Payment successful!');
            console.log('💳 Payment details:', {
                status: payment.payment_status,
                amount: payment.order_amount,
                orderId: orderId,
                paymentId: payment.cf_payment_id
            });
            
            let user = null;
            
            // Try to get user from Clerk if clerkId is available
            if (req.user?.clerkId) {
                console.log('🔍 Fetching Clerk user for payment verification:', req.user.clerkId);
                try {
                    user = await clerkClient.users.getUser(req.user.clerkId);
                    console.log('✅ Clerk user fetched successfully:', {
                        id: user.id,
                        currentMetadata: user.publicMetadata
                    });
                } catch (clerkError) {
                    console.error("❌ Failed to fetch Clerk user during payment verification:", clerkError.message);
                    // Continue with verification using MongoDB user data
                }
            } else {
                console.log('❌ No clerkId found in req.user:', req.user);
            }

            // Determine plan from order meta or amount
            let planId = 'monthly';
            let plan = SUBSCRIPTION_PLANS.monthly;
            
            if (payment.order_amount >= SUBSCRIPTION_PLANS.yearly.price) {
                planId = 'yearly';
                plan = SUBSCRIPTION_PLANS.yearly;
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.duration);

            // Create subscription object
            const subscription = {
                plan: planId,
                status: 'active',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                paymentId: payment.cf_payment_id,
                orderId: orderId,
                amount: payment.order_amount,
                currency: payment.order_currency
            };

            console.log('📋 Subscription object created:', subscription);

            // Update user's metadata in Clerk if possible, otherwise store in MongoDB
            if (req.user?.clerkId && user) {
                try {
                    console.log(`🔄 Attempting Clerk metadata update for user ${req.user.clerkId}:`);
                    console.log('📋 Current metadata:', user.publicMetadata);
                    console.log('📋 New metadata to apply:', {
                        isPremium: true,
                        subscription: subscription
                    });
                    
                    // Use the correct Clerk SDK method
                    const updatedUser = await clerkClient.users.updateUserMetadata(req.user.clerkId, {
                        publicMetadata: {
                            ...user.publicMetadata,
                            isPremium: true,
                            subscription: subscription
                        }
                    });
                    
                    console.log('✅ Clerk metadata updated successfully!');
                    console.log('✅ Updated user metadata:', updatedUser.publicMetadata);
                } catch (clerkError) {
                    console.error("❌ Failed to update Clerk metadata:", {
                        message: clerkError.message,
                        stack: clerkError.stack,
                        response: clerkError.response?.data,
                        userId: req.user.clerkId
                    });
                    console.log("Falling back to MongoDB storage...");
                    
                    // Fallback: update MongoDB user record
                    if (req.user._id) {
                        await User.findByIdAndUpdate(req.user._id, {
                            isPremium: true,
                            subscription: subscription
                        });
                        console.log('✅ MongoDB user record updated as fallback');
                    } else {
                        console.log('❌ No MongoDB _id available for fallback');
                    }
                }
            } else {
                console.log('❌ No Clerk user found for metadata update:', {
                    hasClerkId: !!req.user?.clerkId,
                    hasClerkUser: !!user,
                    clerkId: req.user?.clerkId
                });
                
                // Update MongoDB user record directly
                if (req.user._id) {
                    await User.findByIdAndUpdate(req.user._id, {
                        isPremium: true,
                        subscription: subscription
                    });
                    console.log('✅ MongoDB user record updated directly');
                } else {
                    console.log('❌ No MongoDB _id available');
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified and subscription activated successfully',
                subscription: subscription,
                isPremium: true
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                status: payment.payment_status
            });
        }

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ 
            success: false,
            message: error.response?.data?.message || 'Payment verification failed',
            details: error.response?.data || error.message
        });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        // Handle Cashfree webhook notifications
        const webhookData = req.body;
        
        console.log('Webhook received:', webhookData);
        
        // Process webhook based on event type
        if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
            const { order_id, payment_status, order_amount } = webhookData.data;
            
            if (payment_status === 'SUCCESS') {
                // Find user by order metadata or customer details
                // This would typically be handled more robustly with stored order data
                console.log(`Payment successful for order: ${order_id}`);
            }
        }

        res.status(200).json({ status: 'received' });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(200).json({ status: 'error' });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user?.clerkId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });
        }

        let user = null;
        let currentSubscription = null;

        // Try to get user from Clerk if clerkId is available
        if (req.user?.clerkId) {
            try {
                user = await clerkClient.users.getUser(req.user.clerkId);
                currentSubscription = user.publicMetadata?.subscription;
            } catch (clerkError) {
                console.log("Failed to fetch Clerk user during cancellation:", clerkError.message);
                // Fallback to MongoDB user data
            }
        }

        // If no subscription from Clerk, check MongoDB user data
        if (!currentSubscription && req.user?.subscription) {
            currentSubscription = req.user.subscription;
        }

        if (!currentSubscription) {
            return res.status(400).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        // Update subscription status in Clerk metadata or MongoDB
        const updatedSubscription = {
            ...currentSubscription,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        };

        if (req.user?.clerkId && user) {
            try {
                await clerkClient.users.updateUserMetadata(req.user.clerkId, {
                    publicMetadata: {
                        ...user.publicMetadata,
                        isPremium: false,
                        subscription: updatedSubscription
                    }
                });
            } catch (clerkError) {
                console.log("Failed to update Clerk metadata during cancellation:", clerkError.message);
                // Fallback: update MongoDB user record
                await User.findByIdAndUpdate(req.user._id, {
                    isPremium: false,
                    subscription: updatedSubscription
                });
            }
        } else {
            // Update MongoDB user record directly
            await User.findByIdAndUpdate(req.user._id, {
                isPremium: false,
                subscription: updatedSubscription
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: updatedSubscription
        });

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        res.status(500).json({ 
            success: false,
            message: error.response?.data?.message || 'Failed to cancel subscription',
            details: error.response?.data || error.message
        });
    }
}; 