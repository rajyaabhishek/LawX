import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    useColorModeValue,
    Spinner,
    List,
    ListItem,
    ListIcon,
    SimpleGrid,
    Card,
    Badge
} from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { axiosInstance } from '../lib/axios';
import PaymentButton from '../components/PaymentButton';
import toast from 'react-hot-toast';

const Premium = () => {
    const { isSignedIn, user, isLoaded } = useUser();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'gray.200');

    // Fetch subscription plans from backend
    const { data: plansData } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: async () => {
            const response = await axiosInstance.get('/payments/plans');
            return response.data;
        }
    });

    // Use backend plans if available, otherwise fallback to hardcoded
    const plans = plansData?.plans || {
        monthly: { 
            price: 5.00, 
        },
        yearly: { 
            price: 50.00, 
        }
    };

    // Handle successful subscription
    const handleSubscriptionSuccess = async (plan, billingCycle) => {
        try {
            if (typeof window !== 'undefined' && window.Clerk) {
                try {
                    await window.Clerk.user.reload();
                } catch (refreshError) {
                    console.warn('Failed to refresh user data:', refreshError);
                }
            }
            
            toast.success('🎉 Welcome to Premium! Your subscription is now active.');
            
            setTimeout(() => {
                window.location.reload();
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
        return savings;
    };

    if (!isLoaded) {
        return (
            <Box minH="100vh" p={8} bg={useColorModeValue('gray.50', 'gray.900')}>
                <VStack spacing={8} maxW="4xl" mx="auto">
                    <Spinner size="xl" />
                    <Text>Loading...</Text>
                </VStack>
            </Box>
        );
    }

    const savings = calculateSavings();

    return (
        <Box minH="100vh" p={8} bg={useColorModeValue('gray.50', 'gray.900')}>
            <Box maxW="4xl" mx="auto">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Monthly Plan */}
                    <Card 
                        bg={bgColor} 
                        border="2px" 
                        borderColor={borderColor}
                        p={6}
                        borderRadius="xl"
                        _hover={{ 
                            borderColor: "blue.500",
                            transform: "translateY(-2px)",
                            boxShadow: "xl",
                            transition: "all 0.2s"
                        }}
                    >
                        <VStack spacing={6} align="stretch">
                            <VStack spacing={2} textAlign="center">
                                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                                    Monthly
                                </Text>
                                <Text fontSize="md" color="gray.600">
                                    Perfect for getting started
                                </Text>
                                <Text fontSize="4xl" fontWeight="bold" color="blue.600">
                                    ${plans.monthly.price}
                                    <Text as="span" fontSize="lg" color="gray.500" ml={1}>
                                        /month
                                    </Text>
                                </Text>
                            </VStack>
                            
                            <List spacing={3}>
                                <ListItem>
                                    <ListIcon as={Check} color="blue.500" />
                                    Post legal cases for lawyers to apply
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="blue.500" />
                                    Get verified lawyer badge
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="blue.500" />
                                    Priority support
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="blue.500" />
                                    Unlimited case postings
                                </ListItem>
                            </List>
                            
                            <PaymentButton
                                planType="monthly"
                                onSuccess={(plan, cycle) => handleSubscriptionSuccess(plan, cycle)}
                                width="100%"
                                size="lg"
                                colorScheme="blue"
                                bg="blue.600"
                                color="white"
                                _hover={{ bg: "blue.700" }}
                                _active={{ bg: "blue.800" }}
                            >
                                Buy ${plans.monthly.price}/month
                            </PaymentButton>
                        </VStack>
                    </Card>

                    {/* Annual Plan - Highlighted */}
                    <Card 
                        bg={bgColor} 
                        border="3px" 
                        borderColor="yellow.400"
                        p={6}
                        borderRadius="xl"
                        position="relative"
                        boxShadow="lg"
                        _hover={{ 
                            borderColor: "yellow.500",
                            transform: "translateY(-2px)",
                            boxShadow: "2xl",
                            transition: "all 0.2s"
                        }}
                    >
                        
                        <VStack spacing={6} align="stretch">
                            <VStack spacing={2} textAlign="center">
                                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                                    Annual
                                </Text>
                                <Text fontSize="md" color="green.600" fontWeight="semibold">
                                    Save ${savings} with annual billing
                                </Text>
                                <Text fontSize="4xl" fontWeight="bold" color="green.600">
                                    ${plans.yearly.price}
                                    <Text as="span" fontSize="lg" color="gray.500" ml={1}>
                                        /year
                                    </Text>
                                </Text>
                            </VStack>
                            
                            <List spacing={3}>
                                <ListItem>
                                    <ListIcon as={Check} color="green.500" />
                                    All monthly features
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="green.500" />
                                    Save ${savings} yearly
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="green.500" />
                                    Early access to new features
                                </ListItem>
                                <ListItem>
                                    <ListIcon as={Check} color="green.500" />
                                    Exclusive premium features
                                </ListItem>
                            </List>
                            
                            <PaymentButton
                                planType="yearly"
                                onSuccess={(plan, cycle) => handleSubscriptionSuccess(plan, cycle)}
                                width="100%"
                                size="lg"
                                colorScheme="yellow"
                                bg="yellow.400"
                                color="gray.800"
                                _hover={{ bg: "yellow.500" }}
                                _active={{ bg: "yellow.600" }}
                                fontWeight="bold"
                            >
                                Buy ${plans.yearly.price}/year
                            </PaymentButton>
                        </VStack>
                    </Card>
                </SimpleGrid>
            </Box>
        </Box>
    );
};

export default Premium; 