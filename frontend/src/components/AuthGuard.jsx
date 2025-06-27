import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Heading,
  Box,
  Button,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const AuthGuard = ({ isOpen, onClose, onShowAuth, action = "perform this action" }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} maxW="400px" m={4}>
        <ModalCloseButton />
        <ModalBody p={8}>
          <VStack spacing={6} textAlign="center">
            <Icon as={FaLock} boxSize={12} color="blue.500" />
            
            <Box>
              <Heading size="md" color={textColor} mb={2}>
                Authentication Required
              </Heading>
              <Text fontSize="sm" color="gray.500">
                You need to sign in to {action}
              </Text>
            </Box>

            <Box 
              p={4} 
              bg="blue.50" 
              border="1px solid" 
              borderColor="blue.200" 
              borderRadius="md" 
              w="full"
            >
              <Text fontSize="sm" color="blue.700">
                📚 Join LawX to access legal case management, professional networking, and premium features.
              </Text>
            </Box>

            <VStack spacing={3} w="full">
              <Button
                colorScheme="blue"
                size="lg"
                w="full"
                leftIcon={<FaSignInAlt />}
                onClick={() => {
                  onClose();
                  onShowAuth();
                }}
              >
                Sign In / Sign Up
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Continue Browsing
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthGuard; 