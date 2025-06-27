import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Heading,
  Box,
  Icon,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { FaGavel, FaUsers, FaBriefcase, FaCrown } from 'react-icons/fa';

const AuthPopup = ({ isOpen, onClose, onAuth }) => {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const { isSignedIn, user } = useUser();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const accentColor = useColorModeValue('blue.600', 'blue.400');

  // Close modal when user successfully signs in/up
  useEffect(() => {
    if (isSignedIn && user) {
      onAuth();
      onClose();
    }
  }, [isSignedIn, user, onAuth, onClose]);

  const features = [
    {
      icon: FaGavel,
      title: 'Legal Case Management',
      description: 'Post and manage legal cases efficiently'
    },
    {
      icon: FaUsers,
      title: 'Professional Network',
      description: 'Connect with lawyers and legal professionals'
    },
    {
      icon: FaBriefcase,
      title: 'Apply to Cases',
      description: 'Find and apply to relevant legal opportunities'
    },
    {
      icon: FaCrown,
      title: 'Premium Features',
      description: 'Advanced tools for legal professionals'
    }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl" 
      closeOnOverlayClick={false}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} maxW="900px" m={4}>
        <ModalCloseButton />
        
        <ModalBody p={0}>
          <HStack spacing={0} align="stretch" minH="500px">
            {/* Left Panel - Features */}
            <Box 
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
              color="white" 
              p={8} 
              w="50%" 
              display="flex" 
              flexDirection="column"
              justifyContent="center"
            >
              <VStack spacing={6} align="start">
                <Box>
                  <Heading size="lg" mb={2}>
                    Welcome to LawX
                  </Heading>
                  <Text fontSize="md" opacity={0.9}>
                    Your professional legal network
                  </Text>
                </Box>
                
                <VStack spacing={4} align="start" w="full">
                  {features.map((feature, index) => (
                    <HStack key={index} spacing={3} align="start">
                      <Icon as={feature.icon} boxSize={5} mt={1} />
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm">
                          {feature.title}
                        </Text>
                        <Text fontSize="xs" opacity={0.8}>
                          {feature.description}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
                
                <Box mt={6} p={3} bg="whiteAlpha.200" borderRadius="md">
                  <Text fontSize="sm" fontWeight="medium">
                    🚀 Join thousands of legal professionals
                  </Text>
                </Box>
              </VStack>
            </Box>
            
            {/* Right Panel - Auth Forms */}
            <Box w="50%" p={8} display="flex" flexDirection="column" justifyContent="center">
              <VStack spacing={6}>
                <Box textAlign="center">
                  <Heading size="md" color={textColor} mb={2}>
                    {authMode === 'signin' ? 'Sign In' : 'Join LawX'}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {authMode === 'signin' 
                      ? 'Continue to your professional network' 
                      : 'Start your legal career journey'
                    }
                  </Text>
                </Box>

                {/* Clerk Auth Component */}
                <Box w="full">
                  {authMode === 'signin' ? (
                    <SignIn 
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "w-full shadow-none border-0",
                          headerTitle: "hidden",
                          headerSubtitle: "hidden",
                          socialButtonsBlockButton: "w-full",
                          formButtonPrimary: "w-full bg-blue-600 hover:bg-blue-700",
                          footerActionLink: "text-blue-600 hover:text-blue-700"
                        }
                      }}
                      redirectUrl={window.location.origin}
                    />
                  ) : (
                    <SignUp 
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "w-full shadow-none border-0",
                          headerTitle: "hidden",
                          headerSubtitle: "hidden",
                          socialButtonsBlockButton: "w-full",
                          formButtonPrimary: "w-full bg-blue-600 hover:bg-blue-700",
                          footerActionLink: "text-blue-600 hover:text-blue-700"
                        }
                      }}
                      redirectUrl={window.location.origin}
                    />
                  )}
                </Box>

                {/* Switch between Sign In/Sign Up */}
                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    {authMode === 'signin' 
                      ? "Don't have an account? " 
                      : "Already have an account? "
                    }
                    <Button
                      variant="link"
                      color={accentColor}
                      fontSize="sm"
                      onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    >
                      {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </Button>
                  </Text>
                </Box>
              </VStack>
            </Box>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthPopup; 