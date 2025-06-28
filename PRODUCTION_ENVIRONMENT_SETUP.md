# Production Environment Setup for Render

## 🎯 Issue Fixed
**Problem**: Payment gateway was receiving `http://localhost:5173` URLs instead of production HTTPS URLs.
**Solution**: Updated hardcoded URLs to use `https://lawx.onrender.com` for production.

## 🔧 Changes Made

### 1. Updated Payment Controller (`backend/controllers/payment.controller.js`)
- Fixed return URL: `https://lawx.onrender.com/premium/success?order_id={order_id}`
- Fixed webhook URL: `https://lawx.onrender.com/api/v1/payments/webhook`

### 2. Updated Payment Server (`payment-server.js`)
- Fixed return URL: `https://lawx.onrender.com/premium/success?order_id={order_id}`
- Fixed webhook URL: `https://lawx.onrender.com/api/v1/payments/webhook`

## 🌐 Render Environment Variables Setup

Set these environment variables in your Render dashboard:

### Required Environment Variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Environment
NODE_ENV=production

# URLs
CLIENT_URL=https://lawx.onrender.com
SERVER_URL=https://lawx.onrender.com

# Cashfree Payment Gateway (Production)
CASHFREE_APP_ID=your_production_cashfree_app_id
CASHFREE_SECRET_KEY=your_production_cashfree_secret_key
CASHFREE_ENVIRONMENT=production

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (if using)
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_ENDPOINT=your_mailtrap_endpoint
```

### How to Set Environment Variables on Render:

1. Go to your Render dashboard: https://dashboard.render.com/
2. Select your backend service
3. Go to "Environment" tab
4. Add each environment variable listed above
5. Click "Save Changes"
6. Your service will automatically redeploy

## 🚀 Testing the Fix

After setting the environment variables:

1. **Deploy and wait** for the build to complete
2. **Test payment flow**:
   - Go to https://lawx.onrender.com/premium
   - Initiate a payment
   - Check the browser console for payment URLs
   - Verify the return URL is HTTPS

3. **Check logs** for confirmation:
   ```bash
   💳 Payment order request: {
     returnUrl: 'https://lawx.onrender.com/premium/success?order_id=...',
     notifyUrl: 'https://lawx.onrender.com/api/v1/payments/webhook'
   }
   ```

## 🔍 Troubleshooting

### If payment still fails:

1. **Check Render logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for payment-related errors

2. **Verify Cashfree settings**:
   - Ensure you're using **production** credentials
   - Check if your Cashfree account is verified for production
   - Verify webhook URLs in Cashfree dashboard

3. **Check environment variables**:
   - Ensure all required variables are set
   - Verify no trailing spaces or special characters
   - Confirm CASHFREE_ENVIRONMENT=production

### Common Issues:

- **"Invalid session"**: Wrong Cashfree credentials
- **"Webhook failed"**: Check webhook URL accessibility
- **"CORS error"**: Verify CLIENT_URL matches your frontend domain

## ✅ Success Indicators

You'll know it's working when:
- Payment URLs in logs show `https://lawx.onrender.com`
- Payment gateway opens successfully
- Payments complete and redirect properly
- Webhooks are received and processed

## 📞 Support

If issues persist:
1. Check Render service logs
2. Verify Cashfree dashboard settings
3. Test with Cashfree sandbox first
4. Contact Cashfree support if needed 