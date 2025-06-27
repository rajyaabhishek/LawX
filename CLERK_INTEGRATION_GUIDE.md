# Clerk Authentication Integration Guide

## 🎯 Overview

This guide covers the complete integration of Clerk authentication with your premium subscription system. Clerk will handle user authentication and store premium subscription data in user metadata.

## 🔧 Setup Steps

### 1. Environment Variables

#### Frontend (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZW1lcmdpbmctdmVydmV0LTg3LmNsZXJrLmFjY291bnRzLmRldiQ
```

#### Backend (.env)
```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_ZW1lcmdpbmctdmVydmV0LTg3LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_OJpknejUtH5Tt2nV8SMaEtkktUJdlgqeJrKlJZiabI

# Cashfree Payment Gateway
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_ENVIRONMENT=sandbox

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

### 2. Dependencies Installed

#### Frontend
- `@clerk/clerk-react` - Clerk authentication for React
- `@cashfreepayments/cashfree-js` - Cashfree payment SDK

#### Backend
- `@clerk/backend` - Clerk backend SDK for session verification
- `cashfree-pg` - Cashfree payment gateway integration

## 📁 Files Created/Modified

### Frontend Components Updated

#### 1. `main.jsx` - Clerk Provider Setup
```jsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = 'pk_test_ZW1lcmdpbmctdmVydmV0LTg3LmNsZXJrLmFjY291bnRzLmRldiQ';

<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
  {/* Your app */}
</ClerkProvider>
```

#### 2. `App.jsx` - Authentication Flow
```jsx
import { useUser } from '@clerk/clerk-react';

function App() {
  const { isSignedIn, isLoaded } = useUser();
  
  return (
    <ClerkAxiosProvider>
      {/* Routes with isSignedIn checks */}
    </ClerkAxiosProvider>
  );
}
```

#### 3. `PaymentButton.jsx` - Updated for Clerk
```jsx
import { useUser } from '@clerk/clerk-react';

const PaymentButton = ({ planType, onSuccess }) => {
  const { isSignedIn, user } = useUser();
  
  // Payment logic using Clerk user data
};
```

#### 4. `Premium.jsx` - Clerk Metadata Integration
```jsx
const Premium = () => {
  const { user } = useUser();
  
  // Get premium status from Clerk metadata
  const isPremium = user?.publicMetadata?.isPremium || false;
  const subscription = user?.publicMetadata?.subscription || null;
};
```

#### 5. `ClerkAxiosProvider.jsx` - Token Management
```jsx
import { useAuth } from '@clerk/clerk-react';

const ClerkAxiosProvider = ({ children }) => {
  const { getToken } = useAuth();
  
  // Configure axios with Clerk tokens
};
```

### Backend Integration

#### 1. `clerk.middleware.js` - Authentication Middleware
```javascript
import { ClerkExpressRequireAuth } from '@clerk/backend';

export const requireAuth = ClerkExpressRequireAuth();
export const extractClerkUser = async (req, res, next) => {
  req.user = { clerkId: req.auth.userId };
  next();
};
```

#### 2. `payment.controller.js` - Clerk Metadata Storage
```javascript
import { clerkClient } from '@clerk/backend';

// Store subscription in Clerk metadata
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    isPremium: true,
    subscription: subscriptionData
  }
});
```

## 🔄 Authentication Flow

### 1. User Sign In/Up
```jsx
// Clerk handles authentication automatically
// Users can sign in with email, phone, or social providers
```

### 2. Session Management
```jsx
// Clerk manages sessions and tokens
const { isSignedIn, user, isLoaded } = useUser();
```

### 3. API Authentication
```jsx
// Axios automatically includes Clerk session tokens
const response = await axiosInstance.post('/payments/create-order', { planId });
```

### 4. Backend Verification
```javascript
// Clerk middleware verifies session tokens
app.use('/api/v1/payments', protectRoute, paymentRoutes);
```

## 💾 Data Storage

### Clerk User Metadata Structure
```javascript
{
  publicMetadata: {
    isPremium: boolean,
    subscription: {
      plan: 'monthly' | 'yearly',
      status: 'active' | 'cancelled' | 'expired',
      startDate: string (ISO),
      endDate: string (ISO),
      paymentId: string,
      orderId: string,
      amount: number,
      currency: string
    }
  }
}
```

### Benefits of Clerk Metadata
- ✅ **Automatic Sync** - Available in frontend immediately
- ✅ **No Database Queries** - Reduced backend load
- ✅ **Global Access** - Available wherever user object is
- ✅ **Real-time Updates** - Clerk handles synchronization

## 🎯 Usage Examples

### 1. Check Premium Status
```jsx
import { useUser } from '@clerk/clerk-react';

function PremiumFeature() {
  const { user } = useUser();
  const isPremium = user?.publicMetadata?.isPremium;
  
  if (!isPremium) {
    return <UpgradePrompt />;
  }
  
  return <PremiumContent />;
}
```

### 2. Show Subscription Details
```jsx
function SubscriptionInfo() {
  const { user } = useUser();
  const subscription = user?.publicMetadata?.subscription;
  
  if (!subscription) {
    return <NoSubscription />;
  }
  
  return (
    <div>
      <h3>Your Subscription</h3>
      <p>Plan: {subscription.plan}</p>
      <p>Status: {subscription.status}</p>
      <p>Expires: {new Date(subscription.endDate).toLocaleDateString()}</p>
    </div>
  );
}
```

### 3. Conditional Rendering
```jsx
function Navigation() {
  const { user, isSignedIn } = useUser();
  const isPremium = user?.publicMetadata?.isPremium;
  
  return (
    <nav>
      <Link to="/">Home</Link>
      {isSignedIn && (
        <>
          <Link to="/cases">Cases</Link>
          {isPremium && <Link to="/premium-features">Premium</Link>}
        </>
      )}
    </nav>
  );
}
```

### 4. Payment Success Handling
```jsx
function handlePaymentSuccess(plan, billingCycle) {
  // Clerk will automatically update user metadata
  // Component will re-render with new premium status
  toast.success('Welcome to Premium!');
}
```

## 🔒 Security Features

### Frontend Security
- ✅ **Session Management** - Clerk handles token refresh automatically
- ✅ **Route Protection** - `isSignedIn` checks on protected routes
- ✅ **Automatic Logout** - Session expires based on Clerk settings

### Backend Security
- ✅ **Token Verification** - Clerk middleware verifies JWT tokens
- ✅ **User Extraction** - Safe user ID extraction from verified tokens
- ✅ **Metadata Protection** - Only authenticated users can update their data

## 🚀 Migration from JWT

### What Changed
1. **Authentication**: JWT → Clerk sessions
2. **User Storage**: Database → Clerk metadata
3. **Token Management**: Manual → Automatic
4. **Session Handling**: Custom → Clerk managed

### Migration Benefits
1. **Simplified Code** - Less auth boilerplate
2. **Better UX** - Automatic session management
3. **Scalability** - No database queries for user data
4. **Security** - Industry-standard implementation

## 🎯 Testing

### Manual Testing Checklist
- [ ] User can sign up with Clerk
- [ ] User can sign in with Clerk
- [ ] Premium status shows correctly after payment
- [ ] Subscription data appears in user metadata
- [ ] Protected routes work with Clerk authentication
- [ ] Payment flow completes successfully
- [ ] Axios requests include Clerk tokens

### Development Testing
```javascript
// Test user metadata in development
console.log('User metadata:', user?.publicMetadata);
console.log('Is Premium:', user?.publicMetadata?.isPremium);
console.log('Subscription:', user?.publicMetadata?.subscription);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Missing Publishable Key" Error
```
Solution: Set VITE_CLERK_PUBLISHABLE_KEY in frontend/.env
```

#### 2. Authentication Not Working
```
Solution: Ensure ClerkProvider wraps your app in main.jsx
```

#### 3. API Calls Unauthorized
```
Solution: Check ClerkAxiosProvider is wrapping your routes
```

#### 4. Metadata Not Updating
```
Solution: Verify backend is using clerkClient.users.updateUserMetadata()
```

### Debug Commands
```javascript
// Check Clerk configuration
console.log('Clerk loaded:', isLoaded);
console.log('User signed in:', isSignedIn);
console.log('User object:', user);

// Check axios configuration
console.log('Axios defaults:', axiosInstance.defaults);
```

## 🌟 Best Practices

### 1. Error Handling
```jsx
const { user, isLoaded } = useUser();

if (!isLoaded) {
  return <Loading />;
}

if (!user) {
  return <SignInPrompt />;
}
```

### 2. Metadata Updates
```javascript
// Always spread existing metadata
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    ...user.publicMetadata,
    isPremium: true,
    subscription: newSubscription
  }
});
```

### 3. Type Safety
```typescript
interface UserMetadata {
  isPremium?: boolean;
  subscription?: {
    plan: 'monthly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
  };
}
```

## 🎉 Conclusion

Your LawX application now uses Clerk for authentication with premium subscription data stored in user metadata. This provides:

- ✅ **Simplified Authentication** - No more JWT management
- ✅ **Real-time Premium Status** - Available immediately in frontend
- ✅ **Secure Payment Processing** - Clerk tokens for API calls
- ✅ **Scalable Architecture** - No database queries for user data
- ✅ **Better User Experience** - Seamless authentication flow

The system is now ready for production with enterprise-grade authentication and subscription management! 