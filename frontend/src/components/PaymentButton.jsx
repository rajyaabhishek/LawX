import React, { useState } from 'react';
import { Button, Text, Alert, AlertIcon, VStack } from '@chakra-ui/react';
import { useUser } from '@clerk/clerk-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const PaymentButton = ({ 
  planType, 
  onSuccess, 
  className,
  isLoading: externalLoading = false,
  ...buttonProps 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isSignedIn, user, isLoaded } = useUser();

  // Display pricing in USD for better UX, but backend processes in INR for Cashfree compatibility
  const PRICING = {
    monthly: {
      // displayPrice: '$5/month',
      displayCurrency: 'USD',
      backendPrice: 415.00, // INR equivalent processed by backend
      backendCurrency: 'INR',
      description: 'Monthly Premium',
      savings: null
    },
    yearly: {
      // displayPrice: '$50/year',
      displayCurrency: 'USD', 
      backendPrice: 4150.00, // INR equivalent processed by backend
      backendCurrency: 'INR',
      description: 'Yearly Premium',
      savings: 'Save $10!'
    }
  };

  const selectedPlan = PRICING[planType];

  // Function to handle subscription success
  const handleSubscriptionSuccess = async (plan, billingCycle) => {
    let subscriptionUpdated = false;
    
    if (onSuccess) {
      try {
        await onSuccess(plan, billingCycle);
        subscriptionUpdated = true;
      } catch (callbackError) {
        console.error('Callback error:', callbackError);
      }
    }
    
    // Check for global success handler
    if (!subscriptionUpdated && typeof window !== 'undefined' && window.handleSubscriptionSuccess) {
      try {
        await window.handleSubscriptionSuccess(plan, billingCycle);
        subscriptionUpdated = true;
      } catch (globalError) {
        console.error('Global error:', globalError);
      }
    }
    
    if (subscriptionUpdated) {
      // Dispatch custom event for other components to listen
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
          detail: { plan, billingCycle, success: true }
        }));
      }
      return true;
    } else {
      return false;
    }
  };

  const handlePayment = async () => {
    if (!isSignedIn || !user) {
      setError('Please sign in to make a payment');
      toast.error('Please sign in to make a payment');
      return;
    }

    if (!selectedPlan) {
      setError('Invalid plan selected');
      toast.error('Invalid plan selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    let notificationShown = false;
    
    try {
      // Load Cashfree SDK
      const { load } = await import('@cashfreepayments/cashfree-js');
      
      // Initialize Cashfree with environment mode
      const mode = import.meta.env.MODE === 'production' ? 'production' : 'sandbox';
      console.log('🔧 Cashfree mode:', mode);
      
      const cashfree = await load({
        mode: mode
      });

      if (!cashfree) {
        throw new Error('Failed to load Cashfree SDK');
      }

      console.log('Cashfree SDK loaded successfully');

      // Create payment order using existing backend
      const orderResponse = await axiosInstance.post('/payments/create-order', {
        planId: planType
      });

      const orderData = orderResponse.data;
      console.log('Order created successfully:', orderData);
      
      if (!orderData.payment_session_id) {
        throw new Error('Invalid response from payment server: missing payment_session_id');
      }
      
      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal',
        onSuccess: async (data) => {
          console.log('Payment success callback:', data);
          setIsLoading(false);
          
          try {
            // Verify payment using existing backend
            const verifyResponse = await axiosInstance.post('/payments/verify', {
              orderId: orderData.order_id
            });
            
            const verificationResult = verifyResponse.data;
            console.log('Verification result:', verificationResult);
            
            if (verificationResult.success) {
              // Force refresh of user data from Clerk
              if (typeof window !== 'undefined' && window.Clerk) {
                try {
                  await window.Clerk.user.reload();
                  console.log('User data refreshed successfully');
                } catch (refreshError) {
                  console.warn('Failed to refresh user data:', refreshError);
                }
              }
              
              notificationShown = await handleSubscriptionSuccess(
                selectedPlan.description, 
                planType
              );
              
              toast.success('Payment successful! Your subscription is now active.');
              
              // Additional delay to ensure UI updates
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        onFailure: (data) => {
          console.log('Payment failure callback:', data);
          setIsLoading(false);
          setError('Payment failed. Please try again.');
          toast.error('Payment failed. Please try again.');
        },
        onClose: () => {
          console.log('Payment modal closed');
          setIsLoading(false);
        }
      };

      console.log('Initiating Cashfree checkout with options:', checkoutOptions);
      
      // Use the checkout method
      const result = await cashfree.checkout(checkoutOptions);
      console.log('Checkout result:', result);
      
      // Handle cases where success callback isn't triggered
      if (result && result.paymentDetails && 
          result.paymentDetails.paymentMessage === 'Payment finished. Check status.' && 
          !notificationShown) {
        try {
          const verifyResponse = await axiosInstance.post('/payments/verify', {
            orderId: orderData.order_id
          });

          if (verifyResponse.data.success) {
            // Force refresh of user data from Clerk
            if (typeof window !== 'undefined' && window.Clerk) {
              try {
                await window.Clerk.user.reload();
                console.log('User data refreshed successfully');
              } catch (refreshError) {
                console.warn('Failed to refresh user data:', refreshError);
              }
            }
            
            await handleSubscriptionSuccess(
              selectedPlan.description, 
              planType
            );
            toast.success('Payment successful! Your subscription is now active.');
            
            // Additional delay to ensure UI updates
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } catch (manualVerifyError) {
          console.error('Manual verification error:', manualVerifyError);
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(`Payment failed: ${error.response?.data?.message || error.message}`);
      toast.error(`Payment failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const finalLoading = isLoading || externalLoading;
  const isDisabled = finalLoading || !isSignedIn;

  return (
    <VStack spacing={3} align="stretch">
      <Button
        onClick={handlePayment}
        disabled={isDisabled}
        isLoading={finalLoading}
        loadingText="Processing..."
        colorScheme="blue"
        size="lg"
        className={className}
        {...buttonProps}
      >
        {finalLoading 
          ? 'Processing...' 
          : !isSignedIn 
            ? 'Sign In Required' 
            : selectedPlan
              ? `Buy`
              : `Buy`
        }
      </Button>
      
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      )}
      
      {!isSignedIn && (
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Please sign in to purchase a subscription
        </Text>
      )}
    </VStack>
  );
};

export default PaymentButton; 