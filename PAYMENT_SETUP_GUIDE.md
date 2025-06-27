# Payment System Setup Guide

This guide will help you set up the complete premium subscription system with Cashfree payment integration.

## 🚀 Quick Start

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install @cashfreepayments/cashfree-js
```

**Backend:**
```bash
cd backend
npm install cashfree-pg
```

**Standalone Payment Server:**
```bash
npm install express cors crypto cashfree-pg dotenv
```

### 2. Environment Variables

Create a `.env` file in your root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lawx

# Server Configuration
NODE_ENV=development
PORT=5000
PAYMENT_PORT=8000

# Frontend URL (for CORS and redirects)
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Cashfree Payment Gateway Configuration
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_ENVIRONMENT=sandbox

# For standalone payment server
REACT_APP_CASHFREE_APP_ID=your_cashfree_app_id_here
REACT_APP_CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
REACT_APP_CASHFREE_ENVIRONMENT=sandbox
REACT_APP_API_URL=http://localhost:8000

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

### 3. Get Cashfree Credentials

1. Go to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/)
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Copy your **App ID** and **Secret Key**
5. Use **Sandbox** environment for development

### 4. Update User Model

Make sure your User model includes subscription fields:

```javascript
// backend/models/user.model.js
const userSchema = new mongoose.Schema({
  // ... existing fields
  isPremium: {
    type: Boolean,
    default: false
  },
  subscription: {
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: null
    },
    startDate: Date,
    endDate: Date,
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String
  }
});
```

## 🔧 Running the System

### Option 1: Integrated Backend

```bash
# Start the main backend server
cd backend
npm run dev

# Start the frontend
cd frontend
npm run dev
```

### Option 2: Standalone Payment Server

```bash
# Start the standalone payment server
node payment-server.js

# Start the main backend server
cd backend
npm run dev

# Start the frontend
cd frontend
npm run dev
```

## 📁 File Structure

```
LawX/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaymentButton.jsx          # Standalone payment button
│   │   │   └── PremiumUpgradeModal.jsx    # Enhanced modal with payment
│   │   └── pages/
│   │       ├── Premium.jsx                # Premium subscription page
│   │       └── PaymentSuccess.jsx         # Payment success handling
│   └── package.json
├── backend/
│   ├── controllers/
│   │   └── payment.controller.js          # Payment logic
│   ├── routes/
│   │   └── payment.route.js               # Payment routes
│   └── models/
│       └── user.model.js                  # Updated with subscription
├── payment-server.js                      # Standalone payment server
└── .env                                   # Environment variables
```

## 🎯 Usage Examples

### 1. Basic Premium Button

```jsx
import PaymentButton from '../components/PaymentButton';

function MyComponent() {
  const handleSuccess = (plan, billingCycle) => {
    console.log('Payment successful!', { plan, billingCycle });
  };

  return (
    <PaymentButton
      planType="monthly"
      user={currentUser}
      onSuccess={handleSuccess}
    />
  );
}
```

### 2. Premium Upgrade Modal

```jsx
import PremiumUpgradeModal from '../components/PremiumUpgradeModal';

function App() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <Button onClick={() => setShowUpgrade(true)}>
        Upgrade to Premium
      </Button>
      
      <PremiumUpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        user={currentUser}
      />
    </>
  );
}
```

### 3. Navigate to Premium Page

```jsx
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate('/premium')}>
      Premium
    </Button>
  );
}
```

## 🔄 Payment Flow

1. **User clicks "Premium" button** → Opens plan selection modal
2. **User selects plan** → Modal shows monthly/yearly options
3. **User clicks "Buy"** → PaymentButton initiates Cashfree payment
4. **Payment processing** → Cashfree modal opens for payment
5. **Payment success** → Verification and user update
6. **Redirect to success page** → Shows confirmation and subscription details

## 🛡️ Security Features

- ✅ CORS protection with allowed origins
- ✅ Payment verification through backend
- ✅ Order ID validation
- ✅ Webhook handling for payment notifications
- ✅ Secure credential handling

## 🐛 Troubleshooting

### Payment Session ID Invalid Error

```
Error: payment_session_id_invalid
```

**Solution:** 
- Check your Cashfree credentials
- Ensure you're using real credentials from Cashfree dashboard
- Verify environment (sandbox vs production)

### CORS Errors

```
Error: Not allowed by CORS
```

**Solution:**
- Add your frontend URL to `allowedOrigins` in payment server
- Check if running on correct ports

### Missing Dependencies

```
Error: Cannot find module '@cashfreepayments/cashfree-js'
```

**Solution:**
```bash
cd frontend
npm install @cashfreepayments/cashfree-js
```

## 📚 API Endpoints

### Backend Routes (`/api/v1/payments`)

- `GET /plans` - Get subscription plans
- `POST /create-order` - Create payment order
- `POST /verify` - Verify payment
- `GET /subscription` - Get user subscription
- `POST /cancel` - Cancel subscription
- `POST /webhook` - Payment webhooks

### Standalone Payment Server

- `GET /test` - Server status
- `GET /pricing` - Get pricing plans
- `POST /payment` - Create payment order
- `POST /verify` - Verify payment
- `POST /webhook` - Payment webhooks

## 🎨 Customization

### Pricing Plans

Update pricing in both:
- `backend/controllers/payment.controller.js`
- `payment-server.js` (if using standalone)

```javascript
const SUBSCRIPTION_PLANS = {
  monthly: {
    price: 5.00,
    currency: 'USD',
    // ... other properties
  },
  yearly: {
    price: 45.00,
    currency: 'USD',
    // ... other properties
  }
};
```

### UI Styling

All components use Chakra UI. Customize by:
- Modifying color schemes
- Updating component props
- Adding custom CSS classes

## 🚀 Production Deployment

1. **Set production environment variables:**
   ```env
   NODE_ENV=production
   CASHFREE_ENVIRONMENT=production
   ```

2. **Update allowed origins** with your production domain

3. **Set production Cashfree credentials**

4. **Update return URLs** to production URLs

## 💡 Tips

- Test payments in sandbox environment first
- Use small amounts for testing (₹1 or $0.01)
- Monitor webhook logs for debugging
- Keep payment logs for audit purposes
- Implement proper error handling and user feedback

## 🔗 Useful Links

- [Cashfree Documentation](https://docs.cashfree.com/)
- [Cashfree JavaScript SDK](https://docs.cashfree.com/docs/javascript-integration)
- [Chakra UI Documentation](https://chakra-ui.com/)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify environment variables
3. Check browser console for errors
4. Review server logs
5. Contact support if needed 