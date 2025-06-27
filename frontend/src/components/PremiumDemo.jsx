import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    Badge,
    Icon,
    SimpleGrid,
    useColorModeValue
} from '@chakra-ui/react';
import { Crown, Star } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import PaymentButton from './PaymentButton';
import PremiumUpgradeModal from './PremiumUpgradeModal';

const PremiumDemo = () => {
    const [showModal, setShowModal] = useState(false);
    const { user } = useUser();
    
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const handleSubscriptionSuccess = (plan, billingCycle) => {
        console.log('🎉 Subscription successful!', { plan, billingCycle });
        // Here you would typically:
        // 1. Update user state/context
        // 2. Refresh user data
        // 3. Show success notification
        // 4. Navigate to premium features
    };

    return (
        <Box p={8} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
            <VStack spacing={8} maxW="4xl" mx="auto">
                {/* Header */}
                <VStack spacing={2} textAlign="center">
                    <HStack>
                        <Icon as={Crown} boxSize={8} color="gold" />
                        <Text fontSize="3xl" fontWeight="bold">
                            Premium Integration Demo
                        </Text>
                    </HStack>
                    <Text color="gray.600">
                        Examples of how to integrate the premium subscription system
                    </Text>
                </VStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                    {/* Example 1: Standalone Payment Button */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                            <VStack spacing={4} align="start">
                                <VStack align="start" spacing={2}>
                                    <Badge colorScheme="blue">Example 1</Badge>
                                    <Text fontSize="lg" fontWeight="bold">
                                        Standalone Payment Buttons
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Use individual payment buttons for specific plans
                                    </Text>
                                </VStack>
                                
                                <VStack spacing={3} w="full">
                                    <PaymentButton
                                        planType="monthly"
                                        onSuccess={handleSubscriptionSuccess}
                                    />
                                    <PaymentButton
                                        planType="yearly"
                                        onSuccess={handleSubscriptionSuccess}
                                        colorScheme="green"
                                    />
                                </VStack>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Example 2: Premium Modal Trigger */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                            <VStack spacing={4} align="start">
                                <VStack align="start" spacing={2}>
                                    <Badge colorScheme="green">Example 2</Badge>
                                    <Text fontSize="lg" fontWeight="bold">
                                        Premium Upgrade Modal
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Show a modal with plan comparison and selection
                                    </Text>
                                </VStack>
                                
                                <Button
                                    colorScheme="blue"
                                    leftIcon={<Crown size={20} />}
                                    onClick={() => setShowModal(true)}
                                    w="full"
                                >
                                    Upgrade to Premium
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Example 3: Feature Lock with Upgrade */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                            <VStack spacing={4} align="start">
                                <VStack align="start" spacing={2}>
                                    <Badge colorScheme="purple">Example 3</Badge>
                                    <Text fontSize="lg" fontWeight="bold">
                                        Feature Lock with Upgrade
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Lock features behind premium subscription
                                    </Text>
                                </VStack>
                                
                                <Box 
                                    p={4} 
                                    bg={useColorModeValue('gray.100', 'gray.700')} 
                                    rounded="md" 
                                    w="full"
                                    position="relative"
                                >
                                    {/* Overlay for locked content */}
                                    <Box
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        right={0}
                                        bottom={0}
                                        bg="blackAlpha.600"
                                        rounded="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <VStack spacing={3}>
                                            <Icon as={Crown} boxSize={8} color="gold" />
                                            <Text color="white" fontWeight="bold" textAlign="center">
                                                Premium Feature
                                            </Text>
                                            <PaymentButton
                                                planType="monthly"
                                                onSuccess={handleSubscriptionSuccess}
                                                size="sm"
                                            />
                                        </VStack>
                                    </Box>
                                    
                                    {/* Locked content */}
                                    <VStack spacing={2} opacity={0.3}>
                                        <Text fontWeight="bold">Advanced Analytics</Text>
                                        <Text fontSize="sm">Case success rates, client insights, and more...</Text>
                                    </VStack>
                                </Box>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Example 4: Navigation to Premium Page */}
                    <Card bg={cardBg} border="1px" borderColor={borderColor}>
                        <CardBody>
                            <VStack spacing={4} align="start">
                                <VStack align="start" spacing={2}>
                                    <Badge colorScheme="orange">Example 4</Badge>
                                    <Text fontSize="lg" fontWeight="bold">
                                        Navigate to Premium Page
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Link to a dedicated premium subscription page
                                    </Text>
                                </VStack>
                                
                                <Button
                                    variant="outline"
                                    leftIcon={<Star size={20} />}
                                    onClick={() => {
                                        // In a real app, use: navigate('/premium')
                                        console.log('Navigate to /premium page');
                                    }}
                                    w="full"
                                >
                                    View Premium Features
                                </Button>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Code Examples */}
                <Card bg={cardBg} border="1px" borderColor={borderColor} w="full">
                    <CardBody>
                        <VStack spacing={4} align="start">
                            <Text fontSize="lg" fontWeight="bold">
                                Usage Examples
                            </Text>
                            
                            <Box 
                                p={4} 
                                bg={useColorModeValue('gray.100', 'gray.700')} 
                                rounded="md" 
                                w="full"
                                overflow="auto"
                            >
                                <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
{`// 1. Basic Payment Button
<PaymentButton
  planType="monthly"
  user={currentUser}
  onSuccess={handleSuccess}
/>

// 2. Premium Modal
<PremiumUpgradeModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  user={currentUser}
/>

// 3. Feature Lock Example
{!user.isPremium ? (
  <PaymentButton planType="yearly" user={user} />
) : (
  <PremiumFeature />
)}

// 4. Navigation
const navigate = useNavigate();
<Button onClick={() => navigate('/premium')}>
  Premium
</Button>`}
                                </Text>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>

            {/* Premium Upgrade Modal */}
            <PremiumUpgradeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </Box>
    );
};

export default PremiumDemo; 