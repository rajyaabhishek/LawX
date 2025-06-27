# 🔧 Fix Payment Gateway - Step by Step Instructions

## 🚨 Current Issue
Your Cashfree payment gateway is not working because the environment variables are not loaded properly.

## ✅ Solution Steps

### Step 1: Get Cashfree Credentials

1. **Go to Cashfree Dashboard**: https://merchant.cashfree.com/
2. **Sign Up/Login** to your account
3. **Navigate to**: Dashboard → Developers → API Keys
4. **Select Environment**: Sandbox (for testing)
5. **Copy your credentials**:
   - App ID (looks like: `CF12345ABCDEFGH`)
   - Secret Key (looks like: `cfsk_ma_test_abc123xyz789...`)

### Step 2: Create/Update .env File

1. **Open your project root directory**: `C:\Users\abhis\Desktop\duplicate\LawX\`
2. **Create a file named**: `.env` (exactly, with the dot at the beginning)
3. **Copy this content** and replace the placeholder values:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lawx

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Environment
NODE_ENV=development

# Server Configuration
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
PORT=5000

# Cashfree Payment Gateway Configuration
CASHFREE_APP_ID=YOUR_ACTUAL_CASHFREE_APP_ID_HERE
CASHFREE_SECRET_KEY=YOUR_ACTUAL_CASHFREE_SECRET_KEY_HERE
CASHFREE_ENVIRONMENT=sandbox
```

### Step 3: Replace Placeholder Values

**Replace these with your actual values:**
- `YOUR_ACTUAL_CASHFREE_APP_ID_HERE` → Your actual Cashfree App ID
- `YOUR_ACTUAL_CASHFREE_SECRET_KEY_HERE` → Your actual Cashfree Secret Key
- `your_super_secret_jwt_key_here_make_it_long_and_random` → Any long random string

### Step 4: Test the Configuration

Run this command to verify your setup:
```bash
node debug-env.js
```

You should see:
```
✅ Cashfree credentials are configured!
```

### Step 5: Start Your Application

1. **Backend**: `npm run dev`
2. **Frontend**: `cd frontend && npm run dev`

### Step 6: Test Payment

1. Go to `http://localhost:5173/premium`
2. Click on "Buy $5/month" or "Buy $45/year"
3. The Cashfree payment modal should now open

## 🧪 Testing with Sandbox

Use these test credentials in Cashfree sandbox:

- **Test Card**: 4111 1111 1111 1111
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)
- **OTP**: 123456

## 🔍 Troubleshooting

### If payment modal still doesn't open:

1. **Check browser console** for error messages
2. **Check backend terminal** for error logs
3. **Run debug script again**: `node debug-env.js`
4. **Verify .env file location**: Must be in root directory, not in backend folder

### Common Issues:

- ❌ `.env` file in wrong location (should be in root, not backend folder)
- ❌ Spaces around the `=` sign in .env file
- ❌ Using placeholder credentials instead of real ones
- ❌ Quotes around values in .env file (don't use quotes)

## 📞 Need Help?

If you're still having issues:

1. Run `node debug-env.js` and share the output
2. Check if the `.env` file exists in the correct location
3. Verify your Cashfree credentials are from the sandbox environment

## 🎯 Expected Result

After following these steps:
- ✅ Environment variables will load correctly
- ✅ Payment button will work
- ✅ Cashfree modal will open when clicked
- ✅ Test payments will process successfully 