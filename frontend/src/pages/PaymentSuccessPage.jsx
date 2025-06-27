import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box,
    VStack,
    Text,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    Heading,
    useColorModeValue,
    HStack,
    Badge
} from '@chakra-ui/react';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import usePremium from '../hooks/usePremium';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useUser();
    const { refreshUserData } = usePremium();
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);

    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    const orderId = searchParams.get('order_id');

    const verifyPaymentMutation = useMutation({
        mutationFn: async (orderId) => {
            const response = await axiosInstance.post('/payments/verify', { orderId });
            return response.data;
        },
        onSuccess: async (data) => {
            setVerificationStatus('success');
            setSubscriptionDetails(data.subscription);
            toast.success('Payment verified successfully! Welcome to Premium!');
            
            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['authUser'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            
            // Force refresh of Clerk user data
            try {
                if (user) {
                    await user.reload();
                    console.log('Clerk user data refreshed after payment');
                }
            } catch (error) {
                console.error('Failed to refresh Clerk user data:', error);
            }
            
            // Small delay to ensure data is synced, then refresh the page
            setTimeout(() => {
                window.location.href = '/premium';
            }, 2000);
        },
        onError: (error) => {
            console.error('Payment verification failed:', error);
            setVerificationStatus('failed');
            toast.error(error.response?.data?.message || 'Payment verification failed');
        }
    });

    useEffect(() => {
        if (orderId) {
            verifyPaymentMutation.mutate(orderId);
        } else {
            setVerificationStatus('failed');
        }
    }, [orderId]);

    const handleContinue = () => {
        // Refresh user data before navigating
        refreshUserData();
    };

    const handleMySubscription = () => {
        navigate('/premium');
    };

    if (verificationStatus === 'verifying') {
        return (
            <Box
                minH="100vh"
                bg={bgColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
            >
                <Box
                    bg={cardBg}
                    p={8}
                    borderRadius="xl"
                    boxShadow="lg"
                    textAlign="center"
                    maxW="md"
                    w="full"
                >
                    <VStack spacing={4}>
                        <Spinner size="xl" color="blue.500" />
                        <Heading size="md">Verifying Payment...</Heading>
                        <Text color="gray.600">
                            Please wait while we confirm your payment
                        </Text>
                    </VStack>
                </Box>
            </Box>
        );
    }

    if (verificationStatus === 'failed') {
        return (
            <Box
                minH="100vh"
                bg={bgColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
            >
                <Box
                    bg={cardBg}
                    p={8}
                    borderRadius="xl"
                    boxShadow="lg"
                    textAlign="center"
                    maxW="md"
                    w="full"
                >
                    <VStack spacing={6}>
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            Payment verification failed
                        </Alert>
                        
                        <Heading size="md" color="red.600">
                            Payment Not Confirmed
                        </Heading>
                        
                        <Text color="gray.600">
                            We couldn't verify your payment. Please try again or contact support if the issue persists.
                        </Text>
                        
                        <VStack spacing={3} w="full">
                            <Button colorScheme="blue" onClick={() => navigate('/')} w="full">
                                Return to Home
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/premium')} w="full">
                                Try Again
                            </Button>
                        </VStack>
                    </VStack>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            minH="100vh"
            bg={bgColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
        >
            <Box
                bg={cardBg}
                p={8}
                borderRadius="xl"
                boxShadow="lg"
                textAlign="center"
                maxW="lg"
                w="full"
            >
                <VStack spacing={6}>
                    {/* Success Icon */}
                    <Box>
                        <CheckCircle size={64} color="green" />
                    </Box>

                    {/* Success Message */}
                    <VStack spacing={2}>
                        <HStack>
                            <Crown size={24} color="gold" />
                            <Heading size="lg" color="green.600">
                                Welcome to Premium!
                            </Heading>
                        </HStack>
                        <Text fontSize="lg" color="gray.600">
                            Your payment has been processed successfully
                        </Text>
                    </VStack>

                    {/* Subscription Details */}
                    {subscriptionDetails && (
                        <Box
                            p={4}
                            bg="green.50"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="green.200"
                            w="full"
                        >
                            <VStack spacing={2}>
                                <HStack justify="space-between" w="full">
                                    <Text fontWeight="semibold">Plan:</Text>
                                    <Badge colorScheme="green" textTransform="capitalize">
                                        {subscriptionDetails.plan} Premium
                                    </Badge>
                                </HStack>
                                <HStack justify="space-between" w="full">
                                    <Text fontWeight="semibold">Amount:</Text>
                                    <Text>
                                        {subscriptionDetails.currency} ${subscriptionDetails.amount}
                                    </Text>
                                </HStack>
                                <HStack justify="space-between" w="full">
                                    <Text fontWeight="semibold">Valid Until:</Text>
                                    <Text>
                                        {new Date(subscriptionDetails.endDate).toLocaleDateString()}
                                    </Text>
                                </HStack>
                            </VStack>
                        </Box>
                    )}

                    {/* What's Next */}
                    <Box textAlign="left" w="full">
                        <Text fontWeight="semibold" mb={2}>
                            What you can do now:
                        </Text>
                        <VStack align="start" spacing={1} pl={4}>
                            <Text fontSize="sm">✅ Post unlimited legal cases</Text>
                            <Text fontSize="sm">✅ Get verified lawyer badge</Text>
                            <Text fontSize="sm">✅ Access premium features</Text>
                            <Text fontSize="sm">✅ Priority support</Text>
                        </VStack>
                    </Box>

                    {/* Action Buttons */}
                    <VStack spacing={3} w="full">
                        <Button 
                            colorScheme="blue" 
                            size="lg" 
                            onClick={handleContinue}
                            rightIcon={<ArrowRight size={20} />}
                            w="full"
                        >
                            Start Using Premium Features
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleMySubscription}
                            w="full"
                        >
                            View Subscription Details
                        </Button>
                    </VStack>
                </VStack>
            </Box>
        </Box>
    );
};

export default PaymentSuccessPage; 