import React, { useEffect, useState } from 'react';
import { 
    Box, 
    VStack, 
    Text, 
    Button, 
    Alert, 
    AlertIcon, 
    Spinner,
    Icon,
    Badge,
    useColorModeValue 
} from '@chakra-ui/react';
import { CheckCircle, Crown, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [verificationComplete, setVerificationComplete] = useState(false);
    const { user } = useUser();
    
    const orderId = searchParams.get('order_id');
    const bgColor = useColorModeValue('white', 'gray.800');
    const successColor = useColorModeValue('green.500', 'green.300');

    // Verify payment on component mount
    const { data: verificationData, isLoading, error } = useQuery({
        queryKey: ['payment-verification', orderId],
        queryFn: async () => {
            if (!orderId) {
                throw new Error('No order ID provided');
            }
            
            const response = await axiosInstance.post('/payments/verify', {
                orderId: orderId
            });
            
            return response.data;
        },
        enabled: !!orderId && !verificationComplete,
        retry: 3,
        retryDelay: 2000,
    });

    useEffect(() => {
        if (verificationData?.success) {
            setVerificationComplete(true);
            toast.success('🎉 Payment successful! Welcome to Premium!');
            
            // Dispatch global event for subscription update
            window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
                detail: { 
                    success: true, 
                    subscription: verificationData.subscription 
                }
            }));
        }
    }, [verificationData]);

    const handleReturnHome = () => {
        navigate('/');
    };

    const handleViewSubscription = () => {
        navigate('/premium');
    };

    if (!orderId) {
        return (
            <Box 
                minH="100vh" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                bg={useColorModeValue('gray.50', 'gray.900')}
                p={4}
            >
                <Box bg={bgColor} p={8} rounded="lg" shadow="md" maxW="md" w="full">
                    <VStack spacing={6}>
                        <Alert status="error">
                            <AlertIcon />
                            Invalid payment link. No order ID found.
                        </Alert>
                        <Button onClick={handleReturnHome} leftIcon={<ArrowLeft size={20} />}>
                            Return to Home
                        </Button>
                    </VStack>
                </Box>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box 
                minH="100vh" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                bg={useColorModeValue('gray.50', 'gray.900')}
                p={4}
            >
                <Box bg={bgColor} p={8} rounded="lg" shadow="md" maxW="md" w="full">
                    <VStack spacing={6}>
                        <Spinner size="xl" color="blue.500" />
                        <Text fontSize="lg" fontWeight="medium">
                            Verifying your payment...
                        </Text>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                            Please wait while we confirm your transaction.
                        </Text>
                    </VStack>
                </Box>
            </Box>
        );
    }

    if (error || !verificationData?.success) {
        return (
            <Box 
                minH="100vh" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                bg={useColorModeValue('gray.50', 'gray.900')}
                p={4}
            >
                <Box bg={bgColor} p={8} rounded="lg" shadow="md" maxW="md" w="full">
                    <VStack spacing={6}>
                        <Alert status="error">
                            <AlertIcon />
                            <Box>
                                <Text fontWeight="bold">Payment Verification Failed</Text>
                                <Text fontSize="sm">
                                    {error?.message || 'We could not verify your payment. Please contact support.'}
                                </Text>
                            </Box>
                        </Alert>
                        
                        <VStack spacing={3} w="full">
                            <Button 
                                onClick={() => window.location.reload()} 
                                colorScheme="blue"
                                w="full"
                            >
                                Retry Verification
                            </Button>
                            <Button 
                                onClick={handleReturnHome} 
                                variant="outline"
                                leftIcon={<ArrowLeft size={20} />}
                                w="full"
                            >
                                Return to Home
                            </Button>
                        </VStack>
                    </VStack>
                </Box>
            </Box>
        );
    }

    // Success state
    return (
        <Box 
            minH="100vh" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            bg={useColorModeValue('gray.50', 'gray.900')}
            p={4}
        >
            <Box bg={bgColor} p={8} rounded="lg" shadow="md" maxW="md" w="full">
                <VStack spacing={6} textAlign="center">
                    {/* Success Icon */}
                    <Icon as={CheckCircle} boxSize={16} color={successColor} />
                    
                    {/* Success Message */}
                    <VStack spacing={2}>
                        <Text fontSize="2xl" fontWeight="bold" color={successColor}>
                            Payment Successful!
                        </Text>
                        <Text fontSize="lg" color="gray.600">
                            Welcome to Premium! 🎉
                        </Text>
                    </VStack>

                    {/* Subscription Details */}
                    {verificationData?.subscription && (
                        <Box 
                            p={4} 
                            bg={useColorModeValue('blue.50', 'blue.900')} 
                            rounded="md" 
                            w="full"
                        >
                            <VStack spacing={2}>
                                <HStack>
                                    <Icon as={Crown} color="gold" />
                                    <Text fontWeight="bold">Premium Subscription</Text>
                                    <Badge colorScheme="green">Active</Badge>
                                </HStack>
                                
                                <Text fontSize="sm" color="gray.600">
                                    Plan: {verificationData.subscription.plan || 'Premium'}
                                </Text>
                                
                                {verificationData.subscription.endDate && (
                                    <Text fontSize="sm" color="gray.600">
                                        Valid until: {new Date(verificationData.subscription.endDate).toLocaleDateString()}
                                    </Text>
                                )}
                                
                                <Text fontSize="sm" color="gray.600">
                                    Order ID: {orderId}
                                </Text>
                            </VStack>
                        </Box>
                    )}

                    {/* Premium Features */}
                    <Box p={4} bg={useColorModeValue('green.50', 'green.900')} rounded="md" w="full">
                        <Text fontWeight="bold" mb={2}>You now have access to:</Text>
                        <VStack align="start" spacing={1} fontSize="sm">
                            <Text>✅ Post legal cases for other lawyers</Text>
                            <Text>✅ Verified lawyer badge</Text>
                            <Text>✅ Priority support and visibility</Text>
                            <Text>✅ Advanced case management tools</Text>
                            <Text>✅ Unlimited case postings</Text>
                        </VStack>
                    </Box>

                    {/* Action Buttons */}
                    <VStack spacing={3} w="full">
                        <Button 
                            onClick={handleViewSubscription}
                            colorScheme="blue" 
                            size="lg"
                            w="full"
                            leftIcon={<Crown size={20} />}
                        >
                            View My Subscription
                        </Button>
                        <Button 
                            onClick={handleReturnHome}
                            variant="outline"
                            w="full"
                            leftIcon={<ArrowLeft size={20} />}
                        >
                            Continue to Dashboard
                        </Button>
                    </VStack>
                </VStack>
            </Box>
        </Box>
    );
};

export default PaymentSuccess; 