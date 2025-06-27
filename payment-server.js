const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Cashfree, CFEnvironment } = require('cashfree-pg');

require('dotenv').config();

const app = express();
const port = process.env.PAYMENT_PORT || 8000;

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT || process.env.RENDER;

// Comprehensive list of allowed origins - Updated for this project
const allowedOrigins = [
    'https://ehealthreport.site',
    'https://rajyaabhishek.github.io',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',  // Vite default
    'http://localhost:5174',  // Vite alternative
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];

// CORS configuration with proper error handling
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`CORS blocked request from origin: ${origin}`);
            console.log('Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Cashfree
console.log('Configuring Cashfree...');

let cashfreeInstance = null;

try {
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
        const environment = (process.env.CASHFREE_ENVIRONMENT === 'production') 
            ? Cashfree.PRODUCTION 
            : Cashfree.SANDBOX;
        
        // Create Cashfree instance
        cashfreeInstance = new Cashfree(environment, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY);
        
        console.log('✅ Cashfree configured successfully');
        console.log('Environment:', environment);
        console.log('App ID:', process.env.CASHFREE_APP_ID.substring(0, 10) + '...');
    } else {
        console.error('❌ Cashfree credentials not found in environment variables');
        console.log('Please ensure you have set:');
        console.log('- CASHFREE_APP_ID');
        console.log('- CASHFREE_SECRET_KEY');
        console.log('- CASHFREE_ENVIRONMENT');
    }
} catch (error) {
    console.error('❌ Error configuring Cashfree:', error.message);
}

function generateOrderId() {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(uniqueId);
    const orderId = hash.digest('hex');
    return orderId.substr(0, 12);
}

// Pricing configuration - Updated to match backend
const PRICING_PLANS = {
    monthly: {
        price: 5.00,
        currency: 'USD',
        displayPrice: '$5',
        description: 'Premium Monthly Plan',
        billingCycle: 'monthly'
    },
    yearly: {
        price: 50.00,
        currency: 'USD',
        displayPrice: '$50',
        description: 'Premium Yearly Plan',
        billingCycle: 'yearly'
    }
};

// Get pricing information
app.get('/pricing', (req, res) => {
    res.json({
        plans: PRICING_PLANS,
        success: true
    });
});

// Debug endpoint - for development only
app.get('/debug-auth', (req, res) => {
    res.json({
        hasAppId: !!process.env.CASHFREE_APP_ID,
        hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
        environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
        appIdLength: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.length : 0,
        secretLength: process.env.CASHFREE_SECRET_KEY ? process.env.CASHFREE_SECRET_KEY.length : 0,
        appIdStart: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 10) : 'none',
        isPlaceholder: process.env.CASHFREE_APP_ID === 'TEST1048385683912f7d45f93b4c0f8865838401',
        startsWithTestYour: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.startsWith('TEST_YOUR') : false
    });
});

// Handle both GET and POST requests for payment
app.all('/payment', async (req, res) => {
    try {
        const planType = req.query.planType || req.body.planType || 'monthly';
        const userEmail = req.query.userEmail || req.body.userEmail || 'customer@example.com';
        const userName = req.query.userName || req.body.userName || 'Customer Name';
        const userPhone = req.query.userPhone || req.body.userPhone || '9999999999';
        const userId = req.query.userId || req.body.userId || `cust_${Math.floor(Math.random() * 1000000)}`;
        
        // Get pricing based on plan type
        const selectedPlan = PRICING_PLANS[planType];
        if (!selectedPlan) {
            return res.status(400).json({ 
                error: 'Invalid plan type',
                availablePlans: Object.keys(PRICING_PLANS)
            });
        }
        
        const request = {
            "order_amount": selectedPlan.price.toFixed(2),
            "order_currency": selectedPlan.currency,
            "order_id": await generateOrderId(),
            "customer_details": {
                "customer_id": userId,
                "customer_phone": userPhone,
                "customer_name": userName,
                "customer_email": userEmail
            },
            "order_meta": {
                "plan": selectedPlan.description,
                "billing_cycle": selectedPlan.billingCycle,
                "display_price": selectedPlan.displayPrice,
                "return_url": isProduction 
                    ? "https://ehealthreport.site/payment/return?order_id={order_id}" 
                    : "http://localhost:5173/payment/return?order_id={order_id}",
                "notify_url": isProduction 
                    ? `${process.env.SERVER_URL || 'https://ecase.onrender.com'}/webhook` 
                    : `http://localhost:${port}/webhook`
            }
        };

        // Check if using placeholder credentials
        const isUsingPlaceholderCredentials = 
            !process.env.CASHFREE_APP_ID ||
            process.env.CASHFREE_APP_ID === 'TEST1048385683912f7d45f93b4c0f8865838401' ||
            process.env.CASHFREE_APP_ID.startsWith('TEST_YOUR');

        if (isUsingPlaceholderCredentials) {
            console.log('🚧 Using placeholder credentials - returning mock payment session');
            console.log('❌ This will cause "payment_session_id_invalid" error from Cashfree!');
            console.log('');
            console.log('To fix this issue:');
            console.log('1. Go to https://merchant.cashfree.com/');
            console.log('2. Sign up and get your Sandbox credentials');
            console.log('3. Set environment variables:');
            console.log('   CASHFREE_APP_ID=your_real_app_id');
            console.log('   CASHFREE_SECRET_KEY=your_real_secret_key');
            console.log('   CASHFREE_ENVIRONMENT=sandbox');
            console.log('');
            
            return res.status(400).json({
                error: 'Invalid Cashfree credentials',
                message: 'Please set up real Cashfree credentials. See server logs for instructions.',
                details: 'Using placeholder/test credentials that will cause payment_session_id_invalid errors',
                setup_required: true
            });
        }

        // Check if Cashfree is properly configured
        if (!cashfreeInstance) {
            return res.status(500).json({ 
                error: 'Payment gateway not configured',
                details: 'Cashfree instance not initialized'
            });
        }

        cashfreeInstance.PGCreateOrder(request)
            .then(response => {
                res.json({
                    payment_session_id: response.data.payment_session_id,
                    order_id: response.data.order_id,
                    plan: selectedPlan,
                    status: 'OK'
                });
            })
            .catch(error => {
                console.error('Cashfree PGCreateOrder error:', error);
                res.status(500).json({ 
                    error: error.response?.data?.message || 'Failed to create payment order',
                    details: error.response?.data || error.message
                });
            });
    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.post('/verify', async (req, res) => {
    try {
        let { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        if (!cashfreeInstance) {
            return res.status(500).json({ error: 'Payment gateway not configured' });
        }

        cashfreeInstance.PGOrderFetchPayments(orderId).then((response) => {
            res.json(response.data);
        }).catch(error => {
            res.status(500).json({ 
                error: error.response?.data?.message || 'Payment verification failed',
                orderId: orderId,
                details: error.response?.data
            });
        })

    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Webhook endpoint for payment notifications
app.post('/webhook', (req, res) => {
    console.log('Webhook received:', req.body);
    res.status(200).json({ status: 'received' });
});

// Test endpoint to manually trigger subscription update
app.post('/test-subscription', (req, res) => {
    const { plan, billingCycle, userId } = req.body;
    
    res.json({ 
        success: true, 
        message: `Subscription updated to ${plan} (${billingCycle}) for user ${userId}`,
        credits: plan === 'Starter' ? 1000 : 400
    });
});

// Test endpoint to verify CORS and server status
app.get('/test', (req, res) => {
    res.json({
        status: 'Payment Server is running',
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
        allowedOrigins: allowedOrigins,
        requestOrigin: req.get('Origin') || 'No origin header',
        cashfreeConfigured: !!cashfreeInstance
    });
});

app.listen(port, () => {
    console.log(`Payment Server is running on port ${port}`);
    console.log('Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('Allowed origins:', allowedOrigins);
    console.log('Cashfree configured:', !!cashfreeInstance);
    console.log('');
    console.log('Available endpoints:');
    console.log(`- GET  /test                - Server status`);
    console.log(`- GET  /pricing             - Get pricing plans`);
    console.log(`- POST /payment             - Create payment order`);
    console.log(`- POST /verify              - Verify payment`);
    console.log(`- POST /webhook             - Payment webhooks`);
    console.log(`- GET  /debug-auth          - Debug credentials (DEV only)`);
}); 