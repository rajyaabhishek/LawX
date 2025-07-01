import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FaLock, FaCrown, FaUserShield, FaEye } from 'react-icons/fa';

const ProtectedRoute = ({ children, requirePermission, requireRole, fallbackComponent }) => {
  const {
    isSignedIn,
    isGuestMode,
    currentUser,
    hasPermission,
    hasRole,
    getUserDisplayInfo,
    guestTimeLeft,
  } = useAuthContext();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // If user is signed in and meets all requirements, render the protected content
  if (isSignedIn && currentUser) {
    if (requirePermission && !hasPermission(requirePermission)) {
      return (
        <Box minH="60vh" bg={bgColor} py={12}>
          <VStack spacing={8} maxW="lg" mx="auto" p={8} bg={cardBg} borderRadius="xl" shadow="lg">
            <Icon as={FaCrown} boxSize={16} color="yellow.500" />
            <VStack spacing={4} textAlign="center">
              <Heading size="lg">Premium Feature</Heading>
              <Text color="gray.600">
                This feature requires premium access. Upgrade your account to unlock all features.
              </Text>
            </VStack>
            <VStack spacing={3} w="full">
              <Button colorScheme="yellow" size="lg" w="full" as="a" href="/premium">
                Upgrade to Premium
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </VStack>
          </VStack>
        </Box>
      );
    }

    if (requireRole && !hasRole(requireRole)) {
      return (
        <Box minH="60vh" bg={bgColor} py={12}>
          <VStack spacing={8} maxW="lg" mx="auto" p={8} bg={cardBg} borderRadius="xl" shadow="lg">
            <Icon as={FaUserShield} boxSize={16} color="red.500" />
            <VStack spacing={4} textAlign="center">
              <Heading size="lg">Access Restricted</Heading>
              <Text color="gray.600">
                You don't have the required permissions to access this feature.
              </Text>
            </VStack>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </VStack>
        </Box>
      );
    }

    return children;
  }

  // If in guest mode, show appropriate message
  if (isGuestMode) {
    return (
      <Box minH="60vh" bg={bgColor} py={12}>
        <VStack spacing={8} maxW="lg" mx="auto" p={8} bg={cardBg} borderRadius="xl" shadow="lg">
          <HStack spacing={3}>
            <Icon as={FaEye} boxSize={12} color="orange.500" />
            <Badge colorScheme="orange" fontSize="md" p={2} borderRadius="md">
              Guest Mode
            </Badge>
          </HStack>
          
          <VStack spacing={4} textAlign="center">
            <Heading size="lg">Sign Up Required</Heading>
            <Text color="gray.600">
              This feature is only available to registered users. Join LawX to access all features and connect with legal professionals.
            </Text>
            
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Guest time remaining:</AlertTitle>
                <AlertDescription>
                  {Math.floor(guestTimeLeft / 60)}:{(guestTimeLeft % 60).toString().padStart(2, '0')} minutes
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>

          <VStack spacing={3} w="full">
            <Button 
              colorScheme="blue" 
              size="lg" 
              w="full"
              onClick={() => {
                // This will trigger the AuthOverlay
                window.dispatchEvent(new CustomEvent('showAuthModal'));
              }}
            >
              Sign Up Now
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Continue Browsing
            </Button>
          </VStack>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            Sign up for free to unlock unlimited access
          </Text>
        </VStack>
      </Box>
    );
  }

  // If not signed in and not in guest mode, show sign up prompt
  return (
    <Box minH="60vh" bg={bgColor} py={12}>
      <VStack spacing={8} maxW="lg" mx="auto" p={8} bg={cardBg} borderRadius="xl" shadow="lg">
        <Icon as={FaLock} boxSize={16} color="blue.500" />
        
      

        <VStack spacing={3} w="full">
          <Button 
            colorScheme="blue" 
            size="lg" 
            w="full"
            onClick={() => {
              // This will trigger the AuthOverlay
              window.dispatchEvent(new CustomEvent('showAuthModal'));
            }}
          >
            Sign In
          </Button>
          
        </VStack>

        <HStack spacing={4} fontSize="sm" color="gray.500">
          <Text>New to LawX?</Text>
          <Button 
            variant="link" 
            size="sm" 
            colorScheme="blue"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('showAuthModal', { detail: { mode: 'signup' } }));
            }}
          >
            Create Account
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ProtectedRoute; 