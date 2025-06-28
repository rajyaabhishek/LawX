import { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    HStack,
    Text,
    Box,
    Badge,
    List,
    ListItem,
    ListIcon,
    Divider,
    Radio,
    RadioGroup,
    Alert,
    AlertIcon,
    Spinner,
    useColorModeValue
} from '@chakra-ui/react';
import { CheckIcon, Crown } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { axiosInstance } from '../lib/axios';
import PaymentButton from './PaymentButton';
import toast from 'react-hot-toast';

const PremiumUpgradeModal = ({ isOpen, onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const queryClient = useQueryClient();
    const { isSignedIn, user } = useUser();

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Debug logging
    useEffect(() => {
        console.log('PremiumUpgradeModal mounted, isOpen:', isOpen);
    }, [isOpen]);

    // Fetch subscription plans from backend
    const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: async () => {
            const response = await axiosInstance.get('/payments/plans');
            return response.data;
        }
    });

    // Use backend plans if available, otherwise fallback to hardcoded
    const plans = plansData?.plans || {
        monthly: { 
            price: 399.00, 
            name: 'Monthly Premium',
            currency: 'INR',
            duration: 30,
            description: 'Monthly premium subscription with full access to all features'
        },
        yearly: { 
            price: 3599.00, 
            name: 'Yearly Premium',
            currency: 'INR',
            duration: 365,
            description: 'Yearly premium subscription with full access to all features (Save ₹1189!)'
        }
    };

    // Handle successful subscription
    const handleSubscriptionSuccess = async (plan, billingCycle) => {
        try {
            // Force refresh of user data from Clerk
            if (typeof window !== 'undefined' && window.Clerk) {
                try {
                    await window.Clerk.user.reload();
                    console.log('User data refreshed successfully in modal');
                } catch (refreshError) {
                    console.warn('Failed to refresh user data in modal:', refreshError);
                }
            }
            
            // Invalidate queries to refresh user data
            await queryClient.invalidateQueries(['user']);
            await queryClient.invalidateQueries(['subscription']);
            
            // Close modal and show success message
            onClose();
            toast.success('🎉 Welcome to Premium! Your subscription is now active.');
            
            // Navigate to premium page to show the updated status
            setTimeout(() => {
                window.location.href = '/premium';
            }, 1500);
            
            return true;
        } catch (error) {
            console.error('Error handling subscription success:', error);
            return false;
        }
    };

    const calculateSavings = () => {
        const monthlyTotal = plans.monthly.price * 12;
        const yearlyPrice = plans.yearly.price;
        const savings = monthlyTotal - yearlyPrice;
        const percentage = Math.round((savings / monthlyTotal) * 100);
        return { amount: savings, percentage };
    };

    const savings = calculateSavings();

    console.log('Modal render - isOpen:', isOpen, 'selectedPlan:', selectedPlan);

    if (plansLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent bg={bgColor}>
                    <ModalBody py={10}>
                        <VStack spacing={4}>
                            <Spinner size="xl" color="blue.500" />
                            <Text>Loading subscription plans...</Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    if (plansError) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent bg={bgColor}>
                    <ModalHeader>Error Loading Plans</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Alert status="error">
                            <AlertIcon />
                            Failed to load subscription plans. Please try again later.
                        </Alert>
                        <Button mt={4} onClick={onClose} width="full">
                            Close
                        </Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!isProcessing}>
            <ModalOverlay />
            <ModalContent bg={bgColor}>
                <ModalHeader>
                    <HStack>
                        <Crown size={24} color="gold" />
                        <Text>Upgrade to Premium</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton isDisabled={isProcessing} /   >
                
                <ModalBody pb={6}>
                    <VStack spacing={6} align="stretch">
                        {/* Benefits Section */}
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={3}>
                                Premium Features:
                            </Text>
                            <List spacing={2}>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Post legal cases for other lawyers to apply
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Get verified lawyer badge
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Access to premium lawyer features
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Priority support and visibility
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Advanced case management tools
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={CheckIcon} color="green.500" />
                                    Unlimited case postings
                                </ListItem>
                            </List>
                        </Box>

                        <Divider />

                        {/* Pricing Plans */}
                        <Box>
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                                Choose Your Plan:
                            </Text>
                            
                            <RadioGroup value={selectedPlan} onChange={setSelectedPlan}>
                                <VStack spacing={3} align="stretch">
                                    {/* Monthly Plan */}
                                    <Box
                                        p={4}
                                        border="2px"
                                        borderColor={selectedPlan === 'monthly' ? 'blue.500' : borderColor}
                                        borderRadius="lg"
                                        position="relative"
                                        cursor="pointer"
                                        onClick={() => setSelectedPlan('monthly')}
                                    >
                                        <Radio value="monthly" size="lg">
                                            <VStack align="start" spacing={1} ml={2}>
                                                <HStack>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {plans.monthly.name}
                                                    </Text>
                                                </HStack>
                                                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                                                    ₹{plans.monthly.price}
                                                    <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                                                        /month
                                                    </Text>
                                                </Text>
                                                <Text fontSize="sm" color="gray.600">
                                                    Billed monthly, cancel anytime
                                                </Text>
                                            </VStack>
                                        </Radio>
                                    </Box>

                                    {/* Yearly Plan */}
                                    <Box
                                        p={4}
                                        border="2px"
                                        borderColor={selectedPlan === 'yearly' ? 'blue.500' : borderColor}
                                        borderRadius="lg"
                                        position="relative"
                                        cursor="pointer"
                                        onClick={() => setSelectedPlan('yearly')}
                                    >
                                        <Badge
                                            position="absolute"
                                            top="-8px"
                                            right="10px"
                                            colorScheme="green"
                                            px={2}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            Save ₹{savings.amount} ({savings.percentage}%)
                                        </Badge>
                                        
                                        <Radio value="yearly" size="lg">
                                            <VStack align="start" spacing={1} ml={2}>
                                                <HStack>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {plans.yearly.name}
                                                    </Text>
                                                </HStack>
                                                <HStack align="baseline">
                                                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                                        ₹{plans.yearly.price}
                                                        <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                                                            /year
                                                        </Text>
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.400" textDecoration="line-through">
                                                        ₹{plans.monthly.price * 12}
                                                    </Text>
                                                </HStack>
                                                <Text fontSize="sm" color="gray.600">
                                                    Best value - save ₹{Math.round(savings.amount)}!
                                                </Text>
                                            </VStack>
                                        </Radio>
                                    </Box>
                                </VStack>
                            </RadioGroup>
                        </Box>

                        {/* Payment Info */}
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">
                                Secure payment powered by Cashfree. You can cancel your subscription anytime.
                            </Text>
                        </Alert>

                        {/* Action Buttons */}
                        <HStack spacing={3}>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                isDisabled={isProcessing}
                                flex={1}
                            >
                                Cancel
                            </Button>
                            
                            {/* Use PaymentButton component for actual payment processing */}
                            <Box flex={1}>
                                <PaymentButton
                                    planType={selectedPlan}
                                    onSuccess={handleSubscriptionSuccess}
                                    isLoading={isProcessing}
                                    width="100%"
                                />
                            </Box>
                        </HStack>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PremiumUpgradeModal; 